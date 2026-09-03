## Test Plan: Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts

**Story reference:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/stories/fal-s1-resolve-real-feature-slug-before-artefact-lookup.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Object-shaped epic-nested story resolves to its real feature slug for artefact lookup | 1 | — | — | — | — | 🟢 |
| AC2 | Bare-string epic-nested story: computeTaxonomyRollup resolves slug correctly, then AC1's routing fix applies | 2 | — | — | — | — | 🟢 |
| AC3 (regression) | Top-level feature: fast path unchanged, no taxonomy scan triggered | 1 | — | — | — | — | 🟢 |
| AC4 (regression) | Genuinely unresolvable slug: "No artefacts found" still renders | 1 | — | — | — | — | 🟢 |
| AC5 (regression) | Breadcrumb output unchanged for the epic-nested case | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language — this story touches only `product-rollup.js`'s own pure data-transform function and `features.js`'s route handler logic (which slug string is passed to which downstream call), matching this repo's own established convention for testing this exact route (`tests/check-pdt-s4-story-breadcrumb.js`, `tests/check-wuce20-artefact-index-html.js`). N/A.

---

## Coverage gaps

None for the resolution *mechanism* itself. **Named residual finding, addressed directly by this test plan's own design, not left as a gap:** the pre-existing `tests/check-pdt-s4-story-breadcrumb.js` test for the epic-nested case (`AC1a`) mocks `setListArtefacts` to always return success regardless of the slug it's actually called with — it would not have caught this bug, since it only asserts the rendered breadcrumb text, not which feature slug the artefact lookup itself received. This test plan's own AC1/AC2 tests capture the actual call arguments to `_listArtefacts`/`getJourneyByFeatureSlug` directly, closing that specific verification gap rather than repeating it.

---

## Test Data Strategy

**Source:** Synthetic — mocked `pool.query`, `setListArtefacts`, `setJourneyStoreModule` in test setup, no real network/DB calls
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — reuses the exact injectable-mock pattern already established by `tests/check-pdt-s4-story-breadcrumb.js` for this same route handler.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked taxonomy with an object-shaped epic-nested item carrying `featureSlug`, distinct from its own `slug`; a `setListArtefacts` mock that records which slug it was called with | Synthetic, in-test | None | |
| AC2 | `computeTaxonomyRollup` called directly with a real `pipelineState` fixture containing a bare-string epic-nested story reference (no route-handler mocking needed for this half); then the same call-capturing mock as AC1 for the routing half | Synthetic, in-test | None | |
| AC3 | A mocked `journeyForPage` that resolves directly (top-level feature case) | Synthetic, in-test | None | |
| AC4 | No `journeyForPage` match, no taxonomy match | Synthetic, in-test | None | |
| AC5 | Reuses the exact fixture already in `tests/check-pdt-s4-story-breadcrumb.js`'s own `AC1a` test | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Object-shaped epic-nested story: artefact lookup uses the real parent feature slug, not the raw story ID
- **Verifies:** AC1
- **Precondition:** `journeyForPage` for the raw slug (`lphf-s2`) resolves to `null` (not itself a top-level feature). Mocked tenant-scoped taxonomy query returns a product whose `taxonomy.groups[].items[]` includes `{ slug: 'lphf-s2', featureSlug: '2026-08-08-landing-page-hero-features' }`. `setListArtefacts` and `setJourneyStoreModule`'s own `getJourneyByFeatureSlug` are both spied to record their call arguments.
- **Action:** Call `handleGetFeatureArtefacts(req, res, 'lphf-s2', pool)`.
- **Expected result:** `_listArtefacts` was called with `'2026-08-08-landing-page-hero-features'`, not `'lphf-s2'`. The second `getJourneyByFeatureSlug` call (for the real journey, used for resume-links/Postgres-artefact-fallback) was also called with the real feature slug.
- **Edge case:** No

### Bare-string epic-nested story: computeTaxonomyRollup resolves the slug correctly
- **Verifies:** AC2 (part 1 — the data-layer fix)
- **Precondition:** A `pipelineState` fixture with one feature whose `epics[0].stories` is `['p3.1a', 'p3.1b']` (bare strings, matching this repo's own real `2026-04-14-skills-platform-phase3` shape).
- **Action:** Call `computeTaxonomyRollup(pipelineState)` directly.
- **Expected result:** `result.groups[0].items` contains `{ slug: 'p3.1a', featureSlug: '<the feature's own slug>' }` and `{ slug: 'p3.1b', featureSlug: '<...>' }` — not `{ slug: undefined, ... }`.
- **Edge case:** Yes — this is the exact bare-string shape that previously produced `undefined`.

### Bare-string epic-nested story: end-to-end artefact lookup also uses the real feature slug
- **Verifies:** AC2 (part 2 — the routing fix applies once the data is correct)
- **Precondition:** Same as AC1's own test, but the mocked taxonomy's matching item is `{ slug: 'p3.1a', featureSlug: '2026-04-14-skills-platform-phase3' }` (representing what `computeTaxonomyRollup`'s own now-fixed output would produce for this shape).
- **Action:** Call `handleGetFeatureArtefacts(req, res, 'p3.1a', pool)`.
- **Expected result:** `_listArtefacts` was called with `'2026-04-14-skills-platform-phase3'`, not `'p3.1a'`.
- **Edge case:** No

### Top-level feature: fast path unchanged, no taxonomy scan triggered (regression guard)
- **Verifies:** AC3
- **Precondition:** `journeyForPage` for the raw slug resolves directly (`{ productId: 'product-abc', ... }`) — the common case.
- **Action:** Call `handleGetFeatureArtefacts(req, res, '2026-08-08-landing-page-hero-features', pool)`. Spy on the tenant-scoped taxonomy query (`SELECT p.product_id, p.name, pr.taxonomy...`).
- **Expected result:** The taxonomy-scan query was never called (call count 0) — the fast path short-circuits it entirely, matching today's exact behaviour. `_listArtefacts` was called with the raw slug unchanged.
- **Edge case:** No

### Genuinely unresolvable slug: "No artefacts found" still renders (regression guard)
- **Verifies:** AC4
- **Precondition:** `journeyForPage` resolves to `null`; the taxonomy scan finds no matching item in any product's taxonomy for this tenant.
- **Action:** Call `handleGetFeatureArtefacts(req, res, 'totally-unknown-slug', pool)`.
- **Expected result:** The rendered page still contains "No artefacts found for this feature" — reuses the exact fixture and assertion already in `tests/check-pdt-s4-story-breadcrumb.js`'s own equivalent test, confirming no change to this case.
- **Edge case:** No

### Breadcrumb output is unchanged for the epic-nested case (regression guard)
- **Verifies:** AC5
- **Precondition:** Reuses `tests/check-pdt-s4-story-breadcrumb.js`'s own `AC1a` fixture exactly (the `dic.5`/`dic` case).
- **Action:** Run that pre-existing test file unmodified.
- **Expected result:** All its existing assertions (`Discovery Product`, `Discovery Improvements`, `href="/products/product-dic"`) still pass — confirms this story's refactor of the shared resolver did not change the breadcrumb's own resolved values.

---

## Out of Scope for This Test Plan

- Any test of the artefact *viewer* route (`/artefact/:featureSlug/:fileSlug`) — unchanged by this story.
- Any test of `_listArtefacts`'s own internal logic (local filesystem scan, GitHub API fallback, Postgres merge) — unchanged, already covered by its own pre-existing tests (`tests/check-alrf-s4-postgres-artefact-fallback.js` and others).
- Duplicate story-slug collision handling — explicitly out of scope per the story, a pre-existing, unchanged limitation.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
