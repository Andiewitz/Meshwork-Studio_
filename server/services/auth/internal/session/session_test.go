package session

import (
	"testing"
	"time"
)

func TestTokenHashIsStableAndOpaque(t *testing.T) {
	raw, hash, err := NewToken()
	if err != nil {
		t.Fatal(err)
	}
	if raw == "" || hash == "" {
		t.Fatal("empty token output")
	}
	if HashToken(raw) != hash {
		t.Error("hash(raw) must reproduce the stored hash")
	}
	// A different token must never collide.
	_, other, _ := NewToken()
	if other == hash {
		t.Error("two tokens produced identical hashes")
	}
	// The hash must not leak the raw token.
	if len(hash) >= len(raw) && hash[:len(raw)] == raw {
		t.Error("hash appears to embed the raw token")
	}
}

func TestRecordActiveHonoursBothWindows(t *testing.T) {
	now := time.Now()
	base := Record{
		UserID:     "u1",
		CreatedAt:  now.Add(-time.Hour),
		LastSeenAt: now.Add(-time.Minute),
		RevokedAt:  nil,
	}
	rec := base
	rec.ExpiresAt = now.Add(time.Hour)
	rec.AbsoluteExpiresAt = now.Add(24 * time.Hour)
	if !rec.Active(now) {
		t.Error("fresh session must be active")
	}

	rec = base
	rec.ExpiresAt = now.Add(-time.Second) // idle expired
	rec.AbsoluteExpiresAt = now.Add(24 * time.Hour)
	if rec.Active(now) {
		t.Error("idle-expired session must not validate")
	}

	rec = base
	rec.ExpiresAt = now.Add(time.Hour)
	rec.AbsoluteExpiresAt = now.Add(-time.Second) // absolute expired
	if rec.Active(now) {
		t.Error("absolutely-expired session must not validate — rolling refresh must never extend forever")
	}

	rec = base
	rec.ExpiresAt = now.Add(time.Hour)
	rec.AbsoluteExpiresAt = now.Add(24 * time.Hour)
	revoked := now.Add(-time.Second)
	rec.RevokedAt = &revoked
	if rec.Active(now) {
		t.Error("revoked session must not validate")
	}
}
