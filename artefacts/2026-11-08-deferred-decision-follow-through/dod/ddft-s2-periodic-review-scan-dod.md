# Definition of Done: Periodic review scan over unresolved deferred-item records

**PR:** https://github.com/heymishy/skills-repo/pull/1079 | **Merged:** 2026-11-12 (merge commit c91034080)
**Story:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s2-periodic-review-scan.md
**Test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s2-periodic-review-scan-test-plan.md
**DoR artefact:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s2-periodic-review-scan-dor.md
**Assessed by:** Claude (against merged code on master at ab308f579, which contains c91034080)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against synthetic input; `integration-real-code` = exercises the real script as a child process and the real committed data file; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. This story ships a command-line script, so the last two do not apply.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (Acceptance Criterion 1: the scan surfaces every `deferred-item` record whose status is not already resolved, never silently skipping one). Tests filtersToUnresolvedDeferredItemRecordsOnly and neverSkipsAnUnresolvedRecordSilently pass; filtersOutResolvedRecordsInRealFixture confirms a resolved record is excluded. The scan runs as a real child process (`node scripts/lib/deferred-item-scan.js`). Strength: `integration-real-code`. | Automated test `tests/check-ddft-s2-periodic-review-scan.js` (10 passed, 0 failed, re-run on merged master) | None. The story does not define "resolved"; the script treats a status of "resolved" (case-insensitive) as resolved and surfaces every other status including a missing one. Recorded under Observations. |
| AC2 | ✅ | AC2 (Acceptance Criterion 2: the first real run surfaces ddft-s1's two seeded records). firstRealRunSurfacesBothSeededRecords and realCommittedFileHoldsExactlyTheTwoSeededUnresolvedRecords pass against the real committed `workspace/incidents.json`, read-only. Independently re-run on merged master: the command printed "2 unresolved deferred-item record(s) surfaced for review" with the `tfhc-s1` and C1-versus-Option-C records. Strength: `integration-real-code`. This is the direct check the story's metric names, and it depends on dsrf-s1 having persisted the records. | Automated test plus a direct run of the command on master | None |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: `revisitCondition` prose is shown as written, with no parsing, evaluation or auto-classification). preservesRevisitConditionTextVerbatim and neverCallsAnyConditionEvaluationLogic pass, including a static check that the source uses no `Date`, `eval` or `new Function`. Strength: `integration-real-code`. | Automated test | None |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: a second run with no new records surfaces the same unresolved records again). secondRunWithNoNewRecordsResurfacesSameSet passes. Strength: `integration-real-code`. | Automated test | None for the AC as written. The metric it serves, periodic coverage, is not met because nothing runs the scan on a schedule. See Observations 1. |

**Verification strength summary:** 4 of 4 ACs `integration-real-code`; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: N/A, no browser-observable ACs.

---

## Scope Deviations

None against the story's Out of Scope list (no resolution or closing mechanism was built). The PR changed three files, all new: `scripts/lib/deferred-item-scan.js`, `tests/check-ddft-s2-periodic-review-scan.js` and the implementation plan. It added no workflow and no npm script, because the DoR contract listed only the script.

---

## Test Plan Coverage

**Tests from plan implemented:** the test plan registered 7 tests; the test file implements 10, covering every AC plus an empty-or-missing-file case, a malformed-file case and a real-file case. I did not map the plan's 7 test names one to one against the 10.
**Tests passing:** 10 / 10, re-run locally on merged master: `node tests/check-ddft-s2-periodic-review-scan.js`. The subagent that built it reported RED first (9 failed before the script existed). The final CI results for PR #1079 were not re-inspected; the operator merged it.

**Gaps (tests not implemented):** none identified. The plan has no `CSS-layout-dependent` gaps.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: no credentials in output | ✅ | The script only prints fields already in the committed records, and the test runs against the real file read-only. |
| Constraint #11 (no persistent agent runtime): a triggered, bounded script | ✅ | The scan is a one-shot command, not a watcher. |
| Performance | ✅ | Not applicable: a linear read of a small file. |

---

## Metric Signal

The story names the metric "Periodic review scan coverage". No metric in the feature's `metrics[]` lists ddft-s2 as a contributor.

**Periodic review scan coverage**
Signal: not-yet-measured
Evidence note: the direct check passes (both seeded records surface on the first real run), but nothing triggers the scan periodically, so there is no scan history to measure coverage against. Measurement needs a scheduled or recurring invocation.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/4 as written, all `integration-real-code`. Nothing is ❌. The deviation is that the "periodic" in the feature name is not delivered: the scan is run by hand.

**Follow-up actions:**
1. Decide how the scan is triggered periodically (a scheduled CI job, or a step in a session-start routine). A CI job alone would only print to a log, so it is only worth building with a place for the output to be seen: the ddft-s5 web page, or a notification once a channel exists. Owner: operator.
2. Define what "resolved" means and build the mechanism that sets it. Until then a record can never leave the scan's output. Owner: operator.

---

## DoD Observations

1. **Nothing runs this scan periodically.** The story allows "on demand or from a scheduled CI job", so the ACs hold, but the feature's purpose is re-surfacing on a cycle. Same shape as the wave-2 findings (a mechanism with no trigger), though here the story text permits it.
2. **"Resolved" is undefined and unreachable.** The script treats status "resolved" as resolved. No code sets it, so every record surfaces forever.
3. **This story's AC2 only passes because dsrf-s1 shipped first.** Without the persisted records the real-file test would fail, which is the intended behaviour.
4. **Not verified here:** no scheduled run, no live or production behaviour, and the verification script's scenario that compares printed output against `workspace/capture-log.md` was not run (the test compares against `incidents.json` instead).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Periodic review scan over unresolved deferred-item records".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
