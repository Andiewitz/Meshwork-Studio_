package captcha

import (
	"crypto/sha256"
	"encoding/base64"
	"sync"
	"time"
)

var memSeen sync.Map

func sha256Short(v string) string {
	sum := sha256.Sum256([]byte(v))
	return base64.RawURLEncoding.EncodeToString(sum[:12])
}

// memSweep drops expired entries opportunistically; the map stays bounded by
// traffic within a 10-minute window.
func memSweep() {
	now := time.Now()
	n := 0
	memSeen.Range(func(key, expiry any) bool {
		if n > 128 { // amortise: sweep a slice each call
			return false
		}
		if t, ok := expiry.(time.Time); ok && t.Before(now) {
			memSeen.Delete(key)
		}
		n++
		return true
	})
}
