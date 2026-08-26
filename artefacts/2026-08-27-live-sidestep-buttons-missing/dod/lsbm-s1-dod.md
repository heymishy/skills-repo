# Definition of Done: lsbm-s1 — Show the /clarify and /estimate sub-step buttons live, not only after a page reload

**PR:** https://github.com/heymishy/skills-repo/pull/773 | **Merged:** 2026-08-26T20:57:18Z (commit `50d83994`)
**Story:** `artefacts/2026-08-27-live-sidestep-buttons-missing/stories/lsbm-s1-live-substep-affordance-injection.md`
**Test plan:** `artefacts/2026-08-27-live-sidestep-buttons-missing/test-plans/lsbm-s1-test-plan.md`
**DoR:** `artefacts/2026-08-27-live-sidestep-buttons-missing/dor/lsbm-s1-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `SUBSTEP_HTML` confirmed present and populated for discovery even with `session.done: false` at render time | Automated test + independent code trace | None |
| AC2 | ✅ | `showCommitLink()` confirmed to inject `SUBSTEP_HTML` and re-execute `SUBSTEP_JS` via a dynamically-created `<script>` element, genuinely re-attaching the estimate form's submit listener to the freshly-inserted DOM node | Automated test + independent code trace | None |
| AC3 | ✅ | Same mechanism as AC2, verified for the estimate form specifically (both discovery and definition) | Automated test + independent code trace | None |
| AC4 | ✅ | `SUBSTEP_HTML` confirmed estimate-only (no clarify) for `definition`, present with `done: false` | Automated test | None |
| AC5 | ✅ | Spec-compliance review independently reconstructed pre-fix output via `git show 6de5eef5:...` and diffed real rendered output byte-for-byte against post-fix output — not just trusting the test's own golden fixture | Automated test + independent reconstruction | None |
| AC6 | ✅ | Confirmed `SUBSTEP_HTML` is empty for skills with no sub-step affordance (e.g. `benefit-metric`) and `showCommitLink()`'s injection is a true no-op (no empty markup ever inserted) | Automated test | None |

**Test file:** `tests/check-lsbm-s1-live-substep-injection.js` — 12/12 passing, re-confirmed fresh on merged master (2026-08-27). `tests/check-ougl4-journey-aware-chat-button.js` (pre-existing coverage) — 7/7, unchanged.

---

## Scope Deviations

None. Diff confirmed to touch exactly `src/web-ui/routes/skills.js` and one new test file.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 AC groups / 12 individual tests, all implemented.
**Tests passing:** 12/12, confirmed fresh on merged master; `check-ougl4` regression suite also confirmed clean.
**Full suite:** 558/558 passing (0 failures — the pre-existing flaky `check-p3.5-validate-trace.js` did not recur in either full-suite run for this story).

**Gaps:** None per the test plan's own "Test Gaps and Risks" table — the one named gap (true live-browser proof of AC1-AC4, since a plain-Node unit test cannot simulate an actual SSE `done` event + browser DOM mutation) was explicitly acknowledged and mitigated by the verification script's manual scenarios, matching this repo's own established precedent (`check-ougl4`'s T4.1 comment) for this exact class of limitation.

**Review-driven fixes applied before merge (not deviations — improvements caught and closed pre-merge):**
1. **MEDIUM:** `SUBSTEP_HTML`/`SUBSTEP_JS` were the first place in this file to embed `JSON.stringify` output inside a `<script>` block without the file's own established `<`/`>`/`&` sanitization (already used at 5 other call sites). Not exploitable with today's hardcoded templates, but a latent gap for any future edit. Fixed by applying the same `.replace()` chain; re-verified clean across all 3 test layers (new suite, `check-ougl4`, full suite).
2. **LOW:** the full-render path recomputed `buildJourneySubStepAffordance` a second time with identical arguments. Fixed by reusing the already-computed `_substepAff`.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Rated "negligible" — confirmed; the review-driven dedupe fix also removed one redundant function call |
| Security | ✅ | No new endpoint/input path; code-quality review specifically scrutinized the new script-embedding pattern and found (then the fix closed) a latent sanitization gap — now consistent with the file's established convention |
| Accessibility | ✅ | No regression — byte-identical markup to the pre-fix full-render path, confirmed via independent reconstruction |
| Audit | ✅ N/A | No existing audit-log call affected |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None declared | N/A | N/A | Short-track direct correctness fix, no formal benefit-metric artefact. |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. (Out of scope, noted in story) Disabling the chat input after a stage is marked done — deferred as a separate, broader follow-up (the gap predates this story and also affects the already-working resume path).
2. (Live verification pending, operator requested) The operator has asked for a live Chrome-based validation of this fix (and `ctpr-s1`) on production — to be performed as a follow-up action once browser authentication is available.

---

## DoD Observations

1. **Code-quality review earned its keep on a genuinely subtle finding.** The script-embedding sanitization gap (MEDIUM) would not have been caught by any of the automated tests — all 12 new tests and the full suite passed both before and after the fix, since none of today's hardcoded templates trigger it. It was found purely by the reviewer recognizing an inconsistency with an established in-file convention (5 other call sites already sanitize) and reasoning about what a *future* edit could introduce. This is exactly the kind of latent-risk catch a mechanical test suite cannot provide on its own.
2. **AC5's verification depth mattered.** The story's riskiest claim ("the full-render path's output is unchanged") was verified twice independently — once by the story's own test (a hand-transcribed golden fixture, itself character-by-character diffed against real pre-fix source by the code-quality reviewer) and once by the spec-compliance reviewer's own from-scratch reconstruction via `git show` of the actual pre-fix module. Both independently confirmed byte-identical output. A single trust-the-test-name pass would not have caught a subtly-wrong hand-typed fixture if one had existed.
