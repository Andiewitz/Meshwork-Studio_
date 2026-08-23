export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message = "Authentication request failed",
    public readonly status = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const publicAuthError = (error: unknown) => {
  if (error instanceof AuthError) {
    return {
      status: error.status,
      body: { code: error.code, message: error.message },
    };
  }
  return {
    status: 500,
    body: {
      code: "AUTH_INTERNAL_ERROR",
      message: "Authentication service unavailable",
    },
  };
};

export const unauthenticated = () =>
  new AuthError("UNAUTHENTICATED", "Authentication required", 401);

export const invalidCredentials = () =>
  new AuthError("INVALID_CREDENTIALS", "Invalid email or password", 401);

export const accountLocked = (minutesRemaining = 15) =>
  new AuthError(
    "ACCOUNT_LOCKED",
    `Too many failed attempts. Account temporarily locked for ${minutesRemaining} minutes.`,
    429,
  );

export const csrfRejected = () =>
  new AuthError("CSRF_REJECTED", "CSRF validation failed", 403);
