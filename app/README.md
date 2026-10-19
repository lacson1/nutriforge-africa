# NutriForge Mobile

Built from the Claude Design handoff [`design/nutriforge-mobile/project/NutriForge Mobile.html`](../design/nutriforge-mobile/project/), a phone build of `NutriForge Onboarding Flow.dc.html`. It is an installable, offline-capable web app (PWA) in React, TypeScript and Vite.

**Flow:** Welcome → 4 onboarding steps (condition, medicines + metformin frequency, kitchen, situation + name) → All set → app with four tabs: **Check** (search, "From your kitchen" list, food detail with Save), **Saved**, **Medicines** (per-drug alerts by severity) and **Me** (summary, change answers, restart).

On phones (< 520 px wide) it runs full screen and respects the safe areas. On wider screens it shows the design's phone frame and the prototype jump panel.

## Run

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # logic + full-flow tests (Vitest, Testing Library)
npm run build      # static site in dist/, with service worker
npm run preview    # serve dist/ to try install/offline
```

Deploy `dist/` to any static host over HTTPS. The app uses relative paths, so it also works from a subfolder. On iPhone, open it in Safari, tap Share, then **Add to Home Screen**. After the first visit it works offline, and the heading font (Google Fonts) is cached by the service worker on first use.

URL options (these replace the design's tweak props):
- `?start=app` skips onboarding with the sample patient (Adaeze, T2D, metformin twice a day, Nigerian + Ghanaian).
- `?plate=0` hides the plate diagram on food detail.

Answers and saved foods are kept in `localStorage`. **Restart prototype** in Me clears them.

## Code map

- `src/data.ts` holds all content: foods, verdict buckets, evidence tiers, conditions, medicines, situations, alerts.
- `src/state.ts` has the reducer, step rules and derived views (kitchen ordering, search, interaction warnings, situation tips, summary) and persistence.
- `src/components/` has `Onboarding.tsx` (welcome + steps) and `AppTabs.tsx` (tabs, food detail), plus small shared pieces.
- `src/styles.css` has the design's inline styles as classes, with the same values and tokens.
- `scripts/icons.mjs` re-renders the PNG app icon from `public/icons/icon.svg`.

## Before real patients use it

All clinical content (verdicts, portions, warnings, sources) is **placeholder copy from the design**. A clinician must sign it off first; the Clinical Review and Test Pack in `design/nutriforge-mobile/project/` lists every claim. High blood pressure and high cholesterol stay "Coming soon", as in the design.
