## Test Plan: Fix the Story-Detail Dead End With a Breadcrumb and Back Link

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s4.md
**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Product breadcrumb segment renders when `productId` resolves | 1 | 1 | — | — | — | 🟢 |
| AC1a | Phase/Epic segment resolves when possible, degrades gracefully otherwise | 2 | — | — | — | — | 🟢 |
| AC2 | Clicking the product name navigates back to the product page | 1 | — | — | — | — | 🟢 |
| AC3 | No-artefacts case still shows the breadcrumb, never a bare page | 1 | 1 | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No triggering language found. The breadcrumb is server-rendered HTML content and a link `href` — testable by inspecting the response body's markup and link targets directly.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — reuses `das-s1`/`acdg-s1`'s own proven `journeyStore.createJourney` + `setJourneyFields` fixture pattern for the Product segment; a hand-built `pipelineState` fixture for the Phase/Epic reverse-lookup case.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture journey created via `journeyStore.createJourney` + `setJourneyFields({productId: ...})` | Synthetic, in-test | None | Same pattern as `acdg-s1`'s own `productId`-set fixture |
| AC1a | A fixture `pipelineState` with a feature containing `epics[].stories[]`, and a story slug nested inside it (not itself a journey-store feature) | Synthetic, in-test | None | Reproduces the confirmed live case (`dic.5`-shaped nesting) |
| AC2 | Same as AC1 | Synthetic, in-test | None | |
| AC3 | A fixture with no artefacts written for the feature | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Product breadcrumb segment renders using journeyForPage.productId when resolvable
- **Verifies:** AC1
- **Precondition:** Fixture journey created with `productId` set, matching a real product name in the fixture
- **Action:** Call `handleGetFeatureArtefacts` for this feature slug
- **Expected result:** The response HTML contains a breadcrumb with the product's name, sourced from `journeyForPage.productId`
- **Edge case:** No

### Phase/Epic segment resolves via reverse lookup when the story is nested in a known feature
- **Verifies:** AC1a
- **Precondition:** Fixture `pipelineState` with a feature containing an epic with this exact story slug nested inside it
- **Action:** Call `handleGetFeatureArtefacts` for the nested story slug
- **Expected result:** The response HTML's breadcrumb includes the resolved epic/phase name alongside the product segment
- **Edge case:** Yes

### Phase/Epic segment gracefully omits when not resolvable — no broken breadcrumb
- **Verifies:** AC1a
- **Precondition:** A feature slug with no matching entry anywhere in `pipelineState`'s `epics[].stories[]` tree, and no resolvable `journeyForPage` either
- **Action:** Call `handleGetFeatureArtefacts` for this slug
- **Expected result:** The response still renders a coherent page (at minimum a "Back to product list" link) — never a thrown exception, never a blank/malformed breadcrumb element
- **Edge case:** Yes — the genuine worst case (nothing resolvable at all)

---

## Integration Tests

### Clicking the product name in the breadcrumb navigates back to that product's page
- **Verifies:** AC1, AC2
- **Components involved:** `handleGetFeatureArtefacts`, the breadcrumb's product link, `handleGetProductView`
- **Precondition:** Fixture journey with `productId` set, matching a real product
- **Action:** Extract the breadcrumb's product-name link `href` from the response, then request that URL
- **Expected result:** The second request resolves to that same product's page (`/products/:id`), not a 404 or a different product

### No-artefacts case still shows breadcrumb and an honest message, never a bare dead end
- **Verifies:** AC3
- **Components involved:** `handleGetFeatureArtefacts`
- **Precondition:** Fixture journey with `productId` set but zero artefacts written for the feature (reproduces the confirmed live "No artefacts found" case)
- **Action:** Call `handleGetFeatureArtefacts`
- **Expected result:** The response includes the resolvable breadcrumb segments (at minimum Product) AND the existing "No artefacts found for this feature" message — both present together, not one replacing the other

---

## NFR Tests

### Breadcrumb resolution adds no new query for the common (Product-resolvable) case
- **NFR addressed:** Performance
- **Measurement method:** Code review confirms the Product segment reuses the existing `journeyForPage` lookup already performed by this handler (no new query); the Phase/Epic reverse lookup, when needed, is scoped to a single pass over already-loaded pipeline-state data, not a new per-request network call
- **Pass threshold:** No new database/network call introduced for the Product segment
- **Tool:** Manual code review

### Breadcrumb links are keyboard-navigable
- **NFR addressed:** Accessibility
- **Measurement method:** Assert breadcrumb segments render as real `<a>` elements with visible focus styling (matching this codebase's existing link/focus convention), not `<span>`/`<div>` with only a click handler
- **Pass threshold:** Markup inspection confirms real anchor elements
- **Tool:** Node.js assert-based test helper (this repo's `npm test` runner)

---

## Out of Scope for This Test Plan

- Redesigning the artefact-content display itself once a story does have real artefacts — explicitly out of scope per the story.
- Performance of the reverse lookup at full production scale (531+ stories) — a scoped correctness test, not a load test, is sufficient for this MVP; revisit if the reverse lookup proves slow in practice post-deploy.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| The reverse-lookup's own implementation approach (linear scan vs. a precomputed index) is not prescribed by this test plan | This is genuinely an implementation-plan decision, not a test-plan one — the ACs test observable behaviour, not the lookup's internal algorithm | If a precomputed index is chosen instead of a linear scan, no test in this plan needs to change — they all assert on the response, not the lookup mechanism |
