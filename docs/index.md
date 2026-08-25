# Meshwork Studio Documentation

Developer documentation, organized by domain. Operational runbooks live in
[`/important`](../important).

---

## Security & Identity

- [**Auth Architecture**](./AUTH_ARCHITECTURE.md) — The Go identity service:
  sessions, MFA, OAuth, threat model, ownership map, cutover/rollback.
- [**Security Architecture**](./SECURITY.md) — Every layer from browser to
  database: CSRF, IDOR protection, brute-force defence, BYOK encryption,
  logging/PII policy.

## Architecture

- [**Canvas Schema**](./architecture/CANVAS_SCHEMA.md) — ReactFlow node/edge structures and canvas data model.
- [**The Engine**](./architecture/ENGINE.md) — Internal drawing engine and canvas state management.
- [**Persistence**](./architecture/PERSISTENCE.md) — PostgreSQL, Drizzle ORM, and database storage mechanisms.

## Features

- [**Mosh AI**](./features/MOSH_AI.md) — Embedded AI co-pilot and Bring Your Own Key (BYOK) mechanics.
- [**Workspaces**](./features/WORKSPACES.md) — Workspace and real-time collaboration module.
- [**Settings**](./features/SETTINGS.md) — User preferences, security settings and account architecture.
- [**Theming**](./features/THEMING.md) — TailwindCSS configuration, CSS variables, and the dynamic theme system.

## Infrastructure

- [**Infrastructure (ECS/Terraform)**](./infrastructure/INFRASTRUCTURE.md) — Declarative AWS infrastructure.
- [**Deployment Runbook**](../important/DEPLOY.md) — Both production deploy paths, verification, rollback.
- [**Secrets Inventory**](../important/SECRETS.md) — Every secret: generation, consumers, rotation.

## Development

- [**Testing**](./development/TESTING.md) — Test pyramid, commands, conventions.

## Archive

Historical material kept for context only — **not** current guidance:

- [`process/`](./archive/process/) — Q2 tickets, plans, investigations, post-mortems.
- [`security-audit-2026-03.md`](./archive/security-audit-2026-03.md) — Original audit (superseded by the 2026-08 auth overhaul).
- [`aws-migration-and-deployment.md`](./archive/aws-migration-and-deployment.md) — Earlier migration plan (references the removed JWT/csurf stack).
