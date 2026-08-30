// Local verification of Go-issued session assertions.
//
// The auth service (server/services/auth) signs short-lived ed25519 tokens; this
// module verifies them with Node's built-in crypto. The monolith has NO
// access to auth_db — identity lives entirely behind the assertion.
//
// Wire format: v1.<base64url(payloadJSON)>.<base64url(sig)>
// payload: {sub, sid, adm, exp, kid?, eml?, nam?}

import crypto from "node:crypto";

export interface AssertionClaims {
  sub: string;
  sid: string;
  adm: boolean;
  exp: number;
  kid?: string;
  eml?: string;
  nam?: string;
}

export class Verifier {
  // kid → raw ed25519 public key (32 bytes)
  private keys = new Map<string, crypto.KeyObject>();
  public currentKid = "";

  /**
   * @param currentSeedB64 base64 of the 32-byte ed25519 seed whose PUBLIC
   *                       half the auth service currently signs with
   * @param previousSeedsB64 seeds still within their rotation window
   */
  constructor(currentSeedB64: string, previousSeedsB64: string[] = []) {
    const load = (seedB64: string): [string, crypto.KeyObject] => {
      const seed = Buffer.from(seedB64, "base64");
      if (seed.length !== 32) {
        throw new Error(
          `auth/assertion: key must be base64 of exactly 32 bytes, got ${seed.length}`,
        );
      }
      // Derive the public key from the seed via a throwaway private key.
      const priv = crypto.createPrivateKey({
        key: pkcs8ForSeed(seed),
        format: "der",
        type: "pkcs8",
      });
      const pub = crypto.createPublicKey(priv);
      // Compute kid the same way Go does: sha256(rawPublicKey32Bytes)[:4] → hex.
      // Go: hex.EncodeToString(sha256.Sum256(pub)[:4])
      // The raw public key is the last 32 bytes of the SPKI DER export.
      const spkiDer = pub.export({ format: "der", type: "spki" });
      const rawPub = spkiDer.subarray(spkiDer.length - 32);
      const kid = crypto
        .createHash("sha256")
        .update(rawPub)
        .digest("hex")
        .slice(0, 8);
      return [kid, pub];
    };

    const [kid, pub] = load(currentSeedB64);
    this.currentKid = kid;
    this.keys.set(kid, pub);
    for (const prev of previousSeedsB64) {
      if (!prev) continue;
      try {
        const [k, p] = load(prev);
        if (!this.keys.has(k)) this.keys.set(k, p);
      } catch {
        // A malformed rotation key must not prevent boot; skip it loudly.
        console.warn(`[auth] ignoring malformed previous assertion key`);
      }
    }
  }

  /** Returns claims when the token is well-formed, correctly signed and
   *  unexpired (±30s leeway). Returns null otherwise — never throws. */
  verify(
    token: string | undefined | null,
    now = new Date(),
  ): AssertionClaims | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "v1") return null;

    let payload: Buffer;
    let sig: Buffer;
    try {
      payload = Buffer.from(parts[1], "base64url");
      sig = Buffer.from(parts[2], "base64url");
    } catch {
      return null;
    }

    let claims: AssertionClaims;
    try {
      claims = JSON.parse(payload.toString("utf8")) as AssertionClaims;
    } catch {
      return null;
    }
    if (
      typeof claims.sub !== "string" ||
      typeof claims.sid !== "string" ||
      typeof claims.exp !== "number"
    ) {
      return null;
    }

    const key =
      (claims.kid && this.keys.get(claims.kid)) ||
      (claims.kid ? undefined : this.keys.get(this.currentKid));
    if (!key) return null;

    const ok = crypto.verify(null, payload, key, sig);
    if (!ok) return null;

    if (now.getTime() / 1000 > claims.exp + 30) return null; // expiry w/ leeway
    return claims;
  }
}

/**
 * Build a PKCS#8 DER wrapper around a raw ed25519 seed so Node can import
 * it. Layout follows RFC 8410:
 *   SEQUENCE { INTEGER 0, SEQ{OID 1.3.101.112}, OCTET STRING{OCTET STRING seed} }
 */
function pkcs8ForSeed(seed: Buffer): Buffer {
  const innerSeed = Buffer.concat([Buffer.from([0x04, 0x20]), seed]);
  const alg = Buffer.from([
    0x30,
    0x05,
    0x06,
    0x03,
    0x2b,
    0x65,
    0x70, // Ed25519 OID
  ]);
  const version = Buffer.from([0x02, 0x01, 0x00]); // INTEGER 0
  const body = Buffer.concat([
    version,
    alg,
    Buffer.from([0x04, innerSeed.length]),
    innerSeed,
  ]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

/** Extracts the raw 32-byte public key from an SPKI DER buffer. */
export function rawPublicFromSpki(spkiDer: Buffer): Buffer {
  return spkiDer.subarray(spkiDer.length - 32);
}
