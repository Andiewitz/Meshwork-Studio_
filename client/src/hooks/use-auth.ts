import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/user", {
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
    throw err;
  }
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
