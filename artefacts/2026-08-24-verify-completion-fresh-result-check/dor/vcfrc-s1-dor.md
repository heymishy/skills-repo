# Definition of Ready: vcfrc-s1 — Check for an already-fresh same-session result before re-running the full suite

**Story:** artefacts/2026-08-24-verify-completion-fresh-result-check/stories/vcfrc-s1-check-for-fresh-same-session-result-before-rerunning-suite.md
**Test plan:** artefacts/2026-08-24-verify-completion-fresh-result-check/test-plans/vcfrc-s1-test-plan.md
**Track:** Short-track

---

## Hard Blocks

| Check | Status |
|-------|--------|
| ACs are testable | ✅ |
| Test plan exists and maps to ACs | ✅ |
| No unresolved architectural decision | ✅ N/A — instruction-text clarification, not an architectural choice |
| No CSS-layout-dependent ACs | ✅ N/A |
| No injectable adapter introduced | ✅ N/A |
| Contract does not exclude a file the test plan requires touchpoints in | ✅ — `skills/verify-completion/SKILL.md` is the story's sole in-scope file, named in both story and test plan |

## Warnings

None.

---

## Oversight level

**Medium** — follow-up action item from item #6's `loop-design.md` revisit, explicitly approved by the operator ("Yes, ship it") immediately after the revisit's findings were presented.

---

## Standards injection

None — no `pipeline-infrastructure` entry exists in `.github/context.yml`'s standards registry.

---

## Coding Agent Instructions

1. In `skills/verify-completion/SKILL.md`, add a short paragraph at the start of `## Step 1 — Run the full test suite`, before the test command block: instruct checking for an already-fresh same-session full-suite result (no code changes since, same full-suite command) before running the command; cite `vrne-s3`/`vrne-s4` and `loop-design.md` Section 8c as evidence.
2. Do not alter the existing test command block, report format, failure-handling instruction, or the Route/handler E2E coverage check section.
3. Consider whether `.github/scripts/check-skill-contracts.js` should gain a required-string entry guarding this addition, following this session's established pattern for other `verify-completion`/`branch-complete` additions (`evcg-s1`, `psms-s1`) — optional but consistent with precedent.
4. Write `tests/check-vcfrc-s1-verify-completion-fresh-result-check.js` per the test plan (5 tests), run it standalone, then run the full suite to confirm no regressions.
5. Follow this session's established worktree-file-transfer pattern: write files in the main checkout, create a new worktree+branch from master (`git worktree add .worktrees/vcfrc-s1 -b feature/vcfrc-s1 master`), copy files across, diff-verify, discard main-checkout duplicates, commit only in the worktree.

---

## Sign-off

**Decision:** Proceed: Yes
**Signed off by:** Claude (agent), on explicit operator approval ("Yes, ship it (Recommended)")
**Date:** 2026-08-24
