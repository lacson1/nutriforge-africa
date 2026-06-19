import { checkRateLimit, clientIp, sendRateLimitResponse } from '../lib/rate-limit.js';

/**
 * Proxies Anthropic Messages API so the browser never holds ANTHROPIC_API_KEY.
 * Set env on Vercel: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = clientIp(req);
  const burst = checkRateLimit(`chat:burst:${ip}`, { limit: 8, windowMs: 60_000 });
  if (!burst.ok) return sendRateLimitResponse(res, burst.retryAfterSec);
  const hourly = checkRateLimit(`chat:hour:${ip}`, { limit: 40, windowMs: 3_600_000 });
  if (!hourly.ok) return sendRateLimitResponse(res, hourly.retryAfterSec);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI is not configured (set ANTHROPIC_API_KEY on this deployment).',
    });
  }

  const model =
    process.env.ANTHROPIC_MODEL && String(process.env.ANTHROPIC_MODEL).trim()
      ? String(process.env.ANTHROPIC_MODEL).trim()
      : 'claude-sonnet-4-20250514';

  let body;
  try {
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body || '{}');
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else {
      body = {};
    }
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const system = typeof body.system === 'string' ? body.system.slice(0, 12000) : '';
  const messages = Array.isArray(body.messages) ? body.messages.slice(0, 24) : [];
  if (!messages.length) {
    return res.status(400).json({ error: 'messages array required' });
  }

  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) {
      return res.status(400).json({ error: 'Each message needs role user|assistant' });
    }
    if (typeof m.content !== 'string') {
      return res.status(400).json({ error: 'Each message needs string content' });
    }
    m.content = m.content.slice(0, 48000);
  }

  const maxTokens =
    typeof body.max_tokens === 'number' && body.max_tokens > 0 && body.max_tokens <= 4096
      ? Math.floor(body.max_tokens)
      : 1000;

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
    }),
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    const status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
    const clientError =
      status >= 400 && status < 500
        ? text || upstream.statusText || 'Upstream rejected the request.'
        : 'AI service is temporarily unavailable.';
    return res.status(status).json({ error: clientError });
  }

  try {
    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Invalid JSON from upstream' });
  }
}
