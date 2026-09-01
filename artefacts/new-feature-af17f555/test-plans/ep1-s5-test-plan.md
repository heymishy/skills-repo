## Test Plan: Error Handling and Graceful Degradation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s5.md
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Test plan author:** Claude Code (agent-authored, operator-directed)
**Date:** 2026-09-01

---

## Entry Condition Check ✅

- Story artefact exists: `artefacts/new-feature-af17f555/stories/ep1-s5.md` ✅
- Review report shows PASS: `artefacts/new-feature-af17f555/review/ep1-s5-review-1.md` (0 HIGH, 0 MEDIUM, 1 LOW-mitigated) ✅
- Story has 1 AC — below the 3-AC convention minimum. Same mitigation as prior stories in this epic. ⚠️

**Proceeding with test plan for ep1-s5.**

---

## Test Environment and Framework

**Confirmed from `package.json` scripts:** `npm test` (Node.js assert-based test helper).

**AC Analysis:** The AC covers five distinct error conditions (pipeline-state.json unreachable, artefact file missing, artefact file unreadable, journey backfill fails, stage routing indeterminate) and one operator-facing disclosure message. The disclosure is plain text rendered into the session header — no CSS layout, positioning, or interaction dependency. This is verifiable by asserting the rendered HTML/session state contains the expected text, without a real browser.

**Decision:**
No E2E test required — every error path and the resulting disclosure text are verifiable at unit/integration level.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved

**Mechanism:**
- Simulate each of the 5 named error conditions directly: mock `fs.readFileSync` to throw ENOENT (missing) or a decode error (unreadable); mock `journey-disk.js` writes to throw; mock the routing function (ep1-s4) to return `undefined`/indeterminate; mock the pipeline-state fetch adapter to throw
- Mock PostHog client and server stdout logger to assert error events without a real network call

**Sensitivity:** None — synthetic test data.

**Data Availability:** Ready.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap Type | Risk |
|----|---|---|---|---|---|---|---|
| AC1 | Every named error condition is caught, logged, and degrades gracefully with a non-blocking operator disclosure | 8 | 3 | — | — | None | 🟢 |

---

## Unit Tests

### pipeline-state.json unreachable is caught and logged, feature list falls back gracefully
- **Verifies:** AC1
- **Precondition:** Mock pipeline-state fetch throws
- **Action:** Attempt feature list load
- **Expected result:** Error logged to server stdout with `errorType: 'pipeline_state_unreachable'`; existing skill-picker fallback behaviour is invoked (per Component 1's own established error handling), session start not blocked

### Missing artefact file is excluded, not fatal
- **Verifies:** AC1
- **Precondition:** `resolveArtefacts` (ep1-s2) fixture references a file that does not exist on disk
- **Action:** Call the error-wrapping layer around `resolveArtefacts`
- **Expected result:** That artefact is excluded from HANDOFF CONTEXT; error logged with `errorType: 'artefact_load_error'`, `featureSlug`, `stage`; session proceeds

### Unreadable artefact file (encoding error) is excluded, not fatal
- **Verifies:** AC1
- **Precondition:** Fixture file read throws a decode error
- **Action:** Call the error-wrapping layer
- **Expected result:** Same as above — excluded, logged, non-fatal

### Journey backfill failure does not block session start
- **Verifies:** AC1
- **Precondition:** Mock `backfillJourney` (ep1-s3) throws
- **Action:** Attempt session start for a CLI-progressed feature with no journey record
- **Expected result:** Error logged with `errorType: 'journey_backfill_error'`; session starts with empty `completedStages` rather than failing outright

### Stage routing indeterminate does not block session start
- **Verifies:** AC1
- **Precondition:** Mock `getNextSkill` (ep1-s4) returns `undefined` for an unrecognised stage value
- **Action:** Attempt session start
- **Expected result:** Error logged with `errorType: 'stage_routing_error'`; session falls back to a safe default (skill picker) rather than crashing

### Operator disclosure message renders exactly the specified text for a critical-data-missing case
- **Verifies:** AC1
- **Precondition:** All artefacts for a feature fail to load
- **Action:** Render the session header
- **Expected result:** Header contains "Feature history incomplete — some prior artefacts could not be loaded." verbatim

### No disclosure shown when errors are absent
- **Verifies:** AC1
- **Precondition:** No errors occur
- **Action:** Render the session header
- **Expected result:** No error disclosure text present — the disclosure is conditional, not always-on

### All 5 named error types produce distinct, correctly-typed log entries
- **Verifies:** AC1 (NFR: all errors logged with context)
- **Precondition:** Trigger each of the 5 error conditions in sequence
- **Action:** Inspect captured log entries
- **Expected result:** Each entry includes `featureSlug`, `stage`, `errorType`, `timestamp`; `errorType` values are distinct per condition (no two conditions share a value)

---

## Integration Tests

### Session starts successfully even when all 5 error conditions occur simultaneously
- **Verifies:** AC1
- **Components involved:** feature discovery (ep1-s1), artefact resolution (ep1-2), journey backfill (ep1-s3), stage routing (ep1-s4), all wrapped in this story's error handling
- **Precondition:** Every dependency mocked to fail at once
- **Action:** Attempt a full session start
- **Expected result:** Session still starts, with an appropriately combined (not duplicated) disclosure message; no 500 error, no crash

### PostHog error events fire-and-forget — a PostHog failure does not block session start
- **Verifies:** AC1 (NFR)
- **Components involved:** PostHog client mock configured to throw
- **Precondition:** An artefact load error occurs, triggering a PostHog event emission that itself fails
- **Action:** Attempt session start
- **Expected result:** Session starts normally; the PostHog failure is swallowed/logged, not propagated

### Graceful degradation does not mask a genuinely successful load as an error
- **Verifies:** AC1
- **Precondition:** All artefacts load successfully
- **Action:** Attempt session start
- **Expected result:** No error events emitted; no disclosure shown; behaviour identical to a session with no error-handling layer present (regression safety)

---

## NFR Tests

### No error blocks session start
- **NFR addressed:** Reliability
- **Measurement method:** Every unit/integration test above that simulates a failure also asserts the session ultimately starts (covered inline above, not a separate test — call out for completeness per template)
- **Pass threshold:** 0 of 8 error-simulation tests result in a blocked session start
- **Tool:** Node.js assert-based test helper

---

## Out of Scope for This Test Plan

- Automatic retry logic or exponential backoff — explicitly out of scope per the story
- Admin dashboard for error monitoring — out of scope per story
- Testing the underlying mechanisms this story wraps (ep1-s1 through ep1-s4's own happy-path behaviour) — covered in their own test plans

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

---

*Written 2026-09-01 as part of getting the whole `new-feature-af17f555` feature to DoR-ready level.*
