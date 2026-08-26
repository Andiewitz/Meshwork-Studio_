import { makeServiceDb } from "@server/lib/db";
import * as schema from "./schema";

// Split onto a dedicated database by setting CANVAS_DATABASE_URL.
const { pool, db } = makeServiceDb("canvas", "CANVAS_DATABASE_URL", schema);

export { pool, db };
