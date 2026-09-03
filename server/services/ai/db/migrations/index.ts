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
  {
    version: "0002_jenkos_conversations_memories",
    up: `
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(128) NOT NULL,
        workspace_id VARCHAR(128),
        scope VARCHAR(32) NOT NULL DEFAULT 'workspace',
        title TEXT NOT NULL DEFAULT 'New Conversation',
        context JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS IDX_conversations_user_id ON conversations (user_id);
      CREATE INDEX IF NOT EXISTS IDX_conversations_workspace_id ON conversations (workspace_id);
      CREATE INDEX IF NOT EXISTS IDX_conversations_scope ON conversations (scope);
      CREATE INDEX IF NOT EXISTS IDX_conversations_updated_at ON conversations (updated_at);

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id VARCHAR(128) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        tool_calls JSONB,
        tool_results JSONB,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS IDX_messages_conversation_id ON messages (conversation_id);
      CREATE INDEX IF NOT EXISTS IDX_messages_created_at ON messages (created_at);

      CREATE TABLE IF NOT EXISTS memories (
        id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(128) NOT NULL,
        workspace_id VARCHAR(128),
        scope VARCHAR(32) NOT NULL DEFAULT 'global',
        category VARCHAR(64) NOT NULL DEFAULT 'fact',
        key VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        confidence REAL DEFAULT 1.0,
        source_message_id VARCHAR(128),
        last_recalled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS IDX_memories_user_id ON memories (user_id);
      CREATE INDEX IF NOT EXISTS IDX_memories_workspace_id ON memories (workspace_id);
      CREATE INDEX IF NOT EXISTS IDX_memories_scope ON memories (scope);
      CREATE INDEX IF NOT EXISTS IDX_memories_category ON memories (category);
      CREATE INDEX IF NOT EXISTS IDX_memories_key ON memories (key);
    `,
  },
];
