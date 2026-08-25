import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { AuthService, authStorage } from "@services/auth";
import { WorkspaceService, workspaceStorage } from "@services/workspace";
import { CanvasService, canvasStorage } from "@services/canvas";
import { AIService } from "@services/ai";
import { TeamService, teamStorage } from "@services/team";
import { MetricsService } from "@services/metrics";
import { createChildLogger } from "./lib/logger";
import { AppRegistry } from "./lib/registry";
import { eventBus } from "./lib/events";

const log = createChildLogger("server");

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // NOTE: /api/v1/auth/* and /api/v1/user/* are served by the Go auth
  // service (services/auth) — routed there by NGINX. The monolith only
  // validates sessions via the auth bridge below.

  // Setup Service Registry and Event Bus
  const registry = new AppRegistry();
  registry.register("authStorage", authStorage);
  registry.register("workspaceStorage", workspaceStorage);
  registry.register("teamStorage", teamStorage);
  registry.register("canvasStorage", canvasStorage);

  const context = { registry, eventBus };

  // Initialize Auth bridge first (other services depend on its middleware)
  await AuthService.initialize(app, context);
  registry.register("isAuthenticated", AuthService.middleware.isAuthenticated);

  // Initialize Canvas Service (handles nodes and edges) - must listen before WorkspaceService for user.deleted
  CanvasService.initialize(app, context);

  // Initialize Workspace Service (handles collections and workspaces)
  WorkspaceService.initialize(app, context);

  // Initialize AI Service (handles BYOK and free tier AI service)
  AIService.initialize(app, context);

  // Initialize Team Service (handles teams, members, and shared workspaces)
  TeamService.initialize(app, context);

  // Initialize Metrics Service (background collector + history API)
  await MetricsService.initialize(app, context);

  log.info("All modular services initialized");

  return httpServer;
}
