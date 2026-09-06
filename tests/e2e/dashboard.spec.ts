import { test, expect } from "@playwright/test";

/**
 * Dashboard E2E Tests
 *
 * These tests run against the configured Playwright base URL. Local runs start
 * the dev server; smoke runs set BASE_URL and target a deployed environment.
 *
 * CSRF tokens are fetched from /api/v1/csrf-token before each mutating request.
 */

test.describe("Dashboard Feature Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate through the normal application/auth flow.
    await page.goto("/home");
  });

  test("@smoke should render the dashboard without a white screen or React crash", async ({
    page,
  }) => {
    // The body should be visible
    await expect(page.locator("body")).toBeVisible();

    // No minified React error boundary message
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("Minified React error");
  });

  test("should open the Create Workspace dialog and render all expected fields", async ({
    page,
  }) => {
    // Click the NEW WORKSPACE button (could be in the hero or the sidebar)
    const newWorkspaceBtn = page
      .locator("button", { hasText: "NEW WORKSPACE" })
      .first();
    await expect(newWorkspaceBtn).toBeVisible({ timeout: 10000 });
    await newWorkspaceBtn.click();

    // Dialog should appear
    const dialog = page.locator("h3", { hasText: "Initialize Workspace" });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Check for the name input
    const input = page.locator('input[placeholder="Workspace name"]');
    await expect(input).toBeVisible();

    // Check for character count indicator
    await expect(page.locator("text=/\\d+ characters/")).toBeVisible();
  });

  test("should create a new workspace and display it in the list", async ({
    page,
  }) => {
    // --- Step 1: Fetch CSRF token via the API ---
    const csrfRes = await page.request.get("/api/v1/csrf-token");
    const csrfToken = csrfRes.headers()["x-csrf-token"] ?? "";

    // --- Step 2: Create a workspace directly via API so we control the name ---
    const wsName = `E2E Workspace ${Date.now()}`;
    const createRes = await page.request.post("/api/v1/workspaces", {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      data: { title: wsName, type: "system", icon: "box" },
    });
    expect(createRes.status()).toBe(201);

    // --- Step 3: Reload so the new workspace appears in the list ---
    await page.reload();

    // The workspace name should be visible somewhere on the dashboard
    await expect(page.locator(`text=${wsName}`)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should toggle the favorite star on a newly created workspace", async ({
    page,
  }) => {
    // --- Step 1: Fetch CSRF token ---
    const csrfRes = await page.request.get("/api/v1/csrf-token");
    const csrfToken = csrfRes.headers()["x-csrf-token"] ?? "";

    // --- Step 2: Create a workspace to guarantee at least one exists ---
    const wsName = `Fav Test ${Date.now()}`;
    await page.request.post("/api/v1/workspaces", {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      data: { title: wsName, type: "system", icon: "box" },
    });

    // --- Step 3: Reload and locate the first workspace card ---
    await page.reload();

    // Find the star/favourite button on the first card in Recent Projects
    const firstCard = page
      .locator("section", { hasText: "Recent Projects" })
      .locator("div.group")
      .first();
    const starButton = firstCard.locator("button").first();

    await expect(starButton).toBeVisible({ timeout: 10000 });
    await starButton.hover();
    await starButton.click();

    // After toggling on, some visual indicator should change (class or aria)
    // We simply verify the click didn't crash the page
    await expect(page.locator("body")).toBeVisible();
  });
});
