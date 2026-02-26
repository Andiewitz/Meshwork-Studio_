import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.WORKSPACE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.warn("[CanvasDB] WORKSPACE_DATABASE_URL not set, falling back to in-memory mode if configured");
}

export const pool = new Pool({ connectionString: connectionString || "postgres://" });
export const db = drizzle(pool, { schema });

// Create tables if they don't exist
async function createTables() {
    if (!connectionString) return;

    try {
        // Create nodes table for canvas elements
        await pool.query(`
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                type TEXT,
                position JSONB NOT NULL,
                data JSONB NOT NULL,
                parent_id TEXT,
                extent TEXT
            );
        `);
        console.log("[CanvasDB] Nodes table created/verified");

        // Create edges table for connections
        await pool.query(`
            CREATE TABLE IF NOT EXISTS edges (
                id TEXT PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                source TEXT NOT NULL,
                target TEXT NOT NULL,
                source_handle TEXT,
                target_handle TEXT,
                type TEXT,
                data JSONB,
                animated INTEGER DEFAULT 0
            );
        `);
        console.log("[CanvasDB] Edges table created/verified");

    } catch (err) {
        console.error("[CanvasDB] Failed to create tables:", err);
    }
}

createTables();
