import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { IAuthStorage } from "../db/auth-storage";
import type { SessionService } from "../services/session-service";
import { authConfig } from "../config";
import { unauthenticated } from "../auth-errors";
import type { AuthenticatedRequest, OptionalAuthRequest } from "../auth-types";

export function createAuthMiddleware(
  sessions: SessionService,
  storage: IAuthStorage,
) {
  const optionalAuth: RequestHandler = async (req, _res, next) => {
    try {
      const rawToken = req.cookies?.[authConfig.sessionCookieName];
      if (!rawToken) return next();

      const session = await sessions.validate(rawToken);
      if (!session) return next();

      const user = await storage.findUserById(session.userId);
      if (!user) return next();

      (req as OptionalAuthRequest).auth = {
        userId: user.id,
        sessionId: session.idHash,
        user,
      };
      (req as any).user = user;
    } catch {
      // Ignore errors in optional auth
    }
    next();
  };

  const requireAuth: RequestHandler = async (req, res, next) => {
    try {
      const rawToken = req.cookies?.[authConfig.sessionCookieName];
      if (!rawToken) {
        const error = unauthenticated();
        return res
          .status(error.status)
          .json({ code: error.code, message: error.message });
      }

      const session = await sessions.validate(rawToken);
      if (!session) {
        const error = unauthenticated();
        return res
          .status(error.status)
          .json({ code: error.code, message: error.message });
      }

      const user = await storage.findUserById(session.userId);
      if (!user) {
        const error = unauthenticated();
        return res
          .status(error.status)
          .json({ code: error.code, message: error.message });
      }

      (req as AuthenticatedRequest).auth = {
        userId: user.id,
        sessionId: session.idHash,
        user,
      };
      (req as any).user = user;
      next();
    } catch (error) {
      next(error);
    }
  };

  return {
    optionalAuth,
    requireAuth,
    isAuthenticated: requireAuth,
  };
}
