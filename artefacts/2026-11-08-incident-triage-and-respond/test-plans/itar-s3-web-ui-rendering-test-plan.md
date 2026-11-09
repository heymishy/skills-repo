# Test Plan Template

## Test Plan: Web UI rendering — first slice of initiative 1's visibility surface

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s3-web-ui-rendering.md
**Epic reference:** artefacts/2026-11-08-incident-triage-and-respond/epics/itar-e1-triage-and-respond.md
**Test plan author:** AI (Claude Sonnet 5)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fetch via `fetchRepoPath`, render each record showing status + triage summary | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Triage summary visible inline, no click-through | 1 test | — | — | — | — | 🟢 |
| AC3 | Missing `incidents.json` → zero items, no error | — | 1 test | — | — | — | 🟢 |
| AC4 | Real migrated record renders end-to-end without error | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|----------|
| None | — | — | — | — |

**Step 3a check performed:** scanned all 4 ACs for drag-drop, pointer-coordinate, `getBoundingClientRect`, CSS-position, or stacking-context language. None found — AC1/AC2's "rendered as a distinct item" and "visible without requiring a separate click-through" describe DOM content/structure (presence and placement in markup), not computed CSS layout or rendered screen position. All ACs are jsdom/string-output testable at Unit/Integration level. No CSS-layout-dependent gap exists for this story.

---

## Test Data Strategy

**Source:** Mocked external services — `fetchRepoPath` is mocked (it is an injectable adapter per `src/web-ui/adapters/artefact-fetcher.js`'s `setFetchRepoPath`); record content itself is Synthetic, plus the real AC4 fixture carried over from itar-s1/itar-s2
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mocked `fetchRepoPath` resolving to a JSON array of ≥2 incident records | Synthetic, via mock | None | Mock returns the decoded-content shape `fetchRepoPath` actually resolves to (a string to be JSON-parsed), not a pre-parsed object — matching the real adapter's documented return type |
| AC2 | A record with a populated `triageSummary` field | Synthetic | None | — |
| AC3 | Mocked `fetchRepoPath` rejecting with `ArtefactNotFoundError` | Synthetic, via mock | None | Matches the real error type `src/web-ui/adapters/artefact-fetcher.js` exports for a missing path |
| AC4 | The same real `tenant_admin_bootstrap_failed` record fixture used in itar-s1 AC4 / itar-s2, now with a triage summary attached | Carried over from itar-s1/itar-s2 fixtures | None | Proves the full chain end-to-end with real content |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderIncidentItem_showsStatusAsTextLabel_notColorAlone
- **Verifies:** AC1 (MC-A11Y-02)
- **Precondition:** A record with `status: 'open'`
- **Action:** Call the incident-item render function with this record
- **Expected result:** Output HTML contains the literal text "open" (or an equivalent human-readable label) — not only a CSS class name or colour swatch with no text
- **Edge case:** No

### renderIncidentItem_showsTriageSummaryInline_whenPresent
- **Verifies:** AC2
- **Precondition:** A record with a populated `triageSummary` field
- **Action:** Call the render function
- **Expected result:** The triage summary text appears in the same rendered block as the record itself — not behind a separate link, route, or `<a href>` requiring navigation away from the current view
- **Edge case:** No

### renderIncidentItem_omitsTriageSummaryBlock_whenAbsent
- **Verifies:** AC1 (graceful handling of a record that hasn't been triage-drafted yet — itar-s1 shipped, itar-s2 hasn't run on it)
- **Precondition:** A record with no `triageSummary` field at all
- **Action:** Call the render function
- **Expected result:** The record still renders (id/status visible); no broken markup, no literal "undefined" text where the summary would be
- **Edge case:** Yes

---

## Integration Tests

### renderConsolidatedFeaturesSection_rendersEachRecordAsDistinctItem_whenIncidentsJsonPresent
- **Verifies:** AC1
- **Components involved:** `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`), mocked `fetchRepoPath`
- **Precondition:** Mocked `fetchRepoPath` resolves to a JSON string decoding to 2 incident records
- **Action:** Call `_renderConsolidatedFeaturesSection` (or `handleGetProductView`) for a product with a connected repo
- **Expected result:** Output contains 2 distinct rendered incident items, each showing its own status and (if present) triage summary
- **Edge case:** No

### renderConsolidatedFeaturesSection_rendersZeroIncidentItems_whenIncidentsJsonFileNotFound
- **Verifies:** AC3
- **Components involved:** Same as above
- **Precondition:** Mocked `fetchRepoPath` rejects with `ArtefactNotFoundError` for the `workspace/incidents.json` path
- **Action:** Call `_renderConsolidatedFeaturesSection`
- **Expected result:** The section renders normally (rest of the page's content present, no thrown exception, no visible error banner); zero incident items appear — matching the same graceful-degradation pattern already established for a missing `decisions.md` (`urpv-s3`)
- **Edge case:** Yes

### renderConsolidatedFeaturesSection_rendersMigratedRealRecord_endToEndWithoutError
- **Verifies:** AC4
- **Components involved:** Same as above, using the real `tenant_admin_bootstrap_failed` fixture (with a triage summary attached, carried over from itar-s2)
- **Precondition:** Mocked `fetchRepoPath` resolves to the real fixture record
- **Action:** Call `_renderConsolidatedFeaturesSection`
- **Expected result:** Renders without throwing; output contains the real record's status and triage summary text — the concrete "≥1 real record" proof this story's benefit metric requires
- **Edge case:** No

---

## NFR Tests

### NFR-SEC-1: incident content is rendered as escaped text, never raw HTML
- **NFR addressed:** Security (MC-SEC-01)
- **Measurement method:** Unit/integration assertion on render output
- **Pass threshold:** A record with `tags`/`summary` containing `<script>alert(1)</script>` renders in output as the literal escaped string (`&lt;script&gt;...`), never as an executable/unescaped tag
- **Tool:** `node scripts/run-all-tests.js`

**Accessibility — no automated contrast test written here.** Per this story's own Architecture Constraints, WCAG 2.1 AA text-contrast compliance for `hasDesignSystemTrack: true` stories is enforced at `/definition-of-ready` by the `H-DESIGN` gate (`scripts/check-design-tokens.js`) against `DESIGN.md`'s tokens — this is a separate, already-governed mechanism, not re-implemented as a Jest unit test in this plan. The AC verification script includes a manual visual check as a smoke-test complement, not a replacement for the DoR gate.

**Performance — no NFR test written, explicitly deferred.** The story's own NFR section states this is `[UNKNOWN BASELINE]` at current (expected low) incident volume, "not assumed safe at scale without measurement" — there is no stated threshold to assert against today.

---

## Out of Scope for This Test Plan

- Rendering of short-track reactive-work tags or `decisions.md` RISK-ACCEPT/SCOPE entries — that's `urpv-s2`/`urpv-s3`, not this story.
- A load rollup or filter UI for incidents — `urpv-s4`'s pattern is not extended here.
- Creating or editing a record from the web UI — read-only rendering only; no test written for write paths.
- Full WCAG 2.1 AA contrast compliance — enforced by the H-DESIGN DoR gate (`scripts/check-design-tokens.js`) against `DESIGN.md`, not re-verified by this test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
