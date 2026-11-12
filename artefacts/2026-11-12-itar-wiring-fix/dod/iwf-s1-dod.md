# Definition of Done: Wire triage drafting to incident creation, so a created incident gets a triage summary

**PR:** https://github.com/heymishy/skills-repo/pull/1078 | **Merged:** 2026-11-12 (merge commit 7d95fae62)
**Story:** artefacts/2026-11-12-itar-wiring-fix/stories/iwf-s1-wire-triage-drafting-to-incident-creation.md
**Test plan:** artefacts/2026-11-12-itar-wiring-fix/test-plans/iwf-s1-test-plan.md
**DoR artefact:** artefacts/2026-11-12-itar-wiring-fix/dor/iwf-s1-dor.md
**Assessed by:** Claude (against merged code on master at 7d95fae62)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against synthetic input with the real modules; `integration-real-code` = exercises the real production entry point (the real command run as a child process, the real modules, real file I/O on a temporary file); `live-verified` = confirmed against a real running instance; `production-observed` = observed in production. This story ships a command-line tool and a module, with no running service, so `live-verified` and `production-observed` do not apply.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | AC1 (Acceptance Criterion 1: `recordIncident` appends one `type: "incident"` record without disturbing existing records, runs `draftTriageSummary`, and returns the stored record with `triageSummary` and `priorIncidentLinks` populated and persisted). UT1 passes: the file holds the earlier record plus the new one, and the returned and on-disk records agree on a non-null summary and a link to the earlier incident. UT2 passes: a seeded incident, a `deferred-item` and an untyped legacy record are deep-equal to their snapshots afterwards and the file grew by exactly one. Strength: `unit` with the real modules. Adequate for a claim about the function's own behaviour. | Automated tests UT1, UT2 in `tests/check-iwf-s1-incident-recording.js` | None |
| AC2 | ✅ | AC2 (Acceptance Criterion 2: the `create-incident` command records through `recordIncident`, prints the id and summary and exits 0, and rejects missing input or over-long tags with a message, no write and a non-zero exit). IT1 passes: exit 0, stdout contains the new record's id and its triage summary. IT2 passes: with no `--trigger`, non-zero exit, stderr names `trigger`, and the file is never created. IT3 passes: over-long tags give a non-zero exit, a tag-length message, and the file bytes unchanged. UT6 passes: the module's default target resolves to `workspace/incidents.json`. Strength: `integration-real-code`, since the command is the real script run as a separate process. | Automated tests IT1, IT2, IT3, UT6 | None |
| AC3 | ✅ | AC3 (Acceptance Criterion 3: only `incident` records, with a missing `type` counting as `incident`, are candidates for prior-incident links; a `deferred-item` is never linked). UT3 passes: a `deferred-item` with identical tags yields empty `priorIncidentLinks`, the "No relevant prior incident" summary, and neither its id nor its text appears in the summary. UT4 passes: an untyped legacy record with overlapping tags is linked. Strength: `unit` with the real modules. | Automated tests UT3, UT4 | None |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: if drafting throws after storing, the incident stays on disk with `triageSummary: null` and the failure is reported). UT5 passes with a throwing `draft` option: the call throws a message containing `boom`, and the file still holds the record with trigger, summary and tags intact and `triageSummary` null. Strength: `unit`. The failure is injected through the optional `draft` parameter, since the real drafter does not fail on valid input. | Automated test UT5 | None |
| AC5 | ✅ | AC5 (Acceptance Criterion 5: two sequential real command runs with overlapping tags link the second incident to the first, proved through the real command line, and the real data file is never touched). IT4 passes: the second record's `priorIncidentLinks` equals the first record's id and its summary contains that id. NFR-CORR1 passes: the SHA-256 and mtime of `workspace/incidents.json` are identical before and after the run. Strength: `integration-real-code`. | Automated tests IT4, NFR-CORR1, plus `git status` showing the real file unmodified after the run | None |

**Verification strength summary:** AC2 and AC5 `integration-real-code`; AC1, AC3 and AC4 `unit` with real modules; 0 `live-verified`; 0 `production-observed`. UI-evidence gate: N/A, no browser-observable ACs.

---

## Scope Deviations

