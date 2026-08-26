import { makeServiceDb } from "@server/lib/db";
import * as schema from "./schema";

// Split onto a dedicated database by setting TEAM_DATABASE_URL.
const { pool, db } = makeServiceDb("team", "TEAM_DATABASE_URL", schema);

export { pool, db };
