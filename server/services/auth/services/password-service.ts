import bcrypt from "bcrypt";
import { AuthError } from "../auth-errors";

const BCRYPT_ROUNDS = 12;

export function validatePassword(password: string): void {
  if (!password || typeof password !== "string") {
    throw new AuthError("WEAK_PASSWORD", "Password is required", 400);
  }
  if (password.length < 8) {
    throw new AuthError(
      "WEAK_PASSWORD",
      "Password must be at least 8 characters long",
      400,
    );
  }
  if (password.length > 128) {
    throw new AuthError(
      "WEAK_PASSWORD",
      "Password must not exceed 128 characters",
      400,
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePassword(password);
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  if (!password || !passwordHash) return false;
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
}
