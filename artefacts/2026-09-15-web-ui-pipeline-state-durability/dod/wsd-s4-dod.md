# Definition of Done: wsd-s4 — resolve pipeline-state writer owner/repo fresh and unconditionally

**Track:** Short-track
**PR:** https://github.com/heymishy/skills-repo/pull/891 | **Merged:** 2026-09-14 (merge commit `dca55591`)
**Test plan:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s4-test-plan.md
**DoR artefact:** artefacts/2026-09-15-web-ui-pipeline-state-durability/dor/wsd-s4-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 6 regression files re-run unchanged (68 checks) | automated test re-run | None |
| AC2 | ✅ | `check-wsd-s2-github-pipeline-state-writer.js` 24/24, unchanged | automated test re-run | None |
| AC3 | ✅ | New `tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js` — 8 assertions driving the REAL two-step flow (`handlePostTurnStreamHtml` then `handlePostGateConfirm`); `context.owner`/`context.repo`/`context.token` all correctly resolved, not `undefined`. | automated test (new file) | None |
| AC4 | ⚠️ | Live-verified: this fix's own deploy moved the failure to a genuinely NEW, different error ("Unexpected end of JSON input") — real, measurable progress (the owner/repo/token resolution bug this story targeted is confirmed fixed), but a third, distinct bug (GitHub Contents API's 1 MB inline-content ceiling) remained, found and fixed by `wsd-s5`. | Live production re-verification (Fly logs) | RISK-ACCEPT: this story's own fix IS correct and necessary (proven both by the new behavioural test AC3 and by the error changing in production, not repeating) — it was simply not sufficient alone to close the full gap, which needed `wsd-s5` too. |

**Confirmed in CI, not just locally:** all 8 required PR #891 checks passed before merge.

---

## Scope Deviations

None against this story's own, correctly-scoped fix (owner/repo resolution). The story's own AC4 correctly anticipated live verification might surface further gaps — it did, and that led directly to `wsd-s5`.

---

## Test Plan Coverage

**Tests from plan implemented:** T1-T9, all implemented
**Tests passing in CI:** all PR #891 checks green; `check-wsd-s4-pipeline-state-owner-repo-resolution.js` 8/8 locally

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T6 | ✅ | ✅ | Existing regression suite, unchanged |
| T7 | ✅ | ✅ | wsd-s2's own suite, unchanged |
| T8 | ✅ | ✅ | New behavioural test proving the fix — real two-step flow, owner/repo correctly resolved |
| T9 | ✅ | ⚠️ Partial — moved past this bug, hit a new one | Live verification confirmed THIS story's fix worked (different, later error) — see AC4 |

**Gaps:** None in this story's own scope. The remaining gap belonged to a different bug, closed by `wsd-s5`.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Adds one `ownerRepoForFeature` DB lookup per gate-confirm call | ✅ | Negligible cost, matches `skills.js`'s own equivalent call's already-accepted cost |

---

## Metric Signal

Contributes materially to closing the gap — confirmed the owner/repo/token resolution bug (the SECOND of three real bugs found this session) is genuinely fixed. See `wsd-s5`'s own DoD for the story that fully closed the benefit-metric.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding specific to this story.

---

## DoD Observations

1. **A behavioural test that exercises the REAL two-step completion flow (chat-turn-completes-stage, then gate-confirm-runs-against-already-completed-session) caught what a `handlePostGateConfirm`-only test harness structurally could not.** `wsd-s2`'s and `wsd-s3`'s own test suites both called `handlePostGateConfirm` directly against a hand-built session with `_stageDone` left unset — exactly the unreality `dcuf-s1`'s own test file (an earlier, unrelated story) had already documented for the artefact-commit case, now independently rediscovered for the pipeline-state-writer case. Worth flagging as a pattern: any test harness for `journey.js`'s gate-confirm logic should default to the two-step, `_stageDone`-already-true shape unless a test specifically needs the rarer first-completion-in-one-request path.
2. **Root-causing this precisely (rather than accepting `wsd-s3`'s plausible-but-wrong snapshot fix) required tracing an interaction with a completely unrelated, already-merged story's own prior code movement (`dcuf-s1`).** This is the kind of cross-story interaction that's easy to miss without either deep familiarity with the codebase's history or, as here, the discipline of live-verifying and re-diagnosing rather than assuming a first fix worked because it "looked right."
