# Implementation Plan: lsbm-s1 — Show the /clarify and /estimate sub-step buttons live

**Story:** artefacts/2026-08-27-live-sidestep-buttons-missing/stories/lsbm-s1-live-substep-affordance-injection.md
**Test plan:** artefacts/2026-08-27-live-sidestep-buttons-missing/test-plans/lsbm-s1-test-plan.md
**DoR:** artefacts/2026-08-27-live-sidestep-buttons-missing/dor/lsbm-s1-dor.md
**Worktree:** .worktrees/lsbm-s1 (branch `lsbm-s1`, based on origin/master)

---

## Tasks

### Task 1 — Extract shared sub-step affordance builder
- Add `buildJourneySubStepAffordance(skillName, journeyId)` to `src/web-ui/routes/skills.js`, extracted from the existing inline `discovery`/`definition` branches (~line 4157-4239). Returns `{ html, js }`.
- Update the full-render path to call this function instead of inlining — output must be byte-identical.
- ACs covered: infrastructure for all; AC5 verified here.

### Task 2 — Make the affordance available unconditionally at page load
- In the unconditional script section (~line 2921-2923), add `SUBSTEP_HTML` (from Task 1's `html`) and move the click-handler function definitions to be always-defined (not nested in the conditional `subStepJs`).
- ACs covered: infrastructure for AC1-AC4.

### Task 3 — Wire live injection into `showCommitLink()`
- Extend `showCommitLink()` (~line 3512-3528) to inject `SUBSTEP_HTML` before the plain gate-confirm form when non-empty, and attach the estimate form's submit listener to the freshly-inserted element.
- ACs covered: AC1, AC2, AC3, AC4, AC6.

### Task 4 — Tests
- New file `tests/check-lsbm-s1-live-substep-injection.js` covering AC1-AC6 per the test plan.
- Re-run `tests/check-ougl4-journey-aware-chat-button.js` plus the full suite.

---

## Sequencing

Task 1 before Task 2 (Task 2 consumes Task 1's function). Task 3 depends on Task 2's unconditional definitions existing. Task 4 last.
