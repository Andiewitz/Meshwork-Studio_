import type { Express } from "express";
import { workspaceStorage } from "./storage";
import { registerWorkspaceRoutes } from "./routes";

export class WorkspaceModule {
    static initialize(app: Express) {
        registerWorkspaceRoutes(app);
        console.log("[WorkspaceModule] Workspace service initialized");
    }

    static storage = workspaceStorage;
}

export * from "./storage";
export * from "./routes";
