import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateWorkspaceRequest, type UpdateWorkspaceRequest } from "@shared/schema";
import { useAuth } from "./use-auth";

// Hook to fetch all workspaces
export function useWorkspaces() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [api.workspaces.list.path],
    queryFn: async () => {
      const res = await fetch(api.workspaces.list.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch workspaces");
      }
      return api.workspaces.list.responses[200].parse(await res.json());
    },
    enabled: isAuthenticated, // Only fetch if authenticated
  });
}

// Hook to fetch a single workspace
export function useWorkspace(id: number) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [api.workspaces.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workspaces.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch workspace");
      return api.workspaces.get.responses[200].parse(await res.json());
    },
    enabled: isAuthenticated && !!id,
  });
}

// Hook to create a workspace
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWorkspaceRequest) => {
      const res = await fetch(api.workspaces.create.path, {
        method: api.workspaces.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create workspace");
      }

      return api.workspaces.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
    },
  });
}

// Hook to update a workspace
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateWorkspaceRequest) => {
      const url = buildUrl(api.workspaces.update.path, { id });
      const res = await fetch(url, {
        method: api.workspaces.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update workspace");
      return api.workspaces.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
    },
  });
}

// Hook to delete a workspace
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workspaces.delete.path, { id });
      const res = await fetch(url, {
        method: api.workspaces.delete.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete workspace");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
    },
  });
}
