/**
 * Lightweight in-memory rate limiter for Vercel serverless handlers.
 * Best-effort per instance — still materially slows abuse; pair with edge/WAF for production.
 */

const buckets = new Map();

/** @param {import('http').IncomingMessage} req */
export function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim();
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * @param {string} key
 * @param {{ limit: number, windowMs: number }} opts
 * @returns {{ ok: true } | { ok: false, retryAfterSec: number }}
 */
export function checkRateLimit(key, opts) {
  const now = Date.now();
  const windowMs = Math.max(1000, opts.windowMs);
  const limit = Math.max(1, opts.limit);

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  if (bucket.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  bucket.count += 1;
  return { ok: true };
}

/** @param {import('http').ServerResponse} res */
export function sendRateLimitResponse(res, retryAfterSec) {
  res.setHeader('Retry-After', String(retryAfterSec));
  return res.status(429).json({ error: 'Too many requests. Try again later.' });
}
