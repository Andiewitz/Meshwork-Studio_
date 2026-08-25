#!/usr/bin/env node
/**
 * Database Backup Utility
 *
 * Creates a timestamped JSON dump of all critical tables.
 * Run before deployments: npx tsx script/backup-db.ts
 *
 * Backups are saved to ./backups/<timestamp>/
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx script/backup-db.ts
 */

import pg from "pg";
import fs from "fs";
import path from "path";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[Backup] DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString });

const TABLES_TO_BACKUP = [
  "users",
  "workspaces",
  "collections",
  "nodes",
  "edges",
  "sessions",
  "login_attempts",
];

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups", timestamp);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`[Backup] Starting backup to ${backupDir}`);

  for (const table of TABLES_TO_BACKUP) {
    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
      console.log(`  ✓ ${table}: ${result.rows.length} rows`);
    } catch (err: any) {
      if (err.code === "42P01") {
        // Table doesn't exist yet — skip
        console.log(`  ⊘ ${table}: table does not exist (skipped)`);
      } else {
        console.error(`  ✗ ${table}: ${err.message}`);
      }
    }
  }

  // Write metadata
  const meta = {
    timestamp: new Date().toISOString(),
    tables: TABLES_TO_BACKUP,
    databaseUrl: connectionString.replace(/\/\/.*@/, "//***@"), // redact creds
  };
  fs.writeFileSync(
    path.join(backupDir, "_meta.json"),
    JSON.stringify(meta, null, 2),
  );

  console.log(`\n[Backup] Complete! Saved to: ${backupDir}`);
  await pool.end();
}

backup().catch((err) => {
  console.error("[Backup] Fatal error:", err);
  process.exit(1);
});
