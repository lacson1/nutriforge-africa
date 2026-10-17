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

## Premium landing redesign — 17 October 2026

Rebuilt landing.html as an editorial split composition rather than a centred SaaS-style headline and card grid. Warm ivory, ink typography and terracotta accent; oversized Instrument Serif heading paired with DM Sans controls; one food-led hero, one primary Planner CTA, secondary Plate entry and three unboxed explanatory rows. Mobile places the CTA before the image. Reduced-motion preferences disable entrance animation. No clinical or commercial claims were introduced.

References actually opened and visually inspected:
- Cynthia Ugwudike, “Landing Page For Meal Planning Website” (Behance): https://www.behance.net/gallery/131650841/Landing-Page-For-Meal-Planning-Website — strong split hero, oversized plate imagery and a direct meal-plan action. Promotional banners and discount claims were not adopted.
- Mouad Yming, “Modern Meal Plan Landing Page UI Design” (Dribbble): https://dribbble.com/shots/27204804-Modern-Meal-Plan-Landing-Page-UI-Design — large typographic hierarchy, restrained navigation and one strong coloured action. Layout and content are original.
- Ottolenghi recipes: https://ottolenghi.co.uk/pages/recipes — sparse navigation, warm neutral ground, red accent and large food photography. Cookie/promotion overlays obscured some of the recipe page; no claim of a complete site audit.

assets/planner-table.jpg is an original AI-generated editorial food illustration, created for this preview, not copied from the references. It is labelled as an illustration and is not a nutrition or portion measurement. Converted to JPEG for web delivery.

Verified desktop and mobile first view, no horizontal overflow, image loading, no console errors, Planner CTA opening a populated editable week preview, and Plate entry opening the existing app. All 74 regression tests and AI flow script pass. Production remains unchanged.
