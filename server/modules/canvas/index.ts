import type { Express } from "express";
import { canvasStorage } from "./storage";
import { registerCanvasRoutes } from "./routes";

export class CanvasModule {
    static initialize(app: Express) {
        registerCanvasRoutes(app);
        console.log("[CanvasModule] Modular Canvas service initialized");
    }

    static storage = canvasStorage;
}

export * from "./storage";
export * from "./routes";

