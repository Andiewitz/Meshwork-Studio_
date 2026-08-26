import type { Migration } from "@server/lib/migrate";

// user_id is a plain column: users are owned by the Go auth service.

export const MIGRATIONS: Migration[] = [
  {
    version: "0001_core",
    up: `
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(128) NOT NULL,
        provider VARCHAR(32) NOT NULL,
        encrypted_key TEXT NOT NULL,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        key_hint VARCHAR(10),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS IDX_user_api_keys_user_id ON user_api_keys (user_id);
      CREATE INDEX IF NOT EXISTS IDX_user_api_keys_provider ON user_api_keys (provider);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_api_keys_one_active_per_provider
        ON user_api_keys (user_id, provider)
        WHERE is_active = TRUE;
    `,
  },
];
