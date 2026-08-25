package password

import (
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestHashAndVerifyArgon2id(t *testing.T) {
	hash, err := Hash("correct horse battery staple")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if !strings.HasPrefix(hash, "$argon2id$") {
		t.Fatalf("expected argon2id prefix, got %s", hash[:12])
	}
	ok, err := Verify("correct horse battery staple", hash)
	if err != nil || !ok {
		t.Fatalf("verify correct: ok=%v err=%v", ok, err)
	}
	ok, _ = Verify("wrong password", hash)
	if ok {
		t.Fatal("verify wrong password succeeded")
	}
}

func TestVerifyLegacyBcrypt(t *testing.T) {
	legacy, err := bcrypt.GenerateFromPassword([]byte("old-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}
	ok, err := Verify("old-password", string(legacy))
	if err != nil || !ok {
		t.Fatalf("legacy verify: ok=%v err=%v", ok, err)
	}
	ok, _ = Verify("not-the-password", string(legacy))
	if ok {
		t.Fatal("legacy verify should fail for wrong password")
	}
}

func TestNeedsRehash(t *testing.T) {
	argon, _ := Hash("x")
	if NeedsRehash(argon) {
		t.Error("fresh argon2id hash must not need rehash")
	}
	bc, _ := bcrypt.GenerateFromPassword([]byte("x"), bcrypt.DefaultCost)
	if !NeedsRehash(string(bc)) {
		t.Error("bcrypt hash must need rehash")
	}
	if !NeedsRehash("$argon2id$v=19$m=1024,t=1,p=1$c2FsdA$aGFzaA") {
		t.Error("weak-param argon2id must need rehash")
	}
}

func TestVerifyDummyAlwaysWorks(t *testing.T) {
	// The dummy hash is a real hash; verification must succeed silently.
	VerifyDummy("anything")
}

func TestKeyedHashDomainSeparation(t *testing.T) {
	a := KeyedHash("purpose-a", "value")
	b := KeyedHash("purpose-b", "value")
	if a == b {
		t.Error("different domains must produce different hashes")
	}
	if a != KeyedHash("purpose-a", "value") {
		t.Error("same domain+value must be stable")
	}
}

// BenchmarkVerify documents the intentional cost (~50ms) of one login.
func BenchmarkVerify(b *testing.B) {
	hash, _ := Hash("benchmark-password")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = Verify("benchmark-password", hash)
	}
}
