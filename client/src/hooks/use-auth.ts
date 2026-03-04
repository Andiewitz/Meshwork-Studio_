import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { User } from "@shared/schema";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

function getApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch(getApiUrl("/api/auth/me"), {
      credentials: "include",
    });

    if (response.status === 401) {
      console.log("[AuthHook] Fetch user returned 401 (Not logged in)");
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("[AuthHook] Fetch user failed:", response.status, text);
      throw new Error(`${response.status}: ${text}`);
    }

    const userData = await response.json();
    console.log("[AuthHook] User fetched successfully:", userData.id || userData.email);
    return userData;
  } catch (err) {
    console.error("[AuthHook] Error in fetchUser:", err);
    // Return null instead of throwing to prevent infinite loading screen
    return null;
  }
}

async function logout(): Promise<void> {
  const response = await fetch(getApiUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      setIsRedirecting(true);
      // Clear all queries to ensure fresh state on next login
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading: isLoading || isRedirecting,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    isRedirecting,
  };
}
