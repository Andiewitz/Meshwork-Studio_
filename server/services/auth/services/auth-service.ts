import type { AuthProvider, AuthResult, PublicUser } from "../auth-types";
import {
  AuthError,
  invalidCredentials,
  accountLocked,
} from "../auth-errors";
import { normalizeEmail, type IAuthStorage } from "../db/auth-storage";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
} from "./password-service";
import { SessionService } from "./session-service";
import { createChildLogger } from "@server/lib/logger";

const log = createChildLogger("auth-service");

export class AuthService {
  constructor(
    private readonly storage: IAuthStorage,
    private readonly sessions: SessionService,
  ) {}

  async register(
    input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    },
    metadata?: { userAgent?: string; ipHash?: string },
    oldSessionToken?: string,
  ): Promise<AuthResult & { sessionToken: string }> {
    const emailNormalized = normalizeEmail(input.email);
    validatePassword(input.password);

    const existing = await this.storage.findUserByEmail(emailNormalized);
    if (existing) {
      log.warn({ email: emailNormalized }, "Registration attempt with existing email");
      throw new AuthError(
        "REGISTRATION_UNAVAILABLE",
        "Registration could not be completed with the provided information.",
        409,
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.storage.createUser({
      email: input.email.trim(),
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      passwordHash,
      authProvider: "email",
    });

    log.info({ userId: user.id }, "User registered successfully");
    return this.withRotatedSession(user, metadata, oldSessionToken);
  }

  async login(
    input: { email: string; password: string },
    metadata?: { userAgent?: string; ipHash?: string },
    oldSessionToken?: string,
  ): Promise<AuthResult & { sessionToken: string }> {
    const normalizedEmail = normalizeEmail(input.email);

    // 1. Account Lockout Check
    const lockoutState = await this.storage.getFailedAttempts(normalizedEmail);
    if (lockoutState?.lockedUntil && lockoutState.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (lockoutState.lockedUntil.getTime() - Date.now()) / 60000,
      );
      log.warn(
        { email: normalizedEmail, minutesRemaining },
        "Login attempted on locked account",
      );
      throw accountLocked(minutesRemaining);
    }

    // 2. Lookup user & verify password
    const account = await this.storage.findUserByEmail(normalizedEmail);
    const valid = await verifyPassword(input.password, account?.passwordHash);

    if (!account || !valid) {
      // Record failure for lockout protection
      const attempt = await this.storage.recordFailedAttempt(normalizedEmail);
      log.warn(
        { email: normalizedEmail, failedCount: attempt.failed },
        "Invalid login credentials",
      );
      if (attempt.lockedUntil) {
        throw accountLocked(15);
      }
      throw invalidCredentials();
    }

    // 3. Clear failed attempts on successful login
    await this.storage.resetFailedAttempts(normalizedEmail);

    log.info({ userId: account.id }, "User logged in successfully");
    return this.withRotatedSession(account, metadata, oldSessionToken);
  }

  async loginWithIdentity(
    provider: string,
    providerAccountId: string,
    profile: {
      email: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    },
    metadata?: { userAgent?: string; ipHash?: string },
    oldSessionToken?: string,
  ): Promise<AuthResult & { sessionToken: string }> {
    let user = await this.storage.findIdentity(provider, providerAccountId);
    if (!user) {
      const byEmail = await this.storage.findUserByEmail(
        normalizeEmail(profile.email),
      );
      user =
        byEmail ??
        (await this.storage.createUser({
          ...profile,
          email: profile.email,
          authProvider: provider,
        }));
      await this.storage.linkIdentity(user.id, provider, providerAccountId);
    }
    return this.withRotatedSession(user, metadata, oldSessionToken);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const account = await this.storage.findUserById(userId);
    if (!account) throw invalidCredentials();

    const withPassword = await this.storage.findUserByEmail(
      normalizeEmail(account.email),
    );
    if (
      !withPassword ||
      !(await verifyPassword(currentPassword, withPassword.passwordHash))
    ) {
      throw invalidCredentials();
    }

    validatePassword(newPassword);
    const newHash = await hashPassword(newPassword);
    await this.storage.setPasswordHash(userId, newHash);
    await this.sessions.revokeAll(userId);
    log.info({ userId }, "Password changed successfully; all sessions revoked");
  }

  async logout(userId: string, rawSessionToken: string): Promise<void> {
    if (rawSessionToken) {
      await this.sessions.revoke(rawSessionToken);
    }
    log.info({ userId }, "User session revoked upon logout");
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.revokeAll(userId);
    log.info({ userId }, "All user sessions revoked");
  }

  private async withRotatedSession(
    user: PublicUser,
    metadata?: { userAgent?: string; ipHash?: string },
    oldSessionToken?: string,
  ) {
    const session = await this.sessions.rotate(
      oldSessionToken,
      user.id,
      metadata,
    );
    return {
      user,
      sessionToken: session.rawToken,
      expiresAt: session.expiresAt.toISOString(),
    };
  }
}
