/**
 * Streams VAT protocol PDF after cookie check.
 * File: _protocol/vat-protocol.pdf (not exposed as a static route; use rewrite /protocol/vat-protocol.pdf → this handler).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  PROTOCOL_COOKIE_NAME,
  parseCookie,
  verifyProtocolCookie,
} from '../lib/protocol-token.js';

function pdfPath() {
  return path.join(process.cwd(), '_protocol', 'vat-protocol.pdf');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const secret = process.env.PROTOCOL_COOKIE_SECRET;
  if (!secret) {
    return res.status(503).send('Protocol gate not configured.');
  }

  const raw = parseCookie(req.headers.cookie, PROTOCOL_COOKIE_NAME);
  if (!verifyProtocolCookie(raw, secret)) {
    return res.status(403).send('Forbidden');
  }

  const file = pdfPath();
  if (!fs.existsSync(file)) {
    return res.status(404).send('PDF not deployed — add _protocol/vat-protocol.pdf to this deployment.');
  }

  const stat = fs.statSync(file);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', String(stat.size));
  res.setHeader('Content-Disposition', 'inline; filename="vat-protocol.pdf"');

  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  fs.createReadStream(file).pipe(res);
}
