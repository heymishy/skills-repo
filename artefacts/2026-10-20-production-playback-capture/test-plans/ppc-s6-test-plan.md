# Test Plan: Dashboard-shell UX/CX parity and scope/benefit summary

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s6-dashboard-shell-parity.md
**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Test plan author:** Claude (session)
**Date:** 2026-10-26
**Confirmed test runner:** `node scripts/run-all-tests.js` (via `npm test`) — plain Node.js `assert`-based tests, confirmed from `package.json`'s own `scripts.test` entry, not assumed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Page wrapped via `renderShellWithNav` — nav, product context, Products sidebar all present | — | 2 tests | — | — | — | 🟢 |
| AC2 | Scope/Benefit sections render `escHtml()`-escaped `discovery.md`/`benefit-metric.md` content via `fetchArtefact`, using `.sw-card`/`.sw-section-title` | 2 tests | 2 tests | — | — | — | 🟢 |
| AC3 | Coverage line reused as-is from `renderCoverageSummaryHtml`/`computeAcCoverageSummary` | — | 1 test | — | — | — | 🟢 |
| AC4 | Missing `discovery.md`/`benefit-metric.md` → "not available" state naming the specific missing artefact; rest of page unaffected | — | 2 tests | — | — | — | 🟢 |
| AC5 | Existing forms still submit correctly, no client-side JS required, after the shell wrap | — | 1 test | — | — | — | 🟢 |
| AC6 | Scope/Benefit cards stack to one column below 768px | — | — | 2 tests | — | CSS-layout-dependent | 🟡 |

---

## Coverage gaps

AC6 is genuinely CSS-layout-dependent — whether two cards render side-by-side or stacked at a given viewport width is a real-browser layout question, not something jsdom computes. Per Step 3a, this is handled as 2 new Playwright E2E tests (`tests/e2e/ppc-s6-responsive-summary.spec.js`), directly mirroring `tests/e2e/dsa-s6-mobile-responsiveness.spec.js`'s own established viewport-resize + `getBoundingClientRect`/`scrollWidth` check shape. Playwright is already configured repo-wide (ADR-018) — no tooling gap to accept.

---

## Test Data Strategy

