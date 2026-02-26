import { db } from "./db";
import {
    nodes,
    edges,
    type Node,
    type Edge,
    type InsertNode,
    type InsertEdge,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface ICanvasStorage {
    // Canvas operations
    getNodes(workspaceId: number): Promise<Node[]>;
    getEdges(workspaceId: number): Promise<Edge[]>;
    syncCanvas(workspaceId: number, nodes: InsertNode[], edges: InsertEdge[]): Promise<void>;
    duplicateCanvas(fromWorkspaceId: number, toWorkspaceId: number): Promise<void>;
}

export class CanvasDatabaseStorage implements ICanvasStorage {
    async getNodes(workspaceId: number): Promise<Node[]> {
        return await db.select().from(nodes).where(eq(nodes.workspaceId, workspaceId));
    }

    async getEdges(workspaceId: number): Promise<Edge[]> {
        return await db.select().from(edges).where(eq(edges.workspaceId, workspaceId));
    }

    async syncCanvas(workspaceId: number, newNodes: InsertNode[], newEdges: InsertEdge[]): Promise<void> {
        await db.transaction(async (tx: any) => {
            await tx.delete(edges).where(eq(edges.workspaceId, workspaceId));
            await tx.delete(nodes).where(eq(nodes.workspaceId, workspaceId));
            if (newNodes.length > 0) {
                await tx.insert(nodes).values(newNodes.map(n => ({ ...n, workspaceId })));
            }
            if (newEdges.length > 0) {
                await tx.insert(edges).values(newEdges.map(e => ({ ...e, workspaceId })));
            }
        });
    }

    async duplicateCanvas(fromWorkspaceId: number, toWorkspaceId: number): Promise<void> {
        await db.transaction(async (tx: any) => {
            const nodesList = await tx.select().from(nodes).where(eq(nodes.workspaceId, fromWorkspaceId));
            const edgesList = await tx.select().from(edges).where(eq(edges.workspaceId, fromWorkspaceId));

            if (nodesList.length > 0) {
                await tx.insert(nodes).values(nodesList.map((n: any) => ({ ...n, workspaceId: toWorkspaceId })));
            }
            if (edgesList.length > 0) {
                await tx.insert(edges).values(edgesList.map((e: any) => ({ ...e, workspaceId: toWorkspaceId })));
            }
        });
    }
}

// In-memory fallback for Canvas
export class CanvasMemStorage implements ICanvasStorage {
    private nodesMap: Map<string, Node> = new Map();
    private edgesMap: Map<string, Edge> = new Map();

    async getNodes(workspaceId: number): Promise<Node[]> {
        return Array.from(this.nodesMap.values()).filter(n => n.workspaceId === workspaceId);
    }

    async getEdges(workspaceId: number): Promise<Edge[]> {
        return Array.from(this.edgesMap.values()).filter(e => e.workspaceId === workspaceId);
    }

    async syncCanvas(workspaceId: number, newNodes: InsertNode[], newEdges: InsertEdge[]): Promise<void> {
        for (const [id, node] of Array.from(this.nodesMap.entries())) {
            if (node.workspaceId === workspaceId) this.nodesMap.delete(id);
        }
        for (const [id, edge] of Array.from(this.edgesMap.entries())) {
            if (edge.workspaceId === workspaceId) this.edgesMap.delete(id);
        }
        for (const n of newNodes) {
            this.nodesMap.set(n.id, { ...n, workspaceId } as Node);
        }
        for (const e of newEdges) {
            this.edgesMap.set(e.id, { ...e, workspaceId } as Edge);
        }
    }

    async duplicateCanvas(fromWorkspaceId: number, toWorkspaceId: number): Promise<void> {
        for (const node of Array.from(this.nodesMap.values())) {
            if (node.workspaceId === fromWorkspaceId) {
                this.nodesMap.set(node.id, { ...node, workspaceId: toWorkspaceId });
            }
        }
        for (const edge of Array.from(this.edgesMap.values())) {
            if (edge.workspaceId === fromWorkspaceId) {
                this.edgesMap.set(edge.id, { ...edge, workspaceId: toWorkspaceId });
            }
        }
    }
}

export const canvasStorage = process.env.CANVAS_DATABASE_URL || process.env.DATABASE_URL
    ? new CanvasDatabaseStorage()
    : new CanvasMemStorage();
