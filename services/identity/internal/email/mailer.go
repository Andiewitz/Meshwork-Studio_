// Package email sends transactional auth emails. Without SMTP configuration
// (development) messages are logged instead — never silently dropped.
package email

import (
	"crypto/tls"
	"fmt"
	"log/slog"
	"net"
	"net/smtp"
	"strings"
	"time"
)

type Mailer struct {
	host string
	port int
	user string
	pass string
	from string
	log  *slog.Logger
}

func New(host string, port int, user, pass, from string, log *slog.Logger) *Mailer {
	return &Mailer{host: host, port: port, user: user, pass: pass, from: from, log: log}
}

func (m *Mailer) Enabled() bool { return m.host != "" }

type Message struct {
	To      string
	Subject string
	Text    string
}

// Send delivers the message over SMTP+STARTTLS. In development (no host) it
// logs the full body so flows remain testable end-to-end.
func (m *Mailer) Send(msg Message) error {
	if !m.Enabled() {
		m.log.Info("email (dev console transport)",
			"to", msg.To, "subject", msg.Subject, "body", msg.Text)
		return nil
	}
	addr := fmt.Sprintf("%s:%d", m.host, m.port)
	headers := map[string]string{
		"From": m.from,
		"To":   msg.To,
		"Subject": strings.Map(func(r rune) rune {
			if r == '\r' || r == '\n' {
				return -1
			}
			return r
		}, msg.Subject),
		"MIME-Version": "1.0",
		"Content-Type": `text/plain; charset="utf-8"`,
	}
	var b strings.Builder
	for k, v := range headers {
		fmt.Fprintf(&b, "%s: %s\r\n", k, v)
	}
	b.WriteString("\r\n" + msg.Text)

	dialer := &net.Dialer{Timeout: 10 * time.Second}
	conn, err := tls.DialWithDialer(
		dialer,
		"tcp", addr,
		&tls.Config{ServerName: m.host},
	)
	if err != nil {
		// Fall back to plain + STARTTLS for relays without implicit TLS.
		return m.sendSTARTTLS(addr, b.String())
	}
	defer conn.Close()
	client, err := smtp.NewClient(conn, m.host)
	if err != nil {
		return err
	}
	defer client.Close()
	return m.deliver(client, msg.To, b.String())
}

func (m *Mailer) sendSTARTTLS(addr, body string) error {
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return err
	}
	defer conn.Close()
	client, err := smtp.NewClient(conn, m.host)
	if err != nil {
		return err
	}
	defer client.Close()
	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{ServerName: m.host}); err != nil {
			return fmt.Errorf("starttls: %w", err)
		}
	}
	return m.deliver(client, "", body)
}

func (m *Mailer) deliver(client *smtp.Client, to, body string) error {
	var auth smtp.Auth
	if m.user != "" {
		auth = smtp.PlainAuth("", m.user, m.pass, m.host)
	}
	if auth != nil {
		if ok, _ := client.Extension("AUTH"); ok {
			if err := client.Auth(auth); err != nil {
				return fmt.Errorf("smtp auth: %w", err)
			}
		}
	}
	if err := client.Mail(m.from); err != nil {
		return err
	}
	rcpt := to
	if rcpt == "" {
		rcpt = m.from
	}
	if err := client.Rcpt(rcpt); err != nil {
		return err
	}
	w, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write([]byte(body)); err != nil {
		return err
	}
	return w.Close()
}
