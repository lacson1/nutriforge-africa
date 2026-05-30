/**
 * Local dev server — mirrors vercel.json redirects/rewrites and /api/* handlers
 * without requiring `vercel login`. Load env from .env.local (see .env.example).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();
if (!process.env.PROTOCOL_COOKIE_SECRET) {
  process.env.PROTOCOL_COOKIE_SECRET = 'local-dev-protocol-secret';
}

const REWRITES = [
  [/^\/_protocol\//, '/api/protocol-private-block'],
  [/^\/protocol\/vat-protocol\.pdf$/, '/api/protocol-pdf'],
  [/^\/protocol(\/index\.html)?\/?$/, '/api/protocol-guide'],
];

const API_HANDLERS = {
  '/api/chat': () => import('../api/chat.js'),
  '/api/protocol-session': () => import('../api/protocol-session.js'),
  '/api/protocol-guide': () => import('../api/protocol-guide.js'),
  '/api/protocol-pdf': () => import('../api/protocol-pdf.js'),
  '/api/protocol-private-block': () => import('../api/protocol-private-block.js'),
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
};

function patchVercelRes(res) {
  let code = 200;
  res.status = (n) => {
    code = n;
    return res;
  };
  res.json = (obj) => {
    res.statusCode = code;
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = (data) => {
    res.statusCode = code;
    res.end(data);
    return res;
  };
  const end = res.end.bind(res);
  res.end = (...args) => {
    if (!res.headersSent) res.statusCode = code;
    return end(...args);
  };
  return res;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function resolvePathname(pathname) {
  if (pathname === '/') {
    return { redirect: '/landing.html' };
  }
  for (const [pattern, dest] of REWRITES) {
    if (pattern.test(pathname)) {
      return { api: dest };
    }
  }
  if (API_HANDLERS[pathname]) {
    return { api: pathname };
  }
  return { file: pathname };
}

function serveFile(relativePath, res) {
  const rel = relativePath.replace(/^\/+/, '');
  if (!rel || rel.includes('..')) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  let filePath = path.join(ROOT, rel);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) filePath = indexPath;
  }

  if (
    (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) &&
    !path.extname(rel)
  ) {
    const htmlPath = path.join(ROOT, rel + '.html');
    if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
      filePath = htmlPath;
    }
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!DOCTYPE html><title>404</title><h1>File not found</h1><p><a href="/landing.html">Go to landing</a></p>'
    );
    return;
  }

  const ext = path.extname(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(apiPath, req, res) {
  const loader = API_HANDLERS[apiPath];
  if (!loader) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.body = await readBody(req);
  }
  patchVercelRes(res);
  const mod = await loader();
  await mod.default(req, res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const resolved = resolvePathname(decodeURIComponent(url.pathname));

    if (resolved.redirect) {
      res.statusCode = 302;
      res.setHeader('Location', resolved.redirect);
      res.end();
      return;
    }
    if (resolved.api) {
      await handleApi(resolved.api, req, res);
      return;
    }
    serveFile(resolved.file, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NutriForge dev server running at http://localhost:${PORT}/`);
  console.log('  Extensionless HTML paths resolve automatically (e.g. /landing, /t2dm-clinical-field-guide)');
});
