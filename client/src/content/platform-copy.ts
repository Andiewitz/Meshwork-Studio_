// Single source of truth for copy that appears in multiple surfaces
// (Landing marketing + the in-app /dev documentation page).

export const RATE_LIMITING_COPY =
  "API endpoints enforce sliding-window rate limits (e.g., 100 requests / 15 min). Sensitive endpoints (e.g., `/api/v1/auth/login`) use a Redis-backed progressive timeout. Successive failures trigger exponential lockout periods mapped to both the requester's IP and the target username to mitigate credential stuffing and brute-force attacks.";