**Source:** Mixed — mocked `fetchArtefact` responses (fake `discovery.md`/`benefit-metric.md` markdown content, including one deliberately malicious fixture for the XSS test) for route/render tests, same fake-pool/`journey-store` pattern `ppc-s1`–`ppc-s4` already use, real Playwright (headless) for the 2 E2E responsive tests.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fake pool/tenant fixture with at least one product, so `renderShellWithNav`'s own `getProductsNavSummary` has real data to render | Fixture | None | Mirrors `products.js`'s own existing shell tests |
| AC2 | Fake `discovery.md`/`benefit-metric.md` markdown fixtures (normal content); a second fixture containing `<script>alert(1)</script>` and a literal `"` in the Problem Statement, for the XSS test | Fixture | None | The malicious fixture is the required "XSS injection" minimum-coverage case per `web-ui-patterns.md`'s HTML render function unit test pattern |
| AC3 | A fixture AC list with partial coverage (reuses `/playback`'s own existing coverage fixtures) | Fixture | None | No new fixture needed — function reused as-is |
| AC4 | A `fetchArtefact` mock that 404s for `discovery.md` only, and a separate case that 404s for `benefit-metric.md` only | Fixture | None | Both files must be tested missing independently, per AC4's own wording naming "the specific missing artefact" |
| AC5 | Existing `ppc-s1`/`ppc-s2` form-submission fixtures, unchanged | Fixture | None | Regression check — no new fixture |
| AC6 | A feature fixture with both Scope and Benefit content present (so both cards render), under real Playwright at two viewport widths | Fixture (seeded via `/test/session`) | None | Mirrors `dsa-s6-mobile-responsiveness.spec.js`'s own tenant/session seeding |

### PCI / sensitivity constraints

None.

### Gaps

See Gap table below (AC6).

---

## Unit Tests

### renderScopeBenefitSummary_escapesXssInjection_fromDiscoveryAndBenefitMetricContent

- **Verifies:** AC2 (security — MC-SEC-01, mandatory "XSS injection" coverage per `web-ui-patterns.md`'s HTML render function unit test pattern)
- **Precondition:** A `discovery.md` fixture whose Problem Statement contains `<script>alert(1)</script>` and a literal `"` character
- **Action:** Call the render function that builds the Scope/Benefit HTML
- **Expected result:** Output string does NOT contain an unescaped `<script>` tag; the `"` character is rendered as `&quot;` (or equivalent); the escaped text is still visibly present as plain text

### renderScopeBenefitSummary_emptyOrNullContent_rendersGracefulEmptyState_doesNotThrow

- **Verifies:** AC2/AC4 (mandatory "empty/null data" coverage per the same pattern)
- **Precondition:** `null` or empty-string Problem Statement / metric targets
- **Action:** Call the render function
- **Expected result:** Does not throw; renders the AC4 "not available" state, not a blank or broken fragment

---

## Integration Tests

### handleGetPlaybackEvidence_wrapsPageInRenderShellWithNav_sidebarPresent

- **Verifies:** AC1
- **Components involved:** Route handler, fake pool with a seeded product, `renderShellWithNav`
- **Precondition:** Tenant with at least one product
- **Action:** Request the capture-evidence page
- **Expected result:** Response HTML contains the Products-nav sidebar markup (e.g. the product list / "+ New product" link) — proving `renderShellWithNav`, not a bare `renderShell`, was called

### handleGetPlaybackEvidence_doesNotCallRenderShellDirectly

- **Verifies:** AC1 (regression guard for `/review` finding `1-H1`)
- **Components involved:** Source-level/structural assertion, mirroring `pncg-s1`'s own manifest-driven structural check (strip comments/strings before pattern search, per that story's own documented blind-spot fix)
- **Precondition:** None
- **Action:** Parse `playback-evidence.js`'s real source (comments/strings stripped) for a call to the bare `renderShell(` identifier
- **Expected result:** No direct `renderShell(` call site exists outside `renderShellWithNav`'s own internal implementation; `playback-evidence.js` only calls `renderShellWithNav`

### handleGetPlaybackEvidence_rendersScopeAndBenefitFromFetchArtefact_tenantScoped

- **Verifies:** AC2
- **Components involved:** Route handler, mocked `fetchArtefact`
- **Precondition:** Mocked `fetchArtefact` returns fixture `discovery.md`/`benefit-metric.md` content for the correct `tenantId`/`productId`/`featureSlug`
- **Action:** Request the page
- **Expected result:** Response HTML contains the Scope and Benefit sections built from that fixture content, using the `.sw-card`/`.sw-section-title` classes (string-fragment assertion, not full-snapshot)

### handleGetPlaybackEvidence_summaryContent_neverReadFromLocalDisk

- **Verifies:** AC2 (ADR-025 regression guard)
- **Components involved:** Same, with the local-disk `fs.readFileSync` path spied/stubbed to throw if called
- **Precondition:** Same fixture
- **Action:** Request the page
- **Expected result:** 200, correct content; the local-disk read spy is never called

### handleGetPlaybackEvidence_coverageLine_rendersAboveAcSections

- **Verifies:** AC3
- **Components involved:** Route handler, existing `renderCoverageSummaryHtml` (reused unmodified)
- **Precondition:** A feature fixture with partial AC coverage
- **Action:** Request the page
- **Expected result:** Response HTML contains the partial-coverage string (`"N of M ACs have captured evidence"`) positioned before the per-AC sections in document order

### handleGetPlaybackEvidence_missingDiscoveryMd_showsNotAvailableState_namesDiscoveryMdSpecifically

- **Verifies:** AC4
- **Components involved:** Route handler, `fetchArtefact` mocked to 404 for `discovery.md` only (benefit-metric.md succeeds)
- **Precondition:** Mixed fixture
- **Action:** Request the page
- **Expected result:** Scope section shows a "not available" message naming `discovery.md` specifically; Benefit section still renders normally; AC list/capture forms unaffected

### handleGetPlaybackEvidence_missingBenefitMetricMd_showsNotAvailableState_namesBenefitMetricMdSpecifically

- **Verifies:** AC4 (the other file, independently)
- **Components involved:** Same, reversed fixture
- **Precondition:** Mixed fixture
- **Action:** Request the page
- **Expected result:** Benefit section shows a "not available" message naming `benefit-metric.md` specifically; Scope section still renders normally

### existingCaptureForms_stillSubmitCorrectly_afterShellWrap

- **Verifies:** AC5 (regression)
- **Components involved:** Existing `ppc-s1`/`ppc-s2` form-submission route tests, re-run unmodified against the now-shell-wrapped page
- **Precondition:** None
- **Action:** Re-run `check-ppc-s1-playback-evidence-route.js`'s and `check-ppc-s2-capture-all-route.js`'s existing form-submission assertions
- **Expected result:** All pass unchanged — the shell wrap altered layout/chrome only, not form behaviour

---

## E2E Tests

### scopeBenefitCards_desktopWidth_renderSideBySide

- **Verifies:** AC6 (baseline, before testing the responsive override)
- **File:** `tests/e2e/ppc-s6-responsive-summary.spec.js` (new)
- **Precondition:** Seeded tenant/product/feature fixture via `/test/session?sessionId=...&tenantId=...` (mirrors `dsa-s6-mobile-responsiveness.spec.js`)
- **Action:** Load the page at a desktop viewport (e.g. 1280×800)
- **Expected result:** Scope and Benefit cards render in a multi-column arrangement

### scopeBenefitCards_narrowViewport_stackToSingleColumn_noHorizontalOverflow

- **Verifies:** AC6
- **File:** Same spec file, second test
- **Precondition:** Same fixture
- **Action:** Resize/load at `max-width: 768px` (e.g. 375×667, matching `DESIGN.md`'s own "Verification bar" convention)
- **Expected result:** Scope and Benefit cards stack to a single column; `document.body.scrollWidth` does not exceed the viewport width; neither card collapses to an illegibly narrow or word-wrap-mangled state

---

## NFR Tests

### summaryFetch_boundedOverhead_twoAdditionalFetchArtefactCallsPerPageLoad

- **NFR addressed:** Performance
- **Measurement method:** Call-count spy on the mocked `fetchArtefact`
- **Pass threshold:** Exactly 2 calls per page load (discovery + benefit-metric), not more
- **Tool:** Node `assert` (call-count spy)

### summaryContent_tenantScoped_noNewCrossTenantExposure

- **NFR addressed:** Security
- **Measurement method:** Same as the Integration cross-tenant-style tests already covering AC2/AC4 — listed here too since it's also the NFR evidence
- **Pass threshold:** `fetchArtefact` is always called with the requesting tenant's own `tenantId`/`productId`, never another tenant's
- **Tool:** Node `assert`

### shellWrap_keyboardOperability_preserved

- **NFR addressed:** Accessibility (AC5's own NFR)
- **Measurement method:** `existingCaptureForms_stillSubmitCorrectly_afterShellWrap` (above) is also the evidence — forms submitting correctly with no client-side JS required is the observable proxy for keyboard operability in this repo's existing test style (consistent with `ppc-s1`'s own precedent, which also did not use a dedicated accessibility-tree tool)
- **Pass threshold:** Same as that test
- **Tool:** Node `assert`

---

## Out of Scope for This Test Plan

- Any change to `/playback`'s own test suite — this story only touches `ppc`'s capture-evidence page (per the story's own Out of Scope).
- Real-time/live-updating coverage line testing — unchanged `_renderCaptureAllProgress` mechanism, not touched by this story.

---

## Test Gaps and Risks

| Gap | Gap type | Reason | Mitigation |
|-----|----------|--------|-------------|
| AC6 (768px stacking) cannot be verified by a DOM-simulation test | CSS-layout-dependent | jsdom does not compute real CSS layout/reflow at a given viewport width | Handled via 2 new Playwright E2E tests (`tests/e2e/ppc-s6-responsive-summary.spec.js`) — E2E tooling already configured (ADR-018), no RISK-ACCEPT needed for tooling absence |
