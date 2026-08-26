// Database-per-service connection factory.
//
// Every domain service owns exactly one database and connects with its own
// scoped user. There is NO shared pool and no fallback: a missing
// <SERVICE>_DATABASE_URL fails the boot loudly. Cross-service reads go
// through internal HTTP endpoints, never through someone else's database.
//
// The seam for future extraction is intentional: point a service's env var
// at a different host and it is genuinely its own database.

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { createChildLogger } from "./logger";

export function makeServiceDb<S extends Record<string, unknown>>(
  serviceName: string,
  envKey: string,
  schema: S,
): { pool: pg.Pool; db: NodePgDatabase<S> } {
  const connectionString = process.env[envKey];
  if (!connectionString) {
    throw new Error(
      `FATAL: ${envKey} must be set — the ${serviceName} service owns its own ` +
        `database and does not share connections (database-per-service boundary)`,
    );
  }

  const log = createChildLogger(`${serviceName}-db`);
  const svcPool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  svcPool.on("error", (err) => {
    log.error({ err }, "Unexpected error on idle database client");
  });
  log.info("dedicated database connection established");

  return { pool: svcPool, db: drizzle(svcPool, { schema: schema as never }) };
}
