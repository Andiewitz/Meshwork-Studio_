import crypto from "node:crypto";
import { getRedis } from "@server/lib/redis";
import { createChildLogger } from "@server/lib/logger";

const log = createChildLogger("oauth-service");
const STATE_TTL_SECONDS = 600; // 10 minutes

export class OAuthService {
  private fallbackStates = new Map<string, number>();

  async createState(): Promise<string> {
    const state = crypto.randomBytes(32).toString("base64url");
    const redis = getRedis();

    if (redis) {
      try {
        await redis.set(`oauth:state:${state}`, "valid", "EX", STATE_TTL_SECONDS);
        return state;
      } catch (err) {
        log.warn({ err }, "Failed to save OAuth state in Redis, falling back to memory");
      }
    }

    // In-memory fallback with TTL
    this.cleanupFallbackStates();
    this.fallbackStates.set(state, Date.now() + STATE_TTL_SECONDS * 1000);
    return state;
  }

  async verifyAndConsumeState(state: string | undefined): Promise<boolean> {
    if (!state || typeof state !== "string" || state.length < 16) {
      return false;
    }

    const redis = getRedis();
    if (redis) {
      try {
        const key = `oauth:state:${state}`;
        const exists = await redis.get(key);
        if (exists) {
          await redis.del(key); // Single-use consumption
          return true;
        }
      } catch (err) {
        log.warn({ err }, "Failed to check OAuth state in Redis, checking fallback");
      }
    }

    // In-memory fallback check
    const expiresAt = this.fallbackStates.get(state);
    if (!expiresAt) return false;

    this.fallbackStates.delete(state); // Single-use consumption
    return expiresAt > Date.now();
  }

  private cleanupFallbackStates(): void {
    const now = Date.now();
    for (const [state, expiresAt] of this.fallbackStates.entries()) {
      if (expiresAt <= now) {
        this.fallbackStates.delete(state);
      }
    }
  }
}
