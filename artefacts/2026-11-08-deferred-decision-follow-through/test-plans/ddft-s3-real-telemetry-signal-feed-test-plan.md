## Test Plan: Real telemetry signal feed

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s3-real-telemetry-signal-feed.md
**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Test plan author:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real PostHog figures included when events exist for `linkedFeature` | 2 tests | 1 test | — | — | External-dependency (mocked) | 🟢 |
| AC2 | Zero-events case reported honestly, no crash, no overclaim | 1 test | 1 test | — | — | External-dependency (mocked) | 🟢 |
| AC3 | No `linkedFeature` → lookup skipped entirely | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Story's own sparse-telemetry finding self-registers via ddft-s1's mechanism | — | 1 test | — | — | — | 🟡 |

---

## Coverage gaps

PostHog is a real third-party service; all tests use a mocked PostHog client, never a live call — appropriate per the story's own NFR (no new instrumentation, bounded periodic pull) and `product/constraints.md` #12 (credentials never touch this test environment). This is standard external-dependency mocking, not an unaddressed gap.

---

## Test Data Strategy

**Source:** Mocked external services (PostHog) + the real seeded `ddft-s1` records to key lookups against
**PCI/sensitivity in scope:** No
**Availability:** Available now — PostHog client is mockable at the adapter boundary
**Owner:** Self-contained — mock PostHog responses constructed per test; no real PostHog API key used anywhere in this test plan

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock PostHog response with real-shaped `stage_completed`/`stage_started` events for a known `featureSlug` | Synthetic, shaped per the real confirmed event schema | None | Event shape must match the real sparse-but-genuine schema verified at /clarify, not an invented shape |
| AC2 | Mock PostHog response returning zero events | Synthetic | None | The realistic common case, given confirmed sparse real volume |
| AC3 | A deferred-item record with `linkedFeature` absent/empty | Synthetic | None | |
| AC4 | A full scan run with PostHog mocked to zero events | Synthetic | None | Proves the self-registration behaviour deterministically rather than depending on real-world sparse data at test time |

### PCI / sensitivity constraints

None. No real PostHog credentials are used in any test.

### Gaps

None.

---

## Unit Tests

### buildsExactFeatureSlugQueryNeverFuzzyMatched

- **Verifies:** AC1
- **Precondition:** A deferred-item record with `linkedFeature: "2026-11-08-incident-triage-and-respond"`
- **Action:** Build the PostHog query filter for that record
- **Expected result:** The query filter's feature-slug parameter is the exact string, with no substring/fuzzy matching applied
- **Edge case:** No

### formatsRealEventsIntoFigures

- **Verifies:** AC1
- **Precondition:** A mock event batch containing `stage_completed` (with cost/tokens) and `artefact_commit_succeeded` counts
- **Action:** Run the formatting function
- **Expected result:** Output includes the real cost, token count, and event counts from the mock batch — not a generic "data exists" message
- **Edge case:** No

### reportsZeroEventsHonestlyWithoutOverclaiming

- **Verifies:** AC2
- **Precondition:** A mock event batch with zero matching events
- **Action:** Run the formatting function
- **Expected result:** Output reads as "no telemetry signal found for this feature" (or the exact equivalent the implementation defines) — explicitly asserted to NOT contain language implying "nothing happened" or "feature is inactive," since zero events could mean sparse instrumentation, not zero real activity
- **Edge case:** Yes — this is the specific overclaiming failure mode the AC calls out

### skipsLookupWhenNoLinkedFeature

- **Verifies:** AC3
- **Precondition:** A deferred-item record with `linkedFeature` absent
- **Action:** Run the telemetry-enrichment step for that record
- **Expected result:** The PostHog client is never invoked for this record (assert zero calls); the record passes through to scan output without a telemetry field, not with an empty/invalid-key error
- **Edge case:** Yes

---

## Integration Tests

### enrichesScanOutputWithRealFiguresWhenEventsExist

- **Verifies:** AC1
- **Components involved:** Scan module (from `ddft-s2`), telemetry-enrichment module, mocked PostHog client
- **Precondition:** A seeded deferred-item record with a `linkedFeature` that the mock PostHog client returns real-shaped events for
- **Action:** Run the full scan with enrichment enabled
- **Expected result:** That record's scan-output entry includes the real figures from the mock; other records without matching events are unaffected

### enrichesScanOutputWithHonestZeroSignalMessage

- **Verifies:** AC2
- **Components involved:** Scan module, telemetry-enrichment module, mocked PostHog client (zero events)
- **Precondition:** A seeded deferred-item record with a `linkedFeature`, mock PostHog returns zero matching events
- **Action:** Run the full scan with enrichment enabled
- **Expected result:** No crash; the record's output includes the honest "no signal found" message; the scan's own successful completion (exit code / return value) is unaffected by the zero-event case

### neverQueriesPostHogForRecordWithoutLinkedFeature

- **Verifies:** AC3
- **Components involved:** Scan module, telemetry-enrichment module, mocked PostHog client
- **Precondition:** A seeded deferred-item record with no `linkedFeature` (e.g. a backlog-thread-sourced deferral) mixed in with records that do have one
- **Action:** Run the full scan with enrichment enabled
- **Expected result:** The mocked PostHog client's call count equals the number of records WITH a `linkedFeature`, confirmed by call-count assertion — the no-`linkedFeature` record contributes zero calls

### selfRegistersSparseTelemetryFindingAsNewDeferredItemRecord

- **Verifies:** AC4
- **Components involved:** Telemetry-enrichment module, `ddft-s1`'s record-registration function, `workspace/incidents.json`
- **Precondition:** Mock PostHog returns zero events across the board (forcing the sparse-signal condition deterministically)
- **Action:** Run the story's own first production-path execution
- **Expected result:** A new record is written via `ddft-s1`'s `registerRecord()` mechanism with `type: "deferred-item"`, `source: "capture-log"` (or exact equivalent), and `revisitCondition` containing "investigate whether tracking calls are wired into real skill execution" — proving this epic's mechanism applies to its own finding, not only the two pre-seeded historical cases

---

## NFR Tests

### postHogApiKeyNeverAppearsInScanOutput

- **NFR addressed:** Security (`product/constraints.md` #12)
- **Measurement method:** Run the scan with enrichment enabled using a mock client configured with a fake API-key-shaped string in its config; scan the full text of the scan's own output for that string
- **Pass threshold:** Zero occurrences
- **Tool:** Node test runner (`node scripts/run-all-tests.js`)

Performance: no dedicated test — the story's own NFR states query volume is "bounded by the number of surfaced records per scan cycle," a documented assumption without a numeric threshold, not a measurable target at this repo's current record volume. Accessibility: not applicable (CLI output). Audit: satisfied by the AC1/AC2 tests themselves (the scan output recording which records got real telemetry vs. "no signal" is the audit trail).

---

## Out of Scope for This Test Plan

- Any new PostHog instrumentation — per the story's own Out of Scope
- Live PostHog API calls — all tests use a mocked client
- Treating PostHog data as an auto-decision trigger — not built, not tested
- `ddft-s2`'s core scan/filter logic — covered in that story's own test plan; this plan only covers the enrichment layer

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Mock event shape could drift from PostHog's real schema over time | Tests assert against a shape frozen at the time this plan was written, per the real schema confirmed during /clarify | If PostHog's real event schema changes, this is a real regression risk worth a follow-up deferred-item record of its own, consistent with this epic's own self-application premise |
