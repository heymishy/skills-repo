## Test Plan: Periodic review scan

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s2-periodic-review-scan.md
**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Test plan author:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Surfaces every unresolved `deferred-item` record, never silently skips one | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | First real run surfaces both ddft-s1 seeded records | — | 1 test | — | — | — | 🟢 |
| AC3 | `revisitCondition` shown as-is, no parsing/auto-classification | 2 tests | — | — | — | — | 🟢 |
| AC4 | Re-running with no new records surfaces the same unresolved set again | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. This is a bounded, CLI-triggered scan over a local JSON file — no browser, no external service.

---

## Test Data Strategy

**Source:** Mixed — Synthetic (filtering/edge-case fixtures) + the two real seeded records from `ddft-s1`
**PCI/sensitivity in scope:** No
**Availability:** Available now — depends only on `ddft-s1`'s output, already covered by that story's own test plan
**Owner:** Self-contained — fixture `incidents.json` built per test, including the two real seeded records plus synthetic resolved/unresolved variants

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mix of `type: "incident"`, unresolved `deferred-item`, and resolved `deferred-item` records | Synthetic | None | Proves correct filtering on both dimensions |
| AC2 | The real `tfhc-s1` and C1-vs-Option-C records, as produced by `ddft-s1` | Real, via `ddft-s1`'s registration | None | |
| AC3 | A record with deliberately irregular free-text `revisitCondition` (e.g. containing dates, conditional phrasing) | Synthetic | None | Proves no parsing is attempted regardless of how condition-like the prose looks |
| AC4 | Same fixture run twice, no mutation between runs | Synthetic + real seeded records | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### filtersToUnresolvedDeferredItemRecordsOnly

- **Verifies:** AC1
- **Precondition:** A record list containing `type: "incident"` records, resolved `deferred-item` records, and unresolved `deferred-item` records
- **Action:** Run the scan's filter function
- **Expected result:** Output contains only unresolved `deferred-item` records — zero incidents, zero resolved deferred items
- **Edge case:** Yes — three-way filter, not a simple type check

### neverSkipsAnUnresolvedRecordSilently

- **Verifies:** AC1
- **Precondition:** A record with an unusual/sparse set of optional fields (e.g. missing `linkedFeature`) but `status` unresolved
- **Action:** Run the filter function
- **Expected result:** The record is still included — absence of an optional field must never cause silent exclusion
- **Edge case:** Yes

### preservesRevisitConditionTextVerbatim

- **Verifies:** AC3
- **Precondition:** A record with a `revisitCondition` string containing punctuation, a date-like substring, and conditional phrasing (e.g. "once volume improves after 2026-12-01")
- **Action:** Run the scan and inspect the surfaced text for that record
- **Expected result:** The surfaced string is character-for-character identical to the input — no trimming, no date extraction, no condition parsing applied
- **Edge case:** Yes

### neverCallsAnyConditionEvaluationLogic

- **Verifies:** AC3
- **Precondition:** Scan module instrumented so any call to a date-parsing or boolean-condition-evaluation function would be detected
- **Action:** Run the scan against a batch of varied `revisitCondition` strings
- **Expected result:** No such function is ever called — a negative assertion proving the "confirmed infeasible, do not attempt" constraint is actually honoured in code, not just in prose
- **Edge case:** No

---

## Integration Tests

### firstRealRunSurfacesBothSeededRecords

- **Verifies:** AC2
- **Components involved:** Scan module, `workspace/incidents.json` (as produced by `ddft-s1`)
- **Precondition:** `incidents.json` contains the real `tfhc-s1` and C1-vs-Option-C records from `ddft-s1`
- **Action:** Run the scan
- **Expected result:** Both records appear in the output, identifiable by their real ids — not merely "2 records returned," the specific ids must be asserted

### secondRunWithNoNewRecordsResurfacesSameSet

- **Verifies:** AC4
- **Components involved:** Scan module, `workspace/incidents.json`
- **Precondition:** Same fixture file, unmodified between runs
- **Action:** Run the scan twice in sequence
- **Expected result:** Both runs return the identical set of unresolved record ids — the scan is a re-surfacing mechanism, not a "seen once, suppress thereafter" notification

### filtersOutResolvedRecordsInRealFixture

- **Verifies:** AC1
- **Components involved:** Scan module, `workspace/incidents.json`
- **Precondition:** Fixture with one record marked resolved alongside the two real unresolved seeded records
- **Action:** Run the scan
- **Expected result:** Only the two unresolved records appear; the resolved one is excluded

---

## NFR Tests

No dedicated NFR tests. Performance has no stated numeric threshold — the story's own NFR section states this is "not expected to be a performance concern," a documented assumption, not a measurable target, so no test is written against it. Security states "none beyond what ddft-s1 already establishes" — covered by `ddft-s1`'s own NFR test, not re-tested here. Accessibility: not applicable (CLI output). Audit: satisfied by the AC1/AC2/AC4 tests themselves (the scan's own output is the audit trail).

---

## Out of Scope for This Test Plan

- Any resolution/closing mechanism — surfacing only, per the story's own Out of Scope
- Automated trigger-condition evaluation — confirmed infeasible; covered above as a negative test, not built
- `ddft-s1`'s schema/registration behaviour, `ddft-s3`'s telemetry enrichment — each has its own test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All four ACs are fully automatable | — |
