import crypto from "node:crypto";
import type { Request, RequestHandler } from "express";
import type { IAuthStorage } from "../db/auth-storage";
import { authConfig, csrfCookieOptions } from "../config";
import { csrfRejected } from "../auth-errors";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function digest(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isValidOrigin(originOrReferer: string | undefined): boolean {
  if (!originOrReferer) return true; // If browser or non-browser client doesn't send Origin, rely on CSRF tokens

  try {
    const originUrl = new URL(originOrReferer);
    const host = originUrl.host;

    // Allow localhost/127.0.0.1 in non-production
    if (!authConfig.isProduction) {
      if (
        host.startsWith("localhost") ||
        host.startsWith("127.0.0.1") ||
        host.startsWith("0.0.0.0")
      ) {
        return true;
      }
    }

    if (authConfig.frontendUrl) {
      const allowedUrl = new URL(authConfig.frontendUrl);
      if (originUrl.origin === allowedUrl.origin) return true;
    }

    if (process.env.APP_URL) {
      const allowedAppUrl = new URL(process.env.APP_URL);
      if (originUrl.origin === allowedAppUrl.origin) return true;
    }

    return false;
  } catch {
    return false;
  }
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
    const origin = req.get("origin");
    const referer = req.get("referer");
    if (origin && !isValidOrigin(origin)) {
      const error = csrfRejected();
      return res
        .status(error.status)
        .json({ code: error.code, message: "Invalid request origin" });
    }
    if (!origin && referer && !isValidOrigin(referer)) {
      const error = csrfRejected();
      return res
        .status(error.status)
        .json({ code: error.code, message: "Invalid request referer" });
    }

    // 2. Double-Submit Cookie & Header Token Verification
    const cookieToken = req.cookies?.[authConfig.csrfCookieName];
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
      if (
        !record ||
        record.expiresAt <= new Date() ||
        !safeEqual(record.secretHash, digest(headerToken))
      ) {
        const error = csrfRejected();
        return res
          .status(error.status)
          .json({ code: error.code, message: error.message });
      }
    }

    next();
  };

  return { issue, protect };
}
