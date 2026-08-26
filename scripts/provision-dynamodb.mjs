// Provisions the canvas DynamoDB table (create if missing).
//   Local dev : DYNAMODB_ENDPOINT=http://127.0.0.1:8000 node scripts/provision-dynamodb.mjs
//   Production: AWS_ACCESS_KEY_ID=… AWS_SECRET_ACCESS_KEY=… AWS_REGION=… node scripts/provision-dynamodb.mjs
import {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

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

try {
  await client.send(new DescribeTableCommand({ TableName: TABLE }));
  console.log(`table "${TABLE}" already exists (${REGION})`);
} catch (err) {
  if (err?.name !== "ResourceNotFoundException") throw err;
  console.log(`creating table "${TABLE}" in ${REGION}${ENDPOINT ? ` @ ${ENDPOINT}` : ""} …`);
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
  console.log(`table "${TABLE}" ready (PAY_PER_REQUEST, encrypted)`);
}
