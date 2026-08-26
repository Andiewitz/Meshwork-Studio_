// Auth middleware for the monolith: verifies the Go-signed assertion cookie
// locally. No database, no session store — identity is a signed claim.

import type { Request, RequestHandler } from "express";
import { Verifier, type AssertionClaims } from "./assertion";
import { revokedSessions, startRevocationListener } from "./denylist";

export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  isAdmin: boolean;
  sessionId: string;
}

export interface AuthContext {
  userId: string;
  sessionId: string;
  user: AuthUser;
}

let verifier: Verifier | null = null;

/** Boot-time initialisation. Production refuses to start without keys. */
export function initAuth(): void {
  const seed = process.env.AUTH_ASSERTION_PUBLIC_KEY?.trim();
  if (!seed) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: AUTH_ASSERTION_PUBLIC_KEY must be set in production " +
          "(base64 ed25519 seed from the auth service)",
      );
    }
    console.warn(
      "[auth] AUTH_ASSERTION_PUBLIC_KEY not set — auth middleware will reject " +
        "everything until the auth service key is provided (development)",
    );
    return;
  }
  const prev = (process.env.AUTH_ASSERTION_PREVIOUS_KEYS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  verifier = new Verifier(seed, prev);
  startRevocationListener();
}

function readAssertion(req: Request): string | undefined {
  for (const name of ["__Host-meshwork_assertion", "meshwork_assertion"]) {
    const v = req.cookies?.[name];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function toUser(claims: AssertionClaims): AuthUser {
  return {
    id: claims.sub,
    email: claims.eml,
    firstName: claims.nam,
    isAdmin: claims.adm,
    sessionId: claims.sid,
  };
}

function verify(req: Request): AuthUser | null {
  if (!verifier) return null;
  const claims = verifier.verify(readAssertion(req));
  if (!claims) return null;
  if (revokedSessions.has(claims.sid)) return null;
  return toUser(claims);
}

const unauthorized = (res: import("express").Response) =>
  res
    .status(401)
    .json({ code: "UNAUTHENTICATED", message: "Authentication required" });

/** Populates req.user when a valid assertion exists; never rejects. */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  try {
    const user = verify(req);
    if (user) {
      (req as Request & { auth?: AuthContext }).auth = {
        userId: user.id,
        sessionId: user.sessionId,
        user,
      };
      req.user = user as unknown as Request["user"];
    }
  } catch {
    // optional auth must never break the request path
  }
  next();
};

/** Rejects unauthenticated requests with 401. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const user = verify(req);
  if (!user) return unauthorized(res);
  (req as Request & { auth?: AuthContext }).auth = {
    userId: user.id,
    sessionId: user.sessionId,
    user,
  };
  req.user = user as unknown as Request["user"];
  next();
};

/** Verify a raw assertion token without an Express request (WS upgrades). */
export function verifyAssertionToken(
  token: string | undefined | null,
): AssertionClaims | null {
  if (!verifier) return null;
  const claims = verifier.verify(token);
  if (!claims || revokedSessions.has(claims.sid)) return null;
  return claims;
}
