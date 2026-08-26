# Meshwork Auth Service

The identity provider for Meshwork Studio: users, sessions, passwords, MFA,
OAuth, CSRF token issuance and the security audit trail. Written in Go,
deployable as a single static binary. **Owns the `auth_db` Postgres schema** —
no other service writes to it.

## Layout

```
services/auth/
├── api/openapi.yaml        # HTTP contract (source of truth)
├── cmd/server/             # entrypoint
├── internal/
│   ├── assertion/          # ed25519 session assertions for the monolith
│   ├── audit/              # append-only security trail
│   ├── captcha/            # hCaptcha / reCAPTCHA verification
│   ├── config/             # fail-fast env validation (AUTH_* namespace)
│   ├── csrf/               # double-submit + strict origin allowlist
│   ├── email/              # SMTP transport (+ dev console)
│   ├── httpapi/            # chi routes, middleware, handlers
│   ├── iphash/             # keyed HMAC IP pseudonymisation
│   ├── lockout/            # atomic per-account brute-force lockout
│   ├── mfa/                # TOTP, backup codes, AES-GCM sealbox
│   ├── oauth/              # Google PKCE flow helpers
│   ├── password/           # argon2id (+ bcrypt upgrade), HIBP screening
│   ├── ratelimit/          # Redis sliding windows (Lua, fail-closed)
│   ├── session/            # opaque session store + Redis cache/pubsub
│   └── store/              # pgx pool, migrations, queries
└── migrations/             # embedded SQL applied at boot (fail-closed)
```

## Quickstart

```bash
cp .env.example .env         # fill in what you need (dev works with DB only)
make run                     # listens on :8081 (healthz on same port)
make test                    # go test -race
make lint                    # golangci-lint
```

Local development with the monolith:

```bash
make -C services/auth run    # terminal 1
npm run dev                  # terminal 2 — proxies /api/v1/(auth|user)/* here
```

## Configuration

Every variable lives in the `AUTH_*` namespace and is validated at boot —
the service refuses to start on any problem and reports all of them at once.
Full inventory (including the monolith-side variables): see
[`important/SECRETS.md`](../../../important/SECRETS.md).

## Deployment

Ships as a distroless container (`Dockerfile`) or a bare binary
(`CGO_ENABLED=0 go build`). Migrations are embedded and applied before the
HTTP listener opens; a failed migration aborts boot. CI:
[`.github/workflows/auth.yml`](../../../.github/workflows/auth.yml).

## Session model (what the monolith relies on)

1. Browser holds an opaque session cookie; this service stores only its SHA-256.
2. On login it additionally sets a short-lived ed25519-signed **assertion**
   cookie (`internal/assertion`) that the Node monolith verifies locally —
   the monolith has zero access to `auth_db`.
3. Revocations publish on Redis channel `identity:sessions:revoked`; the
   monolith denylists those sessions instantly.
