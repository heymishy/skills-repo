## Story: No-product, CLI-authored features are reachable within one click from the /dashboard landing page

**Epic reference:** artefacts/2026-08-31-web-ui-navigation-legibility/epics/web-ui-navigation-legibility.md
**Discovery reference:** artefacts/2026-08-31-web-ui-navigation-legibility/discovery.md
**Benefit-metric reference:** artefacts/2026-08-31-web-ui-navigation-legibility/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer or Platform maintainer who works across both Claude Code CLI and the web UI**,
I want **a visible entry point to my no-product, CLI-authored features directly on the `/dashboard` landing page after login**,
So that **I don't have to already know to look at the left-hand sidebar's "No product" link — I can move seamlessly between CLI and web-UI sessions regardless of which one started the work**.

## Benefit Linkage

**Metric moved:** M3 — Cross-channel feature discoverability from the dashboard
**How:** `handleGetDashboard`'s own rendered body (`_renderProductDashboard`, `src/web-ui/routes/products.js:168`) currently builds its card list solely from `navSummary.products` (real, Postgres-registered products) and never renders anything for `noProductJourneyCount` — even though that value is already computed and passed into the function on every call. Adding a visible, clickable entry point for the no-product bucket directly in the dashboard body — not sidebar-only — closes the exact gap that produced this metric's baseline (2 confirmed incidents in one session, 2026-09-10).

## Architecture Constraints

- **ADR-028 (this codebase's own binding constraint — "a derived structure needs exactly one canonical builder"):** do not write a second, independent "what no-product work exists" query. `src/web-ui/routes/journey.js`'s `_mergeStateFeaturesIntoJourneyList()` (~line 4447) is the existing canonical builder for this exact question — it already correctly merges real Postgres `journeys` rows with `product_id IS NULL` *and* CLI-only `pipeline-state.json` features that have no journey-store record at all. Reuse it (or extract a shared count from the same underlying logic) rather than relying solely on `getProductsNavSummary`'s own SQL-only `noProductJourneyCount` (`src/web-ui/routes/products.js:2301`), which counts only real Postgres `journeys` rows and does **not** account for CLI-only, not-yet-backfilled `pipeline-state.json` features — confirmed by direct code reading, and confirmed as the precise mechanism of both live incidents behind this story: `jasb-s1` and `web-ui-navigation-legibility` itself both had zero Postgres `journeys` rows until their first `/journey/:slug/resume` click, meaning a naive Postgres-only count would show "0" and hide the entry point entirely for exactly the features this story exists to surface.
- Reuse the dashboard's existing card-rendering visual style (`src/web-ui/routes/products.js:168`'s per-product `<a>` card markup) for the new entry point, rather than inventing a new visual pattern — consistent with `product/tech-stack.md`'s "reuse existing rendering/CSS patterns" convention (not ADR-009, which governs an unrelated topic, CI evaluation/write-back trigger separation; see `CLAUDE.md`'s own note on this exact prior mis-citation).
- **No numeric count on the entry point (resolves a real design-consistency risk found at /review):** the entry point must indicate presence only (e.g. "No product work" or similar copy, no "(N)" count) — not a number. Displaying a count here risks visibly disagreeing with the sidebar's own separate, Postgres-only `noProductJourneyCount` (`getProductsNavSummary`) shown on the same page, since this story deliberately does not fix that sidebar count (see Out of Scope). Binary presence avoids the two-different-numbers-on-one-screen problem entirely without requiring the sidebar fix as a prerequisite.
- The entry point must link to the existing `/journey` no-product list (the same destination the sidebar's "No product" link already provides) — do not build a second, separate list view.
- Mandatory Constraints (`architecture-guardrails.md`): existing `_escapeHtml()`/`escHtml()` usage preserved for any rendered text; the new link/card must be keyboard-accessible (a plain `<a>` tag satisfies this by default, as the existing product cards already do).

## Dependencies

- **Upstream:** None. (`cross-channel-feature-continuity`, whose `ep1-s1` story built `_mergeStateFeaturesIntoJourneyList`, is already DoD-complete — this story reuses its output, it does not modify it.)
- **Downstream:** None. Touches `src/web-ui/routes/products.js` (`handleGetDashboard`, `_renderProductDashboard`, possibly `getProductsNavSummary`) and reads from `src/web-ui/routes/journey.js`'s existing exported `_mergeStateFeaturesIntoJourneyList` — a different file area from `wnl-s1`/`wnl-s2` (both `skills.js`), low conflict risk.

## Acceptance Criteria

**AC1:** Given a tenant has at least one no-product journey registered in Postgres (`journeys.product_id IS NULL`), When the operator loads `/dashboard`, Then a visible, clickable entry point for "No product" work appears in the dashboard body (not sidebar-only).

**AC2:** Given a tenant has zero Postgres `journeys` rows with `product_id IS NULL`, but has at least one non-terminal `pipeline-state.json` feature with no matching journey-store record at all (the exact `jasb-s1`/`web-ui-navigation-legibility` scenario), When the operator loads `/dashboard`, Then the same "No product" entry point still appears — it must not rely solely on the Postgres-only count, which would show zero and hide it.

**AC3:** Given the "No product" entry point is visible on the dashboard, When the operator clicks it, Then they land on `/journey`'s existing no-product list (the same destination and content the sidebar's own "No product" link already provides) — no new, separate list view is built.

