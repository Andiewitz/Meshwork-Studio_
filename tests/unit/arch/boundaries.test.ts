import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * ARCHITECTURE ENFORCEMENT — database-per-service boundaries.
 *
 * Each service owns its database and is the only module allowed to touch
 * its tables. These tests fail the build if anyone re-couples the services
 * through imports, no matter how convenient it feels at the time.
 */

const SERVER_DIR = path.resolve(__dirname, "../../../server");
const SERVICES = ["auth", "canvas", "workspace", "team", "ai", "metrics"];

function listFiles(dir: string, ext: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

describe("service boundary enforcement", () => {
  it("no service imports another service's db/storage internals", () => {
    const violations: string[] = [];

    for (const svc of SERVICES) {
      const dir = path.join(SERVER_DIR, "services", svc);
      const files = [...listFiles(dir, ".ts"), ...listFiles(dir, ".tsx")];
      for (const file of files) {
        // Type-only imports of another service's PORT interface are allowed
        // (that's how routes type their registry lookups). Everything else —
        // runtime imports of schema/storage/connection — is a violation.
        // Sanctioned client adapters (db/*-client) are also exempt.
        const content = fs
          .readFileSync(file, "utf-8")
          .split("\n")
          .filter((line) => !line.trim().startsWith("import type"))
          .join("\n");
        for (const other of SERVICES) {
          if (other === svc) continue;
          const pattern = new RegExp(
            `from ["']@services/${other}/db(?![a-z-]+-[a-z-]+-client)(?!.*-client)["']`,
          );
          const runtimeImport =
            new RegExp(`from ["']@services/${other}/db/storage`).test(
              content,
            ) ||
            new RegExp(`from ["']@services/${other}/db/schema`).test(content) ||
            new RegExp(`from ["']@services/${other}/db/connection`).test(
              content,
            );
          const clientImport = new RegExp(
            `from ["']@services/${other}/db/[a-z-]+-client`,
          ).test(content);
          if (runtimeImport && !clientImport) {
            violations.push(
              `${path.relative(SERVER_DIR, file)} → @services/${other}/db`,
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("services do not import the shared schema hub's table definitions", () => {
    const violations: string[] = [];

    for (const svc of SERVICES) {
      const dir = path.join(SERVER_DIR, "services", svc);
      for (const file of listFiles(dir, ".ts")) {
        // type-only imports are the sanctioned contract surface
        const content = fs
          .readFileSync(file, "utf-8")
          .split("\n")
          .filter((line) => !line.trim().startsWith("import type"))
          .join("\n");
        // The hub is types/contracts only; importing it from a service means
        // someone is reaching for a table definition that isn't theirs.
        if (/@shared\/schema["']/.test(content)) {
          violations.push(path.relative(SERVER_DIR, file));
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("every domain service owns exactly one migrations folder (or none by design)", () => {
    const TS_SERVICES = SERVICES.filter((s) => s !== "auth"); // Go: internal/store/migrations
    const withMigrations = TS_SERVICES.filter((svc) =>
      fs.existsSync(path.join(SERVER_DIR, "services", svc, "db/migrations")),
    );
    // canvas persists in DynamoDB — no SQL migrations.
    expect(withMigrations.sort()).toEqual(
      ["ai", "metrics", "team", "workspace"].sort(),
    );
  });

  it("makeServiceDb has no shared-pool fallback", async () => {
    delete process.env.WORKSPACE_DATABASE_URL;
    vi.resetModules();
    await expect(import("@services/workspace/db/connection")).rejects.toThrow(
      /must be set/,
    );
  });
});
