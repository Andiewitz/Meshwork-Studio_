import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.CANVAS_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.warn("[CanvasDB] CANVAS_DATABASE_URL not set, falling back to in-memory mode if configured");
}

export const pool = new Pool({ connectionString: connectionString || "postgres://" });
export const db = drizzle(pool, { schema });
