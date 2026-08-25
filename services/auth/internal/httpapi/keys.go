package httpapi

import (
	"net"
	"net/http"

	"github.com/meshwork-studio/auth/internal/csrf"
	"github.com/meshwork-studio/auth/internal/session"
)

// ipKey builds the per-IP rate-limit key for a route family.
func ipKey(route string) func(*http.Request) string {
	return func(r *http.Request) string {
		return "rl:" + route + ":ip:" + clientIPFrom(r)
	}
}

// userKey builds a per-account rate-limit key (requires auth).
func userKey(route string) func(*http.Request) string {
	return func(r *http.Request) string {
		if info := authFrom(r); info != nil {
			return "rl:" + route + ":user:" + info.User.ID
		}
		return "rl:" + route + ":ip:" + clientIPFrom(r)
	}
}

var (
	_ = csrf.HashForLookup
	_ = session.ErrNotFound
	_ net.IP
)
