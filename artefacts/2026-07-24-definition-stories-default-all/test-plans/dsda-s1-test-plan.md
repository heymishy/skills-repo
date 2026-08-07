## Test Plan: Default to all stories from /definition when starting the per-story review sequence

**Story reference:** artefacts/2026-07-24-definition-stories-default-all/stories/dsda-s1.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Story list auto-populated on render | — | 1 test | — | — | — | 🟢 |
| AC2 | Auto-populated list proceeds correctly through per-story sequence | — | 1 test | — | — | — | 🟢 |
| AC3 | Manual edit affordance still reachable | — | — | 1 test | — | — | 🟢 |
| AC4 | Parse failure falls back to manual entry, doesn't block | 1 test | — | — | — | — | 🟢 |
| AC5 | Extraction matches client-side parser's own story-ID output across formats | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Fixtures
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1-AC2 | A real definition artefact (H1 format) with 2+ stories | Synthetic fixture matching the real format | None | |
| AC3 | Same, rendered page | Synthetic | None | |
| AC4 | A malformed/unrecognisable definition artefact | Synthetic (e.g. empty file, or a format neither parser format matches) | None | |
| AC5 | Both known formats (H1 epic/story headers, flat-story fallback) | Synthetic fixtures mirroring the client-side parser's own test coverage, if any exists; otherwise hand-authored matching the two documented formats | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### serverSideExtractorMatchesH1FormatStoryIds

- **Verifies:** AC5
- **Precondition:** A definition artefact using the H1 epic/story header format (`# Epic N: Name`, `# Story id — Title`)
- **Action:** Run the new server-side story-ID extractor against this fixture
- **Expected result:** Returns the exact same set of story IDs the client-side `parseDefinitionArtefact` would extract for the identical input (cross-checked by running the client-side regex logic in a Node context against the same fixture, or by hand-verifying against known expected IDs)
- **Edge case:** No

### serverSideExtractorHandlesParseFailureGracefully

- **Verifies:** AC4
- **Precondition:** A malformed or unrecognised-format definition artefact (e.g. plain prose with no story markers)
- **Action:** Run the extractor
- **Expected result:** Returns an empty array (or partial results) without throwing — the caller (`handleGetStories`) is responsible for falling back to manual entry, not the extractor itself failing loudly
- **Edge case:** Yes — the explicit "cannot parse" case this story's AC4 depends on

---

## Integration Tests

### storiesPageAutoPopulatesFromDefinitionArtefact

- **Verifies:** AC1
- **Components involved:** `handleGetStories`, new server-side extractor, journey's `completedStages`
- **Precondition:** A journey whose `/definition` stage completed with a real, parseable artefact
- **Action:** GET `/journey/:id/stories`
- **Expected result:** Rendered page's story-list input (textarea or equivalent) is pre-filled with every extracted story ID, not empty

### autoPopulatedListProceedsThroughPerStorySequence

- **Verifies:** AC2
- **Components involved:** `handlePostStories`, `PER_STORY_SEQ` progression (`handlePostGateConfirm`)
- **Precondition:** Same as above; operator submits the auto-populated list unmodified
- **Action:** POST the unmodified auto-populated list, then drive the resulting review session to completion, then gate-confirm
- **Expected result:** Progresses through review → test-plan → definition-of-ready for each story in the auto-populated list, identical to today's manually-typed flow's own existing behaviour

---

## E2E Tests

### manualEditAffordanceStillReachable

- **Verifies:** AC3
- **Precondition:** The auto-populated `/journey/:id/stories` page from AC1
- **Action:** In a real browser (Playwright, local `NODE_ENV=test` harness), locate and interact with the edit affordance (e.g. an editable textarea, or an "edit list" toggle) to remove one story ID
- **Expected result:** The edited list (not the original auto-populated one) is what gets submitted — confirms the operator retains real control, not just a cosmetic pre-fill

---

## NFR Tests

### None — confirmed with story owner

No performance/security/audit NFRs beyond the trivial file-read/parse cost already covered above.

---

## Out of Scope for This Test Plan

- Any test of `parseDefinitionArtefact`'s own client-side canvas-rendering behaviour — unchanged, not touched by this story.
- Any test of `PER_STORY_SEQ`'s own progression logic beyond confirming this story's auto-populated input flows through it correctly — the progression logic itself is out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
