// THE single HTTP client for the app.
//
// Responsibilities (all in one place):
//   - same-origin credentials on every request
//   - X-CSRF-Token attach on mutations
//   - one-shot CSRF refresh + retry when the server answers 403
//   - token storage in sessionStorage

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "";
const CSRF_ENDPOINT = "/api/v1/auth/csrf-token";

function getApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

import { useEffect } from "react";

// ─── CSRF token plumbing ────────────────────────────────────────────────────

function getCsrfToken(): string {
  if (typeof window === "undefined") return "";
  return (
    window.sessionStorage.getItem("csrfToken") ||
    window.sessionStorage.getItem("auth.csrfToken") ||
    ""
  );
}

export function storeCsrfToken(token: string): void {
  if (typeof window === "undefined") return;
  // Both keys are written so any straggler reader stays correct; only
  // "csrfToken" is authoritative going forward.
  window.sessionStorage.setItem("csrfToken", token);
}

export function clearCsrfToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("csrfToken");
  window.sessionStorage.removeItem("auth.csrfToken");
}

let refreshInFlight: Promise<string | null> | null = null;

/** Fetch a fresh CSRF token. Concurrent callers share one request. */
export function refreshCsrfToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = fetch(getApiUrl(CSRF_ENDPOINT), {
    credentials: "include",
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { csrfToken?: string };
      if (!data.csrfToken) return null;
      storeCsrfToken(data.csrfToken);
      return data.csrfToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

/** Boot-time hook: primes a CSRF token once on app mount. */
export function useCsrfTokenInitializer(): void {
  useEffect(() => {
    void refreshCsrfToken();
  }, []);
}

// ─── the client ─────────────────────────────────────────────────────────────

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * The fetch wrapper every API call should go through.
 * Usage is identical to fetch(); mutations automatically carry a CSRF token
 * and retry once behind a fresh token if the server rejects with 403.
 */
export async function secureFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const isMutation = !SAFE_METHODS.has(method);
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  const headers = new Headers(init?.headers);
  const retryInit: RequestInit | undefined = init;

  if (isMutation) {
    const token = getCsrfToken() || (await refreshCsrfToken());
    if (token) headers.set("X-CSRF-Token", token);
  }

  const doFetch = () =>
    fetch(input, { ...retryInit, headers, credentials: "include" });

  let response = await doFetch();

  if (
    isMutation &&
    response.status === 403 &&
    !requestUrl.includes(CSRF_ENDPOINT)
  ) {
    const fresh = await refreshCsrfToken();
    if (fresh) {
      headers.set("X-CSRF-Token", fresh);
      response = await doFetch();
    }
  }

  return response;
}

export { getApiUrl };
