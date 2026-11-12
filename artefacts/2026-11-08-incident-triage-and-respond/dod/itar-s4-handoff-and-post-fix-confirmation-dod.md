# Definition of Done: Handoff to short-track pipeline + post-fix confirmation

**PR:** https://github.com/heymishy/skills-repo/pull/1085 | **Merged:** 2026-11-12 (merge commit 88457a760)
**Story:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s4-handoff-and-post-fix-confirmation.md
**Test plan:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s4-handoff-and-post-fix-confirmation-test-plan.md
**DoR artefact:** artefacts/2026-11-08-incident-triage-and-respond/dor/itar-s4-handoff-and-post-fix-confirmation-dor.md
**Assessed by:** Claude (against merged code on master at 88457a760)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = a library function against fixtures; `integration-real-code` = the real command-line scripts run as child processes against temporary incident files, with the real storage module; `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. This story ships command-line scripts, so the last two do not apply.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: for an incident with a triage summary, a short-track story is created with the triage context attached and the record is updated to link the story's slug). Tests linkIncidentToStory_setsLinkedStorySlug_whenHandoffOccurs (real CLI) and attachTriageContextToStoryHandoff_includesKnownAndNextStep (real CLI writes context file) pass, with rejection tests for an unsafe slug (nothing written), a missing triage summary, an unknown id and an already-linked incident. Strength: `integration-real-code`. | Automated test `tests/check-itar-s4-handoff-and-post-fix-confirmation.js` (20 passed, 0 failed, re-run on merged master) | **No story is created.** No command exists to create a short-track story, so `handoff-incident.js` writes `artefacts/<slug>/incident-handoff.md` (triage summary, prior incidents, suggested next step) and sets the record's `linkedStory`. It does not add an entry to `pipeline-state.json`. A person or agent still has to start the short-track story from that file. |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: when the linked story reaches `dodStatus: complete`, the post-fix check attempts the original triggering check if an automated one exists, else prompts for a manual confirm). Tests postFixCheck_selectsAutomatedPath_whenDetectionExistsForTriggeringCheck and postFixCheck_selectsManualPath_whenNoAutomatedDetectionExists pass, "automated branch end to end via real CLI --registry (pass and fail), epic-nested story" passes, and "confirm CLI refuses when linked story is not dodStatus complete" passes. Strength: `integration-real-code`. | Automated test | The built-in detection registry is empty because initiative 2 has not shipped, so in real use every incident takes the manual branch. The automated branch is proven only with a test registry passed through `--registry`. The check is a command a person runs; nothing triggers it when a story reaches `dodStatus: complete`. |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: the record's status is updated to confirmed or not-confirmed after either path, never left at its pre-fix status). Tests updateIncidentConfirmationStatus_setsConfirmed_whenCheckPasses (real CLI, manual) and updateIncidentConfirmationStatus_setsNotConfirmed_whenCheckFails (real CLI, manual) pass, plus the NFR audit test that `confirmedAt` is set. Strength: `integration-real-code`. | Automated test | None for the AC as built, with one reading: the result is stored in a new field `confirmationStatus` (confirmed or not-confirmed), and the top-level `status` becomes `confirmed` or `flagged`. See Observation 2. |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: a not-confirmed result keeps the record open or flagged and logs the fix attempt as tried-but-unsuccessful). Test updateIncidentConfirmationStatus_keepsRecordOpenAndLogsAttempt_whenNotConfirmed passes: status is `flagged`, never `closed`, and a `tried-but-unsuccessful` attempt is appended. Strength: `integration-real-code`. | Automated test | None |

**Verification strength summary:** AC3 and AC4 `integration-real-code`; AC1 and AC2 `integration-real-code` but marked ⚠️; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: N/A, no browser-observable ACs.

---

## Scope Deviations

None against the story's Out of Scope list. The PR added six files and changed none: `scripts/handoff-incident.js`, `scripts/confirm-incident-fix.js`, `scripts/lib/incident-handoff.js`, `scripts/lib/incident-detection-registry.js`, the test file and the plan. The DoR contract listed `scripts/lib/incident-store.js` as touched; it was not, and nothing needed it. The scripts only handle `incident` records: a `deferred-item` record is refused with exit code 1 and left untouched (tested, and re-run by me against the real `workspace/incidents.json`, whose hash was unchanged).

---

## Test Plan Coverage

**Tests from plan implemented:** the test plan registered 9 tests; the test file implements 20 (the plan's cases plus refusal, safety, flag-documentation and untouched-real-file cases). I did not map the plan's 9 names one to one against the 20.
**Tests passing:** 20 / 20, re-run locally on merged master; the neighbouring suites itar-s3 (14), iwf-s1 (11) and urpv-s4 (17) pass. The build agent's first full-suite run showed 6 failures and the second showed 5, all baseline or known flakes; the list for the first run was not captured, so the 6th failure is unidentified. Final CI results for PR #1085 were not re-inspected; the operator merged it.

**Gaps (tests not implemented):** none identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Audit: confirmation time recorded | ✅ | Test NFR-AUDIT-1 asserts `confirmedAt` is set when `confirmationStatus` changes. |
| Safety: path traversal in the story slug | ✅ | handoff_rejectsUnsafeSlug_andWritesNothing. |
| Data safety: never alters deferred-item records or the real file | ✅ | handoff_neverTouchesDeferredItemRecord, confirm_neverTouchesDeferredItemRecord and "real workspace/incidents.json untouched by this test file". |
| Idempotence | ✅ | Handoff refuses an already-linked incident and confirm refuses an already-confirmed one (tested). |

---

## Metric Signal

No metric in the feature's `metrics[]` lists itar-s4 as a contributor.

**Incidents closed through a confirmed fix (rather than assumed fixed)**
Signal: not-yet-measured
Evidence note: both scripts work against temporary files, but no real incident exists in `workspace/incidents.json` to hand off or confirm. The first real incident taken from recording to confirmed fix will be the first measurement.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 4/4 in substance. AC3 and AC4 are ✅; AC1 and AC2 are ⚠️. Nothing is ❌. The deviations are that handoff does not create a story, that the automated re-check has nothing to run until initiative 2 ships, and that nothing triggers the post-fix check by itself.

**Follow-up actions:**
1. Decide whether a command to create a short-track story (state entry plus story file) should exist, so handoff can complete AC1 as written. Owner: operator.
2. Run the whole chain once on a real incident: `create-incident.js`, `handoff-incident.js`, the short-track story to DoD, then `confirm-incident-fix.js`. This is also the first real test of the record store in use. Owner: operator.
3. Decide whether reaching `dodStatus: complete` for a linked story should prompt the confirm step automatically (for example a line in the DoD skill), or stay a manual command. Owner: operator.

---

## DoD Observations

1. **AC1's "a short-track story is created" is delivered as a context file plus a link.** The record ends up pointing at a slug that may not exist in `pipeline-state.json` yet.
2. **AC3 and AC4 disagree on one field.** AC3 wants a status of `confirmed` or `not-confirmed`; AC4 wants the record `open` or `flagged`. The build agent resolved it with two fields (`confirmationStatus` and top-level `status`), disclosed on the PR; the alternative would be one field that cannot satisfy both.
3. **The detection registry is a stub with an interface and no entries.** The automated branch has never run against a real detection.
4. **Not verified here:** no real incident, no live or production behaviour, the unidentified 6th failure in the agent's first full run, and per-check CI results for the merged PR.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Handoff to short-track pipeline + post-fix confirmation".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
