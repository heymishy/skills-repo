# Definition of Done: A completed stage's resumed history silently drops its final assistant message when nothing followed it

**PR:** #706 (commit `65f14210`) | **Merged:** 2026-08-10
**Story:** artefacts/2026-08-10-resume-history-trailing-turn-fix/stories/rht-s1-trailing-assistant-turn-shown-in-history.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: lone trailing assistant turn (no following turn) displays as a message, not an empty panel | Yes | `PASS: AC1: handleGetJourneyStageView_loneTrailingAssistantTurn_displaysAsMessage` | `tests/check-rht-s1-trailing-assistant-turn.js` | None |
| AC2: assistant turn followed by a user turn still pairs into one Q&A entry (existing behaviour unchanged) | Yes | `PASS: AC2: handleGetJourneyStageView_pairedAssistantUser_unchangedFromToday` | `tests/check-rht-s1-trailing-assistant-turn.js` | None |
| AC3: `[assistant, user, assistant]` sequence — both the paired entry and the trailing assistant-only entry display | Yes | `PASS: AC3: handleGetJourneyStageView_pairedThenTrailingAssistant_bothDisplay` | `tests/check-rht-s1-trailing-assistant-turn.js` | None |
| AC4: no interactive input/textarea/submit control appears in any scenario (`readOnly: true` suppression intact) | Yes | `PASS: AC4: handleGetJourneyStageView_trailingAssistantTurn_stillNoInteractiveControls` | `tests/check-rht-s1-trailing-assistant-turn.js` | None |
| AC5: zero-turns / artefact-only fallback path completely unchanged | Yes | `PASS: AC5: handleGetJourneyStageView_zeroTurns_unchangedArtefactOnlyFallback` | `tests/check-rht-s1-trailing-assistant-turn.js` | None |

All 5 ACs map one-to-one onto the 5 named test cases in `check-rht-s1-trailing-assistant-turn.js`; no gaps.

## Scope Deviations

None. The story's own Out of Scope items (`readOnly` suppression changes, live chat page rendering, any alternative heuristic for "still-open question") were not touched, consistent with the story text and the Architecture Constraints section. Review (`rht-s1-review-1.md`) recorded 0 HIGH findings across all 5 categories with no noted scope creep.

## Test Plan Coverage

`check-rht-s1-trailing-assistant-turn.js`: **5 passed, 0 failed** (verified this session, 2026-08-17). The task brief's supplied figure ("null passed, null failed") did not parse as real numbers, so the script was re-run directly per the guardrail allowing re-run when a supplied result looks suspicious; the re-run output above is the actual, current result and confirms all 5 named test cases pass with no regressions.

## NFR Status

| NFR | Status | Notes |
|-----|--------|-------|
| Correctness | Met | AC1/AC3 tests confirm the previously-silently-dropped trailing assistant turn is now displayed. |
| Consistency | Met | AC2 confirms multi-turn pairing behaviour is unchanged; single-shot and multi-turn stages now both render their full recorded conversation. |

## Metric Signal

No benefit-metric artefact is referenced by this story — it is explicitly short-track ("Benefit-metric reference: None — short-track skips benefit-metric; benefit linkage stated directly below"). The story's benefit linkage is a direct correctness fix reported by the operator during live validation of `drh-s1` (empty `#chat-messages` panel, `childCount: 0`, confirmed via DOM inspection); no formal metric tracking applies.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

Tightly-scoped, single-loop fix reusing an existing display pattern (no new rendering branch); all 5 ACs have direct 1:1 test coverage with 0 HIGH review findings. No production longevity signal available beyond the merge itself — no incidents or regressions referenced in subsequent commits touching the same route.
