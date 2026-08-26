package httpapi

import (
	"net/http"
	"time"

	"github.com/meshwork-studio/auth/internal/assertion"
)

// assertionCookieName is read by the Node monolith to authenticate requests
// locally without touching auth_db.
const assertionCookieName = "meshwork_assertion"

// issueAssertion sets the short-lived signed assertion cookie alongside the
// session. Call at every point where a session is created or rotated.
func (s *Server) issueAssertion(w http.ResponseWriter, id assertion.Identity) {
	if s.assert == nil {
		return
	}
	tok, err := s.assert.Sign(id, time.Now())
	if err != nil {
		// Assertion failure must never block the primary session flow; the
		// opaque cookie alone keeps the user signed in on auth-service routes.
		s.log.Warn("assertion sign failed", "err", err)
		return
	}
	setCookie(w, s.cfg, assertionCookieName, tok, s.cfg.AssertionTTL, true)
}

// refreshAssertion re-issues the assertion when it is past half-life so a
// revoked-session staleness window stays bounded even for long-lived tabs.
func (s *Server) refreshAssertion(w http.ResponseWriter, r *http.Request) {
	if s.assert == nil {
		return
	}
	c, err := r.Cookie(assertionCookieName)
	if err != nil || c.Value == "" {
		return
	}
	claims, verr := assertion.Verify(c.Value, s.assert, time.Now())
	if verr != nil || claims.Sub != "" && claims.Sid == "" {
		return // malformed/foreign — leave alone; requireAuth handles rejection
	}
	remaining := time.Until(time.Unix(claims.Exp, 0))
	if remaining > s.cfg.AssertionTTL/2 {
		return
	}
	s.issueAssertion(w, assertion.Identity{
		UserID:        claims.Sub,
		SessionIDHash: claims.Sid,
		Admin:         claims.Adm,
		Email:         claims.Eml,
		Name:          claims.Nam,
	})
}
