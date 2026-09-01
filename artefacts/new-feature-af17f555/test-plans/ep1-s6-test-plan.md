## Test Plan: Audit Logging and PostHog Instrumentation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s6.md
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Test plan author:** Claude Code (agent-authored, operator-directed)
**Date:** 2026-09-01

---

## Entry Condition Check ✅

- Story artefact exists: `artefacts/new-feature-af17f555/stories/ep1-s6.md` ✅
- Review report shows PASS: `artefacts/new-feature-af17f555/review/ep1-s6-review-1.md` (0 HIGH, 0 MEDIUM, 1 LOW-mitigated) ✅
- Story has 1 AC — below the 3-AC convention minimum. Same mitigation as prior stories in this epic. ⚠️

**Proceeding with test plan for ep1-s6.**

---

## Test Environment and Framework

**Confirmed from `package.json` scripts:** `npm test` (Node.js assert-based test helper). Purely backend logging/instrumentation — no UI component, no E2E test required.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved

**Mechanism:**
- Mock the PostHog client to capture emitted events without a real network call
- Trigger each of the 6 named event types (feature discovered, feature selected, journey backfilled, artefact loaded, session started from CLI-progressed feature, stage navigation) plus the error events already built in ep1-s5, and assert on captured event shape

**Sensitivity:** None — synthetic test data. `operatorId` (when available) is the only potentially-identifying field; this is the operator's own GitHub-OAuth-derived identity, already used elsewhere in the platform for authorship attribution — no new sensitivity introduced.

**Data Availability:** Ready.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap Type | Risk |
|----|---|---|---|---|---|---|---|
| AC1 | Every named event is logged to server stdout with `[cross-channel]` prefix and emitted to PostHog with structured fields | 7 | 2 | — | — | None | 🟢 |

---

## Unit Tests

### Each of the 6 named event types is logged with the [cross-channel] prefix
- **Verifies:** AC1
- **Precondition:** Trigger each event type in isolation: feature discovered, feature selected, journey backfilled, artefact loaded, session started from CLI-progressed feature, stage navigation
- **Action:** Inspect captured server stdout log lines
- **Expected result:** Every log line begins with `[cross-channel]` and includes `featureSlug`, `stage`, `eventType`, `timestamp`
- **Edge case:** No

### PostHog events include base fields plus event-specific details
- **Verifies:** AC1
- **Precondition:** Trigger "artefact loaded" event with a known artefact count and load time
- **Action:** Inspect the captured PostHog call
- **Expected result:** Event includes `featureSlug`, `stage`, `eventType`, `timestamp` (base fields) plus `artefactCount`, `loadTimeMs` (event-specific)
- **Edge case:** No

### operatorId is included when available, omitted (not null-padded) when not
- **Verifies:** AC1
- **Precondition:** Trigger the same event once with an authenticated session (operatorId present) and once without (e.g. a background/system-triggered backfill)
- **Action:** Inspect both log lines
- **Expected result:** `operatorId` present in the first, cleanly absent (not `null` or `undefined` string) in the second
- **Edge case:** Yes

### ep1-s5's 3 error event types are covered by this story's same logging shape
- **Verifies:** AC1
- **Precondition:** Trigger `artefact_load_error`, `journey_backfill_error`, `stage_routing_error` (from ep1-s5)
- **Action:** Inspect captured log/PostHog calls
- **Expected result:** Same base field shape (`featureSlug`, `stage`, `eventType`, `timestamp`) as the 6 success-path events — one consistent instrumentation shape across success and error paths, not two divergent ones
- **Edge case:** Yes — proves this story unifies rather than duplicates ep1-s5's own logging

### PostHog call failure does not throw or block the calling code
- **Verifies:** AC1 (NFR: fire-and-forget)
- **Precondition:** Mock PostHog client's `capture()` to throw
- **Action:** Trigger any event
- **Expected result:** No exception propagates to the caller; server stdout log for the same event still succeeds independently

### Server logs are structured JSON, not free-text interpolation
- **Verifies:** AC1 (NFR)
- **Precondition:** Trigger any event
- **Action:** Parse the captured stdout line
- **Expected result:** The line (after the `[cross-channel]` prefix) parses as valid JSON with the documented fields — not a free-text sentence with values interpolated inline

### Stage navigation event captures both from-stage and to-stage
- **Verifies:** AC1
- **Precondition:** Trigger a backward stage navigation (ep1-s4)
- **Action:** Inspect the captured event
- **Expected result:** Event includes both the stage navigated from and the stage navigated to — not just the destination

---

## Integration Tests

### A full session lifecycle emits the expected event sequence
- **Verifies:** AC1
- **Components involved:** ep1-s1 (discovery), ep1-s2 (artefact load), ep1-s3 (journey backfill), ep1-s4 (stage navigation)
- **Precondition:** Fixture feature with no journey record, at `stage: 'definition'`
- **Action:** Simulate a full continue-and-navigate session
- **Expected result:** Events fire in order: feature discovered → feature selected → journey backfilled → artefact loaded → session started from CLI-progressed feature — none skipped, none duplicated

### Instrumentation does not alter the behaviour it observes
- **Verifies:** AC1 (regression safety)
- **Precondition:** Same fixture as above, instrumentation temporarily disabled vs enabled
- **Action:** Compare session-start outcome (HANDOFF CONTEXT content, journey record fields, routing decision) with instrumentation on vs off
- **Expected result:** Identical outcome in both cases — this story only observes, it does not change ep1-s1–s5's behaviour

---

## NFR Tests

### All PostHog events include the 5 required fields
- **NFR addressed:** Auditability
- **Measurement method:** Assert every captured PostHog call across all test triggers includes `featureSlug`, `stage`, `eventType`, `timestamp`, and `userId` (when available)
- **Pass threshold:** 100% of captured events include the 4 always-required fields
- **Tool:** Node.js assert-based test helper

---

## Out of Scope for This Test Plan

- Real-time analytics dashboard — out of scope per story (PostHog for async analysis only)
- Operator-facing logging UI or trace view — out of scope per story
- Custom PostHog cohort/funnel definitions — out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

---

*Written 2026-09-01 as part of getting the whole `new-feature-af17f555` feature to DoR-ready level. This story is the mechanism that will eventually MEASURE `benefit-metric.md`'s Metrics 1, 2, and 3 — until it ships, those metrics remain at `signal: 'not-yet-measured'` in pipeline-state.json.*
