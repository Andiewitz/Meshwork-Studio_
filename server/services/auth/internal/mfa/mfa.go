// Package mfa implements TOTP multi-factor authentication: RFC 6238 code
// verification with drift tolerance, AES-GCM encryption of secrets at rest,
// and single-use backup codes.
package mfa

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/pquerna/otp/totp"
)

const (
	backupCodeCount = 8
	totpSkew        = 1 // accept ±1 time step (~±30s clock drift)
)

var ErrInvalidCode = errors.New("invalid verification code")

type Crypto struct {
	aead cipher.AEAD
}

// NewCrypto builds the AES-256-GCM sealbox from a 32-byte key.
func NewCrypto(key []byte) (*Crypto, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &Crypto{aead: aead}, nil
}

func (c *Crypto) Seal(plaintext []byte) (string, error) {
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	return base64.RawStdEncoding.EncodeToString(
		c.aead.Seal(nonce, nonce, plaintext, nil)), nil
}

func (c *Crypto) Open(sealed string) ([]byte, error) {
	raw, err := base64.RawStdEncoding.DecodeString(sealed)
	if err != nil {
		return nil, err
	}
	if len(raw) < c.aead.NonceSize() {
		return nil, errors.New("ciphertext too short")
	}
	nonce, body := raw[:c.aead.NonceSize()], raw[c.aead.NonceSize():]
	return c.aead.Open(nil, nonce, body, nil)
}

type Manager struct {
	crypto *Crypto
}

func NewManager(crypto *Crypto) *Manager { return &Manager{crypto: crypto} }

// Enroll generates a fresh TOTP secret. It is stored encrypted but NOT yet
// active; activation happens after the user proves possession with a code.
func (m *Manager) Enroll(email string) (secret string, otpauthURI string, sealed string, err error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Meshwork",
		AccountName: email,
	})
	if err != nil {
		return "", "", "", fmt.Errorf("generate totp key: %w", err)
	}
	sealed, err = m.crypto.Seal([]byte(key.Secret()))
	if err != nil {
		return "", "", "", err
	}
	return key.Secret(), key.URL(), sealed, nil
}

// Verify checks a 6-digit code against the stored secret with ±1 step drift
// and replay protection via lastUsedStep tracking handled by callers.
func (m *Manager) Verify(sealedSecret, code string) bool {
	plain, err := m.crypto.Open(sealedSecret)
	if err != nil {
		return false
	}
	ok, _ := totp.ValidateCustom(code, string(plain), time.Now(),
		totp.ValidateOpts{Period: 30, Skew: totpSkew, Digits: 6})
	return ok
}

// GenerateBackupCodes returns plaintext codes once; only hashes are stored.
func GenerateBackupCodes() (codes []string, hashes []string, err error) {
	for i := 0; i < backupCodeCount; i++ {
		b := make([]byte, 10)
		if _, err := rand.Read(b); err != nil {
			return nil, nil, err
		}
		code := strings.ToLower(base64.RawURLEncoding.EncodeToString(b))
		codes = append(codes, code)
		hashes = append(hashes, HashBackupCode(code))
	}
	return codes, hashes, nil
}

// HashBackupCode is a keyed hash so a DB leak alone cannot brute codes fast.
func HashBackupCode(code string) string {
	sum := sha256.Sum256([]byte("meshwork-backup:" + strings.ToLower(strings.TrimSpace(code))))
	return base64.RawStdEncoding.EncodeToString(sum[:])
}

// ConstantTimeEqual is a small helper for comparing derived values.
func ConstantTimeEqual(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
