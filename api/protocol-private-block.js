/** Blocks HTTP access to _protocol/* — PDF is only served via /api/protocol-pdf after cookie check. */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(403).send('Forbidden');
}
