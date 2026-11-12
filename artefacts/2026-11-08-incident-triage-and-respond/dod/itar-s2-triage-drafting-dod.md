# Definition of Done: Triage drafting via structured-field Jaccard matching

**PR:** https://github.com/heymishy/skills-repo/pull/1066 | **Merged:** 2026-11-11 (merge commit 79c65db23)
**Story:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s2-triage-drafting.md
**Test plan:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s2-triage-drafting-test-plan.md
**DoR artefact:** artefacts/2026-11-08-incident-triage-and-respond/dor/itar-s2-triage-drafting-dor.md
**Assessed by:** Claude (against merged code on master at d0a3ad048, which contains 79c65db23)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against fixtures or mocks only; `integration-real-code` = exercises the real, unmocked production modules (`triage-drafter.js`, `incident-store.js`, `drift-comparator.js`) reading and writing a real file on disk, but not a live environment or real incident data; `live-verified` = confirmed against a real running instance; `production-observed` = confirmed from real production data. No AC here has live-verified or production-observed evidence.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: score a new record's tags against every existing record with the newly exported Jaccard primitive and attach above-threshold matches as prior-incident links). Tests pass on merged master: `jaccardSimilarity_isExportedAndCallable_fromDriftComparator`, `attachesMatch_whenScoreAtOrAboveThreshold`, `excludesMatch_whenScoreBelowThreshold`, `attachesMultipleMatches_...`, `rankMatchesByScoreDescending_...`, plus `persistsSummaryOnRecordInStore_whenRunAgainstRealIncidentsFile`. Strength: `integration-real-code` with synthetic tag fixtures only. | Automated test `tests/check-itar-s2-triage-drafting.js` (15 passed, 0 failed), plus direct read of `triage-drafter.js` and the `drift-comparator.js` diff | Gap 1 (no creation-time caller) is resolved by iwf-s1 (PR #1078, merged 2026-11-12): `recordIncident` and the `create-incident` command now run `draftTriageSummary` whenever a record is created through them. Gap 2 remains: `INCIDENT_JACCARD_THRESHOLD` is 0.3, chosen by reasoning about small tag sets, and cannot be tuned because no real `type: "incident"` record exists yet. See Re-grade Addendum. |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: a matched summary includes what is known, what was tried before, and a suggested next step, not a bare score). `draftTriageSummary_includesKnownTriedBeforeAndNextStep_whenMatchFound` passes: the persisted text contains all three components. Strength: `integration-real-code`. | Automated test `tests/check-itar-s2-triage-drafting.js`, plus direct read of `buildMatchedSummary` | The structure is verified, not usefulness. The "next step" is a fixed template ("review incident X's own triage notes and prior-incident links before investigating from scratch") for every match, and "what's been tried" only restates the matched record's `status` and prior `triageSummary`. Whether a delivery engineer finds these drafts actually helpful is a real-world claim with no live or real-data evidence. Follow-up 3. |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: no match above threshold still attaches an explicit "no relevant prior incident found" summary, never skipped or fabricated). `statesNoRelevantPriorIncidentFound_whenNoMatchAboveThreshold` and `distinguishesCannotScoreFromGenuineNoMatch` pass; code sets `triageSummary` to "No relevant prior incident was found..." with empty `priorIncidentLinks` and persists it. A first-ever record (no other records) takes the same branch by construction. Strength: `integration-real-code`. | Automated test `tests/check-itar-s2-triage-drafting.js`, plus direct read of `draftTriageSummary` | None. The claim is about a field written by the code, which the test reads back from disk. |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: empty or malformed tags produce an explicit "cannot score" result, distinct from the no-match case, with no unhandled error). `returnsCannotScoreResult_whenTagsFieldEmpty` and `..._whenTagsFieldMalformed` (null and a string) pass, and the distinguishing test confirms status `cannot-score` differs from `no-match`; summary text is "Cannot score — no tags present on this record." Strength: `integration-real-code`. | Automated test `tests/check-itar-s2-triage-drafting.js`, plus direct read of `draftTriageSummary` | None |

