// Package csrf implements the double-submit cookie CSRF defence with a
// strict, exact-match origin allowlist. It intentionally contains no
// substring or "contains" host matching — that class of check is bypassable.
package csrf

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type SecretStore interface {
	Save(ctx context.Context, sessionIDHash, secretHash string, expiresAt time.Time) error
	Find(ctx context.Context, sessionIDHash string) (secretHash string, expiresAt time.Time, err error)
}

func hashToken(v string) string {
	sum := sha256.Sum256([]byte(v))
	return base64.RawStdEncoding.EncodeToString(sum[:])
}

// HashForLookup exposes the token hashing used for server-side binding keys.
func HashForLookup(v string) string { return hashToken(v) }

// NewSecret generates 256 bits of URL-safe entropy.
func NewSecret() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// Allowlist holds the exact origins permitted to make state-changing browser
// requests.
type Allowlist struct {
	origins map[string]struct{}
}

func NewAllowlist(publicURL string, extra []string) *Allowlist {
	a := &Allowlist{origins: make(map[string]struct{})}
	for _, o := range append([]string{publicURL}, extra...) {
		o = strings.TrimSuffix(strings.TrimSpace(o), "/")
		if o == "" {
			continue
		}
		if !strings.Contains(o, "://") {
			continue // origins must include scheme; bare hosts are rejected
		}
		if u, err := url.Parse(o); err == nil && u.Host != "" {
			a.origins[u.Scheme+"://"+u.Host] = struct{}{}
		}
	}
	return a
}

func (a *Allowlist) Contains(origin string) bool {
	_, ok := a.origins[strings.TrimSuffix(origin, "/")]
	return ok
}

// OriginAllowed applies the request-side rules:
//
//  1. An explicit Origin header must exactly match the allowlist OR the
//     request's own Host-derived origin (same-origin deployments).
//  2. Browsers always attach Origin to cross-site and same-site POSTs; a
//     mutating request WITH credentials but NO Origin and NO Referer is
//     treated as hostile (fail closed).
//  3. Non-browser clients without cookies are unaffected (they cannot be
//     CSRF'd; they authenticate explicitly).
func OriginAllowed(r *http.Request, allow *Allowlist) bool {
	origin := r.Header.Get("Origin")
	referer := r.Header.Get("Referer")

	scheme := "http"
	if r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
		scheme = "https"
	}
	selfOrigin := scheme + "://" + r.Host

	match := func(candidate string) bool {
		return candidate == selfOrigin || allow.Contains(candidate)
	}

	if origin != "" {
		return match(strings.TrimSuffix(origin, "/"))
	}
	if referer != "" {
		if u, err := url.Parse(referer); err == nil && u.Host != "" {
			return match(u.Scheme + "://" + u.Host)
		}
		return false
	}

	// No Origin and no Referer. Modern browsers send Sec-Fetch-Site on every
	// fetch/navigation; if present this IS a browser request → reject.
	if r.Header.Get("Sec-Fetch-Site") != "" {
		return false
	}
	// A cookie-bearing mutation without any origin signal is rejected too.
	if hasSessionishCookie(r) {
		return false
	}
	return true
}

func hasSessionishCookie(r *http.Request) bool {
	_, err := r.Cookie("meshwork_session")
	if err == nil {
		return true
	}
	_, err = r.Cookie("__Host-meshwork_session")
	return err == nil
}

// Verify performs the double-submit comparison plus optional server-side
// session binding. cookieToken and headerToken come from the client;
// sessionIDHash (optional) enables bound-secret verification.
func Verify(cookieToken, headerToken, sessionIDHash string, secrets SecretStore) bool {
	if cookieToken == "" || headerToken == "" || len(cookieToken) > 512 || len(headerToken) > 512 {
		return false
	}
	if subtle.ConstantTimeCompare([]byte(cookieToken), []byte(headerToken)) != 1 {
		return false
	}
	if sessionIDHash == "" || secrets == nil {
		return true // unauthenticated endpoints rely on double-submit alone
	}
	storedHash, expiresAt, err := secrets.Find(context.Background(), hashToken(sessionIDHash))
	if err != nil || expiresAt.Before(time.Now()) {
		// No bound record yet — bind this token now (first use after login).
		_ = secrets.Save(context.Background(), hashToken(sessionIDHash), hashToken(headerToken),
			time.Now().Add(time.Hour))
		return true
	}
	return subtle.ConstantTimeCompare([]byte(storedHash), []byte(hashToken(headerToken))) == 1
}

// Bind stores the secret for the session so subsequent requests verify
// against the server-side copy (defence against cookie injection).
func Bind(secrets SecretStore, sessionIDHash, secret string, ttl time.Duration) error {
	if sessionIDHash == "" || secrets == nil {
		return nil
	}
	return secrets.Save(context.Background(), hashToken(sessionIDHash), hashToken(secret), time.Now().Add(ttl))
}
