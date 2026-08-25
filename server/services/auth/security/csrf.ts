import crypto from "node:crypto";
import type { Request, RequestHandler } from "express";
import type { IAuthStorage } from "../db/auth-storage";
import { authConfig, csrfCookieOptions } from "../config";
import { csrfRejected } from "../auth-errors";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function digest(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function cookieTokenLookup(req: Request, names: string[]): string | undefined {
  for (const name of names) {
    const value = req.cookies?.[name];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isValidOrigin(
  req: Request,
  originOrReferer: string | undefined,
): boolean {
  // SECURITY: exact-match allowlist ONLY. Substring/`includes()` matching was
  // removed — it allowed origins like `https://meshwork.evil.com`.
  if (!originOrReferer) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(originOrReferer);
  } catch {
    return false;
  }
  const candidate = `${originUrl.protocol}//${originUrl.host}`;

  // 1. Same-origin: Origin must match the request's own Host exactly.
  const reqHost = req.get("host");
  if (reqHost && originUrl.host === reqHost) return true;

  const forwardedHost = req.get("x-forwarded-host");
  if (
    forwardedHost &&
    forwardedHost === reqHost &&
    originUrl.host === forwardedHost
  ) {
    return true;
  }

  // 2. Explicit configured origins, compared as exact scheme+host strings.
  const allowed = new Set<string>();
  const addOrigin = (raw?: string | null) => {
    if (!raw) return;
    try {
      const u = new URL(raw.trim());
      if ((u.protocol === "https:" || u.protocol === "http:") && u.host) {
        allowed.add(`${u.protocol}//${u.host}`);
      }
    } catch {
      // ignore malformed configuration entries
    }
  };
  addOrigin(authConfig.frontendUrl);
  addOrigin(process.env.APP_URL);
  if (authConfig.isProduction && authConfig.frontendUrl) {
    addOrigin(authConfig.frontendUrl);
  }

  // 3. Localhost development origins (non-production only), exact hosts.
  if (!authConfig.isProduction) {
    for (const host of [
      "localhost:5173",
      "127.0.0.1:5173",
      "localhost:5000",
      "127.0.0.1:5000",
    ]) {
      allowed.add(`http://${host}`);
      allowed.add(`https://${host}`);
    }
  }

  return allowed.has(candidate);
}

export function createCsrfMiddleware(storage: IAuthStorage) {
  const issue: RequestHandler = async (req, res, next) => {
    try {
      const auth = (req as Request & { auth?: { sessionId: string } }).auth;
      const sessionId = auth?.sessionId;
      const secret = crypto.randomBytes(32).toString("base64url");

      if (sessionId) {
        await storage.saveCsrfSecret(
          digest(sessionId),
          digest(secret),
          new Date(Date.now() + 60 * 60 * 1000),
        );
      }

      res.cookie(authConfig.csrfCookieName, secret, csrfCookieOptions());
      res.json({ csrfToken: secret, message: "CSRF token generated" });
    } catch (error) {
      next(error);
    }
  };

  const protect: RequestHandler = async (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) return next();

    // 1. Origin & Referer Verification
    // Fail closed: a cookie-bearing mutation with no Origin AND no Referer is
    // treated as hostile (browsers always attach one of the two on POSTs).
    const origin = req.get("origin");
    const referer = req.get("referer");
    const hasSessionCookie = Boolean(
      cookieTokenLookup(req, ["__Host-meshwork_session", "meshwork_session"]),
    );
    if (!origin && !referer && hasSessionCookie) {
      const error = csrfRejected();
      return res
        .status(error.status)
        .json({ code: error.code, message: "Missing origin context" });
    }
    if (origin && !isValidOrigin(req, origin)) {
      const error = csrfRejected();
      return res
        .status(error.status)
        .json({ code: error.code, message: "Invalid request origin" });
    }
    if (!origin && referer && !isValidOrigin(req, referer)) {
      const error = csrfRejected();
      return res
        .status(error.status)
        .json({ code: error.code, message: "Invalid request referer" });
    }

    // 2. Double-Submit Cookie & Header Token Verification
    const cookieToken =
      cookieTokenLookup(req, [
        authConfig.csrfCookieName,
        "__Host-meshwork_csrf",
        "meshwork_csrf",
      ]) || "";
    const headerToken = req.get("X-CSRF-Token") || req.get("x-csrf-token");

    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
      const error = csrfRejected();
      return res
        .status(error.status)
        .json({ code: error.code, message: error.message });
    }

    // 3. Authenticated Session Binding Verification
    const auth = (req as Request & { auth?: { sessionId: string } }).auth;
    if (auth?.sessionId) {
      const record = await storage.findCsrfSecret(digest(auth.sessionId));
      if (record) {
        if (
          record.expiresAt <= new Date() ||
          !safeEqual(record.secretHash, digest(headerToken))
        ) {
          const error = csrfRejected();
          return res
            .status(error.status)
            .json({ code: error.code, message: error.message });
        }
      } else {
        // Automatically bind this valid double-submit token to the authenticated session
        await storage.saveCsrfSecret(
          digest(auth.sessionId),
          digest(headerToken),
          new Date(Date.now() + 60 * 60 * 1000),
        );
      }
    }

    next();
  };

  return { issue, protect };
}