**Verification strength summary:** AC1 and AC2 `integration-real-code`, marked ⚠️ because their real-world claims (running at record creation, matching real incidents, drafts being useful) have no live or real-data evidence; AC3 and AC4 `integration-real-code`, adequate for what they claim; 0 `unit`-only; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: N/A, no browser-observable ACs.

---

## Scope Deviations

None against the story's Out of Scope list: no matching against `decisions.md` free text, and no auto-prioritization, severity scoring or escalation. `gh pr diff 1066 --name-only` shows six files: `src/modules/triage-drafter.js` (new), `src/modules/drift-comparator.js` (adds the `jaccardSimilarity: _jaccard` export, no behaviour change), `scripts/lib/incident-store.js` (adds `loadIncidentRecords` and `saveIncidentRecords`), `tests/check-itar-s2-triage-drafting.js` (new), the implementation plan, and `.github/pipeline-state.json` (bookkeeping).

One non-deviation worth recording: the two new helpers in `incident-store.js` are not named in the story, but they are additive, needed for AC1's integration test, and the DoR contract's wording about `incident-store.js` allowed them. Recorded here rather than treated as scope creep.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 (11 named tests plus NFR-AUDIT-1)
**Tests passing in CI:** 12 / 12 implemented. Re-run locally on merged master at d0a3ad048: `node tests/check-itar-s2-triage-drafting.js` gave `15 passed, 0 failed`. The file holds 15 tests: the 12 planned plus 3 extra for the new `loadIncidentRecords` / `saveIncidentRecords` helpers.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| jaccardSimilarity_isExportedAndCallable_fromDriftComparator | ✅ | ✅ | |
| draftTriageSummary_attachesMatch_whenScoreAtOrAboveThreshold | ✅ | ✅ | |
| draftTriageSummary_excludesMatch_whenScoreBelowThreshold | ✅ | ✅ | |
| draftTriageSummary_attachesMultipleMatches_whenMultipleRecordsScoreAboveThreshold | ✅ | ✅ | |
| draftTriageSummary_rankMatchesByScoreDescending_whenAttachingMultiple | ✅ | ✅ | |
| draftTriageSummary_statesNoRelevantPriorIncidentFound_whenNoMatchAboveThreshold | ✅ | ✅ | |
| draftTriageSummary_returnsCannotScoreResult_whenTagsFieldEmpty | ✅ | ✅ | |
| draftTriageSummary_returnsCannotScoreResult_whenTagsFieldMalformed | ✅ | ✅ | |
| draftTriageSummary_distinguishesCannotScoreFromGenuineNoMatch | ✅ | ✅ | |
| draftTriageSummary_persistsSummaryOnRecordInStore_whenRunAgainstRealIncidentsFile | ✅ | ✅ | Reads the file back from disk, satisfying `product/constraints.md` #13 |
| draftTriageSummary_includesKnownTriedBeforeAndNextStep_whenMatchFound | ✅ | ✅ | |
| NFR-AUDIT-1 (implemented as draftTriageSummary_advancesUpdatedAt_afterDrafting) | ✅ | ✅ | |

**Gaps (tests not implemented):** None. The test plan's Coverage gaps table is "None" and it has no CSS-layout-dependent gaps, so the layout-gap audit is N/A. The one acknowledged test-plan risk, the unpinned threshold value, is recorded in decisions.md (2026-11-09 ASSUMPTION) and is still open (see AC1 deviation).

---

## NFR Status

Feature-level `nfr-profile.md` exists (Status: Active).

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: no numeric SLO, matching over full history at low volume | ✅ | The profile states no target and the test plan deliberately wrote no performance test. Matching is a linear scan over records, fine at current volume (indeed, zero real records exist). Nothing to measure; flagged for re-evaluation if volume grows. |
| Security: none beyond itar-s1 data handling | ✅ | `triage-drafter.js` performs no credential handling and writes only to the incidents file path it is given. Note the summary interpolates the matched record's `trigger` text verbatim, so any credential wrongly placed in a trigger would propagate; this is the same authoring-discipline rule as itar-s1's MC-SEC-02, not a new code-enforced check. |
| Audit: the attached summary is the audit trail; `updatedAt` advances | ✅ | NFR-AUDIT-1 passes (`updatedAt` advances after drafting). |
| Accessibility: not applicable | ✅ | No UI in this story. |

