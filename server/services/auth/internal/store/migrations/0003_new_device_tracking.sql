-- 0003_new_device_tracking.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip_hash varchar(128);
