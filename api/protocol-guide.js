/**
 * Gated HTML outline (full-protocol mirror lite) for /protocol and /protocol/index.html rewrites.
 */
import {
  PROTOCOL_COOKIE_NAME,
  parseCookie,
  verifyProtocolCookie,
} from '../lib/protocol-token.js';

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VAT protocol · NutriForge Africa</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:42rem;margin:0 auto;padding:1.25rem;line-height:1.55;color:#1a1a17;background:#faf9f6}
    h1{font-size:1.25rem;margin:0 0 .5rem}
    p.lead{color:#6b6860;font-size:.9rem;margin:0 0 1rem}
    .banner{border:1px solid #e8e5de;border-radius:12px;padding:.75rem 1rem;background:#fff;margin-bottom:1rem;font-size:.85rem}
    a.pdf{display:inline-block;margin:.5rem 0 1rem;font-weight:600;color:#0f2a30}
    ol{padding-left:1.1rem}
    li{margin:.35rem 0}
    section{border-top:1px solid #eceae4;padding:.75rem 0;margin-top:.5rem}
    section h2{font-size:.95rem;margin:0 0 .35rem}
    section p{margin:0;font-size:.82rem;color:#555}
  </style>
</head>
<body>
  <h1>Visceral fat loss protocol</h1>
  <p class="lead">Evidence-oriented outline aligned with NutriForge Africa food grading. This page is access-controlled; it is not medical advice.</p>
  <div class="banner"><strong>Safety:</strong> Review contraindications, medications, pregnancy, diabetes meds/insulin, renal disease, and eating-disorder history with your clinician before applying phased deficits or supplements.</div>
  <a class="pdf" href="/protocol/vat-protocol.pdf">Open full PDF</a>

  <section id="s1"><h2>1. Daily protocol summary</h2><p>Timeline for fasting window, meals, hydration, sleep prep — print-friendly fridge sheet in the PDF.</p></section>
  <section id="s2"><h2>2. General food base</h2><p>Mechanism-tiered food list (general) with evidence grades.</p></section>
  <section id="s3"><h2>3. African food base</h2><p>Mechanism-tiered African spotlight foods with transparency notes on grade C+.</p></section>
  <section id="s4"><h2>4–5. Daily timelines</h2><p>General and African daily schedules.</p></section>
  <section id="s6"><h2>6–7. Protocol rules</h2><p>General and African-specific rules (meal order, iron/tea spacing, starch retrogradation, etc.).</p></section>
  <section id="s8"><h2>8. Biomarker targets</h2><p>TG:HDL priority and related metabolic markers — interpret with labs and your clinician.</p></section>
  <section id="s9"><h2>9. Synergies &amp; pairings</h2><p>Combinations referenced against pathways in the database.</p></section>
  <section id="s10"><h2>10. 7-day meal rotation</h2><p>Practical rotation templates.</p></section>
  <section id="s11"><h2>11–12. Periodisation &amp; training sync</h2><p>Three phases and training-day adjustments.</p></section>
  <section id="s13"><h2>13–14. Supplements &amp; hydration</h2><p>Stacks and fluid/psyllium cautions.</p></section>
  <section id="s15"><h2>15–18. Lifestyle &amp; logistics</h2><p>Stress/cortisol, meal prep, eating out, shopping costs.</p></section>
  <section id="s19"><h2>19. Portion guide</h2><p>Portion language mapped to practical cooking.</p></section>
  <section id="s20"><h2>20. Safety &amp; contraindications</h2><p>Must-read section in the PDF — do not skip.</p></section>

  <p style="margin-top:1.5rem;font-size:.8rem;color:#888"><a href="/index.html">← Back to NutriForge Africa</a></p>
</body>
</html>`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const secret = process.env.PROTOCOL_COOKIE_SECRET;
  if (!secret) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(503).send('Protocol gate not configured.');
  }

  const raw = parseCookie(req.headers.cookie, PROTOCOL_COOKIE_NAME);
  if (!verifyProtocolCookie(raw, secret)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(403).send('Forbidden');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (req.method === 'HEAD') return res.status(200).end();
  return res.status(200).send(PAGE);
}
