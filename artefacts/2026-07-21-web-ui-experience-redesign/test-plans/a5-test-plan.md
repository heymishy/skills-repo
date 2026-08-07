## Test Plan: Surface discovery-only and ideation-only work in a Roadmap tab

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a5-roadmap-tab.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Discovery-only artefact appears with stage label + date | 1 | 1 | — | — | — | 🟢 |
| AC2 | Ideate-only artefact appears with distinct stage label | 1 | — | — | — | — | 🟢 |
| AC3 | Already-tracked feature does NOT appear | 1 | — | — | — | — | 🟢 |
| AC4 | Empty state when nothing early-stage exists | 1 | — | — | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Fixtures — real folder-structure fixtures mirroring this repo's own `artefacts/2026-06-04-strategy-data-grounding/` (has both discovery.md and ideate.md) and `artefacts/2026-07-13-context-graph-primitive/` (discovery-only), used as reference shapes for synthetic test fixtures rather than reading the real repo's artefacts directly in tests (to avoid test fragility if those real folders ever change).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC4 | A temp fixture directory with discovery.md/ideate.md files, a matching pipeline-state.json | Synthetic, written to a temp dir per test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### A feature with only discovery.md and no pipeline-state.json entry is detected as roadmap-eligible
- **Verifies:** AC1
- **Precondition:** A temp fixture folder with `discovery.md` (Status: Approved, Created: a known date), no corresponding pipeline-state.json entry
- **Action:** Run the roadmap-scan function
- **Expected result:** Returns an entry with the feature's title, stage "Discovery", and the date extracted from discovery.md

### A feature with only ideate.md is labelled distinctly from a discovery-only feature
- **Verifies:** AC2
- **Precondition:** A temp fixture with `ideate.md` present, no `discovery.md`
- **Action:** Run the scan
- **Expected result:** Returns stage "Ideate only" — a different label string than "Discovery"

### A feature already tracked in pipeline-state.json is excluded
- **Verifies:** AC3
- **Precondition:** A temp fixture with `discovery.md` AND a matching entry in a fixture pipeline-state.json
- **Action:** Run the scan
- **Expected result:** That feature does NOT appear in the roadmap-eligible results

### Zero early-stage artefacts returns an empty array, not an error
- **Verifies:** AC4
- **Precondition:** An empty artefacts fixture directory
- **Action:** Run the scan
- **Expected result:** Returns `[]`, no exception thrown

---

## Integration Tests

### Roadmap tab renders the empty state cleanly when the scan returns nothing
- **Verifies:** AC4
- **Components involved:** route handler, roadmap-scan function
- **Precondition:** Scan returns `[]`
- **Action:** Render the Roadmap tab
- **Expected result:** HTML shows "Nothing in early-stage discovery right now" (or equivalent), not a blank section or error

### Roadmap tab renders a real discovery-only entry with its stage pill
- **Verifies:** AC1
- **Components involved:** route handler, roadmap-scan function, rendering
- **Precondition:** Scan returns one discovery-only entry
- **Action:** Render
- **Expected result:** HTML shows the feature title, a "Discovery" stage pill, and the date

---

## NFR Tests

### Artefact scan completes within budget
- **NFR addressed:** Performance
- **Measurement method:** Time the scan against a fixture directory with 100 feature folders
- **Pass threshold:** Under 1 second
- **Tool:** Manual timing script

---

## Out of Scope for This Test Plan

- The full sync/cache pipeline — explicitly deferred at the story level; this plan only covers the read-at-render-time approach actually being built.

## Test Gaps and Risks

None.
