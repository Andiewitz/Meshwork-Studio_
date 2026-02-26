import { db } from "./db";
import { users, verificationAttempts } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomInt } from "crypto";

const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const ATTEMPT_WINDOW_MINUTES = 10;

/**
 * Generate a 6-digit verification code
 */
export function generateCode(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Check rate limiting for verification attempts
 */
async function checkRateLimit(email: string): Promise<boolean> {
  const [attempt] = await db
    .select()
    .from(verificationAttempts)
    .where(eq(verificationAttempts.email, email));

  if (!attempt) {
    return true; // No attempts yet
  }

  const now = new Date();
  const lastAttempt = attempt.lastAttemptAt ? new Date(attempt.lastAttemptAt) : new Date(0);
  const resetAt = attempt.resetAt ? new Date(attempt.resetAt) : null;

  // Check if we need to reset the counter
  if (resetAt && now > resetAt) {
    await db
      .update(verificationAttempts)
      .set({ attemptCount: 0, resetAt: null })
      .where(eq(verificationAttempts.email, email));
    return true;
  }

  // Check if within rate limit window
  const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MINUTES * 60 * 1000);
  if (lastAttempt < windowStart) {
    // Outside window, reset counter
    await db
      .update(verificationAttempts)
      .set({ attemptCount: 0, resetAt: null })
      .where(eq(verificationAttempts.email, email));
    return true;
  }

  return (attempt.attemptCount ?? 0) < MAX_ATTEMPTS;
}

/**
 * Increment attempt counter
 */
async function incrementAttempt(email: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(verificationAttempts)
    .where(eq(verificationAttempts.email, email));

  if (existing) {
    await db
      .update(verificationAttempts)
      .set({
        attemptCount: (existing.attemptCount ?? 0) + 1,
        lastAttemptAt: new Date(),
      })
      .where(eq(verificationAttempts.email, email));
  } else {
    await db.insert(verificationAttempts).values({
      email,
      attemptCount: 1,
      lastAttemptAt: new Date(),
    });
  }
}

/**
 * Create and store a verification code for a user
 */
export async function createVerification(email: string): Promise<string> {
  // Check rate limiting
  const allowed = await checkRateLimit(email);
  if (!allowed) {
    throw new Error("Too many attempts. Please try again in 10 minutes.");
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // Store code in user record
  await db
    .update(users)
    .set({
      emailVerificationCode: code,
      emailVerificationExpires: expiresAt,
    })
    .where(eq(users.email, email));

  // Increment attempt counter
  await incrementAttempt(email);

  return code;
}

/**
 * Verify a code for a user
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  const [user] = await db
    .select({
      emailVerificationCode: users.emailVerificationCode,
      emailVerificationExpires: users.emailVerificationExpires,
      isEmailVerified: users.isEmailVerified,
    })
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    return false;
  }

  // Check if code matches and hasn't expired
  if (
    user.emailVerificationCode !== code ||
    !user.emailVerificationExpires ||
    new Date() > new Date(user.emailVerificationExpires)
  ) {
    return false;
  }

  // Mark email as verified and clear code
  await db
    .update(users)
    .set({
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpires: null,
    })
    .where(eq(users.email, email));

  return true;
}

/**
 * Check if a user's email is verified
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const [user] = await db
    .select({ isEmailVerified: users.isEmailVerified })
    .from(users)
    .where(eq(users.email, email));

  return user?.isEmailVerified ?? false;
}
