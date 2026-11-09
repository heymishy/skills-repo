## Test Plan: Web UI rendering alongside incident records

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s5-web-ui-rendering.md
**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Test plan author:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

---

## Dependency note (read before running)

**This story has a hard upstream dependency on `itar-s3`** (initiative 4's "Web UI rendering" story), which extends `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`) to render incident records in the first place. Every integration test below assumes `itar-s3`'s extension already exists and its own test plan (`artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s3-web-ui-rendering-test-plan.md`) already passes. If `itar-s3` has not merged, these tests cannot run — per the story's own Architecture Constraints, this story is blocked, not reworked into a standalone view, so this is a sequencing precondition, not a test gap to otherwise mitigate.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Deferred-item record renders alongside incident records, distinguished by text label (not colour alone) | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | `revisitCondition` visible inline, no click-through | 1 test | — | — | — | — | 🟢 |
| AC3 | Both ddft-s1 seeded real records render without error | — | 1 test | — | — | — | 🟢 |
| AC4 | Zero deferred-item records → incident-only view renders normally, no regression | 1 test | 1 test | — | — | — | 🟢 |

**Step 3a classification:** None of this story's ACs mention drag-drop, pointer coordinates, `getBoundingClientRect`, or any CSS-position-dependent behaviour. "Text label, not colour alone" and "visible without a click-through" are both DOM-content-presence assertions, correctly testable at Unit/Integration level — not mis-categorised as Unit/Integration coverage of a layout-dependent AC.

---

## Coverage gaps

None beyond the upstream `itar-s3` sequencing dependency noted above (not a test-plan gap — a delivery-sequencing precondition).

---

## Test Data Strategy

**Source:** Mixed — Synthetic (type-label/edge-case fixtures) + the two real seeded `ddft-s1` records
**PCI/sensitivity in scope:** No
**Availability:** Available now, contingent on `itar-s3` and `ddft-s1` both existing
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture `workspace/incidents.json` with one `type: "incident"` and one `type: "deferred-item"` record | Synthetic | None | |
| AC2 | A `deferred-item` record with a populated `revisitCondition` | Synthetic | None | |
| AC3 | The two real seeded records from `ddft-s1` (`tfhc-s1`, C1-vs-Option-C) | Real | None | |
| AC4 | A fixture `workspace/incidents.json` with incident records only, zero `deferred-item` records | Synthetic | None | Proves no regression to `itar-s3`'s existing incident-only baseline |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the sequencing dependency noted above.

---

## Unit Tests

### rendersTextLabelDistinguishingRecordType

- **Verifies:** AC1
- **Precondition:** One incident-type and one deferred-item-type record
- **Action:** Run the record-type-label rendering function for each
- **Expected result:** Returns "Incident" for the incident record and "Deferred" (or the implementation's exact equivalent) for the deferred-item record — distinct literal text, not merely distinct CSS classes
- **Edge case:** No

### typeLabelNeverReliesOnColourAlone

- **Verifies:** AC1 (MC-A11Y-02)
- **Precondition:** Rendered markup fragment for a deferred-item record
- **Action:** Inspect the fragment for a text node carrying the type distinction, independent of any colour/class-only styling
- **Expected result:** A literal text string naming the type is present in the DOM, not only a colour-differentiated class with no accompanying text
- **Edge case:** Yes — this is the specific accessibility failure mode MC-A11Y-02 exists to prevent

### rendersRevisitConditionInlineNotBehindClickThrough

- **Verifies:** AC2
- **Precondition:** A deferred-item record with a populated `revisitCondition`
- **Action:** Run the record-rendering function
- **Expected result:** The `revisitCondition` text is present directly within the record's own rendered markup fragment — not behind a link, button, or modal trigger requiring an additional interaction
- **Edge case:** No

### incidentOnlyRenderingUnchangedWhenZeroDeferredItems

- **Verifies:** AC4
- **Precondition:** A record list containing only `type: "incident"` records
- **Action:** Run the section-rendering function
- **Expected result:** Output matches `itar-s3`'s existing incident-only rendering exactly — no deferred-item-related markup appears, no error

---

## Integration Tests

### mixedRecordListRendersBothTypesInOneList

- **Verifies:** AC1
- **Components involved:** `_renderConsolidatedFeaturesSection`, `fetchRepoPath`, fixture `workspace/incidents.json`
- **Precondition:** A connected-repo fixture with one incident and one deferred-item record
- **Action:** Load the consolidated features view
- **Expected result:** Both records render within the same list — not two parallel sections — each carrying its own distinct text label

### bothRealSeededRecordsRenderWithoutError

- **Verifies:** AC3
- **Components involved:** Same rendering pipeline, fixture seeded with `ddft-s1`'s real `tfhc-s1` and C1-vs-Option-C records
- **Precondition:** `itar-s3`'s extension already merged and passing its own test plan
- **Action:** Load the consolidated features view against this fixture
- **Expected result:** Both real records render without throwing, each showing the "Deferred" label and its `revisitCondition` text inline

### zeroDeferredItemsNoRegressionToIncidentOnlyCase

- **Verifies:** AC4
- **Components involved:** Same rendering pipeline, fixture with incident records only
- **Precondition:** `itar-s3`'s own incident-only test case as the known-good baseline
- **Action:** Load the consolidated features view
- **Expected result:** Renders identically to `itar-s3`'s own incident-only baseline — confirmed by comparing against that story's existing passing test, not a new independent assertion of "looks fine"

---

## NFR Tests

### typeLabelMeetsAaContrast

- **NFR addressed:** Accessibility (WCAG 2.1 AA text-contrast, MC-A11Y-02)
- **Measurement method:** Axe-core scan of the rendered record fragment
- **Pass threshold:** Zero contrast violations; zero colour-only-distinction violations
- **Tool:** axe-core (consistent with this repo's existing accessibility NFR tests on `itar-s3`/`urpv-s2`)

### revisitConditionTextIsEscapedOnRender

- **NFR addressed:** Security (MC-SEC-01)
- **Measurement method:** Render a record whose `revisitCondition` contains a literal `<script>` tag; inspect the output markup
- **Pass threshold:** The tag renders as escaped text, never as executable markup
- **Tool:** Node test runner (`node scripts/run-all-tests.js`)

Performance: inherits the already-flagged `[UNKNOWN BASELINE]` fetch-latency gap from `itar-s3`/`urpv-s3` — not a new risk introduced by this story, and not re-tested here; see those stories' own test plans for that open gap. Audit: none beyond what `ddft-s1` already provides on the record itself — no separate NFR test required.

---

## Out of Scope for This Test Plan

- Any filter or rollup UI specific to deferred items — not built in this MVP, per the story's own Out of Scope
- Creating or resolving a deferred-item record from the web UI — read-only rendering only
- `itar-s3`'s own rendering pipeline and its baseline test coverage — this plan only tests the deferred-item-specific extension on top of it

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None new | All four ACs are DOM-content assertions, fully automatable at Unit/Integration level | — |
