import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.warn("[AuthDB] AUTH_DATABASE_URL not set, falling back to in-memory mode if configured");
}

export const pool = new Pool({ connectionString: connectionString || "postgres://" });
export const db = drizzle(pool, { schema });

// Create tables if they don't exist
async function createTables() {
    if (!connectionString) return;

    try {
        // Create users table with new auth fields
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR UNIQUE NOT NULL,
                first_name VARCHAR,
                last_name VARCHAR,
                profile_image_url VARCHAR,
                password_hash VARCHAR,
                auth_provider VARCHAR NOT NULL DEFAULT 'email',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("[AuthDB] Users table created/verified");

        // Create sessions table for connect-pg-simple
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                sid VARCHAR PRIMARY KEY,
                sess JSONB NOT NULL,
                expire TIMESTAMP NOT NULL
            );
        `);
        console.log("[AuthDB] Sessions table created/verified");

    } catch (err) {
        console.error("[AuthDB] Failed to create tables:", err);
    }
}

createTables();
