# Test Plan: Fix currentStoryId field mismatch (wsap-s2)

**Story:** artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s2-fix-currentstoryid-field-mismatch.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Regression (corrected) | `tests/check-wsap-s1-story-scoped-artefact-paths.js` AC1 rewritten to call `setStoryList()` (the real production entry point) instead of setting `journey.stories` directly via `setJourneyFields` — all 14 assertions in the file pass with the fix applied |
| T2 | AC2 | Behavioural (new) | New `tests/check-wsap-s2-per-story-routing-uses-storylist.js` — drives a full 3-story cycle through `setStoryList`/`advanceToNextStory`/`linkSessionToJourney`; asserts distinct `currentStoryId` per story, in order, and `null` once exhausted (10 assertions) |
| T3 | AC3 | Regression | 17 existing test files touching journey/story routing, all re-run unchanged (139 checks total) |
| T4 | AC4 | Live verification | Post-deploy: resume `new-feature-2b74a292`'s journey, complete another per-story cycle, confirm the resulting commit shows a distinct per-story artefact path, not the shared flat file. |

## Regression coverage

T3's 17 files are the full existing regression surface for journey/story routing in this codebase: `check-alrf-s8-journey-slug-priority.js`, `check-cat-s6-regression-verification.js`, `check-cdg4-gate-confirm-validation.js`, `check-cdg5-trace-emission.js`, `check-csgc-s1-story-extraction-and-gate-confirm.js`, `check-das-s1-commit-artefact-git-fallback.js`, `check-dtra-s1-auto-start-review-after-definition.js`, `check-inf5-trace-extension.js`, `check-mig4-trace-extension.js`, `check-ntpg-s1-nonstream-turn-persist.js`, `check-ougl2-journey-state-store.js`, `check-ougl3-journey-entry-and-start.js`, `check-ougl5-gate-confirm-feature-stages.js`, `check-ougl6-perstory-stage-routing.js`, `check-ougl7-dor-and-journey-complete.js`, `check-s1.1-board-advance-action.js`, `check-s3.3-advisory-wip-limits.js`.

## Out of Scope (per story)

- Recovering artefact content already lost on `new-feature-2b74a292` before this fix.
- Removing the dead `journey.stories` field entirely.
