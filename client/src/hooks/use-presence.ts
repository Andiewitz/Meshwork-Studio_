import { useEffect, useRef, useState, useCallback } from "react";
import type { NodeChange, EdgeChange } from "@xyflow/react";
import { useAuth } from "@/auth";

// ─── Types ───────────────────────────────────────────────────────────

export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
}

/** Serialised node/edge shape sent over the WebSocket wire */
type SerializedNode = Record<string, unknown>;
type SerializedEdge = Record<string, unknown>;

interface ServerMessage {
  type:
    | "presence"
    | "cursor"
    | "joined"
    | "left"
    | "error"
    | "node-move"
    | "canvas-sync"
    | "nodes-change"
    | "edges-change";
  users?: PresenceUser[];
  userId?: string;
  name?: string;
  color?: string;
  x?: number;
  y?: number;
  message?: string;
  nodeId?: string;
  nodeX?: number;
  nodeY?: number;
  parentId?: string | null;
  nodes?: SerializedNode[];
  edges?: SerializedEdge[];
  changes?: NodeChange[] | EdgeChange[];
}

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

// ─── Hook ────────────────────────────────────────────────────────────

export function usePresence(
  workspaceId: string | number | null,
  onNodeMove?: (
    nodeId: string,
    x: number,
    y: number,
    parentId?: string | null,
  ) => void,
  onCanvasSync?: (nodes: SerializedNode[], edges: SerializedEdge[]) => void,
  onNodesChange?: (changes: NodeChange[]) => void,
  onEdgesChange?: (changes: EdgeChange[]) => void,
) {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const onNodeMoveRef = useRef(onNodeMove);
  onNodeMoveRef.current = onNodeMove;
  const onCanvasSyncRef = useRef(onCanvasSync);
  onCanvasSyncRef.current = onCanvasSync;
  const onNodesChangeRef = useRef(onNodesChange);
  onNodesChangeRef.current = onNodesChange;
  const onEdgesChangeRef = useRef(onEdgesChange);
  onEdgesChangeRef.current = onEdgesChange;
  const [collaborators, setCollaborators] = useState<Map<string, PresenceUser>>(
    new Map(),
  );
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const stoppedRef = useRef(false);

  const connect = useCallback(() => {
    if (!workspaceId || !isAuthenticated || stoppedRef.current) return;

    // Build WS URL from current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const rawUrl = (import.meta.env.VITE_API_URL as string) || "";
    const host =
      rawUrl && !rawUrl.includes("railway")
        ? new URL(rawUrl).host
        : window.location.host;
    const url = `${protocol}//${host}/ws`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      backoffRef.current = INITIAL_BACKOFF_MS;
      // Authenticate and join the workspace room
      ws.send(JSON.stringify({ type: "join", workspaceId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data as string);

        switch (msg.type) {
          case "presence": {
            // Full state sync on join
            const map = new Map<string, PresenceUser>();
            for (const user of msg.users || []) {
              map.set(user.userId, user);
            }
            setCollaborators(map);
            break;
          }

          case "joined": {
            if (msg.userId && msg.name && msg.color) {
              setCollaborators((prev) => {
                const next = new Map(prev);
                next.set(msg.userId!, {
                  userId: msg.userId!,
                  name: msg.name!,
                  color: msg.color!,
                  cursor: null,
                });
                return next;
              });
            }
            break;
          }

          case "cursor": {
            if (msg.userId) {
              setCollaborators((prev) => {
                const next = new Map(prev);
                const existing = next.get(msg.userId!);
                if (existing) {
                  next.set(msg.userId!, {
                    ...existing,
                    cursor: { x: msg.x || 0, y: msg.y || 0 },
                  });
                }
                return next;
              });
            }
            break;
          }

          case "left": {
            if (msg.userId) {
              setCollaborators((prev) => {
                const next = new Map(prev);
                next.delete(msg.userId!);
                return next;
              });
            }
            break;
          }

          case "error": {
            console.warn("[Presence] Server message:", msg.message);
            break;
          }

          case "node-move": {
            if (msg.nodeId != null && msg.nodeX != null && msg.nodeY != null) {
              onNodeMoveRef.current?.(
                msg.nodeId,
                msg.nodeX,
                msg.nodeY,
                msg.parentId,
              );
            }
            break;
          }

          case "canvas-sync": {
            if (msg.nodes && msg.edges) {
              onCanvasSyncRef.current?.(msg.nodes, msg.edges);
            }
            break;
          }

          case "nodes-change": {
            if (msg.changes) {
              onNodesChangeRef.current?.(msg.changes as NodeChange[]);
            }
            break;
          }

          case "edges-change": {
            if (msg.changes) {
              onEdgesChangeRef.current?.(msg.changes as EdgeChange[]);
            }
            break;
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      wsRef.current = null;
      // Server closed with 4001 = session revoked/expired — stop reconnecting
      if (event.code === 4001 || !isAuthenticated || stoppedRef.current) {
        return;
      }
      // Exponential backoff with cap
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);
      reconnectTimer.current = setTimeout(() => connect(), delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [workspaceId, isAuthenticated]);

  // Reset backoff and reconnect when auth state changes to authenticated
  useEffect(() => {
    if (isAuthenticated && workspaceId && !stoppedRef.current) {
      backoffRef.current = INITIAL_BACKOFF_MS;
      // Only connect if not already connected
      if (!wsRef.current || wsRef.current.readyState > WebSocket.OPEN) {
        connect();
      }
    }
  }, [isAuthenticated, workspaceId, connect]);

  // Stop reconnecting when auth is lost
  useEffect(() => {
    if (!isAuthenticated) {
      stoppedRef.current = true;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    } else {
      stoppedRef.current = false;
    }
  }, [isAuthenticated]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }

    return () => {
      stoppedRef.current = true;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: "leave" }));
        wsRef.current.close();
        wsRef.current = null;
      }
      setCollaborators(new Map());
      setIsConnected(false);
    };
  }, [connect, isAuthenticated]);

  // Send cursor position (throttled by caller)
  const sendCursor = useCallback((x: number, y: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "cursor", x, y }));
    }
  }, []);

  const sendNodeMove = useCallback(
    (nodeId: string, x: number, y: number, parentId?: string | null) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "node-move",
            nodeId,
            nodeX: x,
            nodeY: y,
            parentId: parentId ?? null,
          }),
        );
      }
    },
    [],
  );

  const sendCanvasSync = useCallback(
    (nodes: SerializedNode[], edges: SerializedEdge[]) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "canvas-sync", nodes, edges }),
        );
      }
    },
    [],
  );

  const sendNodesChange = useCallback((changes: NodeChange[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "nodes-change", changes }));
    }
  }, []);

  const sendEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "edges-change", changes }));
    }
  }, []);

  return {
    collaborators: Array.from(collaborators.values()),
    isConnected,
    sendCursor,
    sendNodeMove,
    sendCanvasSync,
    sendNodesChange,
    sendEdgesChange,
  };
}
