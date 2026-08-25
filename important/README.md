# Important Documentation

Operational runbooks, deployment instructions, and the secrets inventory for
Meshwork Studio.

## Documents

- [**`DEPLOY.md`**](./DEPLOY.md) — Production deployment runbook: both deploy
  paths (GitHub Actions + local dist-swap), topology, verification and rollback.
- [**`SECRETS.md`**](./SECRETS.md) — Every secret/env variable: purpose,
  consumer code, generation commands, storage policy, rotation & blast radius.
- [**`EC2_OPERATIONS_GUIDE.md`**](./EC2_OPERATIONS_GUIDE.md) — Start/stop the
  EC2 instance cost-effectively with `~/start-ec2.sh`, PM2/Docker/Nginx
  management.
- [`post-mortem-csrf-403-2026-08-21.md`](./post-mortem-csrf-403-2026-08-21.md)
  — Historical incident write-up (kept for context).

## Key shortcuts

- **Start EC2 & all services:** `~/start-ec2.sh`
- **Start EC2 & connect via SSH:** `~/start-ec2.sh --ssh`
- **Deploy from local machine:** `./scripts/deploy.sh`
- **Public URL:** <https://meshwork-studio.duckdns.org>
- **SSH key:** `ssh-keys/Mesh-EC2.pem` (chmod 400 — never commit)

Related: architecture of the auth split lives in
[`../docs/AUTH_ARCHITECTURE.md`](../docs/AUTH_ARCHITECTURE.md).
