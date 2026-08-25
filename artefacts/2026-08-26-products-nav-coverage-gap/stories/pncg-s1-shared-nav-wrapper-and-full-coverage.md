## Story: Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it

**Epic reference:** none (short-track, single story)
**Discovery reference:** none (short-track — see `CLAUDE.md` short-track flow)
**Benefit-metric reference:** `2026-06-29-beta-entry-experience` (M1 activation) — a missing Products sidebar is a hard navigation dead-end for any signed-in user who lands on an affected page, directly working against activation

**Domain:** wuce / web-ui-navigation
**Domain tags:** [web-ui]

## User Story

As any signed-in `wuce` user, on any page in the app
I want the persistent left-hand sidebar to always show my Products list, "See all products," and "+ New product"
So that I am never stranded on a page with no way to navigate to my products, regardless of which page I happened to land on

## Benefit Linkage

`bvnd-s1` (PR #768, merged 2026-08-25) fixed this exact defect — a missing Products sidebar section — for one page (`/dashboard?view=board`). While investigating a live operator report that `/org/kanban` has the same problem, a full-codebase audit of every `renderShell(` call site found the same defect in **21 more places** across 10 files. Root cause, confirmed in `src/web-ui/utils/html-shell.js`: `renderShell()`'s Products-section sub-renderer has a hard early return (`if (!opts.products) return '';`) — any caller that doesn't explicitly fetch and pass `products` (via `getProductsNavSummary(pool, tenantId)`, the established pattern used correctly by `handleGetDashboard`, `handleGetJourney`, and `handleGetJourneyComplete`) silently loses the entire Products section for that page, with no error, no test failure, and no visual indication anything is missing.

This was a **deliberate, documented scope decision** at `pan-s1` (2026-07-30, `artefacts/2026-07-30-product-aware-navigation/decisions.md`) — only 3 handlers were wired initially, with an explicit revisit trigger: "if operator feedback shows the missing Products section on unwired pages is confusing, wire additional call sites as a follow-up story." That trigger has now fired twice (the operator's own `/org/kanban` report, plus the wider pattern found while investigating it).

## Architecture Constraints

- **New shared helper, not 22 individual copy-pasted fixes.** Add one new function — `renderShellWithNav(pool, tenantId, opts)` — that internally calls `getProductsNavSummary(pool, tenantId)` (already exported from `src/web-ui/routes/products.js`, already imported this way by `journey.js` and `skills.js`), merges `products`, `activeProductId` (from `opts.activeProductId || null` — callers may still override this per-page), and `noProductJourneyCount` into the options object, then calls the real `renderShell(mergedOpts)` and returns its result. Place it in `src/web-ui/routes/products.js` alongside `getProductsNavSummary` (not in `html-shell.js` — `html-shell.js` must not require `products.js`, since `products.js` already requires `html-shell.js` for `renderShell`; requiring it back would create a circular dependency). Export it the same way `getProductsNavSummary` is already exported and imported by other route files.
- **Every one of the 22 confirmed sites below must be updated to call `renderShellWithNav` instead of `renderShell` directly** — do not leave any of them on the raw `renderShell` call.
- **Pool availability varies by site — verify before assuming a site is "just a call-site swap."** Some handlers already receive `pool` as a parameter (all of `products.js`'s handlers; `journey.js`'s `handleGetJourney`, `handleGetJourneyStageView`, `handleGetJourneyComplete`; `settings.js`'s `handleGetSettings` and `team-management.js`'s handlers via their `createXHandlers(pool)` factory closures). Others currently do NOT receive `pool` at all — confirmed for `journey.js`'s `handleGetStageReview`, `handleGetReferenceModal`, `handleGetReference`, `handleGetStories`, `handleGetJourneyById`, `handleGetWizard` (none take a `pool` parameter, and `server.js` doesn't pass one at their call sites either, even though `server.js` has a pool instance available — it's simply never threaded to these 6 handlers), and likely also `admin-credits.js`, `admin-mock-gateway.js`, `artefact.js`, `billing.js`, `features.js` (spot-checked: no `pool` parameter, no module-level pool reference, no factory-closure pattern found in any of these 5 files — confirm the exact mechanism per file during implementation rather than assuming). For any such site, thread `pool` through as a new parameter (function signature + the corresponding `server.js` call site) as a prerequisite step before the `renderShellWithNav` swap — mirror the exact pattern already used by `handleGetJourney(req, res, _next, pool)` and its `server.js` call site, don't invent a new plumbing convention.
- **`tenantId` comes from `req.session.tenantId` at every site** — this is already the universal convention across every file checked; do not introduce a second way to derive it.
- **`activeProductId`:** most of these 22 sites have no natural "current product" context (e.g. `/settings`, `/team/members`, `/admin/credits`) — pass `null` for those. `products.js`'s per-product pages (`/products/:id/roadmap`, `/products/:id/guardrails/form`, `/products/:id/kanban`) already have the product id in scope (`req.params.id` or equivalent) — pass it, matching how `handleGetProductView` already does.
- **Do not change any other rendered content, route behaviour, or existing test on any of the 22 pages** — this story is exclusively about the sidebar's Products section appearing; it must not otherwise alter what a signed-in user currently sees or how any handler currently behaves.
- **Do not touch any `renderShell` call site NOT in the 22-site list below** — including the 3 already-correct sites (`handleGetJourney`, `handleGetJourneyStageView`/similar already-passing sites, `handleGetJourneyComplete`, and every `skills.js` site) and every genuine error/redirect/fragment/API-response render identified during the audit (e.g. 404s, 403s, validation-failure branches) — those are correctly out of scope, not omissions.

## The 22 confirmed sites

**`src/web-ui/routes/products.js`** (5):
1. `handleGetOrgKanban` — `GET /org/kanban`
2. `handleGetProductKanban` — `GET /products/:id/kanban`
3. `handleGetProductNew` — `GET /products/new`
4. `handleGetProductRoadmap` — `GET /products/:id/roadmap`
5. `handleGetGuardrailsForm` — `GET /products/:id/guardrails/form`

**`src/web-ui/routes/journey.js`** (6 handlers, 8 render call sites — `handleGetWizard` has 3 internal branches for its 3 query-param views, all fixed by one change to that one handler):
6. `handleGetStageReview` — `GET /journey/:id/stage-review`
7. `handleGetReferenceModal` — `GET /journey/:id/reference-modal`
8. `handleGetReference` — `GET /journey/:id/reference`
9. `handleGetStories` — `GET /journey/:id/stories`
10. `handleGetJourneyById` — `GET /journey/:id` (rare defensive-fallback render path; low incidence but a genuine 200 response when reached)
11. `handleGetWizard` — `GET /journey/wizard` (all 3 view branches: default, `?view=existing`, `?view=resume`)

**Other files** (1 site each unless noted):
12. `settings.js` — `handleGetSettings` — `GET /settings`
13. `team-management.js` — `handleGetTeamMembers` — `GET /team/members`
14. `team-management.js` — `handleGetCreateInviteForm` — `GET /team/invites/new`
15. `admin-credits.js` — `adminCreditsGet` — `GET /admin/credits`
16. `admin-mock-gateway.js` — `adminMockGatewayGet` — `GET /admin/mock-gateway`
17. `artefact.js` — `handleArtefactRoute` (GitHub-sourced success branch) — `GET /artefact/:slug/:type`
18. `artefact.js` — `handleArtefactRoute` (Postgres-fallback success branch — same handler, second render call site)
19. `billing.js` — `handleGetBillingSuccess` — `GET /billing/success`
20. `features.js` — `handleGetFeatureArtefacts` — `GET /features/:slug`

(19 numbered entries above map to 22 render call sites once `handleGetWizard`'s 3 branches and `handleArtefactRoute`'s 2 branches are counted individually — every one of the 22 call sites must be updated.)

## Dependencies

None. `getProductsNavSummary` and `renderShell` both already exist and are unchanged in shape by this story.

## Acceptance Criteria

**AC1**
Given the new `renderShellWithNav(pool, tenantId, opts)` helper is added to `src/web-ui/routes/products.js`
When it is called with a valid `pool` and `tenantId`
Then it returns the exact same HTML `renderShell(opts)` would have returned, plus a correctly-populated Products sidebar section (product list, "See all products," "+ New product"), without requiring the caller to fetch `getProductsNavSummary` itself

**AC2**
Given each of the 22 confirmed call sites listed above
When a signed-in user with at least one product requests that page
Then the rendered page's sidebar includes the full Products section, identical in content to what `/dashboard` renders for the same tenant

**AC3**
Given a handler that did not previously receive a `pool` parameter (confirmed: `journey.js`'s `handleGetStageReview`, `handleGetReferenceModal`, `handleGetReference`, `handleGetStories`, `handleGetJourneyById`, `handleGetWizard`; to be confirmed per-file during implementation for `admin-credits.js`, `admin-mock-gateway.js`, `artefact.js`, `billing.js`, `features.js`)
When the fix is applied
Then `pool` is threaded through as a new parameter at that handler's own signature and its `server.js` call site, mirroring the exact existing pattern used by `handleGetJourney(req, res, _next, pool)`, with no other behavioural change to that handler

**AC4**
Given the fix is applied to all 22 sites
When each page's existing (pre-this-story) tests are re-run, and each page's other rendered content is compared before and after
Then all existing tests pass unchanged and no content other than the added Products sidebar section differs — no regression to any of the 22 pages' existing behaviour

## Out of Scope

- The 3 already-correct call sites (`handleGetJourney`, the already-passing `journey.js` site at line ~1329/1325, `handleGetJourneyComplete`) and every `skills.js` render call site — already correct, not touched.
- Every genuine error/redirect/fragment/API-response render identified during the audit (404s, 403s, validation-failure branches, POST-endpoint error responses) — these are not full-page navigable renders and are correctly excluded from the 22-site list.
- `dashboard.js`'s `handleDashboard` (the inactive/no-DB-configured fallback used only when `_pshPool` is unset — the real `/dashboard` path is `products.js`'s `handleGetDashboard`, already fixed by `bvnd-s1`) — low-priority, infra-limited edge case, not part of this story.
- Any change to `renderShell`'s own signature, `html-shell.js`'s Products-section sub-renderer, or the underlying `getProductsNavSummary` query logic — this story only changes which callers reach that existing, correct logic.
- Any new caching, memoisation, or performance optimisation of the now-more-frequently-called `getProductsNavSummary` — if this becomes a real performance concern post-merge, that's a separate, deliberately-scoped follow-up.

## NFRs

NFRs: None — reviewed 2026-08-26. No new external dependency, no schema change, no new route. `getProductsNavSummary` already runs a per-product journeys query in a loop (`Promise.all` over each product) — this story increases how often that existing query pattern runs (once per newly-fixed page load, same as it already does on `/dashboard`/`/journey`), not its own cost per call. If this surfaces a real latency concern post-merge, that's a separate NFR-scoped follow-up, not blocking this fix.

## Complexity Rating

**Complexity:** 2 (some ambiguity — the exact pool-threading mechanism for 5 of the files was not fully confirmed line-by-line before DoR; implementation must verify and may find additional small plumbing differences per file)
**Scope stability:** Stable — the 22-site list itself is fixed and verified; only the exact mechanics of threading `pool` at a handful of sites needs implementation-time confirmation

## Definition of Ready Pre-check

- [x] Acceptance criteria are testable
- [x] No architectural decision requiring `decisions.md` beyond what's already captured in Architecture Constraints (the circular-dependency avoidance reasoning for where `renderShellWithNav` lives)
- [x] No CSS-layout-dependent ACs (this is about which elements render, not their visual layout/positioning)
- [x] No injectable adapter introduced
