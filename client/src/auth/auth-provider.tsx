import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { queryClient } from "@/lib/queryClient";
import { authClient } from "./auth-client";
import {
  anonymousState,
  authReducer,
  initialAuthState,
  isAuthenticated as isAuthCheck,
} from "./auth-store";
import type { AuthResult, AuthState, PublicUser } from "./auth-types";

export interface AuthContextValue {
  state: AuthState;
  user: PublicUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRedirecting: boolean;
  accessTokenExpiresAt: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
  updatePreferences: (data: {
    hasNotifiedTeam?: boolean;
    readNotificationIds?: number[];
  }) => Promise<PublicUser>;
  isUpdatingPreferences: boolean;
  bootToLogin: () => void;
  notifyLoginSuccess: (user: PublicUser, accessTokenExpiresAt: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function bootToLogin(): void {
  const path = window.location.pathname;
  const isAlreadyOnAuth =
    path.startsWith("/login") || path.startsWith("/register");
  const redirectTarget = isAlreadyOnAuth ? "/home" : path;
  window.location.href = `/login?reason=session_expired&redirect=${encodeURIComponent(
    redirectTarget,
  )}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    authReducer,
    undefined,
    initialAuthState,
  );
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const generation = useRef(0);

  // Initial bootstrap check on mount
  useEffect(() => {
    const startedAt = generation.current;
    let cancelled = false;

    void authClient.bootstrap().then(
      (result) => {
        if (!cancelled && startedAt === generation.current) {
          dispatch({ type: "authenticated", result });
        }
      },
      () => {
        if (!cancelled && startedAt === generation.current) {
          dispatch({ type: "anonymous" });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    generation.current += 1;
    setIsRedirecting(false);
    const result = await authClient.login(email, password);
    dispatch({ type: "authenticated", result });
    return result;
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      generation.current += 1;
      setIsRedirecting(false);
      const result = await authClient.register(input);
      dispatch({ type: "authenticated", result });
      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    generation.current += 1;
    setIsLoggingOut(true);
    setIsRedirecting(true);
    try {
      await authClient.logout();
    } catch (err) {
      console.warn("[auth] logout error:", err);
    } finally {
      queryClient.clear();
      dispatch({ type: "logout" });
      setIsLoggingOut(false);
      setIsRedirecting(false);
      window.location.href = "/";
    }
  }, []);

  const updatePreferences = useCallback(
    async (data: {
      hasNotifiedTeam?: boolean;
      readNotificationIds?: number[];
    }) => {
      setIsUpdatingPreferences(true);
      try {
        const updated = await authClient.updatePreferences(data);
        dispatch({ type: "user-updated", user: updated });
        return updated;
      } finally {
        setIsUpdatingPreferences(false);
      }
    },
    [],
  );

  const notifyLoginSuccess = useCallback(
    (newUser: PublicUser, expiresAt: string) => {
      generation.current += 1;
      setIsRedirecting(false);
      dispatch({
        type: "authenticated",
        result: { user: newUser, expiresAt, accessTokenExpiresAt: expiresAt },
      });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user: state.status === "loading" ? undefined : state.user,
      isLoading: state.status === "loading",
      isAuthenticated: isAuthCheck(state),
      isRedirecting,
      accessTokenExpiresAt: state.expiresAt,
      login,
      register,
      logout,
      isLoggingOut,
      updatePreferences,
      isUpdatingPreferences,
      bootToLogin,
      notifyLoginSuccess,
    }),
    [
      state,
      isRedirecting,
      login,
      register,
      logout,
      isLoggingOut,
      updatePreferences,
      isUpdatingPreferences,
      notifyLoginSuccess,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export const authAnonymousState = anonymousState;
