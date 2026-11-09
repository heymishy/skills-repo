# Definition of Done: Incident record mechanism

**PR:** https://github.com/heymishy/skills-repo/pull/1062 | **Merged:** 2026-11-09
**Story:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s1-incident-record-mechanism.md
**Test plan:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s1-incident-record-mechanism-test-plan.md
**DoR artefact:** artefacts/2026-11-08-incident-triage-and-respond/dor/itar-s1-incident-record-mechanism-dor.md
**Assessed by:** Claude Sonnet 5
**Date:** 2026-11-10

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `createIncidentRecord_generatesUniqueId_whenCalled`, `createIncidentRecord_setsStatusOpenAndEmptyPriorLinks_byDefault`, `createIncidentRecord_capturesTriggerFreeText_verbatim`, `createIncidentRecord_rejectsTagsOverBoundedLength_whenSummaryExceedsLimit` — all passing fresh (`node tests/check-itar-s1-incident-store.js`, 2026-11-10) | `integration-real-code` (real, unmocked `incident-store.js`) | None — shipped shape (`id`, `trigger`, `summary`, `tags[]`, `priorIncidentLinks[]`, `status`) matches the AC and the story's own data-model canvas marker exactly |
| AC2 | ✅ | `appendIncidentRecord_addsToFile_withoutTruncatingExistingRecords`, `appendIncidentRecord_createsFile_whenIncidentsJsonDoesNotExistYet` — both passing, both assert the prior record is byte-for-byte unchanged after a second append | `integration-real-code` | None |
| AC3 | ✅ | `normalizeIncidentTags_trimsWhitespaceAndLowercases_beforeStorage` — asserts `[' Auth ', 'SQL-Error']` normalizes to `['auth', 'sql-error']` at capture time, independent of `_jaccard`'s own case-sensitive matching | `integration-real-code` | None |
| AC4 | ✅ | `migrateProductionErrorInvestigation_createsRealRecord_fromCaptureLogFinding` — confirmed the fixture text is a faithful transcription of the real `workspace/capture-log.md` 2026-10-07 entry (`tenant_admin_bootstrap_failed`, "inconsistent types deduced for parameter $1", tenantId heymishy), not a synthetic substitute; cross-checked against the live capture-log.md content directly during this DoD run | `integration-real-code` | None |

**Verification-strength note:** all 4 ACs are backend data-model/storage behaviour with no external real-world effect beyond correctly writing/reading `workspace/incidents.json` — `integration-real-code` evidence is the correct and sufficient class here per the skill's own verification-strength rule. There is no browser-observable behaviour yet (rendering is `itar-s3`, not yet implemented) — **UI-evidence gate: N/A**, no Chrome check applicable to this story.

A deviation is any difference between implemented behaviour and the AC, even if minor. None found.

---

## Scope Deviations

None. `git show c856b57c --stat` confirms the merge touched only: `scripts/lib/incident-store.js` (new module), `tests/check-itar-s1-incident-store.js` (new test file), the implementation plan artefact, `decisions.md`, and `pipeline-state.json`. Neither out-of-scope item (automated alert-to-record creation; any UI for creating a record) was implemented.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9 (re-confirmed fresh on master post-merge, 2026-11-10)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| createIncidentRecord_generatesUniqueId_whenCalled | ✅ | ✅ | |
| createIncidentRecord_setsStatusOpenAndEmptyPriorLinks_byDefault | ✅ | ✅ | |
| createIncidentRecord_capturesTriggerFreeText_verbatim | ✅ | ✅ | |
| createIncidentRecord_rejectsTagsOverBoundedLength_whenSummaryExceedsLimit | ✅ | ✅ | |
| normalizeIncidentTags_trimsWhitespaceAndLowercases_beforeStorage | ✅ | ✅ | |
| appendIncidentRecord_addsToFile_withoutTruncatingExistingRecords | ✅ | ✅ | |
| appendIncidentRecord_createsFile_whenIncidentsJsonDoesNotExistYet | ✅ | ✅ | |
| migrateProductionErrorInvestigation_createsRealRecord_fromCaptureLogFinding | ✅ | ✅ | |
| NFR_AUDIT_1_createdAtAndUpdatedAt_setAndEqualAtCreation | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No credentials in incident content (MC-SEC-02) | ✅ | The real migrated AC4 fixture contains no credentials/tokens (a tenant-bootstrap SQL error message only); the module itself performs no credential handling. This is a content-authoring discipline, not a code-enforced check — consistent with how the story's own Architecture Constraints frame MC-SEC-02 as applying to the committed file's content, not a runtime guard. |

Performance, Accessibility, and Compliance NFRs are explicitly "Not applicable" per the story's own NFR section and the feature's `nfr-profile.md` — confirmed, not newly introduced here.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Incident record mechanism adoption | ✅ (0 structured records today — baseline stated in `benefit-metric.md`) | Not yet — measurement method is "count of structured records vs. new ad-hoc notes, checked monthly," and this mechanism shipped moments ago with zero elapsed time for any monthly window | Signal: `not-yet-measured`. Evidence note: "itar-s1 ships only the incident-record storage mechanism; the feature's other benefit metrics (triage drafting, web-UI rendering, handoff/confirmation) require itar-s2/s3/s4, none yet implemented. This specific metric could in principle start accumulating signal now that the mechanism exists, but no real investigation has used it yet and no monthly measurement window has elapsed." |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required to close this story. Standing, already-tracked items (not new to this DoD): the `workspace/incidents.json` fetch-latency-at-scale gap flagged in `nfr-profile.md` (owed before `itar-s3` reaches DoR, unaffected by this story); `itar-s2`'s unpinned Jaccard threshold (already acknowledged in `decisions.md`).

---

## DoD Observations

1. The shipped data model is a faithful, slightly-more-precise implementation of the story's own canvas marker: the marker typed `tags` as a loose `string`, but the real shipped type is `string[]` (an array) — consistent with AC1's "a list of keyword tags" wording and with `itar-s2`'s own Jaccard-matching need for a real array, not a single delimited string. Not a deviation; a correct resolution of a minor marker/AC phrasing looseness in the array's favor.
2. `MAX_TAG_FIELD_LENGTH` is exported as a named constant (not a magic number buried in the function), consistent with the AC verification script's expectation that the eventual empirical Jaccard threshold tuning (`itar-s2`) has clean, inspectable constants to work from.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Incident record mechanism (itar-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
