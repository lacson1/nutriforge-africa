# Planner journey preview

Branch: codex/planner-led-preview, based on production main 48176e6 (PR 39). Local review only; no deployment or billing changes.

## Direction
One Planner offer, with Plate and swaps as a free introduction. Busy households cooking familiar African foods are the audience hypothesis. UK-first is an unvalidated positioning assumption, not market research; the UI makes no demand, savings or clinical-outcome claims. Learn and Pro have not been introduced as products.

## Working flow
Open landing.html → Preview my week → review meals → adjust household size → preview combined ingredients → Save week on this device. The app also offers Plate → swaps → Plan this plate, and Reuse last week keeps occupied target slots. Diary and existing clinical tools remain available through More.

The planner still uses existing food records and recipe/yield estimates. It does not optimise costs or cooking times. Portions are equal per household member for shopping calculations; users can adjust individual meal portions. Suggestions are starting ideas, not a complete personalised diet.

## Saving and measurement
No account or checkout was added. Existing local-storage keys and saved plates are retained. Weekly plans and household shopping settings now participate in the existing backup/restore flow. Usage counts are opt-in, local only, and excluded from backups: explicit plate-to-planner actions, week previews, week saves, complete weeks saved, and return days. These are event counts, not unique people, purchases, conversion rates or production analytics. Disabling clears the local counters.

## Validation
74 unit/regression tests plus the AI flow regression script pass. Desktop and 390 × 844 browser checks verified landing entry, editable draft, household scaling, saving 21 meals, persistence on reload, previous-week preview, Plate-to-planner saving and swap recommendations. No relevant browser console errors. Preview origin has sample test meals; production data was untouched. Backend AI and protected documents were not tested on this static local server.

Run from this checkout: python3 -m http.server 8774 --bind 127.0.0.1
Review: http://127.0.0.1:8774/landing.html
