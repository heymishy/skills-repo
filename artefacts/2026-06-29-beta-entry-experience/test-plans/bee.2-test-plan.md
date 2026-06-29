# Test Plan: bee.2 — First-run empty-state experience

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.2.md`
**Epic reference:** `artefacts/2026-06-29-beta-entry-experience/epics/bee-entry-surface.md`
**Test plan author:** /test-plan skill (agent-auto)
**Date:** 2026-06-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Empty listJourneys() → empty-state content in response | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Empty-state block contains explanation, session description, and skill picker link | 3 tests | — | — | — | — | 🟢 |
| AC3 | Populated listJourneys() → 200 with journey cards, no empty-state | 3 tests | — | — | — | — | 🟢 |
| AC4 | Correct HTML state (empty-state or list) present in raw initial HTTP response (no JS required) | 1 test | 1 test | — | 1 scenario | — | 🟢 |
| AC5 | listJourneys() throws → HTTP 500, no empty-state, [journey-store] error logged | 3 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are verifiable via Node.js unit/integration tests (HTML string inspection of route handler output).

---

## Test Data Strategy

**Source:** Synthetic — all journey data generated inline in test setup; listJourneys adapter is injectable (D37 rule)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests wire their own fake listJourneys adapter

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Authenticated session + listJourneys returns [] | Inline mock | None | `req.session = { accessToken: 'tok', login: 'alice', tenantId: 'org-1' }` |
| AC2 | Empty-state HTML output | Route handler output | None | Inspect result of AC1 setup |
| AC3 | listJourneys returns array of 1+ journey objects | Inline mock | None | `[{ id: 'j1', title: 'Test Journey' }]` |
| AC4 | Handler response body | Route handler output | None | No JS execution; raw string check |
| AC5 | listJourneys throws Error | Inline mock | None | `async function() { throw new Error('store error'); }` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### T1 — handleJourneys: empty listJourneys returns 200 with empty-state block

- **Verifies:** AC1
- **Precondition:** Authenticated session; `setListJourneys` wired to return `[]`
- **Action:** Call `handleJourneys(req, res)` directly; inspect `res.statusCode` and `res.body`
- **Expected result:** `res.statusCode === 200`; `res.body` contains an element identifiable as the empty-state block (e.g. contains a specific id or class such as `id="empty-state"` or text indicating no sessions exist)
- **Edge case:** No

### T2 — handleJourneys: empty-state block present, journey list absent

- **Verifies:** AC1, AC3
- **Precondition:** `setListJourneys(() => [])` — returns empty array
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains the empty-state block AND does NOT contain a journey card element (e.g. `class="journey-card"` or `data-journey-id` is absent)
- **Edge case:** No

### T3 — handleJourneys: empty-state body contains explanation of no sessions

- **Verifies:** AC2a
- **Precondition:** `setListJourneys(() => [])`, authenticated session
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains text explaining that no skill sessions have been started yet (e.g. "no sessions", "no journeys", "haven't started", or equivalent phrasing)
- **Edge case:** No

### T4 — handleJourneys: empty-state body describes what a skill session produces

- **Verifies:** AC2b
- **Precondition:** `setListJourneys(() => [])`, authenticated session
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains a description of what a skill session produces (e.g. "governed artefact", "artefact", "discovery", "specification", or equivalent)
- **Edge case:** No

### T5 — handleJourneys: empty-state body contains skill picker link

- **Verifies:** AC2c
- **Precondition:** `setListJourneys(() => [])`, authenticated session
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` contains an `<a>` or `<button>` element pointing to `/skills` (the skill picker URL)
- **Edge case:** No

### T6 — handleJourneys: populated listJourneys returns 200 with journey cards

