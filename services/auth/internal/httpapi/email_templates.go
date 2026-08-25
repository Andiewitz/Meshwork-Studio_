package httpapi

import (
	"fmt"

	"github.com/meshwork-studio/auth/internal/email"
)

// Transactional email templates. Plain-text only: no HTML injection surface.

func footer() string {
	return "\n\n—\nYou received this email because of activity on your Meshwork account.\n" +
		"If this wasn't you, reset your password immediately and review your devices."
}

func EmailVerify(to, link string) email.Message {
	return email.Message{
		To:      to,
		Subject: "Verify your Meshwork email",
		Text: fmt.Sprintf("Welcome to Meshwork!\n\nConfirm your email address:\n%s\n\n"+
			"This link expires in 24 hours.", link) + footer(),
	}
}

func EmailPasswordReset(to, link string) email.Message {
	return email.Message{
		To:      to,
		Subject: "Reset your Meshwork password",
		Text: fmt.Sprintf("A password reset was requested for your account.\n\n"+
			"Reset link (valid 30 minutes):\n%s\n\n"+
			"If you didn't request this, ignore this email — your password is unchanged.", link) + footer(),
	}
}

func EmailPasswordChanged(to string) email.Message {
	return email.Message{
		To:      to,
		Subject: "Your Meshwork password was changed",
		Text: "Your password was just changed and all sessions were signed out.\n" +
			"If this wasn't you, reset your password immediately." + footer(),
	}
}

func EmailMFAEnabled(to string) email.Message {
	return email.Message{
		To:      to,
		Subject: "Two-factor authentication enabled",
		Text: "Two-factor authentication is now active on your Meshwork account.\n" +
			"Keep your backup codes somewhere safe." + footer(),
	}
}

func EmailMFADisabled(to string) email.Message {
	return email.Message{
		To:      to,
		Subject: "Two-factor authentication disabled",
		Text: "Two-factor authentication was removed from your Meshwork account.\n" +
			"If this wasn't you, reset your password immediately." + footer(),
	}
}

func EmailNewDevice(to string) email.Message {
	return email.Message{
		To:      to,
		Subject: "New device sign-in",
		Text: "Your account was just accessed from a new location or device.\n" +
			"Review your active devices in Settings → Security." + footer(),
	}
}
