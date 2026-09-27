import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync } from 'node:fs';

/** Emits sw.js that precaches every built file, so the home-screen app works offline. */
function serviceWorker(): Plugin {
  return {
    name: 'nf-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const publicFiles = ['manifest.webmanifest', ...readdirSync('public/icons').map(f => `icons/${f}`)];
      const files = ['./', ...Object.keys(bundle), ...publicFiles].map(f => (f === './' ? f : `./${f}`));
      const version = Object.keys(bundle).filter(f => f.startsWith('assets/')).sort().join('|');
      const source = `const CACHE = 'nf-${hash(version)}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // Fresh HTML when online, cached shell when offline.
    e.respondWith(fetch(req).catch(() => caches.match('./', { ignoreSearch: true, ignoreVary: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  base: './',
  build: { assetsInlineLimit: 0 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
