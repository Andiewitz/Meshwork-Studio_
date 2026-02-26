/**
 * Production-grade CAPTCHA verification utility
 * Supports hCaptcha and reCAPTCHA with security best practices
 */

interface CaptchaConfig {
  secretKey: string;
  provider: 'hcaptcha' | 'recaptcha';
  // Score threshold for reCAPTCHA v3 (0.0 to 1.0)
  scoreThreshold?: number;
}

// Track used tokens to prevent replay attacks (in production, use Redis)
const usedTokens = new Set<string>();
const tokenTimestamps = new Map<string, number>();

// Token expiration: 5 minutes
const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

// Cleanup old tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(tokenTimestamps.entries()).forEach(([token, timestamp]) => {
    if (now - timestamp > TOKEN_EXPIRY_MS) {
      usedTokens.delete(token);
      tokenTimestamps.delete(token);
    }
  });
}, 10 * 60 * 1000);

function getCaptchaConfig(): CaptchaConfig | null {
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET;
  const recaptchaSecret = process.env.RECAPTCHA_SECRET;
  const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');

  if (hcaptchaSecret) {
    return { secretKey: hcaptchaSecret, provider: 'hcaptcha' };
  }

  if (recaptchaSecret) {
    return { secretKey: recaptchaSecret, provider: 'recaptcha', scoreThreshold };
  }

  return null;
}

interface CaptchaVerificationResult {
  success: boolean;
  error?: string;
  score?: number;
}

/**
 * Verify a CAPTCHA token with production-grade security
 */
export async function verifyCaptcha(
  token: string,
  remoteIp?: string
): Promise<CaptchaVerificationResult> {
  const config = getCaptchaConfig();

  // If no CAPTCHA configured, skip verification (dev mode only)
  if (!config) {
    console.log('[Captcha] No CAPTCHA configured, skipping verification (dev mode)');
    return { success: true };
  }

  // Validate token format (prevent injection)
  if (!token || typeof token !== 'string' || token.length < 10 || token.length > 1000) {
    console.error('[Captcha] Invalid token format');
    return { success: false, error: 'Invalid CAPTCHA token format' };
  }

  // Check for replay attacks
  if (usedTokens.has(token)) {
    console.error('[Captcha] Token reuse detected (possible replay attack)');
    return { success: false, error: 'CAPTCHA already used - please complete a new challenge' };
  }

  try {
    const verifyUrl = config.provider === 'hcaptcha'
      ? 'https://hcaptcha.com/siteverify'
      : 'https://www.google.com/recaptcha/api/siteverify';

    const bodyParams: Record<string, string> = {
      secret: config.secretKey,
      response: token,
    };

    // Include remote IP if available (helps prevent token theft/replay)
    if (remoteIp) {
      bodyParams.remoteip = remoteIp;
    }

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(bodyParams),
    });

    if (!response.ok) {
      console.error('[Captcha] Verification service error:', response.status);
      return { success: false, error: 'CAPTCHA verification service unavailable' };
    }

    const data = await response.json();

    if (data.success) {
      // For reCAPTCHA v3, check score
      if (config.provider === 'recaptcha' && data.score !== undefined) {
        const threshold = config.scoreThreshold || 0.5;
        if (data.score < threshold) {
          console.warn(`[Captcha] Score too low: ${data.score} (threshold: ${threshold})`);
          return { 
            success: false, 
            error: 'CAPTCHA verification failed - suspicious activity detected',
            score: data.score 
          };
        }
        console.log(`[Captcha] ${config.provider} passed with score: ${data.score}`);
      } else {
        console.log(`[Captcha] ${config.provider} verification passed`);
      }

      // Mark token as used (prevent replay)
      usedTokens.add(token);
      tokenTimestamps.set(token, Date.now());

      return { success: true, score: data.score };
    } else {
      const errorCodes = data['error-codes'] || [];
      console.error(`[Captcha] ${config.provider} verification failed:`, errorCodes);
      
      // Map error codes to user-friendly messages
      const errorMessage = mapErrorCodes(errorCodes, config.provider);
      return { success: false, error: errorMessage };
    }
  } catch (err) {
    console.error('[Captcha] Verification error:', err);
    return { success: false, error: 'CAPTCHA verification failed - please try again' };
  }
}

function mapErrorCodes(errorCodes: string[], provider: string): string {
  const codeMap: Record<string, string> = {
    'missing-input-secret': 'CAPTCHA configuration error',
    'invalid-input-secret': 'CAPTCHA configuration error',
    'missing-input-response': 'Please complete the CAPTCHA challenge',
    'invalid-input-response': 'CAPTCHA response invalid - please try again',
    'bad-request': 'Invalid CAPTCHA request',
    'timeout-or-duplicate': 'CAPTCHA expired - please complete a new challenge',
  };

  for (const code of errorCodes) {
    if (codeMap[code]) {
      return codeMap[code];
    }
  }

  return 'CAPTCHA verification failed - please try again';
}

/**
 * Middleware to verify CAPTCHA token from request body
 * Production-grade with proper error handling
 */
export function captchaMiddleware(req: any, res: any, next: any) {
  const token = req.body.captchaToken;
  const remoteIp = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];

  if (!token) {
    return res.status(400).json({ 
      message: 'CAPTCHA verification required - please complete the security challenge' 
    });
  }

  verifyCaptcha(token, remoteIp).then((result) => {
    if (result.success) {
      // Attach score to request for potential additional checks
      (req as any).captchaScore = result.score;
      next();
    } else {
      res.status(400).json({ 
        message: result.error || 'CAPTCHA verification failed - please try again' 
      });
    }
  }).catch((err) => {
    console.error('[Captcha] Middleware error:', err);
    res.status(500).json({ 
      message: 'CAPTCHA verification error - please try again later' 
    });
  });
}

/**
 * Skip CAPTCHA middleware for development/testing
 * Use environment variable to control
 */
export function optionalCaptchaMiddleware(req: any, res: any, next: any) {
  // In production with CAPTCHA configured, require it
  // In dev without CAPTCHA keys, skip it
  const config = getCaptchaConfig();
  
  if (!config && process.env.NODE_ENV !== 'production') {
    console.log('[Captcha] Skipping verification in dev mode (no CAPTCHA keys configured)');
    return next();
  }
  
  // Otherwise use full verification
  return captchaMiddleware(req, res, next);
}
