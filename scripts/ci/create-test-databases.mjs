// Only provisions the disposable PostgreSQL service used by GitHub Actions.
// Separate databases mirror production ownership and avoid migration collisions.
import pg from "pg";

if (process.env.CI !== "true" || process.env.NODE_ENV !== "test") {
  throw new Error(
    "Test database provisioning requires CI=true and NODE_ENV=test",
  );
}
const url = new URL(process.env.DATABASE_URL);
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.pathname !== "/test_db"
) {
  throw new Error(
    "Refusing to provision databases outside the local test instance",
  );
}
const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
try {
  // Identifiers are fixed, not supplied by an environment variable or PR input.
  for (const service of ["auth", "workspace", "team", "ai", "metrics"]) {
    await client.query(`CREATE DATABASE "test_${service}_db"`);
  }
} finally {
  await client.end();
}