None against the story's Out of Scope list. The PR changed exactly four files: `src/modules/incident-recorder.js` (new), `scripts/create-incident.js` (new), `src/modules/triage-drafter.js` (the candidate filter and its import only) and `tests/check-iwf-s1-incident-recording.js` (new). It did not change `INCIDENT_JACCARD_THRESHOLD`, the scoring or the summary wording, did not touch `incident-store.js` or `drift-comparator.js`, and wrote no incident record to the real `workspace/incidents.json`.

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11 (UT1 to UT6, IT1 to IT4, NFR-CORR1).
**Tests passing:** 11 / 11, re-run locally on merged master: `node tests/check-iwf-s1-incident-recording.js` reported 11 passed, 0 failed. `node tests/check-itar-s2-triage-drafting.js` (15) and `node tests/check-dsrf-s1-seeded-records.js` (9) still pass. CI on PR #1078 was green on all 8 reported checks, including "Lint, typecheck, test, build" and "Run assurance gate". During the build the test file was run before the module existed and failed 10 of 11, so the tests demonstrably detect an unwired entry point.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| UT1 stores and drafts (AC1) | ✅ | ✅ | |
| UT2 existing records untouched (AC1) | ✅ | ✅ | |
| UT3 deferred-item never a prior incident (AC3) | ✅ | ✅ | |
| UT4 untyped record counts as incident (AC3) | ✅ | ✅ | |
| UT5 draft failure keeps the incident (AC4) | ✅ | ✅ | |
| UT6 default target is the real data file (AC2) | ✅ | ✅ | |
| IT1 command records and prints (AC2) | ✅ | ✅ | |
| IT2 missing input rejected (AC2) | ✅ | ✅ | |
| IT3 over-long tags rejected (AC2) | ✅ | ✅ | |
| IT4 two runs link (AC5) | ✅ | ✅ | |
| NFR-CORR1 real file unchanged (AC5) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage-gap audit:** the test plan declared no coverage gaps and has no `CSS-layout-dependent` gaps, so no RISK-ACCEPT was needed. Its one accepted risk (concurrent runs could interleave writes on the same file) is recorded in the plan.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: no credentials, tenant identifiers or PII written by the command or tests | ✅ | Tests use synthetic text in temporary files; NFR-CORR1 shows the real data file is never written. The command does not itself screen free text for credentials, which stays the authoring-discipline rule from itar-s1. |
| Performance | ✅ | Not applicable: a read-modify-write of a small JSON file. |
| Correctness: the end-to-end test goes through the real command line | ✅ | IT1 to IT4 run `node scripts/create-incident.js` as a child process. |

---

## Metric Signal

No metric formally lists this story; the feature has no `metrics[]` entries (short-track). It addresses the first gap behind itar-s2's metric m2 (Triage drafting coverage: 100% of new incident records get a drafted triage summary attempt).

**itar-s2 m2 Triage drafting coverage**
Signal: not-yet-measured, now measurable
Evidence note: a creation path now exists that always attempts a draft, so coverage is 100% for records created through `create-incident`. No real incident has been recorded through it yet, so there is no real-world measurement. Anything that writes a record directly with `appendIncidentRecord` still bypasses drafting.
Date measured: null

---

## Outcome

**COMPLETE**

ACs satisfied: 5/5. AC2 and AC5 are `integration-real-code` through the real command; AC1, AC3 and AC4 are `unit` with the real modules.

**Follow-up actions:**
1. **Re-grade itar-s2.** Its first DoD gap (no caller of `draftTriageSummary`) is now closed. Its second gap, the unpinned `INCIDENT_JACCARD_THRESHOLD`, is not: it needs real `type: "incident"` records, and none exist. Owner: the itar-s2 DoD re-grade, see its addendum.
2. **Record the first real incident through the command** when one occurs, then check the drafted summary and tune the threshold against it. Owner: operator, whenever a real production incident next happens.

---

## DoD Observations

1. **The wiring gap had a second layer under it.** itar-s2's DoD said the drafter had no caller. Searching for callers showed no production code created incidents either, so the real defect was a missing entry point, not a missing call. For future "X has no caller" findings, check whether X's own inputs are produced anywhere.
2. **Adding a second record type to a shared file changed an older module's correctness.** dsrf-s1 put `deferred-item` records into the file the drafter reads, which would have made them candidate "prior incidents". Caught while scoping this story, not by a test. Any story that adds a record type to a shared store should name the readers of that store.
3. **The command is manual.** Nothing creates an incident automatically on an alert; that is initiative 2's integration point. Direct writers using `appendIncidentRecord` skip drafting.
4. **Not verified here:** no real incident was recorded, no live or production behaviour was checked, and the real data file was deliberately never written.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire triage drafting to incident creation".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
