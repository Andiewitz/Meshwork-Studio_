import { makeServiceDb } from "@server/lib/db";
import { createChildLogger } from "@server/lib/logger";

import * as schema from "./schema";

const log = createChildLogger("metrics-db");

// Split onto a dedicated database by setting METRICS_DATABASE_URL.
const service = makeServiceDb("metrics", "METRICS_DATABASE_URL", schema);
export const pool = service.pool;
export const db = service.db;

log.info("Metrics DB connection initialized");
