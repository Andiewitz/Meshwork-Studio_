import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  encryptApiKey,
  decryptApiKey,
  generateKeyHint,
  validateKeyFormat,
  generateEncryptionKey,
} from "@services/ai/encryption";

describe("AI Encryption Module", () => {
  const MOCK_API_KEY = "sk-or-v1-abcdef1234567890abcdef1234567890";
  let originalEnvKey: string | undefined;

  beforeEach(() => {
    // Save original key
    originalEnvKey = process.env.ENCRYPTION_KEY;
    // Generate a valid 32-byte base64 key for testing
    process.env.ENCRYPTION_KEY = generateEncryptionKey();
  });

  afterEach(() => {
    // Restore original key
    if (originalEnvKey) {
      process.env.ENCRYPTION_KEY = originalEnvKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe("encryptApiKey & decryptApiKey", () => {
    it("should successfully encrypt and decrypt an API key", () => {
      const { encryptedData, iv, authTag } = encryptApiKey(MOCK_API_KEY);

      expect(encryptedData).toBeDefined();
      expect(iv).toBeDefined();
      expect(authTag).toBeDefined();

      // Ensure encrypted data is not plaintext
      expect(encryptedData).not.toContain(MOCK_API_KEY);

      const decrypted = decryptApiKey(encryptedData, iv, authTag);
      expect(decrypted).toBe(MOCK_API_KEY);
    });

    it("should generate unique IVs for each encryption", () => {
      const result1 = encryptApiKey(MOCK_API_KEY);
      const result2 = encryptApiKey(MOCK_API_KEY);

      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encryptedData).not.toBe(result2.encryptedData);
      expect(result1.authTag).not.toBe(result2.authTag);
    });

    it("should throw an error if ENCRYPTION_KEY is missing", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encryptApiKey(MOCK_API_KEY)).toThrow(
        /ENCRYPTION_KEY environment variable is required/,
      );
    });

    it("should throw an error if ENCRYPTION_KEY is wrong length", () => {
      process.env.ENCRYPTION_KEY = Buffer.from("too-short").toString("base64");
      expect(() => encryptApiKey(MOCK_API_KEY)).toThrow(
        /ENCRYPTION_KEY must be 32 bytes/,
      );
    });

    it("should fail to decrypt if auth tag is tampered with", () => {
      const { encryptedData, iv, authTag } = encryptApiKey(MOCK_API_KEY);

      const authTagBuffer = Buffer.from(authTag, "base64");
      authTagBuffer[0] ^= 1; // Flip a bit
      const tamperedAuthTag = authTagBuffer.toString("base64");

      expect(() => decryptApiKey(encryptedData, iv, tamperedAuthTag)).toThrow();
    });

    it("should fail to decrypt if IV is wrong length", () => {
      const { encryptedData, authTag } = encryptApiKey(MOCK_API_KEY);
      const invalidIv = Buffer.from("short").toString("base64");

      expect(() => decryptApiKey(encryptedData, invalidIv, authTag)).toThrow(
        /Invalid IV length/,
      );
    });
  });

  describe("generateKeyHint", () => {
    it("should return last 4 chars for long keys", () => {
      expect(generateKeyHint("sk-1234567890abcd")).toBe("...abcd");
    });

    it("should return full string if 4 chars or less", () => {
      expect(generateKeyHint("abc")).toBe("abc");
      expect(generateKeyHint("abcd")).toBe("abcd");
    });
  });

  describe("validateKeyFormat", () => {
    it("should validate openai keys correctly", () => {
      expect(validateKeyFormat("openai", "sk-12345678901234567890")).toBe(true);
      expect(validateKeyFormat("openai", "invalid-key")).toBe(false); // No sk-
      expect(validateKeyFormat("openai", "sk-short")).toBe(false); // Too short
    });

    it("should validate anthropic keys correctly", () => {
      expect(
        validateKeyFormat("anthropic", "sk-ant-12345678901234567890"),
      ).toBe(true);
      expect(validateKeyFormat("anthropic", "sk-12345678901234567890")).toBe(
        false,
      ); // Missing ant-
    });

    it("should validate generic fallback keys correctly", () => {
      expect(validateKeyFormat("openrouter", "sk-or-v1-123")).toBe(true);
      expect(validateKeyFormat("openrouter", "short")).toBe(false); // Too short (< 10)
    });
  });
});
