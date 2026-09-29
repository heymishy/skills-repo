## Test Plan: Signals panel route handler — `/api/signals` endpoint

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s2.md
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Test plan author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

**Rebuild note:** This replaces a prior file at this path that was, in fact, `/clarify`-or-`/design`-shaped decision-log content (5 "Decision" entries plus a "Follow-up actions" section) — not a real test plan. That content is preserved below in **Design Decisions Carried Forward**, since it answers real implementation questions this test plan needs, rather than being discarded.

---

## Design Decisions Carried Forward

<!-- Recovered from the prior mislabeled file at this path — real content, wrong artefact type. -->

1. **Signal object shape:** `id`, `source`, `type`, `text`, `timestamp` are required on every Signal; `cta.label`/`cta.skill` are required; `context.relatedStory`/`context.featureSlug`/`context.severity`/`context.metadata` are optional and may be absent without failing validation.
2. **Error handling:** an aggregator exception is caught at the route layer and returned as HTTP 500 with a structured `{ error, timestamp }` body — never a partial 200.
3. **Timestamp format:** ISO 8601 strings throughout (matches `id 2` — no Unix-timestamp fields anywhere in the Signal shape).
4. **Sorting:** stable sort on `timestamp` descending; entries without a timestamp are placed at the end in a stable (insertion) order — this is the aggregator's own responsibility (ep1-s1), not re-sorted at the route layer.
5. **File read adapter wiring:** the route handler does not read files itself — it calls the ep1-s1 aggregator's exported `getSignals(repoPath)` function directly. For testability, the route module exposes a test-only override (`setSignalsAggregator(fn)`) so tests can stub the aggregator without depending on ep1-s1's own real file-reading, matching this codebase's existing lightweight-stub convention for simple function dependencies (distinct from a full D37 throw-on-unwired adapter, since this is an internal same-process call, not an external system boundary).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Endpoint returns Signal array as JSON, HTTP 200 | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Response includes all required Signal fields | 1 test | — | — | — | — | 🟢 |
| AC3 | Endpoint gracefully handles aggregator exceptions (500) | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Endpoint latency <250ms | 1 test | — | — | — | — | 🟢 |
| AC5 | Endpoint is deterministic/repeatable | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. This story is entirely server-side JSON (no rendered UI) — every AC is testable via a stubbed aggregator and real HTTP dispatch through this codebase's own router.

---

## Test Data Strategy

**Source:** Synthetic — a stubbed `getSignals` returning fixed, known Signal arrays (via `setSignalsAggregator`).
**PCI/sensitivity in scope:** No — synthetic signal content only.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Stubbed aggregator returning a non-empty `Signal[]` | Synthetic | None | Asserts 200 + array passthrough |
| AC2 | Stubbed aggregator returning signals with and without optional `context` fields | Synthetic | None | Confirms required fields always present, optional fields tolerated absent |
| AC3 | Stubbed aggregator configured to throw | Synthetic | None | Asserts 500 + structured error body, never a partial 200 |
| AC4 | Stubbed aggregator with an artificial delay just under 200ms | Synthetic | None | Confirms route overhead stays under the remaining ~50ms budget |
| AC5 | Stubbed aggregator returning the same fixed array on 2 successive calls | Synthetic | None | Confirms identical response order both times |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Endpoint returns 200 with the aggregator's Signal array verbatim

- **Verifies:** AC1
- **Precondition:** `setSignalsAggregator` wired to return a fixed 3-entry `Signal[]`
- **Action:** Call the route handler function directly with a mock request/response
- **Expected result:** Response status 200; response body is the exact same 3-entry array (JSON-serialized), untransformed
- **Edge case:** No

### Response includes all required fields; optional fields may be absent

- **Verifies:** AC2
- **Precondition:** Stubbed aggregator returns one signal with a full `context` object and one signal with no `context` at all
- **Action:** Call the route handler; inspect both entries in the response body
- **Expected result:** Both entries have `id`, `source`, `type`, `text`, `timestamp`, `cta.label`, `cta.skill`; the entry with no `context` does not fail any check for that field's absence
- **Edge case:** Yes — the story's own named "optional fields may be absent" case

