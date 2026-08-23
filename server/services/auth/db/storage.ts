import {
  users,
  authIdentities,
  authSessions,
  authCsrfSecrets,
  loginAttempts,
  type User,
  type UpsertUser,
} from "./schema";
import { db } from "./connection";
import { eq, and, isNull, sql } from "drizzle-orm";
import { createChildLogger } from "@server/lib/logger";
import type { PublicUser, SessionRecord } from "../auth-types";
import {
  type IAuthStorage,
  type CreateUserInput,
  normalizeEmail,
} from "./auth-storage";

const log = createChildLogger("auth-storage");

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
    hasNotifiedTeam: user.hasNotifiedTeam,
    readNotificationIds: user.readNotificationIds,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class DrizzleAuthStorage implements IAuthStorage {
  async findUserById(userId: string): Promise<PublicUser | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isActive, true)))
      .limit(1);
    return row ? toPublicUser(row) : null;
  }

  async findUserByEmail(
    emailNormalized: string,
  ): Promise<(PublicUser & { passwordHash?: string | null }) | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(
        and(
          sql`LOWER(${users.email}) = ${emailNormalized}`,
          eq(users.isActive, true),
        ),
      )
      .limit(1);
    if (!row) return null;
    return {
      ...toPublicUser(row),
      passwordHash: row.passwordHash,
    };
  }

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const normalized = normalizeEmail(input.email);
    const [row] = await db
      .insert(users)
      .values({
        email: input.email.trim(),
        emailNormalized: normalized,
        firstName: input.firstName || null,
        lastName: input.lastName || null,
        profileImageUrl: input.profileImageUrl || null,
        passwordHash: input.passwordHash || null,
        authProvider: input.authProvider,
        isActive: true,
      })
      .returning();
    return toPublicUser(row);
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, data: Partial<User>): Promise<PublicUser> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new Error("User not found");
    return toPublicUser(updated);
  }

  async findIdentity(
    provider: string,
    providerAccountId: string,
  ): Promise<PublicUser | null> {
    const [row] = await db
      .select({
        user: users,
      })
      .from(authIdentities)
      .innerJoin(users, eq(authIdentities.userId, users.id))
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerAccountId, providerAccountId),
          eq(users.isActive, true),
        ),
      )
      .limit(1);
    return row ? toPublicUser(row.user) : null;
  }

  async linkIdentity(
    userId: string,
    provider: string,
    providerAccountId: string,
  ): Promise<void> {
    await db
      .insert(authIdentities)
      .values({
        userId,
        provider,
        providerAccountId,
      })
      .onConflictDoNothing();
  }

  async createSession(input: {
    idHash: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipHash?: string;
  }): Promise<void> {
    await db.insert(authSessions).values({
      idHash: input.idHash,
      userId: input.userId,
      expiresAt: input.expiresAt,
      userAgent: input.userAgent || null,
      ipHash: input.ipHash || null,
      createdAt: new Date(),
      lastSeenAt: new Date(),
    });
  }

  async findSession(idHash: string): Promise<SessionRecord | null> {
    const [row] = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.idHash, idHash),
          isNull(authSessions.revokedAt),
          sql`${authSessions.expiresAt} > NOW()`,
        ),
      )
      .limit(1);
    if (!row) return null;
    return {
      idHash: row.idHash,
      userId: row.userId,
      createdAt: row.createdAt,
      lastSeenAt: row.lastSeenAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      userAgent: row.userAgent,
      ipHash: row.ipHash,
    };
  }

  async touchSession(idHash: string, lastSeenAt: Date): Promise<void> {
    await db
      .update(authSessions)
      .set({ lastSeenAt })
      .where(eq(authSessions.idHash, idHash));
  }

  async revokeSession(idHash: string): Promise<void> {
    await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(authSessions.idHash, idHash));
  }

  async revokeAllUserSessions(
    userId: string,
    exceptIdHash?: string,
  ): Promise<void> {
    if (exceptIdHash) {
      await db
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(authSessions.userId, userId),
            sql`${authSessions.idHash} != ${exceptIdHash}`,
          ),
        );
    } else {
      await db
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(eq(authSessions.userId, userId));
    }
  }

  async saveCsrfSecret(
    sessionIdHash: string,
    secretHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await db
      .insert(authCsrfSecrets)
      .values({
        sessionIdHash,
        secretHash,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: authCsrfSecrets.sessionIdHash,
        set: {
          secretHash,
          expiresAt,
        },
      });
  }

  async findCsrfSecret(
    sessionIdHash: string,
  ): Promise<{ secretHash: string; expiresAt: Date } | null> {
    const [row] = await db
      .select()
      .from(authCsrfSecrets)
      .where(
        and(
          eq(authCsrfSecrets.sessionIdHash, sessionIdHash),
          sql`${authCsrfSecrets.expiresAt} > NOW()`,
        ),
      )
      .limit(1);
    return row
      ? { secretHash: row.secretHash, expiresAt: row.expiresAt }
      : null;
  }

  async getFailedAttempts(
    email: string,
  ): Promise<{ failed: number; lockedUntil: Date | null } | null> {
    const normalized = normalizeEmail(email);
    const [row] = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.email, normalized))
      .limit(1);
    return row ? { failed: row.failed, lockedUntil: row.lockedUntil } : null;
  }

  async recordFailedAttempt(
    email: string,
    lockDurationMs = 15 * 60 * 1000,
  ): Promise<{ failed: number; lockedUntil: Date | null }> {
    const normalized = normalizeEmail(email);
    const now = new Date();
    const existing = await this.getFailedAttempts(email);

    const newFailed = (existing?.failed ?? 0) + 1;
    let lockedUntil: Date | null = null;

    if (newFailed >= 5) {
      lockedUntil = new Date(now.getTime() + lockDurationMs);
    }

    await db
      .insert(loginAttempts)
      .values({
        email: normalized,
        failed: newFailed,
        lastAttempt: now,
        lockedUntil,
      })
      .onConflictDoUpdate({
        target: loginAttempts.email,
        set: {
          failed: newFailed,
          lastAttempt: now,
          lockedUntil,
        },
      });

    return { failed: newFailed, lockedUntil };
  }

  async resetFailedAttempts(email: string): Promise<void> {
    const normalized = normalizeEmail(email);
    await db.delete(loginAttempts).where(eq(loginAttempts.email, normalized));
  }

  // Legacy compatibility implementations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(
    userData: Partial<User> & { id: string; email: string },
  ): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as UpsertUser)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
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

export const authStorage: IAuthStorage =
  process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL
    ? new DrizzleAuthStorage()
    : new MemAuthStorage();
