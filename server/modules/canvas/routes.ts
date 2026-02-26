import type { Express } from "express";
import { canvasStorage } from "./storage";
import { WorkspaceModule } from "../workspace";
import { api } from "@shared/routes";
import { AuthModule } from "../auth";
import { z } from "zod";

export function registerCanvasRoutes(app: Express) {
    const { isAuthenticated } = AuthModule.middleware;
    const workspaceStorage = WorkspaceModule.storage;

    // Canvas logic routes
    app.get(api.workspaces.getCanvas.path, isAuthenticated, async (req, res) => {
        const id = Number(req.params.id);
        const workspace = await workspaceStorage.getWorkspace(id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });

        const userId = (req.user as any)?.id;
        if (workspace.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        const nodes = await canvasStorage.getNodes(id);
        const edges = await canvasStorage.getEdges(id);
        res.json({ nodes, edges });
    });

    app.post(api.workspaces.syncCanvas.path, isAuthenticated, async (req, res) => {
        const id = Number(req.params.id);
        const workspace = await workspaceStorage.getWorkspace(id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });

        const userId = (req.user as any)?.id;
        if (workspace.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        const { nodes, edges } = api.workspaces.syncCanvas.input.parse(req.body);
        await canvasStorage.syncCanvas(id, nodes, edges);
        res.json({ success: true });
    });

    // Duplicate canvas data when duplicating workspace
    app.post("/api/workspaces/:id/duplicate-canvas", isAuthenticated, async (req, res) => {
        const id = Number(req.params.id);
        const { toWorkspaceId } = req.body;
        
        const workspace = await workspaceStorage.getWorkspace(id);
        if (!workspace) return res.status(404).json({ message: "Source workspace not found" });

        const userId = (req.user as any)?.id;
        if (workspace.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        await canvasStorage.duplicateCanvas(id, toWorkspaceId);
        res.json({ success: true });
    });
}
