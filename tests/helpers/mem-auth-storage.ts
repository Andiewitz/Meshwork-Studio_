// Test-only in-memory implementation of IAuthStorage.
// SECURITY: intentionally NOT exported from production code paths — the
// auth service fails fast without a database instead of degrading to memory.
import type {
  IAuthStorage,
  CreateUserInput,
} from "@services/auth/db/auth-storage";
import { normalizeEmail } from "@services/auth/db/auth-storage";
import type { User, UpsertUser } from "@services/auth/db/schema";
import type { PublicUser, SessionRecord } from "@services/auth/auth-types";

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    emailNormalized: user.emailNormalized ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    authProvider: user.authProvider,
    isActive: user.isActive ?? true,
    isAdmin: user.isAdmin ?? false,
    hasNotifiedTeam: user.hasNotifiedTeam,
    readNotificationIds: user.readNotificationIds,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class MemAuthStorage implements IAuthStorage {
  private users = new Map<string, User>();
  private identities = new Map<
    string,
    { userId: string; provider: string; providerAccountId: string }
  >();
  private sessions = new Map<string, SessionRecord>();
  private csrfSecrets = new Map<
    string,
    { secretHash: string; expiresAt: Date }
  >();
  private attempts = new Map<
    string,
    { failed: number; lastAttempt: Date; lockedUntil: Date | null }
  >();

  async findUserById(userId: string): Promise<PublicUser | null> {
    const user = this.users.get(userId);
    return user ? toPublicUser(user) : null;
  }

  async findUserByEmail(
    emailNormalized: string,
  ): Promise<(PublicUser & { passwordHash?: string | null }) | null> {
    for (const user of this.users.values()) {
      if (normalizeEmail(user.email) === emailNormalized && user.isActive) {
        return { ...toPublicUser(user), passwordHash: user.passwordHash };
      }
    }
    return null;
  }

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const now = new Date();
    const user: User = {
      id: "mem-usr-" + Math.random().toString(36).substring(2, 10),
      email: input.email.trim(),
      emailNormalized: normalizeEmail(input.email),
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      profileImageUrl: input.profileImageUrl || null,
      passwordHash: input.passwordHash || null,
      authProvider: input.authProvider,
      isActive: true,
      isAdmin: false,
      hasNotifiedTeam: false,
      readNotificationIds: [],
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return toPublicUser(user);
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
    }
  }

  async updateUser(userId: string, data: Partial<User>): Promise<PublicUser> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(userId, updated);
    return toPublicUser(updated);
  }

  async findIdentity(
    provider: string,
    providerAccountId: string,
  ): Promise<PublicUser | null> {
    const key = `${provider}:${providerAccountId}`;
    const id = this.identities.get(key);
    if (!id) return null;
    return this.findUserById(id.userId);
  }

  async linkIdentity(
    userId: string,
    provider: string,
    providerAccountId: string,
  ): Promise<void> {
    const key = `${provider}:${providerAccountId}`;
    this.identities.set(key, { userId, provider, providerAccountId });
  }

  async createSession(input: {
    idHash: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipHash?: string;
  }): Promise<void> {
    const now = new Date();
    this.sessions.set(input.idHash, {
      idHash: input.idHash,
      userId: input.userId,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: input.expiresAt,
      revokedAt: null,
      userAgent: input.userAgent,
      ipHash: input.ipHash,
    });
  }

  async findSession(idHash: string): Promise<SessionRecord | null> {
    const s = this.sessions.get(idHash);
    if (!s || s.revokedAt || s.expiresAt <= new Date()) return null;
    return s;
  }

  async touchSession(idHash: string, lastSeenAt: Date): Promise<void> {
    const s = this.sessions.get(idHash);
    if (s) s.lastSeenAt = lastSeenAt;
  }

  async revokeSession(idHash: string): Promise<void> {
    const s = this.sessions.get(idHash);
    if (s) s.revokedAt = new Date();
  }

  async revokeAllUserSessions(
    userId: string,
    exceptIdHash?: string,
  ): Promise<void> {
    const now = new Date();
    for (const [idHash, s] of this.sessions.entries()) {
      if (s.userId === userId && idHash !== exceptIdHash) {
        s.revokedAt = now;
      }
    }
  }

  async saveCsrfSecret(
    sessionIdHash: string,
    secretHash: string,
    expiresAt: Date,
  ): Promise<void> {
    this.csrfSecrets.set(sessionIdHash, { secretHash, expiresAt });
  }

  async findCsrfSecret(
    sessionIdHash: string,
  ): Promise<{ secretHash: string; expiresAt: Date } | null> {
    const secret = this.csrfSecrets.get(sessionIdHash);
    if (!secret || secret.expiresAt <= new Date()) return null;
    return secret;
  }

  async getFailedAttempts(
    email: string,
  ): Promise<{ failed: number; lockedUntil: Date | null } | null> {
    const normalized = normalizeEmail(email);
    return this.attempts.get(normalized) || null;
  }

  async recordFailedAttempt(
    email: string,
    lockDurationMs = 15 * 60 * 1000,
  ): Promise<{ failed: number; lockedUntil: Date | null }> {
    const normalized = normalizeEmail(email);
    const now = new Date();
    const existing = this.attempts.get(normalized);
    const newFailed = (existing?.failed ?? 0) + 1;
    let lockedUntil: Date | null = null;
    if (newFailed >= 5) {
      lockedUntil = new Date(now.getTime() + lockDurationMs);
    }
    const record = { failed: newFailed, lastAttempt: now, lockedUntil };
    this.attempts.set(normalized, record);
    return record;
  }

  async resetFailedAttempts(email: string): Promise<void> {
    const normalized = normalizeEmail(email);
    this.attempts.delete(normalized);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(
    userData: Partial<User> & { id: string; email: string },
  ): Promise<User> {
    const now = new Date();
    const existing = this.users.get(userData.id);
    const user: User = {
      ...existing,
      ...userData,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    } as User;
    this.users.set(userData.id, user);
    return user;
  }
}
