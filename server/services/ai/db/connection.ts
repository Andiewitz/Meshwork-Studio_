import { makeServiceDb } from "@server/lib/db";
import * as schema from "./schema";

// Split onto a dedicated database by setting AI_DATABASE_URL.
const { pool, db } = makeServiceDb("ai", "AI_DATABASE_URL", schema);

export { pool, db };
