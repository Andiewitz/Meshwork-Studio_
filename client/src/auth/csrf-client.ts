let refreshInFlight: Promise<string | null> | null = null;

export async function refreshCsrfToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/v1/auth/csrf-token", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          // Fallback to /api/v1/csrf-token
          const fallbackRes = await fetch("/api/v1/csrf-token", { credentials: "include" });
          if (!fallbackRes.ok) return null;
          const fallbackData = (await fallbackRes.json()) as { csrfToken?: string };
          if (fallbackData.csrfToken) sessionStorage.setItem("auth.csrfToken", fallbackData.csrfToken);
          return fallbackData.csrfToken ?? null;
        }
        const data = (await response.json()) as { csrfToken?: string };
        if (data.csrfToken) sessionStorage.setItem("auth.csrfToken", data.csrfToken);
        return data.csrfToken ?? null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export function clearCsrfToken(): void {
  sessionStorage.removeItem("auth.csrfToken");
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (isMutation) {
    const token = sessionStorage.getItem("auth.csrfToken") ?? (await refreshCsrfToken());
    if (token) headers.set("X-CSRF-Token", token);
  }

  const request = {
    ...init,
    headers,
    credentials: "include" as RequestCredentials,
  };
  let response = await fetch(input, request);

  if (isMutation && response.status === 403) {
    const freshToken = await refreshCsrfToken();
    if (freshToken) {
      headers.set("X-CSRF-Token", freshToken);
      response = await fetch(input, { ...request, headers });
    }
  }
  return response;
}
