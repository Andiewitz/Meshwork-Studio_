import { describe, it, expect, vi, beforeAll } from "vitest";
import { validatePasswordStrength, PASSWORD_POLICY } from "@shared/auth";

// Mock redis
vi.mock("@server/lib/redis", () => ({
  getRedis: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock("@server/lib/logger", () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("Password Strength Validation", () => {
  it("should_accept_strong_password", () => {
    const result = validatePasswordStrength("MyP@ssw0rd!23");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should_reject_short_password", () => {
    const result = validatePasswordStrength("Ab1!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("12 characters"))).toBe(true);
  });

  it("should_reject_password_without_uppercase", () => {
    const result = validatePasswordStrength("myp@ssw0rd!23");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("uppercase"))).toBe(true);
  });

  it("should_reject_password_without_lowercase", () => {
    const result = validatePasswordStrength("MYP@SSW0RD!23");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("lowercase"))).toBe(true);
  });

  it("should_reject_password_without_number", () => {
    const result = validatePasswordStrength("MyP@ssword!abc");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("number"))).toBe(true);
  });

  it("should_reject_password_without_special_char", () => {
    const result = validatePasswordStrength("MyP4ssw0rd123");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("special"))).toBe(true);
  });

  it("should_return_all_errors_for_empty_password", () => {
    const result = validatePasswordStrength("");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("should_enforce_policy_min_length_12", () => {
    expect(PASSWORD_POLICY.minLength).toBe(12);
  });
});
