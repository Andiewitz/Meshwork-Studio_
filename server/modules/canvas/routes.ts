import type { Express } from "express";
import { canvasStorage } from "./storage";
import { api } from "@shared/routes";
import { AuthModule } from "../auth";
import { z } from "zod";

export function registerCanvasRoutes(app: Express) {
    const { isAuthenticated } = AuthModule.middleware;

    // Collections
    app.get("/api/collections", isAuthenticated, async (req, res) => {
        const userId = (req.user as any).claims.sub;
        const parentId = req.query.parentId ? Number(req.query.parentId) : null;
        const collections = await canvasStorage.getCollections(userId, parentId);
        res.json(collections);
    });

    app.post("/api/collections", isAuthenticated, async (req, res) => {
        const userId = (req.user as any).claims.sub;
        const collection = await canvasStorage.createCollection({
            ...req.body,
            userId
        });
        res.status(201).json(collection);
    });

    // Workspace routes
    app.get(api.workspaces.list.path, isAuthenticated, async (req, res) => {
        const userId = (req.user as any).claims.sub;
        const collectionId = req.query.collectionId ? Number(req.query.collectionId) : null;
        const workspaces = await canvasStorage.getWorkspaces(userId, collectionId);
        res.json(workspaces);
    });

    app.get(api.workspaces.get.path, isAuthenticated, async (req, res) => {
        const workspace = await canvasStorage.getWorkspace(Number(req.params.id));
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const userId = (req.user as any).claims.sub;
        if (workspace.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        res.json(workspace);
    });

    app.post(api.workspaces.create.path, isAuthenticated, async (req, res) => {
        try {
            const input = api.workspaces.create.input.parse(req.body);
            const userId = (req.user as any).claims.sub;
            const workspace = await canvasStorage.createWorkspace({
                ...input,
                userId
            });
            res.status(201).json(workspace);
        } catch (err) {
            if (err instanceof z.ZodError) {
                return res.status(400).json({ message: err.errors[0].message });
            }
            throw err;
        }
    });

    app.put(api.workspaces.update.path, isAuthenticated, async (req, res) => {
        const id = Number(req.params.id);
        const existing = await canvasStorage.getWorkspace(id);
        if (!existing) return res.status(404).json({ message: "Not found" });

        const userId = (req.user as any).claims.sub;
        if (existing.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        const updated = await canvasStorage.updateWorkspace(id, req.body);
        res.json(updated);
    });

    app.delete(api.workspaces.delete.path, isAuthenticated, async (req, res) => {
        const id = Number(req.params.id);
        const existing = await canvasStorage.getWorkspace(id);
        if (!existing) return res.status(404).json({ message: "Not found" });

        const userId = (req.user as any).claims.sub;
        if (existing.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        await canvasStorage.deleteWorkspace(id);
        res.status(204).send();
    });

    app.post(api.workspaces.duplicate.path, isAuthenticated, async (req, res) => {
        const id = Number(req.params.id);
        const existing = await canvasStorage.getWorkspace(id);
        if (!existing) return res.status(404).json({ message: "Not found" });

        const userId = (req.user as any).claims.sub;
        if (existing.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        const { title } = req.body;
        const duplicated = await canvasStorage.duplicateWorkspace(id, title);
        res.status(201).json(duplicated);
    });

    // Canvas logic routes
    app.get(api.workspaces.getCanvas.path, isAuthenticated, async (req, res) => {
        const id = Number(req.params.id);
        const workspace = await canvasStorage.getWorkspace(id);
        if (!workspace) return res.status(404).json({ message: "Not found" });

        const userId = (req.user as any).claims.sub;
        if (workspace.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        const nodes = await canvasStorage.getNodes(id);
        const edges = await canvasStorage.getEdges(id);
        res.json({ nodes, edges });
    });

    app.post(api.workspaces.syncCanvas.path, isAuthenticated, async (req, res) => {
        const id = Number(req.params.id);
        const workspace = await canvasStorage.getWorkspace(id);
        if (!workspace) return res.status(404).json({ message: "Not found" });

        const userId = (req.user as any).claims.sub;
        if (workspace.userId !== userId) return res.status(401).json({ message: "Unauthorized" });

        const { nodes, edges } = api.workspaces.syncCanvas.input.parse(req.body);
        await canvasStorage.syncCanvas(id, nodes, edges);
        res.json({ success: true });
    });
}
