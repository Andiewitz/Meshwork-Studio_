#!/usr/bin/env bash
# SECURITY GUARD — CI fails if auth bypass flags ever reappear in runtime code.
# E2E tests must inject test doubles via DI/test helpers, never env switches.
set -euo pipefail

violations=$(grep -rn "E2E_BYPASS_AUTH" \
  --include="*.ts" --include="*.tsx" --include="*.go" \
  server client services 2>/dev/null || true)

if [ -n "$violations" ]; then
  echo "SECURITY VIOLATION: E2E_BYPASS_AUTH found in runtime code paths:"
  echo "$violations"
  echo ""
  echo "Auth bypass flags in application code are forbidden."
  echo "Wire test doubles through dependency injection instead."
  exit 1
fi

echo "OK: no auth bypass flags in runtime code"
