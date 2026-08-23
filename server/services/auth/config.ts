import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";

function getSecret(
  name: string,
  minimumLength: number,
  fallback: string,
): string {
  const value = process.env[name];
  if (isProduction) {
    if (!value || value.length < minimumLength) {
      throw new Error(
        `FATAL: ${name} must be set and at least ${minimumLength} characters long in production`,
      );
    }
    return value;
  }
  return value || fallback;
}

export const authConfig = {
  isProduction,
  sessionSecret: getSecret(
    "SESSION_SECRET",
    32,
    "dev_session_secret_meshwork_studio_secure_32chars_key",
  ),
  sessionDays: 30,
  csrfCookieName: isProduction ? "__Host-meshwork_csrf" : "meshwork_csrf",
  sessionCookieName: isProduction
    ? "__Host-meshwork_session"
    : "meshwork_session",
  cookieSecure: isProduction,
  cookieSameSite: "lax" as const,
  frontendUrl:
    process.env.FRONTEND_URL || (isProduction ? "" : "http://localhost:5173"),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    callbackUrl:
      process.env.GITHUB_CALLBACK_URL || "/api/v1/auth/github/callback",
  },
};

if (isProduction && process.env.E2E_BYPASS_AUTH === "true") {
  throw new Error("E2E_BYPASS_AUTH must never be enabled in production");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
    path: "/",
    maxAge: authConfig.sessionDays * 24 * 60 * 60 * 1000,
  } as const;
}

export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
    path: "/",
    maxAge: 60 * 60 * 1000,
  } as const;
}
