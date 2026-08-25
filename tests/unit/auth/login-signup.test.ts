import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
} from "@server/modules/auth/schemas";
import { validatePasswordStrength, PASSWORD_POLICY } from "@shared/auth";

// Mock bcrypt for password hashing tests
vi.mock("bcrypt", () => ({
  default: {
    hash: vi
      .fn()
      .mockImplementation(
        async (pwd: string, rounds: number) => `bcrypt:${rounds}:${pwd}`,
      ),
    compare: vi
      .fn()
      .mockImplementation(
        async (pwd: string, hash: string) => hash === `bcrypt:12:${pwd}`,
      ),
  },
}));

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

describe("Password Hashing", () => {
  let hashPassword: any;
  let verifyPassword: any;

  beforeAll(async () => {
    const mod = await import("@server/modules/auth/password");
    hashPassword = mod.hashPassword;
    verifyPassword = mod.verifyPassword;
  });

  it("should_hash_password_with_12_salt_rounds", async () => {
    const hash = await hashPassword("mypassword");
    expect(hash).toBe("bcrypt:12:mypassword");
  });

  it("should_verify_correct_password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("correctpassword", hash);
    expect(result).toBe(true);
  });

  it("should_reject_incorrect_password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("wrongpassword", hash);
    expect(result).toBe(false);
  });
});

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

describe("Login Schema Validation", () => {
  it("should_accept_valid_login_payload", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_invalid_email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anypassword",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_empty_password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_missing_email", () => {
    const result = loginSchema.safeParse({
      password: "anypassword",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_missing_password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("Register Schema Validation", () => {
  it("should_accept_valid_registration", () => {
    const result = registerSchema.safeParse({
      email: "new@example.com",
      password: "strongpassword123",
    });
    expect(result.success).toBe(true);
  });

  it("should_accept_optional_name_fields", () => {
    const result = registerSchema.safeParse({
      email: "new@example.com",
      password: "strongpassword123",
      firstName: "John",
      lastName: "Doe",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_short_password", () => {
    const result = registerSchema.safeParse({
      email: "new@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_invalid_email", () => {
    const result = registerSchema.safeParse({
      email: "bademail",
      password: "strongpassword123",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_empty_payload", () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("Change Password Schema Validation", () => {
  it("should_accept_valid_change_password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "newstrongpassword123",
    });
    expect(result.success).toBe(true);
  });

  it("should_reject_empty_current_password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newstrongpassword123",
    });
    expect(result.success).toBe(false);
  });

  it("should_reject_short_new_password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpassword",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});
