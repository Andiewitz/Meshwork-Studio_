import type { Express } from "express";
import { createAuthMiddleware } from "./middleware/authMiddleware";
import { authStorage } from "./db/storage";
import { SessionService } from "./services/session-service";
import { createCsrfMiddleware } from "./security/csrf";
import { authConfig } from "./config";
import { createChildLogger } from "@server/lib/logger";
import type { AppContext } from "@server/lib/registry";

const log = createChildLogger("auth-bridge");

const sessionService = new SessionService(authStorage, authConfig.sessionDays);
const csrfMiddleware = createCsrfMiddleware(authStorage);
const authMiddleware = createAuthMiddleware(sessionService, authStorage);

/**
 * Auth bridge — the Node monolith's consumer of identity sessions.
 *
 * The Go auth service (services/auth) OWNS all authentication endpoints,
 * users, sessions, MFA and OAuth. This module only lets monolith routes
 * validate opaque session cookies and enforce CSRF. It registers no routes.
 */
export class AuthService {
  static async initialize(app: Express, _context: AppContext) {
    // Register optionalAuth early so req.auth is populated if a session
    // cookie exists on monolith-served requests.
    app.use(authMiddleware.optionalAuth);
    log.info(
      "Auth bridge initialized (endpoints are served by the Go auth service)",
    );
  }

  static storage = authStorage;
  static sessions = sessionService;
  static csrf = csrfMiddleware;
  static middleware = {
    requireAuth: authMiddleware.requireAuth,
    optionalAuth: authMiddleware.optionalAuth,
    isAuthenticated: authMiddleware.isAuthenticated,
  };
}

// Backward compatibility aliases
export const AuthModule = AuthService;
export const isAuthenticated = authMiddleware.isAuthenticated;
export const requireAuth = authMiddleware.requireAuth;
export const optionalAuth = authMiddleware.optionalAuth;
export { authStorage, sessionService, csrfMiddleware };

// Re-export domain types and modules
export type { AppContext };
export * from "./auth-types";
export * from "./auth-errors";
export * from "./config";
export * from "./db";
export * from "./security";
export * from "./middleware";
