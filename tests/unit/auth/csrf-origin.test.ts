import { describe, it, expect } from "vitest";
import express from "express";

// The allowlist is built from env at module-load — configure BEFORE import.
process.env.FRONTEND_URL = "https://app.example.com";
process.env.NODE_ENV = "test";
const { isValidOrigin } = await import("../../../server/auth");

/**
 * Regression matrix for the CSRF origin allowlist.
 *
 * The original implementation used `host.includes("meshwork")`, allowing any
 * attacker origin like `https://meshwork.evil.com`. These tests lock in the
 * exact scheme+host matching on the monolith side (the Go service enforces
 * the same policy for its own endpoints — see its csrf_test.go).
 */

function reqWithHost(host: string): express.Request {
  const headers: Record<string, string> = { host };
  return {
    headers,
    get: (h: string) => headers[h.toLowerCase()],
  } as unknown as express.Request;
}

describe("csrf origin exact matching", () => {
  it("same-origin_host_matches", () => {
    const req = reqWithHost("api.example.com");
    expect(isValidOrigin(req, "https://api.example.com")).toBe(true);
  });

  it("configured_frontend_origin_matches_exactly", () => {
    const req = reqWithHost("other-host.example");
    expect(isValidOrigin(req, "https://app.example.com")).toBe(true);
  });

  const bypassAttempts = [
    "https://app.example.com.evil.io",
    "https://evil-app.example.com",
    "https://meshwork.evil.io",
    "http://app.example.com", // downgrade
    "null",
  ];
  for (const origin of bypassAttempts) {
    it(`rejects_${origin}`, () => {
      const req = reqWithHost("api.example.com");
      expect(isValidOrigin(req, origin)).toBe(false);
    });
  }

  it("missing_origin_returns_false_callers_decide_policy", () => {
    const req = reqWithHost("api.example.com");
    expect(isValidOrigin(req, undefined)).toBe(false);
  });
});
