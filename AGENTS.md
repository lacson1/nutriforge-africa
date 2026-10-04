# AGENTS.md

Guidance for cloud agents working in the NutriForge (`nutriforge-africa`) repository.

## Product

Single-repo nutrition web app (vanilla JS PWA + Vercel serverless API routes). Client data lives in browser `localStorage`; no database. Deploy target is Vercel.

## Cursor Cloud specific instructions

### Dependencies

- **Node.js** (v22+ in this environment) and **npm**.
- Run `npm install` from the repo root (installs Vitest only).

### Running the app (static — covers most development)

Most features work without Vercel:

```bash
npx --yes serve . -l 3000
```

- Main app: http://localhost:3000/index.html
- Landing page: http://localhost:3000/landing.html
- T2DM field guide: http://localhost:3000/t2dm-clinical-field-guide.html

Food browse/search, diary logging, profiles, goals, offline PWA, and the field guide all work on the static server.

### Running API routes locally

Serverless routes under `api/` (`/api/chat`, `/api/protocol-*`) require **Vercel CLI**:

```bash
cp .env.example .env.local
# Fill ANTHROPIC_API_KEY, PROTOCOL_COOKIE_SECRET (openssl rand -hex 32), etc.
npx vercel dev
```

`vercel dev` prompts for Vercel account login on first use (device OAuth). Without login, use the static server above for non-API work.

### Tests

```bash
npm test
```

Vitest runs 18 unit tests across `test/*.test.mjs` (meals, scoring, search, backup, foods-data).

### Lint

No ESLint/Prettier scripts are configured in `package.json`.

### Environment variables

See `.env.example`. Required only for API-backed features:

| Variable | Used for |
|---|---|
| `ANTHROPIC_API_KEY` | AI nutrition assistant (`/api/chat`) |
| `ANTHROPIC_MODEL` | Optional model override |
| `PROTOCOL_PASSPHRASE` | VAT protocol unlock (default `diet`) |
| `PROTOCOL_COOKIE_SECRET` | Signs protocol unlock cookie |

### Gotchas

- `package.json` has no `dev` script — use `serve` or `vercel dev` as above.
- `/` redirect to `landing.html` is defined in `vercel.json` and applies on Vercel; with `serve`, open `index.html` directly for the main app.
- AI chat and gated protocol PDF/HTML need `vercel dev` plus env vars; the in-app VAT summary works offline on the static server.