- **Verifies:** AC3
- **Precondition:** `setListJourneys(() => [{ id: 'j1', title: 'Test Journey' }, { id: 'j2', title: 'Second Journey' }])`; authenticated session
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.statusCode === 200`; `res.body` contains exactly 2 journey card elements (verify by counting occurrences of `data-journey-id` or `class="journey-card"` or the journey IDs `j1` and `j2`)
- **Edge case:** No

### T7 — handleJourneys: populated list — empty-state block absent

- **Verifies:** AC3
- **Precondition:** `setListJourneys(() => [{ id: 'j1', title: 'Journey 1' }])`; authenticated session
- **Action:** Call `handleJourneys(req, res)`; inspect `res.body`
- **Expected result:** `res.body` does NOT contain the empty-state block (e.g. `id="empty-state"` absent); does contain journey card for j1
- **Edge case:** No

### T8 — handleJourneys: listJourneys throws → HTTP 500

- **Verifies:** AC5
- **Precondition:** `setListJourneys(async () => { throw new Error('store error'); })`, authenticated session
- **Action:** Call `handleJourneys(req, res)` (await if async); inspect `res.statusCode`
- **Expected result:** `res.statusCode === 500`
- **Edge case:** No

### T9 — handleJourneys: error case — empty-state block absent from 500 response

- **Verifies:** AC5
- **Precondition:** Same as T8
- **Action:** Call `handleJourneys(req, res)` on error path; inspect `res.body`
- **Expected result:** `res.body` does NOT contain the empty-state block; response is an error page or minimal HTML — not a 200 with an empty list
- **Edge case:** No

### T10 — listJourneys default adapter throws (D37 injectable adapter rule)

- **Verifies:** Architecture constraint (D37 — stub defaults must throw)
- **Precondition:** No `setListJourneys` call made; the handler module is freshly required (or the default is inspected directly)
- **Action:** Call the default `listJourneys` function directly (or call `handleJourneys` without wiring any adapter)
- **Expected result:** The call throws an Error with a message containing "Adapter not wired" or equivalent — it does NOT return an empty array or null silently
- **Edge case:** Yes — validates D37 compliance

---

## Integration Tests

### T11 — Integration: server routes GET /journeys to handleJourneys handler

- **Verifies:** AC1, AC4
- **Components involved:** `server.js` URL dispatch + `handleJourneys` + `setListJourneys` adapter
- **Precondition:** `setListJourneys(() => [])` wired; `req.method = 'GET'`, `req.url = '/journeys'`, authenticated session
- **Action:** Feed request through server dispatch function
- **Expected result:** `res.statusCode === 200`; `res.body` contains empty-state block
- **Edge case:** No

### T12 — Integration: GET /journeys error state returns 500 (not silent 200)

- **Verifies:** AC5
- **Components involved:** `server.js` dispatch + `handleJourneys` + failing adapter
- **Precondition:** `setListJourneys(async () => { throw new Error('db error'); })`, authenticated session
- **Action:** Feed request through dispatch
- **Expected result:** `res.statusCode === 500`; response is not a 200 with empty content
- **Edge case:** No

---

## NFR Tests

### NFR-T1 — Empty-state HTML present in raw response body without JavaScript execution

- **NFR addressed:** Server-side rendering (AC4)
- **Measurement method:** Call `handleJourneys(req, res)` and inspect `res.body` as a plain string — no JS parsing or DOM execution. Assert presence of empty-state content in the raw string.
- **Pass threshold:** Empty-state text and skill-picker link present in `res.body` string before any DOM or script evaluation
- **Tool:** Node.js string assertion (`includes`)

### NFR-T2 — No additional latency beyond listJourneys call (synchronous empty-state branch)

- **NFR addressed:** Performance
- **Measurement method:** Time `handleJourneys` call with synchronous stub returning `[]`; assert it completes in under 50ms
- **Pass threshold:** < 50ms (local, no network call)
- **Tool:** `Date.now()` before/after

---

## Out of Scope for This Test Plan

- PostHog instrumentation on the dashboard — covered by bee.3 test plan
- Styling or visual rendering of the empty-state block — not testable without a browser; content and link presence is sufficient
- The skill picker itself (`/skills` route) — an existing route; this plan only verifies the link target is correct
- Interactive animations or tooltips — excluded from scope

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| [journey-store] error log assertion in T8/T9 | `console.error` interception in Node.js tests requires spy setup that varies by test runner | Verification script Scenario 5 includes manual console log check as post-merge smoke test |
