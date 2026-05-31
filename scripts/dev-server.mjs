/**
 * Local dev server — mirrors vercel.json rewrites and /api/* handlers without Vercel login.
 * Loads .env.local (same as `vercel dev`).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const port = Number(process.env.PORT || 3000);

function loadEnv(file) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim();
    const existing = process.env[key];
    if (existing === undefined || existing === '') process.env[key] = val;
  }
}

loadEnv('.env.local');
loadEnv('.env');

const apiRoutes = {
  '/api/protocol-session': () => import('../api/protocol-session.js'),
  '/api/protocol-private-block': () => import('../api/protocol-private-block.js'),
  '/api/protocol-pdf': () => import('../api/protocol-pdf.js'),
  '/api/protocol-guide': () => import('../api/protocol-guide.js'),
  '/api/chat': () => import('../api/chat.js'),
};

const rewrites = [
  { match: (p) => p.startsWith('/_protocol/'), api: '/api/protocol-private-block' },
  { match: (p) => p === '/protocol/vat-protocol.pdf', api: '/api/protocol-pdf' },
  {
    match: (p) => p === '/protocol/index.html' || p === '/protocol/' || p === '/protocol',
    api: '/api/protocol-guide',
  },
];

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
};

function createRes(res) {
  let statusCode = 200;
  const headers = {};
  const api = {
    setHeader(k, v) {
      headers[k.toLowerCase()] = v;
      return api;
    },
    status(code) {
      statusCode = code;
      return api;
    },
    json(obj) {
      headers['content-type'] = 'application/json; charset=utf-8';
      const body = JSON.stringify(obj);
      res.writeHead(statusCode, headers);
      res.end(body);
    },
    send(text) {
      if (!headers['content-type']) headers['content-type'] = 'text/plain; charset=utf-8';
      res.writeHead(statusCode, headers);
      res.end(text);
    },
    end() {
      res.writeHead(statusCode, headers);
      res.end();
    },
  };
  return api;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return undefined;
  const ct = req.headers['content-type'] || '';
  if (ct.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

async function invokeApi(apiPath, req, res) {
  const loader = apiRoutes[apiPath];
  if (!loader) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const mod = await loader();
  const handler = mod.default;
  const body = await readBody(req);
  const vercelReq = {
    method: req.method,
    headers: req.headers,
    body,
  };
  await handler(vercelReq, createRes(res));
}

function serveStatic(urlPath, res) {
  if (urlPath === '/') {
    res.writeHead(302, { location: '/landing.html' });
    res.end();
    return;
  }
  const rel = decodeURIComponent(urlPath.split('?')[0]);
  const filePath = path.join(root, rel.replace(/^\//, ''));
  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = new URL(req.url || '/', `http://localhost:${port}`).pathname;

    if (urlPath.startsWith('/api/')) {
      await invokeApi(urlPath, req, res);
      return;
    }

    for (const rw of rewrites) {
      if (rw.match(urlPath)) {
        await invokeApi(rw.api, req, res);
        return;
      }
    }

    serveStatic(urlPath, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
    }
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`NutriForge dev server → http://localhost:${port}`);
  console.log(`  Landing: http://localhost:${port}/landing.html`);
  console.log(`  App:     http://localhost:${port}/index.html`);
});
