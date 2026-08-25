import type { Request } from "express";

export type AuthProvider = "email" | "password" | "google" | "github";

export interface PublicUser {
  id: string;
  email: string;
  emailNormalized: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  authProvider: string;
  isActive: boolean | null;
  isAdmin?: boolean;
  hasNotifiedTeam?: boolean | null;
  readNotificationIds?: unknown;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface AuthContext {
  userId: string;
  sessionId: string;
  user: PublicUser;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

export interface OptionalAuthRequest extends Request {
  auth?: AuthContext;
}

export interface AuthResult {
  user: PublicUser;
  expiresAt: string;
}

export interface SessionRecord {
  idHash: string;
  userId: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent?: string | null;
  ipHash?: string | null;
}
