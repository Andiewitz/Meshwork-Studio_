import crypto from "node:crypto";
import type { IAuthStorage } from "../db/auth-storage";
import type { SessionRecord } from "../auth-types";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export class SessionService {
  constructor(
    private readonly storage: IAuthStorage,
    private readonly sessionDays = 30,
  ) {}

  async create(
    userId: string,
    metadata?: { userAgent?: string; ipHash?: string },
  ) {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const idHash = sha256(rawToken);
    const expiresAt = new Date(
      Date.now() + this.sessionDays * 24 * 60 * 60 * 1000,
    );
    await this.storage.createSession({
      idHash,
      userId,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipHash: metadata?.ipHash,
    });
    return { rawToken, idHash, userId, expiresAt };
  }

  async rotate(
    oldRawToken: string | undefined,
    userId: string,
    metadata?: { userAgent?: string; ipHash?: string },
  ) {
    if (oldRawToken) {
      await this.revoke(oldRawToken);
    }
    return this.create(userId, metadata);
  }

  async validate(rawToken: string): Promise<SessionRecord | null> {
    if (!rawToken || rawToken.length < 16) return null;
    const idHash = sha256(rawToken);
    const session = await this.storage.findSession(idHash);
    if (!session) return null;
    await this.storage.touchSession(idHash, new Date());
    return session;
  }

  async revoke(rawToken: string): Promise<void> {
    if (rawToken) {
      await this.storage.revokeSession(sha256(rawToken));
    }
  }

  async revokeAll(userId: string, exceptRawToken?: string): Promise<void> {
    await this.storage.revokeAllUserSessions(
      userId,
      exceptRawToken ? sha256(exceptRawToken) : undefined,
    );
  }
}
