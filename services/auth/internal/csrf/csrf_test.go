package csrf

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAllowlistExactMatchOnly(t *testing.T) {
	allow := NewAllowlist("https://app.example.com", []string{"https://extra.example.com"})

	cases := []struct {
		origin string
		want   bool
	}{
		{"https://app.example.com", true},
		{"https://app.example.com/", true}, // trailing slash tolerated
		{"https://extra.example.com", true},
		// The bypass class this test exists to lock out:
		{"https://app.example.com.evil.io", false},
		{"https://evil-app.example.com", false},
		{"https://meshwork.evil.io", false},
		{"http://app.example.com", false}, // scheme downgrade
		{"null", false},
		{"", false},
	}
	for _, tc := range cases {
		if got := allow.Contains(tc.origin); got != tc.want {
			t.Errorf("Contains(%q) = %v, want %v", tc.origin, got, tc.want)
		}
	}
}

func TestOriginAllowedSelfOrigin(t *testing.T) {
	req := httptest.NewRequest("POST", "https://api.example.com/api/v1/auth/login", nil)
	req.Host = "api.example.com"
	req.Header.Set("Origin", "https://api.example.com")
	allow := NewAllowlist("", nil)
	if !OriginAllowed(req, allow) {
		t.Error("same-origin request must pass")
	}
}

func TestOriginAllowedCrossOriginRejected(t *testing.T) {
	req := httptest.NewRequest("POST", "https://api.example.com/x", nil)
	req.Host = "api.example.com"
	req.Header.Set("Origin", "https://attacker.example.net")
	allow := NewAllowlist("", nil)
	if OriginAllowed(req, allow) {
		t.Error("cross-origin request must be rejected")
	}
}

func TestOriginAllowedFailClosedForCookieBearerWithoutOrigin(t *testing.T) {
	req := httptest.NewRequest("POST", "https://api.example.com/x", nil)
	req.Host = "api.example.com"
	req.AddCookie(&http.Cookie{Name: "meshwork_session", Value: "tokentokentokentokentoken"})
	req.Header.Set("Sec-Fetch-Site", "same-site")
	allow := NewAllowlist("", nil)
	if OriginAllowed(req, allow) {
		t.Error("cookie-bearing mutation without Origin must fail closed")
	}
}

func TestOriginAllowedPlainAPIClientWithoutCookies(t *testing.T) {
	req := httptest.NewRequest("POST", "https://api.example.com/x", nil)
	req.Host = "api.example.com"
	req.Header.Del("Sec-Fetch-Site")
	allow := NewAllowlist("", nil)
	if !OriginAllowed(req, allow) {
		t.Error("non-browser API client (no cookies) must not be blocked")
	}
}
