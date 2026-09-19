## Story: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## Amendment note (2026-09-19)

At `/implementation-plan` time, direct investigation found the real `handleDashboard` route (`routes/dashboard.js`) renders only a placeholder `<h1>Dashboard</h1>` body — it never calls `renderDashboard` (`views/dashboard-view.js`), a fully-built, already-token-correct view function whose structure (greeting, "Run a skill" grid, "Waiting on you"/"Recent sessions" columns) closely matches `Skills Platform - Dashboard.dc.html`'s real mock, down to nearly identical data-shape names. `renderDashboard` is otherwise dead code — its only other references are inside `src/web-ui/port-extract/port/` (a scratch/integration staging area, not live application code). Wiring it live requires real data for 3 pieces that had no data source at all before this amendment (a static skill catalog, recent-session history, in-progress session count) plus a mapping layer for the one piece that does have a source (the pending-actions queue, whose real field names differ from `renderDashboard`'s expected shape). Presented to the operator as a scope choice (narrower structural-restyle-with-placeholders vs. full live-data wiring); operator chose full live-data wiring. ACs 5-7 below are new as a result — the story's original AC1-AC4 are unchanged in substance, only re-numbered/retitled where the story title itself needed to reflect the expanded scope. See `decisions.md` for the full investigation trail (real data sources found: `adapters/action-queue.js`'s `getPendingActions`; `modules/journey-store.js`'s `listJourneys`/`completedStages`).

## Amendment note 2 — CRITICAL re-target (2026-09-19)

