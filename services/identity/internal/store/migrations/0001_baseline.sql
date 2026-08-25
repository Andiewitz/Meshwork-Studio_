-- 0001_baseline.sql
-- Baseline schema for the identity service. Matches the shape of the tables
-- previously provisioned ad-hoc by the Node monolith at boot so this service
-- can adopt existing databases without a data migration.

CREATE TABLE IF NOT EXISTS users (
    id varchar(128) PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(320) UNIQUE NOT NULL,
    email_normalized varchar(320),
    first_name varchar(120),
    last_name varchar(120),
    profile_image_url text,
    password_hash text,
    auth_provider varchar(32) NOT NULL DEFAULT 'email',
    is_active boolean NOT NULL DEFAULT true,
    has_notified_team boolean DEFAULT false,
    read_notification_ids jsonb DEFAULT '[]'::jsonb,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_normalized varchar(320);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_uidx ON users (email_normalized);
UPDATE users SET email_normalized = LOWER(TRIM(email)) WHERE email_normalized IS NULL;

CREATE TABLE IF NOT EXISTS auth_identities (
    id varchar(128) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider varchar(32) NOT NULL,
    provider_account_id varchar(255) NOT NULL,
    created_at timestamp DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS auth_identity_provider_account_idx
    ON auth_identities (provider, provider_account_id);
CREATE INDEX IF NOT EXISTS auth_identity_user_idx ON auth_identities (user_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id_hash varchar(128) PRIMARY KEY,
    user_id varchar(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT NOW(),
    last_seen_at timestamp DEFAULT NOW(),
    expires_at timestamp NOT NULL,
    revoked_at timestamp,
    user_agent text,
    ip_hash varchar(128)
);
CREATE INDEX IF NOT EXISTS auth_session_user_idx ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS auth_session_expiry_idx ON auth_sessions (expires_at);

CREATE TABLE IF NOT EXISTS auth_csrf_secrets (
    session_id_hash varchar(128) PRIMARY KEY,
    secret_hash varchar(128) NOT NULL,
    expires_at timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
    email varchar(320) PRIMARY KEY,
    failed integer NOT NULL DEFAULT 0,
    last_attempt timestamp NOT NULL DEFAULT NOW(),
    locked_until timestamp,
    created_at timestamp NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS login_attempts_email_uidx ON login_attempts (email);
