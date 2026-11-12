# Definition of Done: Persist the two seeded deferred-item records that ddft-s1 promised but never shipped

**PR:** https://github.com/heymishy/skills-repo/pull/1077 | **Merged:** 2026-11-12 (merge commit 9d432993c)
**Story:** artefacts/2026-11-12-ddft-seed-records-fix/stories/dsrf-s1-persist-seeded-deferred-item-records.md
**Test plan:** artefacts/2026-11-12-ddft-seed-records-fix/test-plans/dsrf-s1-test-plan.md
**DoR artefact:** artefacts/2026-11-12-ddft-seed-records-fix/dor/dsrf-s1-dor.md
**Assessed by:** Claude (against merged code on master at 9d432993c)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against synthetic input with no real files; `integration-real-code` = exercises real production source and the real committed data file; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. This story ships a data file and a test, with no running service, so `live-verified` and `production-observed` do not apply.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (Acceptance Criterion 1: `workspace/incidents.json` exists, is tracked in git, parses as a JSON array). On merged master, `git ls-files` lists `workspace/incidents.json`, and tests UT1 (file parses as an array of at least 2 records) and UT2 (`git ls-files --error-unmatch`) pass. Strength: `integration-real-code` against the real committed file. | Automated test `tests/check-dsrf-s1-seeded-records.js`, plus a direct `git ls-files` check on master | None |
| AC2 | ✅ | AC2 (Acceptance Criterion 2: exactly one `tfhc-s1` deferred-item record with `source: risk-accept`, the linked feature and story, a C3 summary and a `revisitCondition`). UT3 passes against the real file: one match, type `deferred-item`, `source: risk-accept`, `linkedFeature: 2026-10-30-test-fixture-hardening-continuation`, summary naming check C3 and `testPlan.passing`, non-empty `revisitCondition`. The C3 figures in the summary (passing 4, total 5, merged) were taken from a live run of `scripts/check-pipeline-state-integrity.js` at build time, not copied from the story. Strength: `integration-real-code`. | Automated test UT3 | None |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: exactly one C1-versus-Option-C deferred-item record with `source: backlog-thread` and the logged deferral as `revisitCondition`). UT4 passes against the real file: one match, summary naming constraint C1 and Option C, `revisitCondition` "deferred to a broader `product/` refresh later". Strength: `integration-real-code`. | Automated test UT4 | None |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: a read-only check of the real file fails if either record is missing, duplicated or mistyped). UT5 is a negative control: it feeds in-memory arrays with a missing, a duplicated and a mistyped record and confirms each is rejected, so the guard is shown able to fail. IT1 runs the shipped `validateRecord` over every real record. NFR-CORR1 confirms the run left the real file's hash and mtime unchanged. During the build the test file was run before the data file existed and failed 7 of 9, so it demonstrably detects absence. Strength: `integration-real-code`. | Automated tests UT5, IT1, NFR-CORR1, plus the recorded RED run | None |
| AC5 | ✅ | AC5 (Acceptance Criterion 5: the existing loaders read both records without error and no `type: "incident"` record is introduced). IT2 passes: `loadRecords` and `loadIncidentRecords` return identical arrays of 2 records, none typed `incident`. Strength: `integration-real-code`. | Automated test IT2 | None |

**Verification strength summary:** 5 of 5 ACs `integration-real-code`; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: N/A, no browser-observable ACs.

---

## Scope Deviations