Task 4's E2E-test implementer discovered, and the orchestrating session independently re-verified with a real server + real authenticated request, that **`GET /dashboard` has never dispatched to `routes/dashboard.js`'s `handleDashboard` in any real runtime configuration of this app** — not in production, not in `NODE_ENV=test` (the exact environment this story's own Tasks 1-3 tests all ran in). The real dispatch (`server.js:2743-2748`) is gated on `_pshPool`, which is truthy in every real config; the real, live `/dashboard` route has been served by `routes/products.js`'s `handleGetDashboard`/`_renderProductDashboard` since commit `b010cfcb` (2026-07-05, "product and standards hierarchy"), over 2 months before this feature began. `handleDashboard`/`dashboard.js` has been silently orphaned dead code this entire time — Tasks 1-3's work (all now-committed, already spec-compliance- and code-quality-reviewed) was built entirely against a route no real user, and no `NODE_ENV=test` E2E run, has ever reached. This is a pre-existing gap this story inherited, not a defect it introduced.

Compounding this: the REAL live dashboard's own current content (a simple Products-list page — cards, a "Create your first product"/"New product" CTA, an org-kanban link) has no resemblance to `DESIGN.md`'s mock (a personal dashboard: greeting, "Run a skill" grid, "Waiting on you", "Recent sessions") — the mock's vision has apparently never been live on the real route at all.

**Presented to the operator with 3 options** (narrow token-only restyle of the real Products-list page as-is; pause and escalate as a discovery-level finding; build the full mock experience into the real live route, reusing Tasks 1-3's data-wiring logic). **Operator chose: build the full mock experience into the real live route.** Full investigation and decision trail: `decisions.md`, "CRITICAL: the entire story targeted dead code" entry.

**What changes as a result:** the real target file becomes `src/web-ui/routes/products.js` (`handleGetDashboard`/`_renderProductDashboard`), not `routes/dashboard.js`. Tasks 1-3's already-built, already-reviewed data-wiring functions (`_mapPendingActionsForDashboard`, `_deriveDashboardJourneyData`, `_formatCompletedAgo`) are REUSED, not rebuilt — moved to a shared, importable location (exact mechanism decided at the new `/implementation-plan` pass: extract to a new small shared module, or export and import directly from `dashboard.js` — either way, `dashboard.js`'s own dead `handleDashboard`/route-wiring is NOT deleted by this story, that's a separate future cleanup decision). The real Products-list page's existing "no products yet" onboarding CTA (`hasNoProductWork`, `products.length === 0` branch) MUST be preserved — see amended AC3/AC4/Architecture Constraints below. ACs, Architecture Constraints, Out of Scope, and Complexity are all amended accordingly.

## User Story

As a **Hamish King (Founder/Operator)**,
I want **the dashboard — the screen I use most as day-to-day operator — to look like a modern, consistent SaaS product**,
So that **my own daily experience of the platform reflects the brand direction being set, not the dated "Notion-calm" styling**.

## Benefit Linkage

**Metric moved:** Visual consistency across the 4 real screens
**How:** This story converts the dashboard — one of the 4 real screens the metric counts — from the old token values to `DESIGN.md`'s exact token values, moving the metric from 1/4 (after `dsa-s1`) toward 4/4.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one."
- Confirmed via `/clarify`: reuse and extend `src/web-ui/utils/html-shell.js`'s existing CSS custom-property blocks. **Real structure (see `decisions.md`, "FEATURE-WIDE: the real CSS selector structure is inverted" entry): bare `:root` is LIGHT mode, `[data-theme="dark"]` is the DARK override (plus its `@media` no-JS fallback twin) — update both, not just one "dark-mode block."** Update hex values to match `DESIGN.md`'s token table. **Corrected feature-wide (see `decisions.md`, "FEATURE-WIDE: --green/--amber/--red cannot be renamed" entry, found during `dsa-s1`'s `/implementation-plan`): `--success`/`--warn`/`--danger` are added as NEW aliases alongside the existing `--green`/--amber`/`--red` — the old names are NOT renamed or removed, since 25+ usages across 8 files outside this epic's scope depend on them. `dsa-s1` adds the new aliases at the shared `html-shell.js` level; this story consumes the new names in its own markup and does not need to touch the old names at all.**
- **REAL target file, confirmed by direct empirical routing trace (see `decisions.md`, "CRITICAL: the entire story targeted dead code" entry): `src/web-ui/routes/products.js` — specifically `handleGetDashboard` (the real `GET /dashboard` route handler, `server.js:2743-2748`) and `_renderProductDashboard` (the function it calls for the non-`?view=board` case). `routes/dashboard.js`/`views/dashboard-view.js` are NOT live and are NOT this story's target — they remain as-is (dead code, a future cleanup decision, not this story's scope).**
- **The sidebar (`.sw-sidebar` in `html-shell.js`'s `renderShell`) is already real, already shared across every page (including the real `/dashboard` route via `_renderProductDashboard`'s own `renderShell` call), and already token-correct after `dsa-s1`'s Task 1 — it is NOT rebuilt by this story.** This story's own work is confined to `_renderProductDashboard`'s `body` content (currently a simple Products-list — cards, CTA, org-kanban link), not the shell around it.
- **The real "no products yet" onboarding path MUST be preserved.** `_renderProductDashboard`'s existing `products.length === 0` branch renders a "Create your first product →" CTA — this is a real, load-bearing onboarding flow for new users/tenants with zero products and MUST continue to work exactly as it does today. The new mock-derived personal-dashboard content (greeting, skill grid, pending actions, recent sessions) is ADDITIVE to — or REPLACES, contingent on `/implementation-plan`'s own investigation of whether the mock's information architecture still needs a product-cards grid given products are already in the sidebar — the existing `products.length > 0` branch's card-grid content, never the zero-products onboarding branch. This distinction must be explicitly resolved (not silently assumed either way) before implementation.
- **Reuse Tasks 1-3's already-built, already-reviewed data-wiring logic** — `_mapPendingActionsForDashboard`, `_deriveDashboardJourneyData`, `_formatCompletedAgo` (currently in `routes/dashboard.js`, all pure functions operating on real adapter/store data, portable regardless of caller). Do not rebuild this logic from scratch. `/implementation-plan` decides the exact mechanism (extract to a new shared module e.g. `utils/dashboard-data.js`, or import directly from `routes/dashboard.js`) — either is acceptable, prefer whichever is less disruptive to already-passing tests referencing the current export locations.
- **Real data source for "Waiting on you" (pending actions):** `adapters/action-queue.js`'s `getPendingActions(userIdentity, token)` — already confirmed real, already wired with an injectable `setGetPendingActions` seam in `routes/dashboard.js` (reuse that seam's pattern, or wire a fresh one in `products.js` if cleaner — decide at `/implementation-plan`). Real return shape and the required mapping to `{what, feature, age, you}`/`pendingActionsCount` — unchanged from Tasks 1-3's already-correct implementation.
- **Real data source for in-progress session count and recent sessions:** `modules/journey-store.js`'s `listJourneys()` and `completedStages[]` — unchanged from Tasks 1-3's already-correct implementation, INCLUDING the tenant-filter correctness fix already applied (`!(j.tenantId && j.tenantId !== sessionTenantId)`, matching `routes/artefact.js`'s own established convention — do not regress to a stricter `===` filter when porting this logic to `products.js`). `products.js`'s own `handleGetDashboard` already resolves `tenantId` (`var tenantId = req.session && req.session.tenantId;`) — reuse that existing local variable rather than re-deriving it.
- **New static skills catalog needed for "Run a skill":** unchanged from Tasks 1-3's already-correct implementation (the same 6 real skill names, confirmed against `routes/skills.js`'s real branches and `routes/journey.js`'s skill registry).
- **`_renderProductDashboard`'s real function signature** (`products, login, navProducts, activeProductId, noProductJourneyCount, isAdmin, hasNoProductWork, impersonation`) will need new parameters for the mock's own data (pending actions, skills catalog, in-progress count, recent sessions) — confirm the exact real call site at `handleGetDashboard` (`products.js:2646`) before changing the signature, since this function is NOT exported/reused elsewhere in this file (confirmed via a repo-wide grep at `/implementation-plan` time, not assumed).

## Dependencies

- **Upstream:** `dsa-s1` (adds the new `--success`/`--warn`/`--danger` token aliases at the `html-shell.js` level, per the feature-wide correction in `decisions.md` — this story depends on those aliases already existing to avoid two stories racing to touch the same shared file; also confirms `renderShell`'s sidebar is already token-correct, which this story depends on for AC3 without needing to touch the sidebar itself). This story's own already-committed Tasks 1-3 (data-wiring logic in `routes/dashboard.js`, to be reused/relocated, not rebuilt).
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given the REAL, live dashboard (`GET /dashboard`, served by `routes/products.js`) is rendered in dark mode, When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s dark-mode token table exactly.

**AC2:** Given the real dashboard is rendered in light mode (via the existing Settings toggle), When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s light-mode token table exactly.

**AC3:** Given the real dashboard follows `DESIGN.md`'s "Dashboard/app shell" layout pattern (fixed 224px sidebar with products list + main nav + account nav pinned to bottom, fluid main column, max-width 1080px content, greeting + "Run a skill" grid + "Waiting on you"/"Recent sessions" columns), When the real page is rendered, Then this structure is present and visually matches the `Skills Platform - Dashboard.dc.html` mock, for a signed-in user who already has at least one product.

**AC4:** Given the real dashboard's pre-existing functionality (the "no products yet" onboarding CTA for zero-product users, the `?view=board` kanban route, navigation, account nav), When this story's changes are applied, Then no existing functional behavior regresses — verified by running this screen's own pre-existing test coverage before and after the change, AND explicit confirmation that the zero-products onboarding path and the `?view=board` kanban route are both unaffected by this story's diff.

**AC5:** Given a signed-in user has pending sign-off items across their accessible repos, When the real dashboard renders, Then the "Waiting on you" list shows each real pending item (feature, artefact type, how long it's been pending) fetched via the existing `getPendingActions` adapter — not static/placeholder content.

**AC6:** Given the real dashboard renders, When the "Run a skill" section is inspected, Then it shows a real, defined set of the platform's own skills (name, description, estimated time) that link to real, working `POST /api/skills/:name/sessions` session-start actions.

**AC7:** Given a signed-in user has one or more in-progress or recently-completed journeys, When the real dashboard renders, Then the greeting reflects a real in-progress session count (derived from real journey data, not a placeholder) and "Recent sessions" shows the user's most recently completed pipeline stages (skill name, feature, when completed) — empty/zero states shown honestly when there is no real data, never a stale placeholder number.

**AC8 (new):** Given a signed-in user has zero products, When the real dashboard renders, Then the existing "Create your first product →" onboarding CTA is still shown and still functions exactly as it does today — this story's new mock-derived content does not replace or hide the zero-products onboarding path.

## Out of Scope

- Any other of the 3 remaining real screens (artefact viewer covered by `dsa-s1`, landing, skill-session chat) — each has its own story.
- Fixing the stale/dead nav links already tracked separately in the `web-ui-experience-redesign` feature's Epic B — this story is a visual restyle only, not an information-architecture fix.
- Building the `design.system` DoR governance mechanism — that is `dsa-s5`.
- Rebuilding or restyling `renderShell`'s sidebar — already real, already shared, already token-correct after `dsa-s1`.
- A "reviewed"/"in review" sub-state for recent sessions, or any other richer status taxonomy beyond "done" — the real `completedStages` data model has no such distinction to draw from.
- Cross-tenant/cross-repo action-queue filtering beyond what `getPendingActions` already does — reused exactly as it already works, not modified.
- Making the static skills catalog dynamically configurable, editable, or sourced from a new registry — a small hardcoded array is sufficient for this story's scope.
- Deleting, repurposing, or otherwise cleaning up `routes/dashboard.js`/`views/dashboard-view.js`'s now-confirmed-dead route-wiring (`handleDashboard`, `_DASHBOARD_SKILLS_CATALOG`, the `renderDashboard({...})` call) — a separate future decision, not blocking this story. Only the reusable data-wiring functions (`_mapPendingActionsForDashboard`, `_deriveDashboardJourneyData`, `_formatCompletedAgo`) are touched (moved/exported for reuse), not the dead route itself.
- Any other function in `routes/products.js` beyond `handleGetDashboard`/`_renderProductDashboard` — `handleGetProductView`, `handleGetProductNew`, `_renderRoadmapTab`, the kanban-board rendering path, etc. are all explicitly untouched.
- Changing `_renderProductDashboard`'s own existing "no products yet" onboarding CTA's copy, styling, or behavior beyond what's needed to keep it visually consistent with the new token values — see AC8.

## NFRs

- **Performance:** No measurable page-load regression on the real, live, beta-user-facing `/dashboard` route. `getPendingActions`'s real repo-access-validation loop (already a live-network-bound operation on the existing `/api/actions` route) is now also invoked on this route's own page load — confirm no unacceptable added latency. This route already makes 2 real Postgres queries per render (`getProductsNavSummary`) — the added `getPendingActions`/`listJourneys` calls are additive load on an already-real-user-facing path, not a new route with no production traffic.
- **Security:** None identified beyond what `getPendingActions`/`listJourneys` already enforce (server-side repo-access validation, session-scoped data only). Reconfirm the tenant-filter correctness fix (from Tasks 1-3's own code-quality review) is preserved when ported to `products.js` — a regression here would be a real cross-tenant data-visibility bug on the platform's primary landing page, not a low-stakes internal tool.
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9) — no regression to existing accessibility properties.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 3

<!-- Remains 3, not raised further: the underlying data-wiring logic (the hardest part) is already built, tested, and reviewed from Tasks 1-3 -- this re-scope is now primarily a relocation/integration exercise (move working logic into a different, real route; preserve an existing onboarding branch) rather than new unknowns. The stakes are higher (this is now confirmed to be the real, live, beta-user-facing dashboard, not dead code) but the technical ambiguity is lower than it was before this investigation, since the exact real target function, its real signature, and its real existing branches are now all confirmed by direct code read. -->

**Scope stability:** Stable

<!-- Re-affirmed despite the major re-target: the ACs themselves (dark/light tokens, layout matches mock, no regression, real pending actions, real skill catalog, real session data, zero-products onboarding preserved) are unchanged in SUBSTANCE from the prior amendment -- only WHICH file satisfies them changed. -->

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
