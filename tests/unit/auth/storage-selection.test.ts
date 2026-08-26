import { describe, it, expect } from "vitest";

/**
 * SECURITY regression: workspace storage selection must NEVER depend on an
 * auth bypass flag (E2E_BYPASS_AUTH previously swapped the production data
 * store to in-memory).
 */
describe("workspace storage selection", () => {
  it("always selects the database-backed storage", async () => {
    process.env.E2E_BYPASS_AUTH = "true"; // even when set…
    vi.resetModules();
    const { workspaceStorage } = await import("@services/workspace/db/storage");
    expect(workspaceStorage.constructor.name).toBe("WorkspaceDatabaseStorage");
    delete process.env.E2E_BYPASS_AUTH;
  });
});
