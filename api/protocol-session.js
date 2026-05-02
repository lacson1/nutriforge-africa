/**
 * POST { passphrase } → sets HttpOnly cookie for /protocol access.
 * Env: PROTOCOL_PASSPHRASE, PROTOCOL_COOKIE_SECRET (required on server).
 */
import {
  PROTOCOL_COOKIE_NAME,
  signProtocolCookie,
} from '../lib/protocol-token.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pass = process.env.PROTOCOL_PASSPHRASE;
  const secret = process.env.PROTOCOL_COOKIE_SECRET;
  if (!pass || !secret) {
    return res.status(503).json({
      error: 'Protocol access is not configured (missing PROTOCOL_PASSPHRASE or PROTOCOL_COOKIE_SECRET).',
    });
  }

  let body = {};
  try {
    if (typeof req.body === 'string') body = JSON.parse(req.body || '{}');
    else if (req.body && typeof req.body === 'object') body = req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const phrase =
    typeof body.passphrase === 'string' ? body.passphrase : typeof body.password === 'string' ? body.password : '';

  if (!phrase || phrase !== pass) {
    return res.status(401).json({ error: 'Incorrect passphrase.' });
  }

  const token = signProtocolCookie(secret);
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const cookieParts = [
    `${PROTOCOL_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];
  if (secure) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
  return res.status(200).json({ ok: true });
}
