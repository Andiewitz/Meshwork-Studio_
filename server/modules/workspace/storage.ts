import { db } from "./db";
import {
    workspaces,
    collections,
    type InsertWorkspace,
    type Workspace,
    type Collection,
    type InsertCollection,
} from "@shared/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

export interface IWorkspaceStorage {
    // Collections (subcollections/folders)
    getCollections(userId: string, parentId?: number | null): Promise<Collection[]>;
    createCollection(collection: InsertCollection): Promise<Collection>;
    updateCollection(id: number, updates: Partial<InsertCollection>): Promise<Collection>;
    deleteCollection(id: number): Promise<void>;
    getCollectionById(id: number): Promise<Collection | undefined>;

    // Workspaces
    getWorkspaces(userId: string, collectionId?: number | null): Promise<Workspace[]>;
    getWorkspace(id: number): Promise<Workspace | undefined>;
    createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
    updateWorkspace(id: number, updates: Partial<InsertWorkspace>): Promise<Workspace>;
    deleteWorkspace(id: number): Promise<void>;
    duplicateWorkspace(id: number, newTitle?: string): Promise<Workspace>;
}

export class WorkspaceDatabaseStorage implements IWorkspaceStorage {
    // Collections
    async getCollections(userId: string, parentId: number | null = null): Promise<Collection[]> {
        const query = parentId
            ? and(eq(collections.userId, userId), eq(collections.parentId, parentId))
            : and(eq(collections.userId, userId), isNull(collections.parentId));

        return await db.select()
            .from(collections)
            .where(query);
    }

    async getCollectionById(id: number): Promise<Collection | undefined> {
        const [collection] = await db.select().from(collections).where(eq(collections.id, id));
        return collection;
    }

    async createCollection(insertCollection: InsertCollection): Promise<Collection> {
        const [collection] = await db.insert(collections).values(insertCollection).returning();
        return collection;
    }

    async updateCollection(id: number, updates: Partial<InsertCollection>): Promise<Collection> {
        const [collection] = await db.update(collections).set(updates).where(eq(collections.id, id)).returning();
        return collection;
    }

    async deleteCollection(id: number): Promise<void> {
        await db.delete(collections).where(eq(collections.id, id));
    }

    // Workspaces
    async getWorkspaces(userId: string, collectionId: number | null = null): Promise<Workspace[]> {
        const query = collectionId
            ? and(eq(workspaces.userId, userId), eq(workspaces.collectionId, collectionId))
            : and(eq(workspaces.userId, userId), isNull(workspaces.collectionId));

        return await db.select()
            .from(workspaces)
            .where(query)
            .orderBy(desc(workspaces.createdAt));
    }

    async getWorkspace(id: number): Promise<Workspace | undefined> {
        const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
        return workspace;
    }

    async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
        const [workspace] = await db.insert(workspaces).values(insertWorkspace).returning();
        return workspace;
    }

    async updateWorkspace(id: number, updates: Partial<InsertWorkspace>): Promise<Workspace> {
        const [workspace] = await db.update(workspaces).set(updates).where(eq(workspaces.id, id)).returning();
        return workspace;
    }

    async deleteWorkspace(id: number): Promise<void> {
        await db.delete(workspaces).where(eq(workspaces.id, id));
    }

    async duplicateWorkspace(id: number, newTitle?: string): Promise<Workspace> {
        const existing = await this.getWorkspace(id);
        if (!existing) throw new Error("Workspace not found");

        const [duplicated] = await db.insert(workspaces).values({
            title: newTitle || `${existing.title} (Copy)`,
            type: existing.type,
            icon: existing.icon,
            userId: existing.userId,
            collectionId: existing.collectionId,
        }).returning();

        return duplicated;
    }
}

export const workspaceStorage = new WorkspaceDatabaseStorage();
