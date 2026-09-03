import { describe, it, expect } from "vitest";
import {
  insertConversationSchema,
  insertMessageSchema,
  insertMemorySchema,
  insertUserApiKeySchema,
} from "@services/ai/db/schema";

describe("Jenkos DB Schemas & Zod Validation", () => {
  describe("Conversation Schema", () => {
    it("validates a standard workspace conversation payload", () => {
      const validPayload = {
        userId: "usr_abc123",
        workspaceId: "ws_xyz789",
        scope: "workspace",
        title: "High-Traffic E-Commerce Architecture",
        context: {
          activeNodesCount: 12,
          currentRegion: "us-east-1",
        },
      };

      const parsed = insertConversationSchema.parse(validPayload);
      expect(parsed.userId).toBe("usr_abc123");
      expect(parsed.workspaceId).toBe("ws_xyz789");
      expect(parsed.scope).toBe("workspace");
      expect(parsed.title).toBe("High-Traffic E-Commerce Architecture");
    });

    it("rejects conversation payloads missing userId", () => {
      const invalid = {
        workspaceId: "ws_123",
        title: "Missing User",
      };

      expect(() => insertConversationSchema.parse(invalid)).toThrow();
    });

    it("allows global scope conversations without workspaceId", () => {
      const globalPayload = {
        userId: "usr_abc123",
        scope: "global",
        title: "General Distributed Systems Q&A",
      };

      const parsed = insertConversationSchema.parse(globalPayload);
      expect(parsed.workspaceId).toBeUndefined();
      expect(parsed.scope).toBe("global");
    });
  });

  describe("Message Schema", () => {
    it("validates assistant turn with toolCalls and execution results", () => {
      const messagePayload = {
        conversationId: "conv_123",
        role: "assistant",
        content: "Added Redis cache and Postgres primary with replica.",
        toolCalls: [
          {
            id: "call_abc",
            name: "edit_canvas",
            args: {
              action: "add",
              nodes: [
                { id: "cache-1", type: "cache", label: "Redis Cluster" },
                { id: "db-1", type: "database", label: "Aurora Postgres" },
              ],
            },
          },
        ],
        toolResults: [
          {
            callId: "call_abc",
            success: true,
            createdNodeIds: ["cache-1", "db-1"],
          },
        ],
        metadata: {
          model: "gemini-3.5-flash",
          tokensUsed: 420,
          latencyMs: 850,
        },
      };

      const parsed = insertMessageSchema.parse(messagePayload);
      expect(parsed.conversationId).toBe("conv_123");
      expect(parsed.role).toBe("assistant");
      expect(parsed.toolCalls).toHaveLength(1);
      expect(parsed.toolResults).toHaveLength(1);
    });

    it("rejects message without conversationId or role", () => {
      expect(() =>
        insertMessageSchema.parse({
          content: "Hello",
        }),
      ).toThrow();
    });
  });

  describe("Memory Schema", () => {
    it("validates architectural decision memory record", () => {
      const memoryPayload = {
        userId: "usr_123",
        workspaceId: "ws_456",
        scope: "workspace",
        category: "architectural_decision",
        key: "Caching Layer",
        content: "Use Redis with LRU eviction and 1hr TTL on session tokens",
        tags: ["redis", "caching", "sessions"],
        confidence: 0.95,
      };

      const parsed = insertMemorySchema.parse(memoryPayload);
      expect(parsed.category).toBe("architectural_decision");
      expect(parsed.key).toBe("Caching Layer");
      expect(parsed.tags).toEqual(["redis", "caching", "sessions"]);
      expect(parsed.confidence).toBe(0.95);
    });

    it("validates user preference memory record", () => {
      const prefPayload = {
        userId: "usr_123",
        scope: "user",
        category: "user_preference",
        key: "Preferred Cloud Provider",
        content:
          "Always default to AWS services unless explicitly asked for GCP",
        tags: ["cloud", "aws", "defaults"],
      };

      const parsed = insertMemorySchema.parse(prefPayload);
      expect(parsed.category).toBe("user_preference");
      expect(parsed.scope).toBe("user");
    });
  });
});
