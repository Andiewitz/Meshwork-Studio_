package httpapi

import (
	"context"
	"net/http"

	"github.com/meshwork-studio/auth/internal/audit"
	"github.com/meshwork-studio/auth/internal/store"
)

// consumeBackupCode marks a backup code used; returns 1 when valid.
func (s *Server) consumeBackupCode(ctx context.Context, userID, codeHash string) (int64, error) {
	return s.db.ConsumeBackupCode(ctx, userID, codeHash)
}

// notifyNewDeviceIfUnseen emails the user when the pseudonymised login IP
// differs from their previous successful login.
func (s *Server) notifyNewDeviceIfUnseen(r *http.Request, user *store.User) {
	ip := clientIPFrom(r)
	if ip == "" {
		return
	}
	ipHash := s.ipHasher.Hash(ip)
	_, changed, err := s.db.TouchLastLogin(context.Background(), user.ID, ipHash)
	if err != nil || !changed {
		return
	}
	s.auditor.Record(s.auditEntry(r, user.ID, user.Email, audit.NewDeviceLogin))
	go s.sendEmail(EmailNewDevice(user.Email))
}
