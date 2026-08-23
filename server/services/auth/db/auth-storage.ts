import type { AuthProvider, PublicUser, SessionRecord } from "../auth-types";
import type { User } from "./schema";

export interface CreateUserInput {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  passwordHash?: string | null;
  profileImageUrl?: string | null;
  authProvider: string;
}

export interface IAuthStorage {
  findUserById(userId: string): Promise<PublicUser | null>;
  findUserByEmail(emailNormalized: string): Promise<(PublicUser & { passwordHash?: string | null }) | null>;
  createUser(input: CreateUserInput): Promise<PublicUser>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
  updateUser(userId: string, data: Partial<User>): Promise<PublicUser>;
  findIdentity(provider: string, providerAccountId: string): Promise<PublicUser | null>;
  linkIdentity(userId: string, provider: string, providerAccountId: string): Promise<void>;
  createSession(input: {
    idHash: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipHash?: string;
  }): Promise<void>;
  findSession(idHash: string): Promise<SessionRecord | null>;
  touchSession(idHash: string, lastSeenAt: Date): Promise<void>;
  revokeSession(idHash: string): Promise<void>;
  revokeAllUserSessions(userId: string, exceptIdHash?: string): Promise<void>;
  saveCsrfSecret(sessionIdHash: string, secretHash: string, expiresAt: Date): Promise<void>;
  findCsrfSecret(sessionIdHash: string): Promise<{ secretHash: string; expiresAt: Date } | null>;
  
  // Account lockout helpers
  getFailedAttempts(email: string): Promise<{ failed: number; lockedUntil: Date | null } | null>;
  recordFailedAttempt(email: string, lockDurationMs?: number): Promise<{ failed: number; lockedUntil: Date | null }>;
  resetFailedAttempts(email: string): Promise<void>;

  // Legacy compatibility
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: Partial<User> & { id: string; email: string }): Promise<User>;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
