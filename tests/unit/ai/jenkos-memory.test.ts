import { describe, it, expect } from "vitest";
import {
  formatMemoriesContext,
  formatCanvasContext,
  JENKOS_SYSTEM_PROMPT,
} from "@/features/workspace/agent/jenkosAgent";

describe("Jenkos Agent & Memory Context Formatting", () => {
  it("formats empty memories correctly", () => {
    expect(formatMemoriesContext([])).toBe("");
    expect(formatMemoriesContext(undefined)).toBe("");
  });

  it("formats structured architectural memories correctly", () => {
    const memories = [
      {
        key: "Database Choice",
        content:
          "Use Amazon Aurora PostgreSQL for multi-region transactional data",
        category: "architectural_decision",
      },
      {
        key: "Cache Strategy",
        content: "Redis ElastiCache for auth session caching with 1hr TTL",
        category: "system_pattern",
      },
    ];

    const formatted = formatMemoriesContext(memories);
    expect(formatted).toContain("RELEVANT MEMORIES & PERSISTENT CONTEXT:");
    expect(formatted).toContain(
      "- [architectural_decision] Database Choice: Use Amazon Aurora PostgreSQL",
    );
    expect(formatted).toContain(
      "- [system_pattern] Cache Strategy: Redis ElastiCache",
    );
  });

  it("injects memories into canvas context", () => {
    const memories = [
      {
        key: "Region",
        content: "Deploy primarily in us-east-1",
        category: "fact",
      },
    ];

    const result = formatCanvasContext([], [], { x: 0, y: 0 }, memories);
    expect(result).toContain("Deploy primarily in us-east-1");
    expect(result).toContain("CURRENT CANVAS STATE: Empty canvas");
  });

  it("maintains the Jenkos persona in the system prompt", () => {
    expect(JENKOS_SYSTEM_PROMPT).toContain("You are Jenkos");
    expect(JENKOS_SYSTEM_PROMPT).toContain("Meshwork Studio");
  });
});
