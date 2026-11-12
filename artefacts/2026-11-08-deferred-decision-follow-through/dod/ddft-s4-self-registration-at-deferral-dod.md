# Definition of Done: Self-registration of deferred items at the point of deferral

**PR:** https://github.com/heymishy/skills-repo/pull/1080 | **Merged:** 2026-11-12 (merge commit be2b33468)
**Story:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s4-self-registration-at-deferral.md
**Test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s4-self-registration-at-deferral-test-plan.md
**DoR artefact:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s4-self-registration-at-deferral-dor.md
**Assessed by:** Claude (against merged code on master at ab308f579, which contains be2b33468)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against synthetic input; `integration-real-code` = exercises the real command as a child process, the real SKILL.md text and the real storage module; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. This story ships a script and SKILL.md text, so the last two do not apply.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: when `/discovery`'s State update section runs and the Out of Scope section names a deferral, a `discovery-out-of-scope` record is created automatically with no manual operator step). skillStateUpdateSectionInvokesRegisterScriptWithDiscoveryHook, discoveryHookAutoRegistersRecordOnOutOfScopeCompletion and discoveryHookWritesNothingWhenOutOfScopeAbsent pass: `skills/discovery/SKILL.md` names the exact command, and running that command as a child process writes a valid record. Strength: `integration-real-code`. | Automated test `tests/check-ddft-s4-self-registration-at-deferral.js` (17 passed, 0 failed, re-run on merged master), plus a read of the PR's SKILL.md diff | The skill is prose that an AI agent follows, so nothing fires "automatically". What is enforced is the command and its contract; whether an agent runs it at the real moment is not tested and cannot be. Observation 1. |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: after a `RISK-ACCEPT` is logged, `/decisions` creates a `risk-accept` record linking to that entry). The matching three tests pass, and riskAcceptHookRejectsMissingDecisionRefAndWritesNothing shows bad input writes nothing. Strength: `integration-real-code`. | Automated test, plus the SKILL.md diff | Same prose-enforcement limit as AC1. Also, the link to the decision entry is carried in the record's `trigger` text (`decisions.md: <entry header>`), because the schema has no link field. |
| AC3 | ⚠️ | AC3 (Acceptance Criterion 3: when `/definition-of-done` Step 6 records a metric as `not-yet-measured`, an `unmeasured-benefit-metric` record is created carrying the metric name and evidence note). The matching tests pass, including unmeasuredHookRejectsBlankOrNAEvidence and benefitMetricSkillIsNotHooked. Strength: `integration-real-code`. | Automated test, plus the SKILL.md diff | Same prose-enforcement limit as AC1. |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: all three hooks write through the same `workspace/incidents.json` mechanism ddft-s1 established, with no separate storage path). allThreeHooksWriteThroughSingleSharedMechanism, libWritesOnlyViaIncidentStoreAndInventsNoStoragePath and cliWithoutFileFlagTargetsRealWorkspaceFileByDefault pass; realIncidentsFileWasNotModifiedByThisRun confirms the tests never wrote to the real file. Strength: `integration-real-code`. | Automated test | None |
| AC5 | ⚠️ | AC5 (Acceptance Criterion 5: each hook is implemented as its own PR and tested independently, so one hook's passing test never implies the others). The test file has three separate per-hook groups (discovery, decisions, dod) that can each be run alone. Strength: `integration-real-code`. | Automated test groups | The AC's premise, three separate PRs, was not followed: one branch and one PR carried all three, because one story was dispatched to one build agent. The three SKILL.md hunks are independent. The AC's intent, independent per-hook tests, is met. |

**Verification strength summary:** 5 of 5 ACs `integration-real-code`, 4 of them marked ⚠️ on enforcement or process grounds; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: N/A, no browser-observable ACs.

---

## Scope Deviations

None against the story's Out of Scope list (no retroactive registration of past deferrals). The PR changed seven files: `scripts/lib/deferral-hooks.js`, `scripts/register-deferral.js`, one added paragraph in each of `skills/discovery/SKILL.md`, `skills/decisions/SKILL.md` and `skills/definition-of-done/SKILL.md`, the test file and the plan. `skills/benefit-metric/SKILL.md` was deliberately not hooked and a test asserts that.

---

## Test Plan Coverage

**Tests from plan implemented:** the test plan registered 5 tests; the test file implements 17, grouped per hook plus shared checks. I did not map the plan's 5 names one to one against the 17.
**Tests passing:** 17 / 17, re-run locally on merged master. The subagent that built it reported RED first (modules absent). Final CI results for PR #1080 were not re-inspected; the operator merged it. The repo's skill-contract and governance-sync checks ran inside the full suite and passed in the subagent's run.

**Gaps (tests not implemented):** none identified. The one thing not tested is that an agent follows the SKILL.md instruction at run time, which no automated test can prove.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: no credentials, tenant data or PII written | ✅ | Records contain only the fields supplied by the hook context; the command rejects blank or "N/A" evidence. The tests never write to the real data file. |
| Performance | ✅ | Not applicable: a single append per hook. |

---

## Metric Signal

No metric in the feature's `metrics[]` lists ddft-s4 as a contributor.

**Deferral self-registration rate** (the story's benefit: deferred items register themselves rather than depending on someone remembering)
Signal: not-yet-measured
Evidence note: no real discovery, decision or DoD run has happened since the hooks merged, so no record has been self-registered in real use. The first real discovery with Out-of-Scope items or the first logged `RISK-ACCEPT` will show whether the hook fires.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 5/5 in substance, with AC1, AC2, AC3 and AC5 marked ⚠️. Nothing is ❌. The deviations are that registration is instructed and mechanically testable, not enforced at run time, and that one PR was used where AC5 describes three.

**Follow-up actions:**
1. Observe the first real run of each hook: after the next real `/discovery`, `RISK-ACCEPT` and `/definition-of-done` with a `not-yet-measured` signal, check whether a record appeared in `workspace/incidents.json`. Owner: operator.
2. Decide whether the discovery hook's volume is acceptable (Observation 2) before it runs against many discoveries. Owner: operator.

---

## DoD Observations

1. **All three deferral points are prose in a SKILL.md.** The honest guarantee is "the instruction names a real, tested command", not "a record is always created". A missed step produces no error anywhere.
2. **The discovery hook writes one record per Out-of-Scope item, with no `revisitCondition`.** Nearly every discovery has Out-of-Scope items, so once followed it adds many records to the live file, and each then appears in the ddft-s2 scan and the ddft-s5 page. The story says "a record", so one-per-item is the build agent's reading.
3. **Not verified here:** no real hook run, no live or production behaviour, and whether the command's default path writes the real file was checked only by a test on the constant, to avoid writing to the real file.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Self-registration of deferred items at the point of deferral".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
