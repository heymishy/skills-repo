## Test Plan: A completed stage's resumed history silently drops its final assistant message when nothing followed it

**Story reference:** artefacts/2026-08-10-resume-history-trailing-turn-fix/stories/rht-s1-trailing-assistant-turn-shown-in-history.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Lone trailing assistant turn displays as a message | 1 test | — | — | — | — | 🟢 |
| AC2 | Existing paired assistant+user case unchanged | 1 test | — | — | — | — | 🟢 |
| AC3 | Mixed paired-then-trailing sequence, nothing dropped | 1 test | — | — | — | — | 🟢 |
| AC4 | No interactive controls, any scenario | 1 test | — | — | — | — | 🟢 |
| AC5 | Zero-turns fallback path unchanged | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Reuses `check-drh-s1-resume-history-diagram-rendering.js`'s `makeCompletedJourneyFixture`/`mockReq`/`mockRes` pattern with hand-authored `_dshTurns` arrays for each scenario.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `[{role:'assistant', content: '...'}]` — single turn | Hand-authored | None | |
| AC2 | `[{role:'assistant',...},{role:'user',...}]` | Hand-authored | None | |
| AC3 | `[{assistant},{user},{assistant}]` | Hand-authored | None | |
| AC4 | Same as AC1/AC3 | Hand-authored | None | |
| AC5 | Empty turns array (existing `check-dsh-s3-breadcrumb-split-view.js` AC2 fixture, re-run unmodified) | Existing test file | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handleGetJourneyStageView_loneTrailingAssistantTurn_displaysAsMessage

- **Verifies:** AC1
- **Precondition:** A completed stage whose durable turns are `[{role:'assistant', content: 'Producing the full definition now.'}]`.
- **Action:** `handleGetJourneyStageView`.
- **Expected result:** Response HTML's `#chat-messages` region contains the text "Producing the full definition now." — not empty.

### handleGetJourneyStageView_pairedAssistantUser_unchangedFromToday

- **Verifies:** AC2
- **Precondition:** Turns `[{role:'assistant', content:'Q1'}, {role:'user', content:'A1'}]`.
- **Action:** Same.
- **Expected result:** Both "Q1" and "A1" appear, paired as one Q&A entry — byte-shape-identical to `check-dsh-s3-breadcrumb-split-view.js`'s existing AC1 assertion pattern (re-confirms no regression, doesn't just newly assert it).

### handleGetJourneyStageView_pairedThenTrailingAssistant_bothDisplay

- **Verifies:** AC3
- **Precondition:** Turns `[{assistant:'Q1'}, {user:'A1'}, {assistant:'Final summary'}]`.
- **Action:** Same.
- **Expected result:** All three of "Q1", "A1", and "Final summary" appear in `#chat-messages` — nothing dropped anywhere in the sequence.

### handleGetJourneyStageView_trailingAssistantTurn_stillNoInteractiveControls

- **Verifies:** AC4
- **Precondition:** Same fixture as AC1.
- **Action:** Same.
- **Expected result:** No `<input>`, no `<textarea>`, no `type="submit"` element anywhere in the response — matching `drh-s1`'s own AC4 test pattern, now re-confirmed for this specific new-content case.

### handleGetJourneyStageView_zeroTurns_unchangedArtefactOnlyFallback

- **Verifies:** AC5
- **Precondition:** `journeyRoutes.setGetTurnsForStage(async function() { return []; })`.
- **Action:** Same.
- **Expected result:** Falls through to the artefact-only `sr-paper` wrapper exactly as `check-dsh-s3-breadcrumb-split-view.js`'s existing AC2 (edge case) test already asserts — re-run that exact existing test unmodified as the regression guard, do not duplicate its assertions here.

---

## Integration Tests

None required beyond the unit tests above — each already exercises the real `handleGetJourneyStageView` handler end to end.

---

## NFR Tests

None beyond the ACs above.

---

## Out of Scope for This Test Plan

- The live (non-historical) chat page's own turn rendering — unaffected, not covered here.
- Real browser visual confirmation — the operator already live-confirmed the underlying symptom on staging; this test plan proves the server-side fix, matching the level `drh-s1`'s own test plan used.

---

## Test Gaps and Risks

None identified as blocking.
