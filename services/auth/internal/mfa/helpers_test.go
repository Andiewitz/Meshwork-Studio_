package mfa

import (
	"time"

	"github.com/pquerna/otp/totp"
)

// totpNow computes the current valid code for a base32 secret — used by
// tests to simulate an authenticator app.
func totpNow(secret string) (string, error) {
	return totp.GenerateCode(secret, time.Now())
}
