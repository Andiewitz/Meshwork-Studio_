import type { Express, Request, Response, RequestHandler } from "express";
import { z } from "zod";
import { authConfig, sessionCookieOptions } from "../config";
import { publicAuthError } from "../auth-errors";
import type { AuthService } from "../services/auth-service";
import type { SessionService } from "../services/session-service";
import type { IAuthStorage } from "../db/auth-storage";
import type { AuthenticatedRequest } from "../auth-types";
import { authLimiter } from "@server/middleware/rateLimit";
import { createChildLogger } from "@server/lib/logger";

const log = createChildLogger("auth-routes");

const credentialsSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
});

const registerSchema = credentialsSchema.extend({
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
});

function setSession(res: Response, sessionToken: string) {
  res.cookie(
    authConfig.sessionCookieName,
    sessionToken,
    sessionCookieOptions(),
  );
}

function getSessionToken(req: Request): string | undefined {
  return (
    req.cookies?.[authConfig.sessionCookieName] ||
    req.cookies?.["__Host-meshwork_session"] ||
    req.cookies?.meshwork_session
  );
}

function clearSession(res: Response) {
  const options = {
    path: "/",
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
  };
  res.clearCookie(authConfig.sessionCookieName, options);
  res.clearCookie("__Host-meshwork_session", options);
  res.clearCookie("meshwork_session", options);
}

export function registerAuthRoutes(
  app: Express,
  deps: {
    auth: AuthService;
    sessions: SessionService;
    storage: IAuthStorage;
    requireAuth: RequestHandler;
    csrf: { issue: RequestHandler; protect: RequestHandler };
  },
) {
  // 1. CSRF Token Endpoint
  app.get("/api/v1/auth/csrf-token", deps.csrf.issue);

  // 2. User Registration
  app.post(
    "/api/v1/auth/register",
    authLimiter,
    deps.csrf.protect,
    async (req: Request, res: Response) => {
      try {
        const input = registerSchema.parse(req.body);
        const oldSessionToken = getSessionToken(req);
        const result = await deps.auth.register(
          input,
          {
            userAgent: req.get("user-agent"),
            ipHash: req.ip,
          },
          oldSessionToken,
        );
        setSession(res, result.sessionToken);
        res.status(201).json({
          user: result.user,
          expiresAt: result.expiresAt,
          accessTokenExpiresAt: result.expiresAt,
        });
      } catch (error) {
        log.error({ err: error }, "Error in auth register endpoint");
        const output = publicAuthError(error);
        res.status(output.status).json(output.body);
      }
    },
  );

  // 3. User Login
  app.post(
    "/api/v1/auth/login",
    authLimiter,
    deps.csrf.protect,
    async (req: Request, res: Response) => {
      try {
        const input = credentialsSchema.parse(req.body);
        const oldSessionToken = getSessionToken(req);
        const result = await deps.auth.login(
          input,
          {
            userAgent: req.get("user-agent"),
            ipHash: req.ip,
          },
          oldSessionToken,
        );
        setSession(res, result.sessionToken);
        res.json({
          user: result.user,
          expiresAt: result.expiresAt,
          accessTokenExpiresAt: result.expiresAt,
        });
      } catch (error) {
        log.error({ err: error }, "Error in auth login endpoint");
        const output = publicAuthError(error);
        res.status(output.status).json(output.body);
      }
    },
  );

  // 4. Session Validation
  app.get(
    "/api/v1/auth/session",
    deps.requireAuth,
    async (req: Request, res: Response) => {
      try {
        const auth = (req as AuthenticatedRequest).auth;
        const rawToken = getSessionToken(req);
        const sessionRecord = rawToken
          ? await deps.sessions.validate(rawToken)
          : null;

        const expiresAt = sessionRecord
          ? sessionRecord.expiresAt.toISOString()
          : new Date(
              Date.now() + authConfig.sessionDays * 24 * 60 * 60 * 1000,
            ).toISOString();

        res.json({
          user: auth.user,
          expiresAt,
          accessTokenExpiresAt: expiresAt,
        });
      } catch (error) {
        const output = publicAuthError(error);
        res.status(output.status).json(output.body);
      }
    },
  );

  // 5. Backward compatibility /auth/me
  app.get(
    "/api/v1/auth/me",
    deps.requireAuth,
    async (req: Request, res: Response) => {
      const auth = (req as AuthenticatedRequest).auth;
      const rawToken = getSessionToken(req);
      const sessionRecord = rawToken
        ? await deps.sessions.validate(rawToken)
        : null;

      const expiresAt = sessionRecord
        ? sessionRecord.expiresAt.toISOString()
        : new Date(
            Date.now() + authConfig.sessionDays * 24 * 60 * 60 * 1000,
          ).toISOString();

      res.json({
        ...auth.user,
        accessTokenExpiresAt: expiresAt,
      });
    },
  );

  // 6. User Preferences update
  app.patch(
    "/api/v1/user/preferences",
    deps.csrf.protect,
    deps.requireAuth,
    async (req: Request, res: Response) => {
      try {
        const auth = (req as AuthenticatedRequest).auth;
        const schema = z.object({
          hasNotifiedTeam: z.boolean().optional(),
          readNotificationIds: z.array(z.number()).optional(),
        });
        const parsed = schema.parse(req.body);
        const updated = await deps.storage.updateUser(auth.userId, parsed);
        res.json(updated);
      } catch (error) {
        const output = publicAuthError(error);
        res.status(output.status).json(output.body);
      }
    },
  );

  // 7. Logout Current Session
  app.post(
    "/api/v1/auth/logout",
    deps.csrf.protect,
    async (req: Request, res: Response) => {
      try {
        const rawToken = getSessionToken(req);
        if (rawToken) {
          await deps.sessions.revoke(rawToken);
        }
        clearSession(res);
        res.json({ ok: true, message: "Logged out successfully" });
      } catch (error) {
        const output = publicAuthError(error);
        res.status(output.status).json(output.body);
      }
    },
  );

  // 8. Logout All Sessions
  app.post(
    "/api/v1/auth/logout-all",
    deps.csrf.protect,
    deps.requireAuth,
    async (req: Request, res: Response) => {
      try {
        const auth = (req as AuthenticatedRequest).auth;
        await deps.sessions.revokeAll(auth.userId);
        clearSession(res);
        res.json({ ok: true, message: "All sessions revoked" });
      } catch (error) {
        const output = publicAuthError(error);
        res.status(output.status).json(output.body);
      }
    },
  );

  // 9. Change Password
  app.post(
    "/api/v1/auth/change-password",
    deps.csrf.protect,
    deps.requireAuth,
    async (req: Request, res: Response) => {
      try {
        const auth = (req as AuthenticatedRequest).auth;
        const body = z
          .object({
            currentPassword: z.string().min(1),
            newPassword: z.string().min(8).max(128),
          })
          .parse(req.body);
        await deps.auth.changePassword(
          auth.userId,
          body.currentPassword,
          body.newPassword,
        );
        clearSession(res);
        res.json({ ok: true, requiresLogin: true });
      } catch (error) {
        const output = publicAuthError(error);
        res.status(output.status).json(output.body);
      }
    },
  );
}
