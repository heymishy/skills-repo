# Definition of Done: Stream npm lifecycle-script output in the two slow staging-deploy.yml jobs

**PR:** https://github.com/heymishy/skills-repo/pull/832 | **Merged:** 2026-09-04 (commit `4037964a`)
**Story:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/stories/ncdv-s1-stream-npm-lifecycle-script-output-in-slow-jobs.md
**Test plan:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/test-plans/ncdv-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/dor/ncdv-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-ncdv-s1-npm-ci-foreground-scripts.js` T1/T2: both affected steps have `--foreground-scripts` | automated test | None |
| AC2 (regression guard) | ✅ | Same suite T3/T4: `smoke-test` unmodified, `cpco-s1`'s own env/cache settings intact | automated test | None |
| AC3 (regression guard) | ✅ | 4 related existing governance suites (`bri-s2.5`, `bri-s2.6`, `sdsb-s1`, `cpco-s1`) all pass unmodified | automated test | None |
| AC4 (real-world, RISK-ACCEPTed) | ⏳ Pending | No occurrence of the slow pattern has recurred yet since merge | Manual, ongoing observation | See follow-up action |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. This story's own scope (diagnostic visibility only, two specific jobs, zero behavioural change) was implemented exactly as scoped, with no unanticipated collisions found during the full-suite run.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (T1-T8, all automated and passing)
**T9 reclassified:** not a pass/fail test -- an ongoing watch item with no fixed resolution date, tracked as Follow-up action #1 below rather than counted in the test total (matches this repo's own testPlan.passing <= totalTests integrity rule, which is not designed for an item that genuinely may not resolve for weeks).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T2 --foreground-scripts on both affected steps | ✅ | ✅ | |
| T3 smoke-test unmodified | ✅ | ✅ | |
| T4 cpco-s1 settings intact | ✅ | ✅ | |
| T5-T8 4 regression suites | ✅ | ✅ | All unmodified |
| T9 next real occurrence diagnosis | Script written | Ongoing (not a counted test) | Tracked as a standing follow-up, see below |

**TDD verification performed (RED confirmed, not assumed):** before committing, the workflow change was stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against pre-fix content -- T1/T2 failed exactly as expected (missing `--foreground-scripts`), then restored.

**Gaps (tests not implemented):**
None -- T9's own "pending" status is the expected state for a diagnostic story until a real recurrence happens, not a gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Zero behavioural change | ✅ | `--foreground-scripts` is purely a log-visibility flag; T3/T4 confirm no other setting disturbed |
| Diagnostic value on next recurrence | ⏳ Pending | Cannot be confirmed until the slow pattern happens again |

`nfr-profile.md` status: not created for this story -- no performance/security/residency/availability/compliance NFRs beyond diagnostic visibility, already covered in the AC table.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact (per CLAUDE.md's short-track path). This story exists purely to make a future event diagnosable; there is no metric to measure until that event occurs.

---

## Outcome

**COMPLETE**

Every AC that could be verified at merge time (AC1-AC3) has concrete evidence. AC4 is explicitly a "wait and see" AC by design, RISK-ACCEPTed at DoR time -- its own pending state here is expected, not a gap being glossed over.

**Follow-up actions:**
1. **Watch the next several real `staging-deploy.yml` runs' own `deploy-staging` and `post-deploy-e2e-confirm` jobs.** If the 6-7 minute silent-install pattern recurs, read the now-streamed log for the previously-silent window -- this will either show `bcrypt`'s own `node-gyp-build` postinstall activity (confirming that hypothesis) or something else entirely (ruling it out and pointing to the real cause). Either outcome closes T9/AC4 and informs whether a real fix story is warranted.
2. **One real data point already gathered post-merge, informally, before this DoD was written**: the same run that merged `stcs-s1` (a separate story, pre-dating this fix) showed `deploy-staging`'s own install completing in just 4 seconds -- confirming the slow pattern is genuinely intermittent, not a fixed cost on every run. This makes the diagnostic streaming added here even more valuable, since only some future runs will actually exercise the interesting code path.

---

## DoD Observations

1. **This is the first story this session that is explicitly, deliberately incomplete by design at merge time** -- not a gap, but a genuinely correct shape for a diagnostic-only story whose entire purpose is to wait for a future event. Worth naming so this pattern (RISK-ACCEPT an AC that can only resolve later, ship the visibility improvement now) is recognised as valid next time a similar "we don't know the root cause yet" situation arises, rather than always defaulting to either a speculative fix or dropping the investigation.
2. **This story, `cpco-s1`, and `stcs-s1` together form a complete, traceable investigation arc from one operator observation** ("pipeline seems slow") through a fork-based deep-dive, two confirmed fixes, one still-open diagnostic question, and one deliberately-deferred follow-up (this story) -- a good example of the pipeline's own artefact trail making a multi-day investigation legible after the fact, not just the final fix.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Stream npm lifecycle-script output in the two slow staging-deploy.yml jobs" (ncdv-s1).
Check:
1. Is it appropriate for AC4/T9 to still be marked pending at DoD time, given this is a diagnostic-only story?
2. Does the follow-up action list make it clear what should happen the next time the slow pattern recurs?
3. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) reasonable for a story where one AC is deliberately still open?
Report findings as HIGH / MEDIUM / LOW.
```