None against the story's Out of Scope list. The PR changed exactly two files: `workspace/incidents.json` (new) and `tests/check-dsrf-s1-seeded-records.js` (new). It did not touch `scripts/lib/incident-store.js` or anything under `src/` or `skills/`, did not fix `tfhc-s1` or resolve the C1/Option C contradiction, did not wire `draftTriageSummary`, and added no `type: "incident"` record or dependency.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 (UT1 to UT5, IT1, IT2, NFR-SEC1, NFR-CORR1). The test plan header said 10 in pipeline state; the plan itself lists 9 named tests, so the registered `totalTests` of 10 is one too many and is corrected in the state update below.
**Tests passing:** 9 / 9, re-run locally on merged master: `node tests/check-dsrf-s1-seeded-records.js` reported 9 passed, 0 failed. `node tests/check-ddft-s1-deferred-item-record.js` still reports 8 passed, 0 failed. CI on PR #1077 was green on all 8 reported checks, including "Lint, typecheck, test, build" and "Run assurance gate".

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| UT1 file exists, parses as an array (AC1) | ✅ | ✅ | |
| UT2 file tracked in git (AC1) | ✅ | ✅ | Skips with a message if `git` is unavailable |
| UT3 tfhc-s1 record (AC2) | ✅ | ✅ | |
| UT4 C1 versus Option C record (AC3) | ✅ | ✅ | |
| UT5 negative control (AC4) | ✅ | ✅ | In-memory input only |
| IT1 validateRecord on every real record (AC4) | ✅ | ✅ | |
| IT2 existing loaders (AC5) | ✅ | ✅ | |
| NFR-SEC1 no secrets or personal data | ✅ | ✅ | |
| NFR-CORR1 file unmodified by the run | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage-gap audit:** the test plan declared no coverage gaps and has no `CSS-layout-dependent` gaps, so no RISK-ACCEPT was needed. Its one accepted risk (UT3 pins today's state and must be edited when `tfhc-s1` is eventually fixed) is recorded in the plan.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: no credentials, tenant identifiers or personal data | ✅ | NFR-SEC1 scans the file for token, secret, password, tenant identifier and email patterns; zero matches. Strength: `integration-real-code`. |
| Performance | ✅ | Not applicable: two records in a small JSON file. |
| Correctness: the check reads the real committed file | ✅ | UT1 to UT4 read `workspace/incidents.json` directly; NFR-CORR1 confirms it is never written. |

---

## Metric Signal

No metric formally lists this story; the feature has no `metrics[]` entries (short-track). The story closes the unmet binary target of ddft-s1's metric m1 (Deferred-item record mechanism existence: both seeded real cases exist as structured records).

**ddft-s1 m1 Deferred-item record mechanism existence**
Signal: on-track (target met)
Evidence note: on merged master, `workspace/incidents.json` is tracked and holds exactly the two seeded `deferred-item` records, confirmed by a test that reads the real file. Recording the signal in the ddft feature's own `metrics[]` is left to the ddft-s1 re-grade update.
Date measured: 2026-11-12

---

## Outcome

**COMPLETE**

ACs satisfied: 5/5, all `integration-real-code` against the real committed file.

**Follow-up actions:**
1. **Re-grade ddft-s1.** Its DoD was set INCOMPLETE on 2026-11-12 solely because the two records were not persisted. That gap is now closed, so ddft-s1 can move to complete with an addendum. Owner: next skill run, see the ddft-s1 DoD addendum.
2. **itar-s1's own DoD still claims `workspace/incidents.json` as a deliverable that did not exist until this story.** Whether to re-open it is an operator decision, logged in `workspace/state.json`.

---

## DoD Observations

1. **A test that reads the real artefact caught what temp-file tests could not.** ddft-s1's tests all passed with zero persisted records; this story's tests failed 7 of 9 until the file existed. For any AC that says a real record or file "exists", the test should read the real committed artefact. This is a `/test-plan` improvement candidate.
2. **The negative control (UT5) passes before the data file exists**, as does NFR-CORR1, so a green run of those two alone proves nothing. The other seven tests carry the evidence.
3. **Not verified here:** whether any other consumer of `workspace/incidents.json` exists. No `incident`-typed records are present, so itar-s1 and itar-s2 flows still have no real data to run against. The wiring of `draftTriageSummary` remains a separate open item.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Persist the two seeded deferred-item records".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
