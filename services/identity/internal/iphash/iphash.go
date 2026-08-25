// Package iphash pseudonymises IP addresses with keyed HMAC-SHA256 so the
// stored value cannot be reversed without the server-side rotation key.
package iphash

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
)

type Hasher struct {
	key []byte
}

func New(key []byte) *Hasher {
	return &Hasher{key: key}
}

// Hash returns a stable, key-derived pseudonym for an IP address.
func (h *Hasher) Hash(ip string) string {
	mac := hmac.New(sha256.New, h.key)
	mac.Write([]byte(ip))
	return base64.RawStdEncoding.EncodeToString(mac.Sum(nil))
}
