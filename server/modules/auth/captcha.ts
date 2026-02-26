/**
 * CAPTCHA verification utility
 * Supports hCaptcha and reCAPTCHA
 */

interface CaptchaConfig {
  secretKey: string;
  provider: 'hcaptcha' | 'recaptcha';
}

function getCaptchaConfig(): CaptchaConfig | null {
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET;
  const recaptchaSecret = process.env.RECAPTCHA_SECRET;

  if (hcaptchaSecret) {
    return { secretKey: hcaptchaSecret, provider: 'hcaptcha' };
  }

  if (recaptchaSecret) {
    return { secretKey: recaptchaSecret, provider: 'recaptcha' };
  }

  return null;
}

/**
 * Verify a CAPTCHA token
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  const config = getCaptchaConfig();

  // If no CAPTCHA configured, skip verification (dev mode)
  if (!config) {
    console.log('[Captcha] No CAPTCHA configured, skipping verification');
    return true;
  }

  try {
    const verifyUrl = config.provider === 'hcaptcha'
      ? 'https://hcaptcha.com/siteverify'
      : 'https://www.google.com/recaptcha/api/siteverify';

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: config.secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`[Captcha] ${config.provider} verification passed`);
      return true;
    } else {
      console.error(`[Captcha] ${config.provider} verification failed:`, data['error-codes']);
      return false;
    }
  } catch (err) {
    console.error('[Captcha] Verification error:', err);
    return false;
  }
}

/**
 * Middleware to verify CAPTCHA token from request body
 */
export function captchaMiddleware(req: any, res: any, next: any) {
  const token = req.body.captchaToken;

  if (!token) {
    return res.status(400).json({ message: 'CAPTCHA token required' });
  }

  verifyCaptcha(token).then((valid) => {
    if (valid) {
      next();
    } else {
      res.status(400).json({ message: 'CAPTCHA verification failed' });
    }
  }).catch((err) => {
    console.error('[Captcha] Middleware error:', err);
    res.status(500).json({ message: 'CAPTCHA verification error' });
  });
}
