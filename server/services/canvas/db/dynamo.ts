// DynamoDB persistence for canvas documents — the ONLY storage path.
//
// Design (single table, on-demand billing):
//   pk = ws#{workspaceId}          (partition = one canvas)
//   sk = node#{nodeId} | edge#{edgeId}
//
// syncCanvas is a diff: existing keys are queried, removed nodes/edges are
// deleted, changed items are re-put, untouched items are skipped. This keeps
// consumed capacity proportional to the actual edit, matching the previous
// Postgres upsert behavior.

import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { CanvasEdge, CanvasNode, ICanvasStorage } from "./model";

const TABLE = process.env.CANVAS_DDB_TABLE || "meshwork-canvas";
const ENDPOINT = process.env.DYNAMODB_ENDPOINT; // dynamo-local in dev
const REGION = process.env.AWS_REGION || "us-east-1";

function ddb() {
  const client = new DynamoDBClient({
    endpoint: ENDPOINT,
    region: REGION,
    ...(ENDPOINT
      ? { credentials: { accessKeyId: "local", secretAccessKey: "local" } }
      : {}),
  });
  return { client, doc: DynamoDBDocumentClient.from(client) };
}

let cached: {
  client: DynamoDBClient;
  doc: ReturnType<typeof DynamoDBDocumentClient.from>;
} | null = null;
function clients() {
  cached ??= ddb();
  return cached;
}

export const partitionKey = (workspaceId: string) => `ws#${workspaceId}`;

/** Readiness probe used by tests and the /ready path. */
export async function canvasTableReady(timeoutMs = 1500): Promise<boolean> {
  const { client } = clients();
  try {
    const res = await Promise.race([
      client.send(new DescribeTableCommand({ TableName: TABLE })),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), timeoutMs),
      ),
    ]);
    return Boolean((res as { Table?: unknown }).Table);
  } catch (err) {
    if ((err as Error).name === "ResourceNotFoundException") return false;
    throw err;
  }
}

interface Item {
  pk: string;
  sk: string;
  body: Record<string, unknown>;
}

function nodeItem(workspaceId: string, n: CanvasNode): Item {
  const body = { ...n } as Record<string, unknown>;
  delete body.id;
  delete body.workspaceId;
  return {
    pk: partitionKey(workspaceId),
    sk: `node#${body.id as string}`,
    body,
  };
}

function edgeItem(workspaceId: string, e: CanvasEdge): Item {
  const body = { ...e } as Record<string, unknown>;
  const id = body.id as string;
  delete body.id;
  delete body.workspaceId;
  return { pk: partitionKey(workspaceId), sk: `edge#${id}`, body };
}

async function queryPartition(workspaceId: string): Promise<Item[]> {
  const { doc } = clients();
  const out: Item[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await doc.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "#pk = :pk",
        ExpressionAttributeNames: { "#pk": "pk" },
        ExpressionAttributeValues: { ":pk": partitionKey(workspaceId) },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) out.push(item as unknown as Item);
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

async function batchWrite(
  requests: {
    PutRequest?: { Item: Item };
    DeleteRequest?: { Key: Record<string, unknown> };
  }[],
): Promise<void> {
  const { doc } = clients();
  for (let i = 0; i < requests.length; i += 25) {
    const chunk = requests.slice(i, i + 25);
    await doc.send(
      new BatchWriteCommand({
        RequestItems: { [TABLE]: chunk },
      }),
    );
  }
}

export class DynamoCanvasStorage implements ICanvasStorage {
  async getNodes(workspaceId: string): Promise<CanvasNode[]> {
    const { doc } = clients();
    const res = await doc.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
        ExpressionAttributeValues: {
          ":pk": partitionKey(workspaceId),
          ":prefix": "node#",
        },
      }),
    );
    return (res.Items ?? []).map((i) => {
      const raw = i as unknown as { sk: string; body: Omit<CanvasNode, "id"> };
      return { ...raw.body, id: raw.sk.slice("node#".length) };
    });
  }

  async getEdges(workspaceId: string): Promise<CanvasEdge[]> {
    const { doc } = clients();
    const res = await doc.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
        ExpressionAttributeValues: {
          ":pk": partitionKey(workspaceId),
          ":prefix": "edge#",
        },
      }),
    );
    return (res.Items ?? []).map((i) => {
      const raw = i as unknown as { sk: string; body: Omit<CanvasEdge, "id"> };
      return { ...raw.body, id: raw.sk.slice("edge#".length) };
    });
  }

  async syncCanvas(
    workspaceId: string,
    nodes: CanvasNode[],
    edges: CanvasEdge[],
  ): Promise<void> {
    const desired = new Map<string, Item>();
    for (const n of nodes)
      desired.set(`node#${n.id}`, nodeItem(workspaceId, n));
    for (const e of edges)
      desired.set(`edge#${e.id}`, edgeItem(workspaceId, e));

    const existing = await queryPartition(workspaceId);
    const existingByKey = new Map(existing.map((i) => [i.sk, i]));

    const requests: Parameters<typeof batchWrite>[0] = [];

    // deletions: existed but no longer desired
    for (const [sk] of existingByKey) {
      if (!desired.has(sk)) {
        requests.push({
          DeleteRequest: { Key: { pk: partitionKey(workspaceId), sk } },
        });
      }
    }

    // puts: new or materially changed
    for (const [sk, item] of desired) {
      const prev = existingByKey.get(sk);
      if (prev && JSON.stringify(prev.body) === JSON.stringify(item.body)) {
        continue; // unchanged — skip write
      }
      requests.push({ PutRequest: { Item: item } });
    }

    if (requests.length > 0) await batchWrite(requests);
  }

  async duplicateCanvas(
    fromWorkspaceId: string,
    toWorkspaceId: string,
  ): Promise<void> {
    const source = await queryPartition(fromWorkspaceId);
    const requests = source.map((item) => ({
      PutRequest: {
        Item: { ...item, pk: partitionKey(toWorkspaceId) },
      },
    }));
    if (requests.length > 0) await batchWrite(requests);
  }

  /** Bulk cleanup keyed by explicit workspace ids (ownership resolved by the
   *  caller via the workspace service). */
  async deleteWorkspaces(workspaceIds: string[]): Promise<void> {
    for (const id of workspaceIds) {
      const existing = await queryPartition(id);
      const requests = existing.map((item) => ({
        DeleteRequest: { Key: { pk: item.pk, sk: item.sk } },
      }));
      if (requests.length > 0) await batchWrite(requests);
    }
  }
}
