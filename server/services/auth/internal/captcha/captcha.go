// Package captcha verifies hCaptcha/reCAPTCHA tokens server-side. Replay
// protection uses Redis when available (multi-instance safe) with a
// best-effort in-memory fallback.
package captcha

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type Provider string

const (
	HCaptcha  Provider = "hcaptcha"
	ReCAPTCHA Provider = "recaptcha"
)

type Verifier struct {
	secret   string
	provider Provider
	minScore float64
	rdb      redis.UniversalClient
	client   *http.Client
}

func New(secret string, provider Provider, minScore float64, rdb redis.UniversalClient) *Verifier {
	return &Verifier{
		secret:   secret,
		provider: provider,
		minScore: minScore,
		rdb:      rdb,
		client:   &http.Client{Timeout: 5 * time.Second},
	}
}

func (v *Verifier) Enabled() bool { return v.secret != "" }

// Verify validates the token and enforces single-use semantics.
func (v *Verifier) Verify(ctx context.Context, token, remoteIP string) error {
	if !v.Enabled() {
		return nil
	}
	if len(token) < 10 || len(token) > 2000 {
		return fmt.Errorf("malformed captcha token")
	}
	if v.seenBefore(ctx, token) {
		return fmt.Errorf("captcha token replay")
	}

	form := url.Values{"secret": {v.secret}, "response": {token}}
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}
	endpoint := "https://www.google.com/recaptcha/api/siteverify"
	if v.provider == HCaptcha {
		endpoint = "https://api.hcaptcha.com/siteverify"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint,
		strings.NewReader(form.Encode()))
	if err != nil {
		return fmt.Errorf("build verify request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := v.client.Do(req)
	if err != nil {
		return fmt.Errorf("captcha service unreachable")
	}
	defer func() { _ = resp.Body.Close() }() // Read-only response cleanup cannot affect verification.

	var result struct {
		Success bool     `json:"success"`
		Score   *float64 `json:"score"`
		Codes   []string `json:"error-codes"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("captcha response unreadable")
	}
	if !result.Success {
		return fmt.Errorf("captcha verification failed")
	}
	if result.Score != nil && *result.Score < v.minScore {
		return fmt.Errorf("captcha score too low")
	}
	v.markUsed(ctx, token)
	return nil
}

func (v *Verifier) seenBefore(ctx context.Context, token string) bool {
	key := "captcha:used:" + sha256Short(token)
	if v.rdb != nil {
		ok, err := v.rdb.SetNX(ctx, key, "1", 10*time.Minute).Result()
		if err == nil {
			return !ok // SetNX false → existed → seen before
		}
		// Redis down: fall through to memory; verification continues.
	}
	_, exists := memSeen.LoadOrStore(key, time.Now().Add(10*time.Minute))
	if exists {
		return true
	}
	memSweep()
	return false
}

func (v *Verifier) markUsed(_ context.Context, token string) {
	// With Redis, markUsed already happened atomically in seenBefore.
	if v.rdb != nil {
		return
	}
	_ = token
}
