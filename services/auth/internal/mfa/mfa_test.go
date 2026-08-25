package mfa

import "testing"

func TestSealOpenRoundtrip(t *testing.T) {
	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i)
	}
	c, err := NewCrypto(key)
	if err != nil {
		t.Fatal(err)
	}
	secrets := []string{"JBSWY3DPEHPK3PXP", "another-secret-with-dashes"}
	for _, s := range secrets {
		sealed, err := c.Seal([]byte(s))
		if err != nil {
			t.Fatalf("seal: %v", err)
		}
		opened, err := c.Open(sealed)
		if err != nil || string(opened) != s {
			t.Fatalf("roundtrip mismatch: %q vs %q (err=%v)", opened, s, err)
		}
	}
}

func TestSealIsNonDeterministic(t *testing.T) {
	key := make([]byte, 32)
	c, _ := NewCrypto(key)
	a, _ := c.Seal([]byte("same-plain"))
	b, _ := c.Seal([]byte("same-plain"))
	if a == b {
		t.Error("AES-GCM nonce reuse detected — sealed outputs must differ")
	}
}

func TestBackupCodesUniqueAndHashed(t *testing.T) {
	codes, hashes, err := GenerateBackupCodes()
	if err != nil {
		t.Fatal(err)
	}
	if len(codes) != backupCodeCount || len(hashes) != len(codes) {
		t.Fatalf("expected %d codes", backupCodeCount)
	}
	set := map[string]bool{}
	for i, c := range codes {
		if set[c] {
			t.Error("duplicate backup code generated")
		}
		set[c] = true
		if HashBackupCode(c) != hashes[i] {
			t.Error("hash does not match code")
		}
	}
}

func TestHashBackupCodeNormalizes(t *testing.T) {
	if HashBackupCode("ABC") != HashBackupCode("abc") {
		t.Error("backup code hashing must be case-insensitive")
	}
	if HashBackupCode("") == HashBackupCode("x") {
		t.Error("empty input must hash distinctly")
	}
}

func TestEnrollProducesVerifiableSecret(t *testing.T) {
	key := make([]byte, 32)
	c, _ := NewCrypto(key)
	m := NewManager(c)
	secret, uri, sealed, err := m.Enroll("user@example.com")
	if err != nil {
		t.Fatal(err)
	}
	if len(secret) < 16 {
		t.Fatal("secret implausibly short")
	}
	if uri[:8] != "otpauth:" {
		t.Fatalf("unexpected URI scheme: %s", uri[:8])
	}
	code, err := totpNow(secret)
	if err != nil {
		t.Fatal(err)
	}
	if !m.Verify(sealed, code) {
		t.Fatal("freshly generated secret must verify with current code")
	}
	if m.Verify(sealed, "000000") && code != "000000" {
		t.Log("note: '000000' happened to be valid this step")
	}
}
