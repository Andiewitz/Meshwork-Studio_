import type { Migration } from "@server/lib/migrate";

// NOTE: user_id / workspace_id are PLAIN columns — users live in auth_db and
// workspaces in workspace_db; cross-database foreign keys do not exist.
// Referential integrity is enforced by the auth assertion (valid user ids)
// and explicit cleanup on delete. The team surface is throwaway scaffolding
// pending the collaborators/permissions revamp.

export const MIGRATIONS: Migration[] = [
  {
    version: "0001_core",
    up: `
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(64) NOT NULL,
        invite_code VARCHAR(8) UNIQUE NOT NULL,
        owner_id VARCHAR(128) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS IDX_teams_invite_code ON teams (invite_code);
      CREATE INDEX IF NOT EXISTS IDX_teams_owner_id ON teams (owner_id);

      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id VARCHAR(128) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id VARCHAR(128) NOT NULL,
        role VARCHAR(16) NOT NULL DEFAULT 'editor',
        color VARCHAR(7) NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS IDX_team_members_team_id ON team_members (team_id);
      CREATE INDEX IF NOT EXISTS IDX_team_members_user_id ON team_members (user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_team_members_team_user
        ON team_members (team_id, user_id);

      CREATE TABLE IF NOT EXISTS team_workspaces (
        id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id VARCHAR(128) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        workspace_id VARCHAR(128) NOT NULL,
        shared_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS IDX_team_workspaces_team_id ON team_workspaces (team_id);
      CREATE INDEX IF NOT EXISTS IDX_team_workspaces_workspace_id ON team_workspaces (workspace_id);
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_team_workspaces_team_ws
        ON team_workspaces (team_id, workspace_id);
    `,
  },
  {
    version: "0002_workspace_owners",
    up: `
      CREATE TABLE IF NOT EXISTS workspace_owners (
        workspace_id VARCHAR(128) PRIMARY KEY,
        owner_id VARCHAR(128) NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        synced_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `,
  },
];
