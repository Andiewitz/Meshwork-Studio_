package password

import (
	"context"
	"crypto/sha1" // #nosec G505 -- HIBP's range protocol requires SHA-1; passwords are stored with Argon2id.
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// KeyedHash is the domain-separated SHA-256 used for one-time token and
// backup-code lookups. Domain separation prevents cross-purpose replay if a
// hash ever leaks from another table.
func KeyedHash(domain, v string) string {
	sum := sha256.Sum256([]byte(domain + ":" + v))
	return base64.RawStdEncoding.EncodeToString(sum[:])
}

// Breached checks the password against the HaveIBeenPwned Pwned Passwords
// corpus using k-anonymity: only a 5-char SHA-1 prefix leaves this process,
// never the password itself. On network failure we fail OPEN (availability)
// and let rate limiting carry the risk.
func Breached(plain string) (bool, error) {
	sum := sha1.Sum([]byte(plain)) // #nosec G401 -- HIBP lookup fingerprint, never a password-storage hash.
	hex := strings.ToUpper(fmt.Sprintf("%x", sum))
	prefix, suffix := hex[:5], hex[5:]

	client := &http.Client{Timeout: 1500 * time.Millisecond}
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet,
		"https://api.pwnedpasswords.com/range/"+prefix, nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Add-Padding", "true")
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer func() { _ = resp.Body.Close() }() // Read-only lookup; no pending writes to flush.
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("hibp status %d", resp.StatusCode)
	}
	buf := make([]byte, 0, 64*1024)
	chunk := make([]byte, 4096)
	for {
		n, err := resp.Body.Read(chunk)
		if n > 0 {
			buf = append(buf, chunk[:n]...)
			if len(buf) > 8<<20 { // hard cap ~8 MiB
				break
			}
		}
		if err != nil {
			break
		}
	}
	for _, line := range strings.Split(string(buf), "\n") {
		line = strings.TrimSpace(line)
		if idx := strings.IndexByte(line, ':'); idx > 0 && line[:idx] == suffix {
			return true, nil
		}
	}
	return false, nil
}

var _ = sha1.Size
