# Authentication & Authorization Architecture

> Status: implemented on `feat/go-identity-service`. The Go identity service
> (`services/auth`) owns identity; the Node monolith serves everything else.

## Ownership map

| Concern                                                                     | Owner                                                            | Storage              |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------- |
| Users, sessions, CSRF secrets, lockout, MFA, OAuth identities, audit events | **Go identity service** (`services/auth`)                        | `auth_db` (Postgres) |
| Workspace / canvas / teams / AI / metrics                                   | Node monolith (`server/`)                                        | workspace DB         |
| WebSocket presence                                                          | Node monolith, handshake-authenticated against identity sessions | —                    |

Routing (NGINX): `/api/v1/auth/*` and `/api/v1/user/*` → identity :8081;
everything else → monolith :5000. Rollback = revert the nginx location block.

## Session model

- Opaque 256-bit random token in an HttpOnly cookie; only its SHA-256 hash is stored.
- Rotated on every login/register. Idle TTL 7d, absolute TTL 14d.
- Postgres is the source of truth; Redis caches hot validation entries (60s).
- Revocation publishes to Redis channel `identity:sessions:revoked`; the
  monolith's WebSocket layer closes affected live sockets immediately, and a
  5-minute revalidation loop is a second line of defence.
- Password hashing: Argon2id (64 MiB, t=3, p=2). Legacy bcrypt hashes verify
  transparently and upgrade to Argon2id on next successful login.

## Threat model highlights

| Threat                              | Mitigation                                                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credential stuffing                 | Per-account atomic lockout (5 failures → 15m exponential → 8h cap) + per-IP Redis sliding window + CAPTCHA hook on register                                          |
| Account enumeration                 | Uniform responses AND uniform timing: dummy Argon2id verification on miss paths; no lockout countdown in responses                                                   |
| Password reuse                      | HIBP k-anonymity screening (only a 5-char SHA-1 prefix leaves the server); fail-open on outage                                                                       |
| CSRF                                | Double-submit cookie + session-bound server secret + exact-match origin allowlist; cookie-bearing mutations without Origin/Referer fail closed                       |
| OAuth account takeover              | Google identity requires `email_verified`; linking into an existing password account demands the account password; state is single-use (Redis GETDEL) with S256 PKCE |
| Stolen password alone disabling MFA | MFA disable requires password + current TOTP/backup code                                                                                                             |
| Token replay                        | One-time tokens hashed + single-use at the DB level; new request invalidates prior family                                                                            |
| Mass assignment                     | Preferences update uses an explicit column whitelist                                                                                                                 |
| IP privacy / GDPR                   | IPs stored as keyed HMAC-SHA256 (`IDENTITY_IP_HASH_KEY`), never raw                                                                                                  |
| Silent degradation                  | No in-memory fallbacks: missing DB URL fails boot; Redis outage fails auth endpoints closed instead of silently disabling protections                                |

## Secrets policy

All keys are per-service env vars validated at boot; production refuses to
start without real values. There are **no** defaults or fallback constants.

```
IDENTITY_IP_HASH_KEY      openssl rand -base64 32
IDENTITY_ENCRYPTION_KEY   openssl rand -base64 32   # AES-GCM for TOTP secrets
SESSION_SECRET            openssl rand -base64 32   # monolith only
```

## Admin access

`/admin` requires a session whose user has `users.is_admin = true`. Bootstrap
admins are promoted at identity boot via `BOOTSTRAP_ADMIN_EMAILS`. The old
secret-in-URL gate was removed (leaks via logs/history/Referer).

## Metrics

Identity exposes Prometheus metrics on loopback-only `127.0.0.1:9091/metrics`.
The monolith's `/metrics` requires `Authorization: Bearer $METRICS_BEARER_TOKEN`
(constant-time compare).

## Cutover & rollback

1. Deploy stack (identity runs migrations additively; existing sessions and
   bcrypt hashes remain valid).
2. NGINX routes auth endpoints to identity. Existing cookies keep working —
   both stacks validate the same hashed opaque tokens.
3. Rollback: point the NGINX location block back at the monolith. Sessions
   created by either side remain valid on both.

## CI enforcement

- `.github/workflows/identity.yml`: golangci-lint, gosec, govulncheck,
  race-enabled tests, docker build.
- `scripts/security/no-auth-bypass.sh` runs in the main pipeline and fails if
  `E2E_BYPASS_AUTH` ever reappears in runtime code.
