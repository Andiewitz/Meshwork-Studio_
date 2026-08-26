import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createChildLogger } from "./logger";

const log = createChildLogger("db");

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  log.error(
    "DATABASE_URL is not set. All database operations will fail at runtime.",
  );
}

/**
 * Shared connection pool for the entire server process.
 * All modules import from here — do NOT create additional pools.
 *
 * Pool sizing: max=20 is appropriate for a monolith on a single Postgres
 * instance. When individual modules are extracted to microservices, each
 * service will own its own pool with a smaller max (e.g., 5–10).
 */
export const pool = new Pool({
  connectionString: connectionString || "postgres://",
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  log.error({ err }, "Unexpected error on idle database client");
});

export const db = drizzle(pool, { schema });

export { schema };

/**
 * Per-service connection factory. Every domain service uses the shared pool
 * unless its own *_DATABASE_URL is explicitly set (the seam for future
 * extraction — one env var flips a service onto an isolated database).
 */
export function makeServiceDb<S extends Record<string, unknown>>(
  serviceName: string,
  envKey: string,
  schema: S,
): { pool: pg.Pool; db: ReturnType<typeof drizzle> } {
  const connectionString = process.env[envKey];
  const svcPool = connectionString
    ? new pg.Pool({ connectionString, max: 10 })
    : pool;
  createChildLogger(`${serviceName}-db`).info(
    connectionString ? `dedicated database via ${envKey}` : "using shared pool",
  );
  return { pool: svcPool, db: drizzle(svcPool, { schema: schema as never }) };
}
