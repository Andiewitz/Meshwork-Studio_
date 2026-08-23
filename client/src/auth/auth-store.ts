import type { AuthResult, AuthState, PublicUser } from "./auth-types";

export function initialAuthState(): AuthState {
  return { status: "loading", user: null, expiresAt: null };
}

export function authenticatedState(result: AuthResult): AuthState {
  return {
    status: "authenticated",
    user: result.user,
    expiresAt: result.expiresAt || result.accessTokenExpiresAt || null,
  };
}

export function anonymousState(): AuthState {
  return { status: "anonymous", user: null, expiresAt: null };
}

export function isAuthenticated(
  state: AuthState,
): state is Extract<AuthState, { status: "authenticated" }> {
  return state.status === "authenticated";
}

export type AuthAction =
  | { type: "authenticated"; result: AuthResult }
  | { type: "anonymous" }
  | { type: "logout" }
  | { type: "user-updated"; user: PublicUser };

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "authenticated":
      return authenticatedState(action.result);
    case "anonymous":
    case "logout":
      return anonymousState();
    case "user-updated":
      return state.status === "authenticated"
        ? { ...state, user: action.user }
        : state;
  }
}
