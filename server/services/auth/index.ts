import type { Express } from "express";
import { createAuthMiddleware } from "./middleware/authMiddleware";
import { registerAuthRoutes } from "./routes/authRoutes";
import { authStorage } from "./db/storage";
import { SessionService } from "./services/session-service";
import { AuthService as AuthBusinessService } from "./services/auth-service";
import { createCsrfMiddleware } from "./security/csrf";
import { OAuthService } from "./oauth/oauth-service";
import { authConfig } from "./config";
import { createChildLogger } from "@server/lib/logger";
import type { AppContext } from "@server/lib/registry";

const log = createChildLogger("auth-service");

const sessionService = new SessionService(authStorage, authConfig.sessionDays);
const authBusinessService = new AuthBusinessService(authStorage, sessionService);
const csrfMiddleware = createCsrfMiddleware(authStorage);
const authMiddleware = createAuthMiddleware(sessionService, authStorage);
const oauthService = new OAuthService();

export class AuthService {
  static async initialize(app: Express, context: AppContext) {
    // Register optionalAuth early so req.auth is populated if session cookie exists
    app.use(authMiddleware.optionalAuth);

    // Register auth routes
    registerAuthRoutes(app, {
      auth: authBusinessService,
      sessions: sessionService,
      storage: authStorage,
      requireAuth: authMiddleware.requireAuth,
      csrf: csrfMiddleware,
    });

    log.info("Authentication service and routes initialized successfully");
  }

  static storage = authStorage;
  static sessions = sessionService;
  static auth = authBusinessService;
  static csrf = csrfMiddleware;
  static oauth = oauthService;
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
export { authStorage, sessionService, authBusinessService, csrfMiddleware };

// Re-export domain types and modules
export type { AppContext };
export * from "./auth-types";
export * from "./auth-errors";
export * from "./config";
export * from "./db";
export * from "./services";
export * from "./security";
export * from "./oauth";
export * from "./middleware";
