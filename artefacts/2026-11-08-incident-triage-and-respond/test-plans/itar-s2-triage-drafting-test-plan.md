# Test Plan Template

## Test Plan: Triage drafting via structured-field Jaccard matching

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s2-triage-drafting.md
**Epic reference:** artefacts/2026-11-08-incident-triage-and-respond/epics/itar-e1-triage-and-respond.md
**Test plan author:** AI (Claude Sonnet 5)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Score new record's tags against prior records via newly-exported Jaccard primitive; attach top match(es) above threshold | 5 tests | 1 test | — | — | — | 🟢 |
| AC2 | Matched triage summary includes known context, tried-before, and a suggested next step | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | No match above threshold → explicit "no relevant prior incident found" summary, never silently skipped/fabricated | 1 test | — | — | — | — | 🟢 |
| AC4 | Empty/malformed tags → explicit "cannot score — no tags present" result, distinguishable from AC3 | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|----------|
| None | — | — | — | — |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own tag-set fixtures

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Pairs of tag arrays engineered to score above/at/below the threshold constant | Synthetic | None | Threshold value itself is intentionally NOT hardcoded — see Test Gaps and Risks |
| AC2 | A matched prior record with a populated `status`/resolution field | Synthetic | None | — |
| AC3 | A tag set with near-zero overlap against all existing records (or the only record in the store) | Synthetic | None | — |
| AC4 | A record with `tags: []` and a record with `tags: null` / `tags: "not-an-array"` | Synthetic | None | Two distinct malformed shapes |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### jaccardSimilarity_isExportedAndCallable_fromDriftComparator
- **Verifies:** AC1 (Architecture Constraint: `_jaccard` must be newly exported)
- **Precondition:** None
- **Action:** `const { jaccardSimilarity } = require('../../src/modules/drift-comparator'); expect(typeof jaccardSimilarity).toBe('function')`
- **Expected result:** The import succeeds and resolves to a function — this test currently fails (red) because `module.exports` (line 518) does not yet list this export; it is expected to turn green once the export is added, with no change to the function's own internal behavior
- **Edge case:** No

### draftTriageSummary_attachesMatch_whenScoreAtOrAboveThreshold
- **Verifies:** AC1
- **Precondition:** The domain threshold is imported as a named constant, e.g. `const { INCIDENT_JACCARD_THRESHOLD } = require('.../triage-drafter')` — never a literal number re-typed in the test
- **Action:** Draft a triage summary for a new record whose tags are engineered (via `jaccardSimilarity`) to score exactly at `INCIDENT_JACCARD_THRESHOLD` against one existing record
- **Expected result:** The existing record's id appears in the new record's `priorIncidentLinks`
- **Edge case:** Yes — boundary value, at-threshold inclusion

### draftTriageSummary_excludesMatch_whenScoreBelowThreshold
- **Verifies:** AC1
- **Precondition:** Same imported threshold constant as above
- **Action:** Draft a triage summary for a new record whose tags score just below `INCIDENT_JACCARD_THRESHOLD` against the only existing record
- **Expected result:** `priorIncidentLinks` is empty — this record is not treated as a match
- **Edge case:** Yes — boundary value, below-threshold exclusion

### draftTriageSummary_attachesMultipleMatches_whenMultipleRecordsScoreAboveThreshold
- **Verifies:** AC1 ("match(es)" — plural handling)
- **Precondition:** Store seeded with 2 existing records, both scoring above threshold against the new record's tags
- **Action:** Draft a triage summary
- **Expected result:** `priorIncidentLinks` contains both existing records' ids, not just the single highest-scoring one
- **Edge case:** Yes

### draftTriageSummary_rankMatchesByScoreDescending_whenAttachingMultiple
- **Verifies:** AC1
- **Precondition:** Store seeded with 2 matching records with different scores above threshold
- **Action:** Draft a triage summary
- **Expected result:** `priorIncidentLinks` lists the higher-scoring record first
- **Edge case:** Yes

### draftTriageSummary_statesNoRelevantPriorIncidentFound_whenNoMatchAboveThreshold
- **Verifies:** AC3
- **Precondition:** New record's tags score near-zero against every existing record (or the store is otherwise non-empty but entirely dissimilar)
- **Action:** Draft a triage summary
- **Expected result:** The record's triage summary field is populated with an explicit statement that no relevant prior incident was found — the field is never left blank, and `priorIncidentLinks` stays empty
- **Edge case:** No

### draftTriageSummary_returnsCannotScoreResult_whenTagsFieldEmpty
- **Verifies:** AC4
- **Precondition:** New record has `tags: []`
- **Action:** Draft a triage summary
- **Expected result:** Result status is a distinct value (e.g. `'cannot-score'`) with message "cannot score — no tags present"; no error thrown; `priorIncidentLinks` stays empty
- **Edge case:** Yes

