import crypto from 'node:crypto';

/**
 * Constant-time string equality for passphrase checks.
 * @param {string} provided
 * @param {string} expected
 */
export function safeEqualString(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    try {
      crypto.timingSafeEqual(a, a);
    } catch {
      /* ignore */
    }
    return false;
  }
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
