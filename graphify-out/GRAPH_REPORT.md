# Graph Report - nutriforge-africa  (2026-10-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 318 nodes · 475 edges · 40 communities (21 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d257fcaa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- planner-ui.js
- test-ai-flow.cjs
- planner-journey.js
- vitest
- meals-core.test.mjs
- api-integration.test.mjs
- plate-exploration.js
- reconcile-dishes.mjs
- swaps-ui.js
- search-core.js
- backup-core.mjs
- week-builder.js
- manifest.json
- combinations.js
- ref_node_vm
- planner-core.js
- swaps-core.js
- package.json
- landing-nutrition.test.mjs
- guide-bridge.js
- evidence-audit.js
- ingredient-shopping.test.mjs
- swaps.test.mjs
- c
- filter-core.test.mjs
- drawer-dismissal.test.mjs
- evidence-audit.test.mjs
- plate-exploration.test.mjs
- today-summary.test.mjs
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `vitest` - 26 edges
2. `renderPlanner()` - 8 edges
3. `renderPlannerShopping()` - 8 edges
4. `plannerShoppingChecks()` - 7 edges
5. `plannerShoppingOptions()` - 7 edges
6. `plannerShoppingRows()` - 7 edges
7. `plannerShoppingShareText()` - 7 edges
8. `renderSwapResults()` - 7 edges
9. `plannerDayLabel()` - 6 edges
10. `renderDishOrbit()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --calls--> `signProtocolCookie()`  [EXTRACTED]
  api/protocol-session.js → lib/protocol-token.js
- `initWelcome()` --indirect_call--> `previewPlannerWeek()`  [INFERRED]
  js/welcome.js → js/planner-journey.js
- `getVisibleFoods()` --indirect_call--> `foodMatchesSearch()`  [INFERRED]
  js/filter-core.js → js/search-core.js
- `getVisibleFoods()` --indirect_call--> `foodSearchRelevance()`  [INFERRED]
  js/filter-core.js → js/search-core.js

## Import Cycles
- None detected.

## Communities (40 total, 19 thin omitted)

### Community 0 - "planner-ui.js"
Cohesion: 0.19
Nodes (25): buildPlannerDrawer(), changePlannerWeek(), changeShoppingOptions(), choosePlannerSlot(), downloadPlannerShopping(), loadWeeklyPlan(), plannerDayLabel(), plannerShoppingChecks() (+17 more)

### Community 1 - "test-ai-flow.cjs"
Cohesion: 0.08
Nodes (10): assert, c, els, fs, html, reply, requests, vm (+2 more)

### Community 2 - "planner-journey.js"
Cohesion: 0.17
Nodes (15): buildJourneyMeasurement(), initJourneyMeasurement(), journeyCountText(), journeyRead(), journeyRecord(), makeReuseWeekDraft(), planPlateJourney(), previewPlannerWeek() (+7 more)

### Community 3 - "vitest"
Cohesion: 0.16
Nodes (8): vitest, c, rows, c, c, source, c, setup()

### Community 4 - "meals-core.test.mjs"
Cohesion: 0.14
Nodes (8): __dirname, foodsPath, __dirname, mealsPath, __dirname, path, __dirname, searchPath

### Community 5 - "api-integration.test.mjs"
Cohesion: 0.18
Nodes (6): handler(), handler(), handler(), handler(), PROTOCOL_COOKIE_NAME, signProtocolCookie()

### Community 6 - "plate-exploration.js"
Cohesion: 0.27
Nodes (11): openPlateIngredient(), previewPlateScale(), renderDishOrbit(), renderPlateExploration(), selectOrbitDish(), skDishes(), skInitMotion(), skPauseMotion() (+3 more)

### Community 7 - "reconcile-dishes.mjs"
Cohesion: 0.15
Nodes (13): ambiguous, c, credits, existingNames, imageReview, linked, merged, norm() (+5 more)

### Community 8 - "swaps-ui.js"
Cohesion: 0.32
Nodes (10): filterSwapSources(), initSwaps(), openCardSwap(), pickPlateSwap(), renderSwapPlateChoices(), renderSwapResults(), resetSwapFilters(), selectSwapSource() (+2 more)

### Community 9 - "search-core.js"
Cohesion: 0.29
Nodes (10): getVisibleFoods(), queryFoods(), affordSynonymGroup(), foodMatchesSearch(), foodSearchHaystack(), foodSearchHaystackShort(), foodSearchRelevance(), fuzzySubsequence() (+2 more)

### Community 10 - "backup-core.mjs"
Cohesion: 0.35
Nodes (8): applyBackupKeys(), buildBackupDocument(), collectBackupKeys(), isBackupKey(), NF_BACKUP_KEYS, NF_BACKUP_SCHEMA, NF_BACKUP_VERSION, validateBackupDocument()

### Community 11 - "week-builder.js"
Cohesion: 0.36
Nodes (7): applyComboWeekDraft(), makeComboWeekDraft(), renderComboWeekDraft(), saveComboWeek(), setComboWeekChoice(), suggestComboWeek(), weekBuilderScope()

### Community 12 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, scope, short_name, start_url (+1 more)

### Community 13 - "combinations.js"
Cohesion: 0.42
Nodes (7): addComboMeal(), comboMealMerge(), comboMealParts(), comboPlannerSnapshot(), planComboMeal(), renderComboMeals(), undoComboMeal()

### Community 14 - "ref_node_vm"
Cohesion: 0.22
Nodes (5): c, lookup, c, c, lookup

### Community 15 - "planner-core.js"
Cohesion: 0.39
Nodes (5): plannerDateKey(), plannerIngredientShoppingList(), plannerPut(), plannerShoppingList(), plannerWeek()

### Community 17 - "package.json"
Cohesion: 0.25
Nodes (7): devDependencies, vitest, name, private, scripts, test, type

### Community 18 - "landing-nutrition.test.mjs"
Cohesion: 0.25
Nodes (3): c, example, c

### Community 19 - "guide-bridge.js"
Cohesion: 0.43
Nodes (5): confirmGuideImport(), mergeGuideMeal(), readGuideMeal(), reviewGuideMeal(), validateGuideMeal()

### Community 21 - "ingredient-shopping.test.mjs"
Cohesion: 0.40
Nodes (3): c, lookup, plan

### Community 22 - "swaps.test.mjs"
Cohesion: 0.40
Nodes (4): a, b, c, d

## Knowledge Gaps
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `test-ai-flow.cjs`, `meals-core.test.mjs`, `api-integration.test.mjs`, `backup-core.mjs`, `ref_node_vm`, `package.json`, `landing-nutrition.test.mjs`, `ingredient-shopping.test.mjs`, `swaps.test.mjs`, `filter-core.test.mjs`, `drawer-dismissal.test.mjs`, `evidence-audit.test.mjs`, `plate-exploration.test.mjs`, `today-summary.test.mjs`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `test-ai-flow.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Why does `setup()` connect `vitest` to `c`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `meals-core.test.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.13970588235294118 - nodes in this community are weakly interconnected._