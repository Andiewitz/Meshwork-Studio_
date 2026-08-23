import {
  authenticatedFetch,
  clearCsrfToken,
  refreshCsrfToken,
} from "./csrf-client";
import type { AuthResult, PublicUser } from "./auth-types";

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

  async login(email: string, password: string): Promise<AuthResult> {
    await refreshCsrfToken();
    const response = await authenticatedFetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
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
  ): Promise<void> {
    await authenticatedFetch("/api/v1/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then((response) => parse(response));
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
};

export type { PublicUser };
