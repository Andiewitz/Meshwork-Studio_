import { describe, it, expect, vi } from "vitest";

/**
 * Database-per-service boundary tests.
 *
 * 1. Storage selection is always the real implementation — no env flag may
 *    swap production data stores.
 * 2. A service WITHOUT its own *_DATABASE_URL fails at boot (no shared-pool
 *    fallback) — that failure IS the ownership boundary being enforced.
 */

describe("workspace storage boundary", () => {
  it("always selects the database-backed storage", async () => {
    process.env.WORKSPACE_DATABASE_URL =
      "postgresql://workspace_app:test@localhost:5434/workspace_db";
    delete process.env.E2E_BYPASS_AUTH;
    vi.resetModules();
    const { workspaceStorage } = await import("@services/workspace/db/storage");
    expect(workspaceStorage.constructor.name).toBe("WorkspaceDatabaseStorage");
    delete process.env.WORKSPACE_DATABASE_URL;
  });

  it("refuses_to_boot_without_its_own_database_url", async () => {
    delete process.env.WORKSPACE_DATABASE_URL;
    delete process.env.DATABASE_URL;
    vi.resetModules();
    await expect(import("@services/workspace/db/connection")).rejects.toThrow(
      /WORKSPACE_DATABASE_URL must be set/,
    );
  });
});
