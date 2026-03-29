/**
 * Typed Google Analytics event tracking service.
 *
 * Pure TypeScript module — no React imports. Safe to import from any file
 * including contexts, services, hooks, and components.
 *
 * Uses raw window.gtag (no react-ga4 wrapper) for consistency with CloudNest pattern.
 */

// ── Configuration ────────────────────────────────────────────

const GA_CONFIG = {
  measurementId: 'G-Z629QFCJ9Z',

  /**
   * Enable/disable Google Analytics.
   * Privacy-first: disabled by default.
   */
  enabled: false,

  /**
   * Track in development environment.
   * Set to true if you want to test analytics locally.
   */
  trackInDevelopment: false,

  get shouldTrack(): boolean {
    if (!this.enabled) return false;

    const isProduction = import.meta.env.MODE === 'production';
    if (!isProduction && !this.trackInDevelopment) return false;

    return true;
  },
};

// ── Event taxonomy ───────────────────────────────────────────

type CryptoEvent =
  | { name: "cipher_used"; params: { algorithm: "aes" | "des" | "triple_des" | "rabbit" | "rc4"; mode: "encrypt" | "decrypt" } }
  | { name: "cipher_failed"; params: { algorithm: "aes" | "des" | "triple_des" | "rabbit" | "rc4"; mode: "encrypt" | "decrypt"; error: string } }
  | { name: "hash_generated"; params: { algorithm: "md5" | "sha1" | "sha256" | "sha512" } }
  | { name: "hash_failed"; params: { algorithm: string; error: string } };

type RSAEvent =
  | { name: "rsa_key_generated"; params: { key_size: number } }
  | { name: "rsa_operation"; params: { operation: "encrypt" | "decrypt" } }
  | { name: "rsa_failed"; params: { operation: "encrypt" | "decrypt" | "keygen"; error: string } };

type SignatureEvent =
  | { name: "signature_operation"; params: { algorithm: "rsa_pss" | "ed25519"; operation: "sign" | "verify" } }
  | { name: "signature_failed"; params: { algorithm: string; operation: string; error: string } };

type ImageCryptoEvent =
  | { name: "image_crypto_used"; params: { mode: "encrypt" | "decrypt"; image_size_kb: number } }
  | { name: "image_crypto_failed"; params: { mode: "encrypt" | "decrypt"; error: string } };

type JWTEvent =
  | { name: "jwt_operation"; params: { operation: "sign" | "verify" } }
  | { name: "jwt_failed"; params: { operation: "sign" | "verify"; error: string } };

type UIEvent =
  | { name: "tool_switched"; params: { tool: "cipher" | "rsa" | "signature" | "hash" | "image" | "jwt" } }
  | { name: "result_copied"; params: { tool: string } }
  | { name: "theme_toggled"; params: { theme: "dark" | "light" } };

type ErrorEvent = {
  name: "error_occurred";
  params: { category: string; action: string; error: string };
};

export type AnalyticsEvent =
  | CryptoEvent
  | RSAEvent
  | SignatureEvent
  | ImageCryptoEvent
  | JWTEvent
  | UIEvent
  | ErrorEvent;

// ── Core tracking function ───────────────────────────────────

/**
 * Send a typed analytics event to Google Analytics.
 * No-ops gracefully when gtag is unavailable (SSR, ad blockers) or tracking is disabled.
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!GA_CONFIG.shouldTrack) return;
  if (typeof window === "undefined" || !window.gtag) return;

  const { name, ...rest } = event;
  const params = "params" in rest ? rest.params : undefined;
  window.gtag("event", name, params);
}

// ── Helpers ──────────────────────────────────────────────────

const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.\w+/g;

/**
 * Strip email addresses from error messages to prevent PII leakage.
 * Accepts unknown (catch variable) or string.
 * Truncates to 100 characters.
 */
export function sanitizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(EMAIL_PATTERN, "[email]").slice(0, 100);
}

/**
 * Map internal Algorithm type (AES, DES, TripleDES, Rabbit, RC4) to GA-friendly lowercase value.
 */
export function toCipherAlgorithmParam(
  algorithm: string
): "aes" | "des" | "triple_des" | "rabbit" | "rc4" {
  const map: Record<string, "aes" | "des" | "triple_des" | "rabbit" | "rc4"> = {
    AES: "aes",
    DES: "des",
    TripleDES: "triple_des",
    Rabbit: "rabbit",
    RC4: "rc4",
    RC4Drop: "rc4",
  };
  return map[algorithm] ?? "aes";
}

/**
 * Map internal HashAlgorithm type (SHA-256, SHA-512, SHA-1, MD5) to GA-friendly lowercase value.
 */
export function toHashAlgorithmParam(
  algorithm: string
): "md5" | "sha1" | "sha256" | "sha512" {
  const map: Record<string, "md5" | "sha1" | "sha256" | "sha512"> = {
    "SHA-256": "sha256",
    "SHA-512": "sha512",
    "SHA-1": "sha1",
    "MD5": "md5",
  };
  return map[algorithm] ?? "sha256";
}
