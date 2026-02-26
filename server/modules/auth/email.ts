import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured, emails will be logged to console");
    return null;
  }

  return { host, port, user, pass };
}

function createTransporter() {
  const config = getEmailConfig();
  if (!config) return null;

  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

/**
 * Send a verification code email
 */
export async function sendVerificationCode(email: string, code: string): Promise<void> {
  const transporter = createTransporter();

  const subject = "Your Verification Code - Meshwork Studio v1.0";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a; font-weight: bold; text-transform: uppercase;">Meshwork Studio v1.0</h2>
      <p>Your verification code is:</p>
      <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border: 2px solid #1a1a1a;">
        ${code}
      </div>
      <p style="margin-top: 20px; color: #666;">This code will expire in 10 minutes.</p>
      <p style="color: #666; font-size: 12px;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `;

  if (!transporter) {
    // Development mode: log to console
    console.log("\n========================================");
    console.log("[DEV MODE] Verification Email");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Code: ${code}`);
    console.log("========================================\n");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Meshwork Studio v1.0" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`[Email] Verification code sent to ${email}`);
  } catch (err) {
    console.error("[Email] Failed to send verification code:", err);
    throw err;
  }
}
