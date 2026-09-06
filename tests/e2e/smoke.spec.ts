import { test, expect } from "@playwright/test";

// Anonymous smoke is intentionally separate from authenticated dashboard E2E.
// It must prove boot, real auth routing and rendered UI, not just a visible body.
test("@smoke ready app protects the dashboard and renders a working login", async ({
  page,
  request,
}) => {
  const ready = await request.get("/ready");
  expect(ready.status()).toBe(200);

  const protectedRoute = await request.get("/api/v1/workspaces");
  expect(protectedRoute.status()).toBe(401);

  const auth = await request.get("/api/v1/auth/me");
  expect(auth.status()).toBe(401);

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/home");
  // ProtectedRoute intentionally returns anonymous users to the landing page.
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
