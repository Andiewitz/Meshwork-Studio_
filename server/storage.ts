import { db } from "./db";
import {
  workspaces,
  type InsertWorkspace,
  type Workspace,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getWorkspaces(userId?: string): Promise<Workspace[]>;
  getWorkspace(id: number): Promise<Workspace | undefined>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: number, updates: Partial<InsertWorkspace>): Promise<Workspace>;
  deleteWorkspace(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getWorkspaces(userId?: string): Promise<Workspace[]> {
    if (!userId) return [];
    return await db.select()
      .from(workspaces)
      .where(eq(workspaces.userId, userId))
      .orderBy(desc(workspaces.createdAt));
  }

  async getWorkspace(id: number): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db
      .insert(workspaces)
      .values(insertWorkspace)
      .returning();
    return workspace;
  }

  async updateWorkspace(id: number, updates: Partial<InsertWorkspace>): Promise<Workspace> {
    const [workspace] = await db
      .update(workspaces)
      .set(updates)
      .where(eq(workspaces.id, id))
      .returning();
    return workspace;
  }

  async deleteWorkspace(id: number): Promise<void> {
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }
}

export const storage = new DatabaseStorage();
