#!/usr/bin/env npx tsx
/**
 * Provisions the canvas DynamoDB table (create if missing).
 *
 * Local dev : npx tsx scripts/provision-dynamodb.ts            (hits dynamo-local)
 * Production: AWS_ACCESS_KEY_ID=… AWS_SECRET_ACCESS_KEY=… \
 *             npx tsx scripts/provision-dynamodb.ts
 */
import {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { config as loadEnv } from "dotenv";

loadEnv();
loadEnv({ path: "server/services/auth/.env", quiet: true });

const TABLE = process.env.CANVAS_DDB_TABLE || "meshwork-canvas";
const ENDPOINT = process.env.DYNAMODB_ENDPOINT;
const REGION = process.env.AWS_REGION || "us-east-1";

const client = new DynamoDBClient({
  endpoint: ENDPOINT,
  region: REGION,
  ...(ENDPOINT
    ? { credentials: { accessKeyId: "local", secretAccessKey: "local" } }
    : {}),
});

async function main() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
    console.log(`✔ table "${TABLE}" already exists (${REGION})`);
    return;
  } catch (err) {
    if ((err as { name?: string }).name !== "ResourceNotFoundException")
      throw err;
  }

  console.log(
    `creating table "${TABLE}" in ${REGION}${ENDPOINT ? ` @ ${ENDPOINT}` : ""} …`,
  );
  await client.send(
    new CreateTableCommand({
      TableName: TABLE,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: "S" },
        { AttributeName: "sk", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "pk", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
      SSESpecification: { Enabled: true },
    }),
  );
  await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: TABLE });
  console.log(`✔ table "${TABLE}" ready (PAY_PER_REQUEST, encrypted)`);
}

main().catch((err) => {
  console.error(
    "✖ provisioning failed:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
});
