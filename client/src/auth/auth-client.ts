import {
  clearCsrfToken,
  refreshCsrfToken,
  secureFetch as authenticatedFetch,
} from "@/lib/secure-fetch";
import type { AuthResult, PublicUser } from "./auth-types";

export interface LoginResponse extends AuthResult {
  mfaRequired?: boolean;
}

async function parse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.message || "Authentication request failed");
  }
  return data;
}

export const authClient = {
  async bootstrap(): Promise<AuthResult> {
    const response = await authenticatedFetch("/api/v1/auth/session");
    return parse<AuthResult>(response);
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    await refreshCsrfToken();
    const response = await authenticatedFetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await parse<LoginResponse>(response);
    if (!result.mfaRequired) {
      await refreshCsrfToken();
    }
    return result;
  },

  /** Second factor step; resolves to a full session when correct. */
  async mfaChallenge(code: string, backupCode?: string): Promise<AuthResult> {
    await refreshCsrfToken();
    const response = await authenticatedFetch("/api/v1/auth/mfa/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backupCode ? { backupCode } : { code }),
    });
    void 0;
    const result = await parse<AuthResult>(response);
    await refreshCsrfToken();
    return result;
  },

  async register(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResult> {
    await refreshCsrfToken();
    const response = await authenticatedFetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await parse<AuthResult>(response);
    await refreshCsrfToken();
    return result;
  },

  async logout(): Promise<void> {
    await authenticatedFetch("/api/v1/auth/logout", { method: "POST" });
    clearCsrfToken();
  },

  async logoutAll(): Promise<void> {
    await authenticatedFetch("/api/v1/auth/logout-all", { method: "POST" });
    clearCsrfToken();
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: boolean; requiresLogin: boolean }> {
    const response = await authenticatedFetch("/api/v1/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return parse(response);
  },

  async updatePreferences(data: {
    hasNotifiedTeam?: boolean;
    readNotificationIds?: number[];
  }): Promise<PublicUser> {
    const response = await authenticatedFetch("/api/v1/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parse<PublicUser>(response);
  },

  // ─── Recovery flows ────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    await refreshCsrfToken();
    const response = await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(getCsrfHeader() ? { "X-CSRF-Token": getCsrfHeader()! } : {}),
      },
      body: JSON.stringify({ email }),
    });
    await parse(response);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await refreshCsrfToken();
    const response = await fetch("/api/v1/auth/reset-password", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(getCsrfHeader() ? { "X-CSRF-Token": getCsrfHeader()! } : {}),
      },
      body: JSON.stringify({ token, newPassword }),
    });
    await parse(response);
  },

  async verifyEmail(token: string): Promise<void> {
    const response = await fetch("/api/v1/auth/verify-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    await parse(response);
  },

  async resendVerification(): Promise<void> {
    const response = await authenticatedFetch(
      "/api/v1/auth/resend-verification",
      {
        method: "POST",
      },
    );
    await parse(response);
  },

  // ─── MFA management (Settings) ─────────────────────────────────────────

  async mfaEnroll(): Promise<{ secret: string; otpauthUri: string }> {
    const response = await authenticatedFetch("/api/v1/auth/mfa/enroll", {
      method: "POST",
    });
    return parse(response);
  },

  async mfaActivate(code: string): Promise<{ backupCodes?: string[] }> {
    const response = await authenticatedFetch("/api/v1/auth/mfa/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return parse(response);
  },

  async mfaDisable(
    password: string,
    factor: { code?: string; backupCode?: string },
  ): Promise<void> {
    const response = await authenticatedFetch("/api/v1/auth/mfa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, ...factor }),
    });
    await parse(response);
  },

  // ─── Device / session manager ──────────────────────────────────────────

  async listSessions(): Promise<
    {
      id: string;
      fullHash: string;
      current: boolean;
      createdAt: string;
      lastSeenAt: string;
      userAgent: string | null;
    }[]
  > {
    const response = await authenticatedFetch("/api/v1/auth/sessions");
    const data = await parse<{
      sessions: {
        id: string;
        fullHash: string;
        current: boolean;
        createdAt: string;
        lastSeenAt: string;
        userAgent: string | null;
      }[];
    }>(response);
    return data.sessions;
  },

  async revokeSession(fullHash: string): Promise<void> {
    const response = await authenticatedFetch(
      `/api/v1/auth/sessions/${encodeURIComponent(fullHash)}`,
      { method: "DELETE" },
    );
    await parse(response);
  },
};

function getCsrfHeader(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem("csrfToken") ||
    window.sessionStorage.getItem("auth.csrfToken")
  );
}

export type { PublicUser };
