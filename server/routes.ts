import type { Express } from "express";
import type { Server } from "http";
import { AuthModule } from "./modules/auth";
import { CanvasModule } from "./modules/canvas";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize Auth Module first (as other modules might depend on its middleware)
  await AuthModule.initialize(app);

  // Initialize Canvas Module
  CanvasModule.initialize(app);

  console.log("[Monolith] All modules initialized");

  return httpServer;
}
