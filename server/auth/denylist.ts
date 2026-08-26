// In-memory denylist of revoked sessions, fed by the auth service's Redis
// revocation channel. Closes the gap between a session being revoked in
// auth_db and its assertion expiring (≤ AUTH_ASSERTION_TTL).

import { createRedisClient } from "../lib/redis";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("auth-denylist");

export const REVOCATION_CHANNEL = "identity:sessions:revoked";

class Denylist {
  private sids = new Set<string>();
  private order: string[] = [];
  private readonly capacity = 50_000;

  add(sidHash: string): void {
    if (this.sids.has(sidHash)) return;
    if (this.order.length >= this.capacity) {
      const oldest = this.order.shift();
      if (oldest) this.sids.delete(oldest);
    }
    this.sids.add(sidHash);
    this.order.push(sidHash);
  }

  has(sidHash: string | undefined | null): boolean {
    if (!sidHash) return false;
    return this.sids.has(sidHash);
  }

  get size(): number {
    return this.sids.size;
  }
}

export const revokedSessions = new Denylist();

let subscribed = false;

/** Subscribes once; safe to call at boot. Failures are non-fatal — the
 *  assertion TTL bounds staleness when the channel is unavailable. */
export function startRevocationListener(): void {
  if (subscribed) return;
  subscribed = true;

  const sub = createRedisClient();
  if (!sub) {
    log.warn(
      "Redis unavailable — assertion denylist disabled (TTL-bounded staleness)",
    );
    return;
  }
  sub
    .subscribe(REVOCATION_CHANNEL)
    .then(() => log.info("subscribed to session revocations"))
    .catch((err: Error) => log.warn({ err }, "revocation subscribe failed"));

  sub.on("message", (_channel: string, message: string) => {
    try {
      const payload = JSON.parse(message) as {
        userId?: string;
        idHashes?: string[];
      };
      for (const h of payload.idHashes ?? []) revokedSessions.add(h);
    } catch (err) {
      log.error({ err }, "bad revocation payload");
    }
  });
}
