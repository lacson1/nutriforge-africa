import crypto from 'node:crypto';

export const PROTOCOL_COOKIE_NAME = 'nf_protocol';

/** @param {string} secret */
export function signProtocolCookie(secret) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const expStr = String(exp);
  const sig = crypto.createHmac('sha256', secret).update(expStr).digest('hex');
  return `${expStr}.${sig}`;
}

/**
 * @param {string | undefined} token
 * @param {string} secret
 */
export function verifyProtocolCookie(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = crypto.createHmac('sha256', secret).update(expStr).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/** @param {string | undefined} cookieHeader */
export function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('=').trim());
  }
  return null;
}
