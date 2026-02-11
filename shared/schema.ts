import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull().default("system"), // system, architecture, app, presentation
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true });

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type CreateWorkspaceRequest = InsertWorkspace;
export type UpdateWorkspaceRequest = Partial<InsertWorkspace>;
export type WorkspaceResponse = Workspace;
