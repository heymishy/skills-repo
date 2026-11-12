# Definition of Done: Deferred-item record mechanism (generalized schema)

**PR:** https://github.com/heymishy/skills-repo/pull/1067 | **Merged:** 2026-11-11 (merge commit 123a12589)
**Story:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s1-deferred-item-record-mechanism.md
**Test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s1-deferred-item-record-mechanism-test-plan.md
**DoR artefact:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s1-deferred-item-record-mechanism-dor.md
**Assessed by:** Claude (against merged code on master at d0a3ad048, which contains 123a12589)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against synthetic input with no real files; `integration-real-code` = exercises real production source (here, the real `scripts/lib/incident-store.js` doing real file I/O, but against a temporary file) but not the real committed data file or a live environment; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (Acceptance Criterion 1: existing record fields stay valid, a `type` field is added defaulting to `"incident"`, plus `source`, `revisitCondition`, `linkedFeature`, `linkedStory` for deferred items). `createIncidentRecord` now sets `type` (default `incident`) and adds the four deferred-item fields only when `type` is `deferred-item`; `validateRecord` rejects a deferred item without `source`; `withDefaultType` defaults a legacy record. Tests addsTypeFieldDefaultingExistingRecordsToIncident, validatesDeferredItemRequiredFields, generalizedSchemaRoundTripsThroughDisk and itarS1ExistingCallersUnaffectedByGeneralization pass. Strength: `unit` plus `integration-real-code` (real module, real disk round trip on a temp file). Adequate because the claim is about the module's schema behaviour, not an external effect. | Automated test `tests/check-ddft-s1-deferred-item-record.js` | None |
| AC2 | ✅ | AC2 (Acceptance Criterion 2: the real, unfixed `tfhc-s1` pipeline-integrity failure is registered as a structured `deferred-item` record, a real seeded case rather than synthetic data). Test registersTfhcS1AsRealDeferredItemRecord passes: it builds a record from the real `tfhc-s1` failure text with `source: risk-accept` and a `revisitCondition` naming `testPlan.passing`, but writes it to a temporary file that the test deletes afterwards. Checked on merged master: `workspace/incidents.json` does not exist and is not tracked by git, and the PR diff touches no data file. Strength: `integration-real-code` against a temp file only. | Automated test, plus direct check that `workspace/incidents.json` is absent on master | Resolved by dsrf-s1 (PR #1077, merged 2026-11-12): the real records are now persisted. The original gap stays in this row's evidence for history; see Re-grade Addendum. |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: the C1-vs-Option-C fork-distribution contradiction is registered as a structured `deferred-item` record with `source: backlog-thread` and the logged deferral as `revisitCondition`). Test registersC1VsOptionCAsRealDeferredItemRecord passes with the real contradiction text, `source: backlog-thread` and `revisitCondition` of "deferred to a broader `product/` refresh later", again written to a deleted temp file. No persistent record exists on master. Strength: `integration-real-code` against a temp file only. | Automated test, plus direct check that `workspace/incidents.json` is absent on master | Resolved by dsrf-s1 (PR #1077, merged 2026-11-12): the real records are now persisted. The original gap stays in this row's evidence for history; see Re-grade Addendum. |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: a direct check confirms both seeded records are present and typed `deferred-item`, not `incident`). Test bothSeededRecordsFoundAndCorrectlyTyped passes, but it writes two minimal fixture records (`rc1`, `rc2` as revisit conditions) to a temp file and filters them, so it proves the typing logic, not that the two real seeded records exist. A direct check of master finds zero persisted records, so the metric's binary target (both seeded cases exist) is not yet true. Strength: `unit` in effect. | Automated test, plus direct check that `workspace/incidents.json` is absent on master | Resolved by dsrf-s1 (PR #1077, merged 2026-11-12): the real records are now persisted. The original gap stays in this row's evidence for history; see Re-grade Addendum. |

**Verification strength summary:** AC1 `unit` plus `integration-real-code`; AC2, AC3, AC4 `integration-real-code` against temp files only (AC4 effectively `unit`); 0 `live-verified`; 0 `production-observed`. UI-evidence gate: N/A, no browser-observable ACs.

---

## Scope Deviations

None against the story's Out of Scope list. The PR changed exactly four files: `scripts/lib/incident-store.js`, `tests/check-ddft-s1-deferred-item-record.js`, the implementation plan under `artefacts/.../plans/`, and `.github/pipeline-state.json` (pipeline bookkeeping). It did not fix `tfhc-s1`, did not resolve the C1-vs-Option-C contradiction, and did not backfill any other historical entry. The `incident-store.js` change is an in-place generalization, with no parallel storage mechanism and no rename, as the Architecture Constraints required.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (the plan's 2 unit, 4 integration and 1 NFR tests, plus a backward-compatibility test for existing `itar-s1` callers)
**Tests passing:** 8 / 8, re-run locally on merged master at d0a3ad048: `node tests/check-ddft-s1-deferred-item-record.js` reported Passed: 8, Failed: 0. CI results were not independently re-checked.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| addsTypeFieldDefaultingExistingRecordsToIncident (AC1) | ✅ | ✅ | |
| validatesDeferredItemRequiredFields (AC1) | ✅ | ✅ | |
| generalizedSchemaRoundTripsThroughDisk (AC1) | ✅ | ✅ | |
| registersTfhcS1AsRealDeferredItemRecord (AC2) | ✅ | ✅ | Temp file only |
| registersC1VsOptionCAsRealDeferredItemRecord (AC3) | ✅ | ✅ | Temp file only |
| bothSeededRecordsFoundAndCorrectlyTyped (AC4) | ✅ | ✅ | Uses placeholder fixtures, not the real records |
| noCredentialOrTokenShapedContentInRecordFields (NFR MC-SEC-02) | ✅ | ✅ | |
| itarS1ExistingCallersUnaffectedByGeneralization | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage-gap audit:** the test plan has no `CSS-layout-dependent` gaps and declares no coverage gaps at all. That declaration is the root of the deviation above: its Test Data Strategy states the test setup "never mutates the real file", which makes AC2 to AC4 provable only against temporary files, even though the story's own AC2 and Audit NFR describe real seeded records as the deliverable. The DoR's contract review also described "two real seeded records" without noticing the conflict. No RISK-ACCEPT for this was recorded in `decisions.md`.

