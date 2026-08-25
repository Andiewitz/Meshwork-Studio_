package config

import (
	"encoding/base64"
	"os"
	"strings"
	"testing"
)

func base6432() string {
	return base64.StdEncoding.EncodeToString(make([]byte, 32))
}

func setEnv(t *testing.T, kv map[string]string) {
	t.Helper()
	for k, v := range kv {
		t.Setenv(k, v)
	}
}

func TestProductionRequiresEverything(t *testing.T) {
	setEnv(t, map[string]string{
		"IDENTITY_APP_ENV":        "production",
		"APP_PUBLIC_URL":          "https://app.example.com",
		"IDENTITY_DATABASE_URL":   "postgres://db",
		"SMTP_HOST":               "smtp.example.com",
		"EMAIL_FROM":              "no-reply@example.com",
		"IDENTITY_IP_HASH_KEY":    base6432(),
		"IDENTITY_ENCRYPTION_KEY": base6432(),
	})
	cfg, err := Load()
	if err != nil {
		t.Fatalf("valid production config rejected: %v", err)
	}
	if cfg.SessionCookieName != "__Host-meshwork_session" {
		t.Errorf("prod cookie name = %q", cfg.SessionCookieName)
	}
}

func TestProductionRejectsMissingKeys(t *testing.T) {
	setEnv(t, map[string]string{
		"IDENTITY_APP_ENV":      "production",
		"APP_PUBLIC_URL":        "https://app.example.com",
		"IDENTITY_DATABASE_URL": "postgres://db",
		"SMTP_HOST":             "smtp.example.com",
		"EMAIL_FROM":            "no-reply@example.com",
	})
	os.Unsetenv("IDENTITY_IP_HASH_KEY")
	os.Unsetenv("IDENTITY_ENCRYPTION_KEY")
	_, err := Load()
	if err == nil {
		t.Fatal("production boot must fail without explicit keys")
	}
	for _, want := range []string{"IDENTITY_IP_HASH_KEY", "IDENTITY_ENCRYPTION_KEY"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error should mention %s: %v", want, err)
		}
	}
}

func TestWrongKeyLengthRejected(t *testing.T) {
	setEnv(t, map[string]string{
		"IDENTITY_DATABASE_URL":   "postgres://db",
		"IDENTITY_IP_HASH_KEY":    base64.StdEncoding.EncodeToString(make([]byte, 16)), // too short
		"IDENTITY_ENCRYPTION_KEY": base6432(),
	})
	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "IDENTITY_IP_HASH_KEY") {
		t.Fatalf("short key must be rejected with a named error, got %v", err)
	}
}

func TestAllProblemsReportedAtOnce(t *testing.T) {
	setEnv(t, map[string]string{
		"IDENTITY_APP_ENV": "production",
		// everything else missing
	})
	os.Unsetenv("IDENTITY_IP_HASH_KEY")
	os.Unsetenv("IDENTITY_ENCRYPTION_KEY")
	os.Unsetenv("APP_PUBLIC_URL")
	os.Unsetenv("IDENTITY_DATABASE_URL")
	os.Unsetenv("SMTP_HOST")
	os.Unsetenv("EMAIL_FROM")
	_, err := Load()
	if err == nil {
		t.Fatal("expected failure")
	}
	count := strings.Count(err.Error(), "\n  - ")
	if count < 4 {
		t.Errorf("expected aggregated errors (>=5 problems), got %d:\n%v", count+1, err)
	}
}

func TestDevEphemeralKeysAreAllowed(t *testing.T) {
	setEnv(t, map[string]string{
		"IDENTITY_APP_ENV":      "development",
		"IDENTITY_DATABASE_URL": "postgres://db",
	})
	cfg, err := Load()
	if err != nil {
		t.Fatalf("dev config with ephemeral keys rejected: %v", err)
	}
	if cfg.SessionCookieName != "meshwork_session" {
		t.Errorf("dev cookie name = %q", cfg.SessionCookieName)
	}
}

func TestAbsoluteTTLMustCoverIdleTTL(t *testing.T) {
	setEnv(t, map[string]string{
		"IDENTITY_APP_ENV":      "development",
		"IDENTITY_DATABASE_URL": "postgres://db",
		"SESSION_ABSOLUTE_TTL":  "1h",
		"SESSION_IDLE_TTL":      "2h",
	})
	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "SESSION_ABSOLUTE_TTL") {
		t.Fatalf("absolute < idle must be rejected, got %v", err)
	}
}