### Aggregator exception returns 500 with structured error, not a partial 200

- **Verifies:** AC3
- **Precondition:** Stubbed aggregator configured to `throw new Error('disk read failed')`
- **Action:** Call the route handler
- **Expected result:** Response status 500; response body is `{ error: 'disk read failed', timestamp: <ISO8601 string> }`; no partial signal array is ever returned
- **Edge case:** Yes — the story's own named error-handling case

### Endpoint completes within the latency budget

- **Verifies:** AC4
- **Precondition:** Stubbed aggregator resolves after an artificial 150ms delay
- **Action:** Call the route handler, measure wall-clock time from call to response
- **Expected result:** Total time <250ms (150ms aggregator + <100ms margin for route overhead, well within the story's own <50ms route-overhead budget)
- **Edge case:** No

### Calling the endpoint twice with unchanged aggregator output returns identical responses

- **Verifies:** AC5
- **Precondition:** Stubbed aggregator returns the exact same fixed array on every call
- **Action:** Call the route handler twice in succession
- **Expected result:** Both responses are deep-equal, including array order
- **Edge case:** No

---

## Integration Tests

### Real HTTP dispatch through the router reaches the signals route and returns the aggregator's data

- **Verifies:** AC1 (D37-lesson wiring check — real route dispatch, not just calling the handler function directly)
- **Components involved:** This codebase's real router (`pathname.match(...)` dispatch convention), `routes/signals.js`'s real route registration, the stubbed aggregator
- **Precondition:** `setSignalsAggregator` stubbed; route registered in the real router the same way every other GET route in `server.js` is
- **Action:** Dispatch a real `GET /api/signals` request through the router (matching this repo's own dispatch pattern, not calling the handler function in isolation)
- **Expected result:** 200 response with the stubbed Signal array — confirms the route is actually wired into the real dispatch table, not just that the handler function works in isolation

### Real HTTP dispatch surfaces an aggregator exception as 500, end-to-end

- **Verifies:** AC3 (wiring check)
- **Components involved:** Real router, real route registration, stubbed throwing aggregator
- **Precondition:** Aggregator stubbed to throw
- **Action:** Dispatch a real `GET /api/signals` request through the router
- **Expected result:** 500 response with structured error body — confirms the error-handling path is wired end-to-end, not just correct in the handler function's own unit test

---

## NFR Tests

### Endpoint latency stays within budget under the stated NFR

- **NFR addressed:** Performance
- **Measurement method:** Same as AC4's own unit test — the NFR and AC4 are the same measurable threshold, not duplicated as a separate test (matches EXP-007's own NFR-test-scope rule: no separate NFR test when an AC already asserts the identical threshold)
- **Pass threshold:** N/A — see AC4
- **Tool:** N/A — see AC4

### Response shape consistency is enforced on every response, not just the happy path

- **NFR addressed:** Correctness / response shape consistency
- **Measurement method:** Covered directly by AC2's own unit test (required-fields-always-present check) — not duplicated here
- **Pass threshold:** N/A — see AC2
- **Tool:** N/A — see AC2

### Repeatability holds under the stated NFR

- **NFR addressed:** Correctness / repeatability
- **Measurement method:** Covered directly by AC5's own unit test — not duplicated here
- **Pass threshold:** N/A — see AC5
- **Tool:** N/A — see AC5

---

## Out of Scope for This Test Plan

- Any test of `ep1-s1`'s own aggregator logic — separate story, separate test plan; this plan stubs the aggregator entirely and never exercises its real file-reading behaviour.
- Any test of `ep1-s3`'s own launcher rendering — separate story.
- Real, unstubbed integration against ep1-s1's actual aggregator (a "does the real aggregator's real output satisfy this endpoint's real contract" check) — appropriate for a post-merge smoke test once both stories are implemented, not a pre-implementation unit/integration test.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