The NFR profile's Status is not set to Verified, because itar-s3 and itar-s4 NFRs are still open.

---

## Metric Signal

The story's Benefit Linkage names the "Triage drafting" metric (feature metric m2, "Triage drafting coverage", target: 100% of new incident records get a drafted triage summary attempt). However, `metrics[]` in `.github/pipeline-state.json` lists `contributingStories: []` for m2, so by the skill's rule no metric formally lists itar-s2. Recorded here for visibility anyway.

> **Triage drafting coverage (m2)**
> Signal: not-yet-measured
> Evidence note: the drafting function exists and its behaviour is tested against synthetic fixtures, but nothing calls it when a record is created and no real incident records have been drafted, so a coverage percentage cannot be computed yet. Measurement becomes possible once a creation-time trigger exists and real records flow through it.
> Date measured: null

Housekeeping: m2's `contributingStories` should list itar-s2.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

Re-graded 2026-11-12 from INCOMPLETE to COMPLETE WITH DEVIATIONS after iwf-s1 (PR #1078, merge commit 7d95fae62) wired `draftTriageSummary` to incident creation. The INCOMPLETE grade rested on one fact: nothing called the drafter. That is closed. What remains is a recorded deviation, not a missing deliverable: the threshold is unpinned because no real incident data exists.

ACs satisfied: 4/4 in substance. AC3 and AC4 are ✅; AC1 and AC2 stay ⚠️ on evidence-class grounds (AC1: threshold unpinned; AC2: usefulness of the drafted text unjudged). Nothing is ❌. Verification strength: 4 `integration-real-code`, 0 `live-verified`, 0 `production-observed`.

**Follow-up actions:**
1. Record the first real incident with `node scripts/create-incident.js`, then pin `INCIDENT_JACCARD_THRESHOLD` (currently 0.3) against real tag data per decisions.md's 2026-11-09 revisit trigger, and update AC1 and AC3 text to the pinned value. Owner: operator, when a real incident next occurs.
2. Have a delivery engineer judge whether the drafted summaries for real incidents are useful, which upgrades AC2 to a real-world check.
3. Add itar-s2 to metric m2's `contributingStories` in the feature's metrics.

---

## Re-grade Addendum (2026-11-12)

| Item | Before | After |
|------|--------|-------|
| Caller of `draftTriageSummary` | none anywhere in src, scripts or bin | `recordIncident` (`src/modules/incident-recorder.js`) and `node scripts/create-incident.js` |
| Any production path that creates an incident record | none (found while scoping iwf-s1) | the same command |
| Records the drafter treats as prior incidents | every record in the file, including `deferred-item` | only `incident` records; an untyped record counts as `incident` |
| `workspace/incidents.json` | absent | tracked since dsrf-s1, holds 2 `deferred-item` records and no incidents |
| Threshold `INCIDENT_JACCARD_THRESHOLD` | 0.3, provisional | 0.3, still provisional: no real incident record exists to tune against |
| Metric m2 Triage drafting coverage | not-yet-measurable | measurable for records created through the command; no real incident recorded yet, so still not measured |

Verified by re-running `node tests/check-iwf-s1-incident-recording.js` (11 passed, 0 failed) and `node tests/check-itar-s2-triage-drafting.js` (15 passed, 0 failed) on merged master. itar-s2's own tests are unchanged. Anything that writes a record directly with `appendIncidentRecord`, rather than through `recordIncident`, still bypasses drafting.

---
## DoD Observations

1. **`workspace/incidents.json` does not exist on master.** itar-s1 shipped a migration function for the real capture-log finding, but the file itself is not committed, so the "real incidents file" in the integration test name is a temp fixture. This is why no AC can be real-data verified yet. Tag: `/improve` candidate.
2. **Matched summaries embed the matched record's `triageSummary` verbatim.** `buildMatchedSummary` appends the matched record's own `triageSummary` into "what's been tried", so a chain of matches could nest summaries of summaries over time. Not an AC deviation. Tag: `/improve` candidate.
3. **Not verified in this DoD:** no live or production checks were performed, no real incident data was used, and CI results for PR #1066 were not re-inspected; only the local re-run of the story's own test file on master was done.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Triage drafting via structured-field Jaccard matching".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