---

## NFR Status

Feature-level `nfr-profile.md` exists (Status: Active). The rows relevant to ddft-s1:

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: no credentials in record content (MC-SEC-02, the same constraint as `itar-s1`) | ✅ | Test noCredentialOrTokenShapedContentInRecordFields passes; strength `unit` (pattern check on the created record's string fields). Adequate for a pattern check on record shape. |
| Performance: not applicable, small append-only write | ✅ | Not applicable per profile and story. |
| Audit: the two seeded real records are the audit trail proving the mechanism works against real history | ⚠️ | The records are not persisted, so this audit trail does not yet exist. Same gap as AC2 to AC4. |
| Data residency, availability, compliance | ✅ | Not applicable per the profile (`complianceProfile: standard`, no named sign-off). |

The NFR profile status is left at Active, not set to Verified, because this feature has four more stories unshipped and the Audit row above is open.

---

## Metric Signal

The feature's `metrics[]` array in `.github/pipeline-state.json` has five entries (m1 to m5), and every `contributingStories` list is empty, so no metric formally lists ddft-s1. The story's own Benefit Linkage does name m1 (Deferred-item record mechanism existence, target: both seeded real cases exist as structured records), so it is recorded here for completeness.

**m1 Deferred-item record mechanism existence**
Signal: not-yet-measured
Evidence note: the binary target (both seeded real records exist as structured records) is not met on merged master: `workspace/incidents.json` does not exist, so zero persisted `deferred-item` records exist. Only the mechanism that can create them has shipped, proven against temporary files.
Date measured: null

---

## Outcome

**COMPLETE**

Re-graded back to COMPLETE on 2026-11-12 after dsrf-s1 (PR #1077, merge commit 9d432993c) persisted the two real seeded records. The earlier INCOMPLETE grade (same day) rested on one fact only: `workspace/incidents.json` did not exist on master. It now exists, is tracked, and a test that reads the real file confirms both records. See the Re-grade Addendum below.

ACs satisfied: 4/4. AC1 is `unit` plus `integration-real-code` (unchanged). AC2, AC3 and AC4 are now `integration-real-code` against the real committed file, via dsrf-s1's tests UT3, UT4, UT5 and IT1.

**Follow-up actions:**
1. Confirm whether `itar-s1` (the upstream story) was meant to create `workspace/incidents.json`. It names the file as its own deliverable and never shipped it, so its DoD is still open for an operator decision.

---

## Re-grade Addendum (2026-11-12)

| Item | Before | After |
|------|--------|-------|
| `workspace/incidents.json` on master | absent, untracked | tracked, 2 records (`git ls-files` lists it) |
| AC2 `tfhc-s1` record | temp file only | persisted; dsrf-s1 test UT3 reads the real file and passes |
| AC3 C1-versus-Option-C record | temp file only | persisted; dsrf-s1 test UT4 passes |
| AC4 both records found and typed `deferred-item` | placeholder fixtures | dsrf-s1 tests UT5 (negative control), IT1 (`validateRecord` on every real record) pass |
| Audit NFR (records exist as the audit trail) | open | met |
| m1 Deferred-item record mechanism existence | not-yet-measured | on-track: both seeded cases exist as structured records (measured 2026-11-12) |

Verified by re-running `node tests/check-dsrf-s1-seeded-records.js` (9 passed, 0 failed) and `node tests/check-ddft-s1-deferred-item-record.js` (8 passed, 0 failed) on merged master. ddft-s1's own tests are unchanged, so they still prove only the mechanism; the persisted-data guarantee now lives in dsrf-s1's test file.

---
## DoD Observations

1. **The test plan and the story disagreed and both passed review.** The story's AC2 to AC4 say a record "is created" and "both seeded records exist", but the test plan's data strategy forbids touching the real file. Every test is therefore green while the AC claims about the real world stay unmet. This is a `/test-plan` and `/definition-of-ready` improvement candidate: a check that tests for "real seeded case" ACs actually write to the real artefact.
2. **AC4's test uses placeholder fixtures (`rc1`, `rc2`)**, not the real records, so it cannot detect that the real records are missing.
3. **Not verified here:** CI run results on PR #1067, any staging or production behaviour, and whether other consumers of `incident-store.js` beyond the `itar-s1` backward-compatibility test are unaffected (only this story's own test file was run).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Deferred-item record mechanism (generalized schema)".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
