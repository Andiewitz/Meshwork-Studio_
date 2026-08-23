import { describe, it, expect } from "vitest";
import { OAuthService } from "@services/auth/oauth/oauth-service";

describe("OAuth Service Tests", () => {
  it("should generate a secure random state string", async () => {
    const oauth = new OAuthService();
    const state = await oauth.createState();
    expect(state).toBeDefined();
    expect(typeof state).toBe("string");
    expect(state.length).toBeGreaterThan(16);
  });

  it("should verify and consume a valid state (single-use)", async () => {
    const oauth = new OAuthService();
    const state = await oauth.createState();

    // First verification should succeed
    const validFirstTime = await oauth.verifyAndConsumeState(state);
    expect(validFirstTime).toBe(true);

    // Second verification should fail because state was consumed
    const validSecondTime = await oauth.verifyAndConsumeState(state);
    expect(validSecondTime).toBe(false);
  });

  it("should reject invalid, missing, or empty state", async () => {
    const oauth = new OAuthService();
    expect(await oauth.verifyAndConsumeState(undefined)).toBe(false);
    expect(await oauth.verifyAndConsumeState("")).toBe(false);
    expect(await oauth.verifyAndConsumeState("short")).toBe(false);
    expect(await oauth.verifyAndConsumeState("invalid-state-that-does-not-exist")).toBe(false);
  });
});
