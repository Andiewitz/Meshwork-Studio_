// Canvas storage selector. DynamoDB is the single persistence path;
// CANVAS_DDB_TABLE names the table and DYNAMODB_ENDPOINT points at
// dynamo-local in development.
import { DynamoCanvasStorage } from "./dynamo";

export const canvasStorage = new DynamoCanvasStorage();
export { DynamoCanvasStorage };
