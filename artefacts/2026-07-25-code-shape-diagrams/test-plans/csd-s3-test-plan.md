## Test Plan: /design//definition produce System Architecture + Program Design diagrams

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s3-design-produces-architecture-and-program-diagrams.md
**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Test plan author:** Copilot (Claude Sonnet 5)
**Date:** 2026-07-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Completing System Architecture section generates a `system-architecture` diagram block, saved to the DoR artefact | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Completing Program Design section generates a `program-design` diagram block, saved similarly | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Diagrams generated at feature granularity by default (one set per feature, refreshed as stories complete) | 2 tests | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A mock `/design`/`/definition` session with a completed System Architecture section (mock skill output) | Synthetic session transcript fixture | None | |
| AC2 | Same session with a completed Program Design section | Synthetic session transcript fixture | None | |
| AC3 | A multi-story feature fixture (2+ stories in one feature) | Synthetic fixture, modelled on this repo's own multi-story epic shape | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### systemArchitectureSectionCompletionProducesDiagramBlock
- **Verifies:** AC1
- **Precondition:** A mock session where the operator has just completed the System Architecture section
- **Action:** Trigger the diagram-generation step
- **Expected result:** A content-block object with `type: 'system-architecture'` and valid mermaid syntax is produced
- **Edge case:** No

### programDesignSectionCompletionProducesDiagramBlock
- **Verifies:** AC2
- **Precondition:** Same session, Program Design section completed
- **Action:** Trigger the diagram-generation step
- **Expected result:** A content-block object with `type: 'program-design'` and valid mermaid syntax is produced
- **Edge case:** No

### diagramSetGeneratedOnceForFirstStoryOfAFeature
- **Verifies:** AC3
- **Precondition:** A brand-new feature with no prior diagram set
- **Action:** Complete `/design` for the feature's first story
- **Expected result:** One diagram set (System Architecture + Program Design) is created for the feature
- **Edge case:** No

### diagramSetRefreshedNotDuplicatedForSecondStoryOfSameFeature
- **Verifies:** AC3
- **Precondition:** The same feature, diagram set already exists from the first story
- **Action:** Complete `/design` for the feature's second story
- **Expected result:** The existing diagram set is updated/refreshed in place — a second, duplicate diagram set is not created alongside it
- **Edge case:** Yes — this is the case that would reveal a "per-story instead of per-feature" bug

---

## Integration Tests

### diagramBlockSavedAsPartOfDorArtefactAlongsideProse
- **Verifies:** AC1, AC2
- **Components involved:** `/design`/`/definition` session output, canvas content-block mechanism (csd-s2)
- **Precondition:** A completed `/design` session for a real feature
- **Action:** Save the DoR artefact
- **Expected result:** The saved artefact contains both the existing prose sections AND the new diagram content-blocks, renderable via csd-s2's mechanism

### featureGranularityHoldsAcrossAThreeStoryFeature
- **Verifies:** AC3
- **Components involved:** `/design`/`/definition` session output, feature artefact structure
- **Precondition:** A 3-story feature fixture
- **Action:** Complete `/design` for all 3 stories in sequence
- **Expected result:** Exactly one diagram set exists for the feature after all 3 stories are processed, refreshed (not duplicated) at each step

---

## NFR Tests

None — confirmed with story owner. This story's own NFR section notes a context-window operating consideration (not a hard automated gate), which is out of scope for automated testing per its own framing in the story artefact.

---

## Out of Scope for This Test Plan

- Data Model diagrams — covered by csd-s4's own test plan.
- As-built diagram generation — covered by csd-s5's own test plan.
- The case where `/definition` explicitly overrides the default granularity to per-story for a specific feature (discovery's own Clarification log Q4 left this as a judgment call, not a fixed behaviour to test against here).

---

## Test Gaps and Risks

None identified — all ACs are covered by unit/integration tests, no CSS-layout-dependent or external-dependency gaps for this story.
