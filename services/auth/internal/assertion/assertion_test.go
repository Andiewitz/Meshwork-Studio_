package assertion

import (
	"encoding/base64"
	"testing"
	"time"
)

func seed() string {
	return base64.StdEncoding.EncodeToString([]byte("01234567890123456789012345678901")) // 32 bytes
}

func TestSignVerifyRoundtrip(t *testing.T) {
	s, _, err := NewSigner(seed(), 5*time.Minute, nil)
	if err != nil {
		t.Fatal(err)
	}
	tok, err := s.Sign("user-1", "sessionhash", true, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	claims, err := Verify(tok, s, time.Now())
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if claims.Sub != "user-1" || claims.Sid != "sessionhash" || !claims.Adm {
		t.Errorf("claims mismatch: %+v", claims)
	}
	if claims.Kid != s.kid {
		t.Errorf("kid mismatch: %q vs %q", claims.Kid, s.kid)
	}
}

func TestExpiredTokenRejected(t *testing.T) {
	s, _, _ := NewSigner(seed(), 5*time.Minute, nil)
	tok, _ := s.Sign("u", "s", false, time.Now().Add(-10*time.Minute))
	if _, err := Verify(tok, s, time.Now()); err != ErrExpired {
		t.Fatalf("want ErrExpired, got %v", err)
	}
}

func TestClockLeewayTolerated(t *testing.T) {
	s, _, _ := NewSigner(seed(), 5*time.Minute, nil)
	tok, _ := s.Sign("u", "s", false, time.Now().Add(-time.Minute)) // expired ~55s ago
	if _, err := Verify(tok, s, time.Now()); err != nil {
		t.Fatalf("±30s leeway should accept near-expiry: %v", err)
	}
}

func TestTamperedPayloadRejected(t *testing.T) {
	s, _, _ := NewSigner(seed(), 5*time.Minute, nil)
	tok, _ := s.Sign("u", "s", false, time.Now())
	tampered := tok[:len(tok)-4] + "AAAA"
	if _, err := Verify(tampered, s, time.Now()); err == nil {
		t.Fatal("tampered token must not verify")
	}
}

func TestWrongKeyRejected(t *testing.T) {
	s1, _, _ := NewSigner(seed(), 5*time.Minute, nil)
	otherSeed := base64.StdEncoding.EncodeToString([]byte("abcdefghabcdefghabcdefghabcdefgh"))
	s2, _, _ := NewSigner(otherSeed, 5*time.Minute, nil)

	tok, _ := s1.Sign("u", "s", false, time.Now())
	if _, err := Verify(tok, s2, time.Now()); err == nil {
		t.Fatal("token from a different key must not verify")
	}
}

func TestRotationKeyStillAccepted(t *testing.T) {
	oldSeed := seed()
	old, _, _ := NewSigner(oldSeed, 5*time.Minute, nil)
	oldTok, _ := old.Sign("u", "s", false, time.Now())

	current, _, _ := NewSigner(
		base64.StdEncoding.EncodeToString([]byte("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")),
		5*time.Minute,
		[]string{oldSeed}, // previous key accepted for verification
	)
	claims, err := Verify(oldTok, current, time.Now())
	if err != nil {
		t.Fatalf("rotation window must accept old-kid tokens: %v", err)
	}
	if claims.Kid != old.KeyID() || claims.Kid == current.KeyID() {
		t.Fatalf("kid should identify the OLD key during rotation: %q", claims.Kid)
	}
}

func TestRotationUnknownKidRejected(t *testing.T) {
	unknownSeed := base64.StdEncoding.EncodeToString([]byte("YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"))
	stranger, _, _ := NewSigner(unknownSeed, 5*time.Minute, nil)
	strangerTok, _ := stranger.Sign("u", "attacker-session", true, time.Now())

	current, _, _ := NewSigner(seed(), 5*time.Minute, nil)
	if _, err := Verify(strangerTok, current, time.Now()); err == nil {
		t.Fatal("unknown kid must never verify")
	}
}
