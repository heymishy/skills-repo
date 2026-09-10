# wnl-s3 — No-product, CLI-authored features reachable from /dashboard — Implementation Plan

> **Note:** Written retroactively alongside implementation (single-shot fork execution). Implementation and this plan were produced together; the plan documents the approach actually taken, verified against the 6 ACs in `tests/check-wnl-s3-dashboard-no-product-entry.js`.

**Goal:** Make all 6 tests in `tests/check-wnl-s3-dashboard-no-product-entry.js` pass (AC1-AC6) without breaking existing suites.
**Branch:** `feature/wnl-s3`
**Worktree:** `.worktrees/wnl-s3`
**Test command:** `node tests/check-wnl-s3-dashboard-no-product-entry.js`
**Full suite:** `npm test`
**Story:** `artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md`
**DoR:** `artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s3-dor.md`

---

## File map

```
Modify:
  src/web-ui/routes/products.js   — add _hasUnbackfilledCliFeatures; thread hasNoProductWork through
                                     handleGetDashboard -> _renderProductDashboard; render entry point
Add:
  tests/check-wnl-s3-dashboard-no-product-entry.js   — AC1-AC6 integration tests
```

## Task 1: `_hasUnbackfilledCliFeatures(repoRoot)` — reuse the canonical merge builder (ADR-028)

**Files:** `src/web-ui/routes/products.js`
**Covers:** AC2 (root-cause fix), AC4 (negative case)

- Lazy-`require('./journey')` inside the function body (not module scope) to avoid the circular require: `journey.js` already requires `products.js` at module scope for nav-summary rendering.
- Call `journeyStore.listJourneys(repoRoot)` for the known-journey baseline, then `journey.js`'s exported `_mergeStateFeaturesIntoJourneyList(allJourneys, repoRoot)` — the existing canonical builder that already merges CLI-only `pipeline-state.json` features with no journey-store record. Do not write a second independent query (ADR-028).
- Presence-only signal: `merged.length > allJourneys.length`. No count returned to the caller — the DoR explicitly rules out a numeric badge here (risk of disagreeing with the sidebar's own separate Postgres-only count).
- Wrap both the `listJourneys` and merge calls in `try/catch`, defaulting to `false`/`[]` on error — a dashboard load must never 500 because of this best-effort discoverability check.

## Task 2: Thread the signal into `_renderProductDashboard` and render the entry point

**Files:** `src/web-ui/routes/products.js`
**Covers:** AC1, AC3, AC5, AC6

- Add a 7th parameter `hasNoProductWork` to `_renderProductDashboard(products, login, navProducts, activeProductId, noProductJourneyCount, isAdmin, hasNoProductWork)`. Additive — existing 6-arg callers (including the pre-existing test `tests/check-fresc-s1-empty-state-clarity-copy.js`) get `undefined` -> falsy -> unchanged output.
- In `handleGetDashboard`'s non-board, non-JSON branch: `hasNoProductWork = navSummary.noProductJourneyCount > 0 || _hasUnbackfilledCliFeatures(repoRoot)` — real Postgres no-product journeys (AC1) OR CLI-only unbackfilled features (AC2), either is sufficient.
- Render a single presence-only entry point (`"No product work →"`, no count) linking to `/journey` (AC3 — same destination the sidebar's own "No product" link already provides; no new list view per Out of Scope).
- Reuse the existing card visual style, inserted after the product cards, before the closing content — verified not to touch the existing per-product `<a href="/products/:id">` card markup (AC5) or the sidebar's own `renderProductsSection` output (AC6, `sw-product-nav-item--no-product`).

## Task 3: Tests

**Files:** `tests/check-wnl-s3-dashboard-no-product-entry.js`
**Covers:** AC1-AC6

- Reuse the `makePool`/`makeRes`/req-shape mocking convention from `tests/check-fresc-s1-empty-state-clarity-copy.js`.
- `makeFixtureRepoRoot(features)` — `fs.mkdtempSync` + a `.github/pipeline-state.json` fixture, set via `repoRootAdapter.setRepoRoot(tmpRoot)`.
- Seed `journeyStore.createJourney(KNOWN_JOURNEY_SLUG, 'default')` once at file scope so `listJourneys` never hits its D37 empty-adapter throw, and so AC4's negative case has a real "already has a journey" slug to assert against.
- AC2's fixture deliberately returns 0 Postgres no-product rows (`makePool([], [])`) with one CLI-only `pipeline-state.json` feature — this is the exact scenario a naive Postgres-only check would miss; confirmed by an ad hoc sanity run simulating that naive path (entry point would be absent), demonstrating the test genuinely discriminates the fix from a regression.
- AC3 isolates the entry point's own `<a>` tag by splitting the rendered HTML on `'<a '` and taking the segment containing "No product work" — a naive substring/window search around the text incorrectly matched a different card's link when multiple `<a>` tags were within range.

## Verification

- [x] All 6 ACs pass: `node tests/check-wnl-s3-dashboard-no-product-entry.js`
- [ ] Full suite baseline (`npm test`) shows no new failures beyond the known pre-existing `tests/check-p3.5-validate-trace.js` failure
- [ ] Route/handler E2E coverage check (`products.js` is a route file) — identify and run any pre-existing `tests/e2e/*.spec.js` covering `/dashboard`
- [ ] Backward compatibility with `tests/check-fresc-s1-empty-state-clarity-copy.js` confirmed (6-arg call site unaffected)