**AC4:** Given a tenant has zero no-product work of either kind (no Postgres no-product journeys, no unmatched pipeline-state features), When the operator loads `/dashboard`, Then no "No product" entry point is shown — the dashboard body is not cluttered with an empty-state link that leads nowhere useful.

**AC5 (regression guard):** Given a tenant with one or more real products, When `/dashboard` renders, Then the existing product cards (name, feature count, last-updated date, link to `/products/:id`) render exactly as they do today — this story adds one new entry point, it does not change existing product-card rendering.

**AC6 (regression guard):** Given the sidebar's own existing "No product" link (`renderProductsSection`, `html-shell.js:118`), When this story's dashboard-body entry point ships, Then the sidebar's own link and count continue to render exactly as before — this story adds a second path to the same destination, it does not remove or alter the first.

## Out of Scope

- Fixing the sidebar's own `noProductJourneyCount` (`getProductsNavSummary`) to also account for not-yet-backfilled `pipeline-state.json` features, if that gap is confirmed to exist there too during implementation — that is a pre-existing, separate issue from this story's own dashboard-body fix; log as a follow-up finding in `decisions.md` if confirmed, do not silently expand this story's scope to fix it.
- Any change to `_mergeStateFeaturesIntoJourneyList` itself, or to the `/journey` page's own rendering — this story only adds a new entry point that reuses existing, unmodified logic and destinations.
- A dashboard-body preview of individual no-product feature names/cards — the MVP form is a single entry point (presence-only, no count — see decisions.md), not a duplicated card list (that would violate ADR-028's "don't re-derive" intent by building a second rendering of the same underlying list).
- Any change to how products are created or connected — unrelated to this story.

## NFRs

- **Performance:** Calling `_mergeStateFeaturesIntoJourneyList` (or an equivalent shared count) from `handleGetDashboard` adds one additional computation per dashboard load — this function already reads `pipeline-state.json` from disk on every `/journey` load today, so the marginal cost of doing so once more on `/dashboard` is expected to be small, but must be confirmed not to introduce a noticeable page-load regression (e.g. via a rough before/after timing check, not a formal load test).
- **Security:** None — no new input surface; reuses existing tenant-scoped queries and file reads.
- **Accessibility:** New entry point must be keyboard-accessible (a plain link, consistent with existing product cards).
- **Audit:** None identified.

## Complexity Rating

**Rating:** 2 — the "add a link" part is simple, but correctly computing the no-product count in a way that includes not-yet-backfilled CLI features (AC2, the actual root cause) requires either calling into `journey.js`'s existing merge logic from `products.js` or extracting a shared piece of it, which is a slightly more involved integration than a pure UI change, and depends on the current shape of `_mergeStateFeaturesIntoJourneyList`'s signature (`repoRoot`-based, not `pool`/`tenantId`-based like `getProductsNavSummary`) — reconciling those two different input shapes is the real complexity here, not the visible UI itself.
**Scope stability:** Stable — the root cause (Postgres-only count undercounts CLI-only features) was confirmed via direct code reading before this story was written, not guessed.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
