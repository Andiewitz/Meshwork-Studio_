-- 0002_identity_hardening.sql
-- Additive hardening owned by the identity service.

-- Account lifecycle & privilege columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_algo varchar(16) NOT NULL DEFAULT 'bcrypt';

-- Session model: expires_at becomes the *idle* expiry, absolute_expires_at is
-- the hard lifetime ceiling. Existing rows get a sane absolute ceiling.
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS absolute_expires_at timestamp;
UPDATE auth_sessions SET absolute_expires_at = expires_at + interval '7 days'
WHERE absolute_expires_at IS NULL;
ALTER TABLE auth_sessions ALTER COLUMN absolute_expires_at SET DEFAULT now() + interval '14 days';

-- Single-use, hashed one-time tokens (password reset / email verification)
CREATE TABLE IF NOT EXISTS one_time_tokens (
    token_hash varchar(128) PRIMARY KEY,
    user_id varchar(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose varchar(32) NOT NULL, -- 'password_reset' | 'email_verification'
    created_at timestamp NOT NULL DEFAULT NOW(),
    expires_at timestamp NOT NULL,
    used_at timestamp,
    created_ip_hash varchar(128)
);
CREATE INDEX IF NOT EXISTS one_time_tokens_user_idx ON one_time_tokens (user_id, purpose);
CREATE INDEX IF NOT EXISTS one_time_tokens_expiry_idx ON one_time_tokens (expires_at);

-- TOTP backup codes (hashed at rest, single-use)
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
    id varchar(128) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash varchar(128) NOT NULL,
    used_at timestamp
);
CREATE INDEX IF NOT EXISTS mfa_backup_codes_user_idx ON mfa_backup_codes (user_id);

-- Append-only security audit trail
CREATE TABLE IF NOT EXISTS audit_events (
    id bigserial PRIMARY KEY,
    user_id varchar(128),
    email varchar(320),
    event varchar(64) NOT NULL,
    ip_hash varchar(128),
    user_agent text,
    metadata jsonb,
    created_at timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_events_user_idx ON audit_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS audit_events_event_idx ON audit_events (event, created_at);

-- Sliding lockout window bookkeeping for the atomic account lockout
ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS window_started_at timestamp;
UPDATE login_attempts SET window_started_at = last_attempt WHERE window_started_at IS NULL;
ALTER TABLE login_attempts ALTER COLUMN window_started_at SET DEFAULT now();