### draftTriageSummary_returnsCannotScoreResult_whenTagsFieldMalformed
- **Verifies:** AC4
- **Precondition:** New record has `tags: null` and, separately, `tags: "not-an-array"`
- **Action:** Draft a triage summary for each malformed shape
- **Expected result:** Both cases return the same `'cannot-score'` result, no unhandled error/exception thrown
- **Edge case:** Yes

### draftTriageSummary_distinguishesCannotScoreFromGenuineNoMatch
- **Verifies:** AC3 and AC4 together (the explicit distinguishing requirement in AC4's own wording)
- **Precondition:** Two separate records — one with valid-but-dissimilar tags (AC3 case), one with empty tags (AC4 case)
- **Action:** Draft triage summaries for both
- **Expected result:** The two results have different, explicitly distinct status values (e.g. `'no-match'` vs `'cannot-score'`) — never collapsed into the same generic "no result" shape
- **Edge case:** Yes — this is the exact defect AC4 calls out as unacceptable (a fabricated zero-confidence match indistinguishable from a genuine no-match)

---

## Integration Tests

### draftTriageSummary_persistsSummaryOnRecordInStore_whenRunAgainstRealIncidentsFile
- **Verifies:** AC1, AC2 (`product/constraints.md` #13 — assert the field was actually populated on the persisted record, not just returned by the function in isolation)
- **Components involved:** `scripts/lib/incident-store.js`, triage-drafting module, `drift-comparator.js`'s exported Jaccard function, a fixture `workspace/incidents.json`
- **Precondition:** Fixture file with 1 existing record and 1 newly-created record with matching tags
- **Action:** Run the triage-drafting function against the store, then re-read the fixture file from disk
- **Expected result:** The new record's `triageSummary` and `priorIncidentLinks` fields, as read back from disk, are populated — not merely present in an in-memory return value that was never persisted
- **Edge case:** No

### draftTriageSummary_includesKnownTriedBeforeAndNextStep_whenMatchFound
- **Verifies:** AC2
- **Components involved:** triage-drafting module, a matched record with a populated `status` field (e.g. `'confirmed'`)
- **Precondition:** Matched record has resolution/status content to summarize
- **Action:** Draft a triage summary
- **Expected result:** The resulting `triageSummary` text contains all three narrative components: a "what's known" section referencing the matched record, a "what's been tried" section derived from its status, and a "suggested next step" — not a bare similarity score with no narrative
- **Edge case:** No

---

## NFR Tests

### NFR-AUDIT-1: triage summary attachment updates the record's updatedAt timestamp
- **NFR addressed:** Audit
- **Measurement method:** Unit/integration assertion that `updatedAt` changes when a triage summary is attached post-creation
- **Pass threshold:** `updatedAt` after triage drafting is strictly later than `createdAt`
- **Tool:** `node scripts/run-all-tests.js`

**Performance — no NFR test written, explicitly deferred.** The story's own NFR section states matching against full incident history "is not expected to be a performance concern" at current volume and is "flagged for re-evaluation if incident volume grows materially" — there is no stated threshold to assert against today. Writing a performance test now would assert a number the story itself declines to set.

**Security — no NFR test written.** Story states "None beyond itar-s1's existing data handling" — covered by itar-s1's own test plan.

**Accessibility — not applicable, confirmed with story owner.** No UI in this story.

---

## Out of Scope for This Test Plan

- Any matching against `decisions.md` free text — confirmed out of scope by the discovery; no test written for this.
- Auto-prioritization, severity scoring, or auto-escalation — story itself is Out of Scope for this; no test written.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| The exact `INCIDENT_JACCARD_THRESHOLD` value is not pinned in this test plan | Acknowledged open MEDIUM finding (`/review` 1-M1), logged in `artefacts/2026-11-08-incident-triage-and-respond/decisions.md` (2026-11-09 ASSUMPTION entry) — no comparable historical dataset of incident-tag Jaccard scores exists yet to pin a number now, unlike `pep-s2`/`pep-s3`'s epic-count case where the deciding data already existed | Every test above references the threshold as an imported named constant, never a hardcoded literal, so the suite stays valid once the implementation plan picks and tunes a real value empirically. Per the logged decision's revisit trigger: once the Jaccard primitive has run against a handful of real/fixture incident tag sets, pin the constant to a concrete value and update this test plan's boundary-value tests (`...AtOrAboveThreshold` / `...BelowThreshold`) with that real number if they need adjustment |
