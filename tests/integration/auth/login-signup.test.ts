import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { MemAuthStorage } from "@services/auth/db/storage";
import { SessionService } from "@services/auth/services/session-service";
import { AuthService } from "@services/auth/services/auth-service";
import { createCsrfMiddleware } from "@services/auth/security/csrf";
import { createAuthMiddleware } from "@services/auth/middleware/authMiddleware";
import { registerAuthRoutes } from "@services/auth/routes/authRoutes";
import { authConfig } from "@services/auth/config";

function getFirstCookie(res: request.Response): string {
  const raw = res.headers["set-cookie"];
  if (Array.isArray(raw)) return raw[0] || "";
  if (typeof raw === "string") return raw;
  return "";
}

const setupTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const storage = new MemAuthStorage();
  const sessions = new SessionService(storage, 30);
  const auth = new AuthService(storage, sessions);
  const csrf = createCsrfMiddleware(storage);
  const middleware = createAuthMiddleware(sessions, storage);

  app.use(middleware.optionalAuth);

  registerAuthRoutes(app, {
    auth,
    sessions,
    storage,
    requireAuth: middleware.requireAuth,
    csrf,
  });

  return { app, storage, sessions, auth };
};

describe("Authentication Integration Tests", () => {
  let app: express.Express;
  let csrfToken: string;
  let csrfCookie: string;

  beforeEach(async () => {
    const setup = setupTestApp();
    app = setup.app;

    // Get initial CSRF token
    const res = await request(app).get("/api/v1/auth/csrf-token");
    csrfToken = res.body.csrfToken;
    csrfCookie = getFirstCookie(res);
  });

  it("should_register_new_user_and_issue_session_cookie", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: "NewUser@Example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("NewUser@Example.com");
    expect(res.body.expiresAt).toBeDefined();

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies)
      ? cookies.join("; ")
      : (cookies ?? "");
    expect(cookieStr).toContain(authConfig.sessionCookieName);
  });

  it("should_reject_duplicate_registration_case_insensitively", async () => {
    // 1. Register first user
    await request(app)
      .post("/api/v1/auth/register")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "user@example.com", password: "Password123!" });

    // 2. Try registering same email with different casing
    const res = await request(app)
      .post("/api/v1/auth/register")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "USER@EXAMPLE.COM", password: "Password123!" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("REGISTRATION_UNAVAILABLE");
  });

  it("should_login_with_correct_credentials_and_rotate_session", async () => {
    // Register
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "login@example.com", password: "Password123!" });

    const regCookie = getFirstCookie(regRes);

    // Login with existing cookie to test rotation
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .set("Cookie", [csrfCookie, regCookie].join("; "))
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "login@example.com", password: "Password123!" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe("login@example.com");
    expect(loginRes.body.expiresAt).toBeDefined();

    const newCookies = loginRes.headers["set-cookie"];
    expect(newCookies).toBeDefined();
  });

  it("should_reject_login_with_invalid_password_generically", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "login@example.com", password: "Password123!" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "login@example.com", password: "WrongPassword" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("should_verify_active_session_and_return_real_expiry", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "session@example.com", password: "Password123!" });

    const sessionCookie = getFirstCookie(regRes);

    const sessionRes = await request(app)
      .get("/api/v1/auth/session")
      .set("Cookie", sessionCookie);

    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.user.email).toBe("session@example.com");
    expect(sessionRes.body.expiresAt).toBeDefined();
  });

  it("should_reject_mutation_without_csrf_token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "no-csrf@example.com", password: "Password123!" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CSRF_REJECTED");
  });

  it("should_logout_and_revoke_session", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "logout@example.com", password: "Password123!" });

    const sessionCookie = getFirstCookie(regRes);

    // Logout
    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [csrfCookie, sessionCookie].join("; "))
      .set("X-CSRF-Token", csrfToken);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.ok).toBe(true);

    // Session endpoint should now return 401
    const sessionRes = await request(app)
      .get("/api/v1/auth/session")
      .set("Cookie", sessionCookie);

    expect(sessionRes.status).toBe(401);
  });

  it("should_change_password_and_revoke_all_sessions", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "pwd@example.com", password: "OldPassword123!" });

    const sessionCookie = getFirstCookie(regRes);

    const changeRes = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", [csrfCookie, sessionCookie].join("; "))
      .set("X-CSRF-Token", csrfToken)
      .send({
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.requiresLogin).toBe(true);

    // Old session should be revoked
    const sessionRes = await request(app)
      .get("/api/v1/auth/session")
      .set("Cookie", sessionCookie);
    expect(sessionRes.status).toBe(401);

    // Login with new password should succeed
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken)
      .send({ email: "pwd@example.com", password: "NewPassword123!" });
    expect(loginRes.status).toBe(200);
  });
});
