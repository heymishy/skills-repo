## Test Plan: Bootstrap flags server-side on session start to avoid UI flicker

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.3-server-side-bootstrap.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | All relevant flags resolved and included in initial HTML before first paint; no client-side flag fetch precedes it | 1 test | 2 tests | — | — | — | 🟢 |
| AC2 | A mid-session PostHog flag toggle does not apply until next session start | 1 test | — | — | — | — | 🟢 |
| AC3 | Slow/timed-out PostHog call during bootstrap falls back to the safe default rather than blocking session start | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Playwright: initial HTML response (not a later DOM mutation) reflects the gated element's on/off state | — | 1 test | 1 test (optional, see note) | — | — | 🟢 |

**Note on AC4:** per the confirmed test approach for this story, the "no flicker" behaviour is verified by inspecting the raw initial HTTP HTML response for presence/absence of the gated element — this is an integration-level concern (server rendering), not a CSS-layout/`getBoundingClientRect` concern, so it is not classified as a CSS-layout-dependent gap. An integration test covers the primary case; one lightweight Playwright spec is included as a belt-and-braces E2E check because AC4 is explicitly framed around "a Playwright test" in the story text, but the integration test is sufficient on its own to satisfy the AC and would be written first.

---

## Coverage gaps

None. All 4 ACs are covered by unit and/or integration tests; the one NFR-level gap (Accessibility, discussed below) is not an AC gap and is logged in Test Gaps and Risks instead.

---

## Test Data Strategy

**Source:** Mocked (PostHog adapter from S1.1, mocked at the `isEnabled()` boundary; no real session store or database needed)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock `isEnabled()` returning fixed true/false per flag key; a fake `req`/`res` pair for the session-start handler (`handleGetWizard` in `src/web-ui/routes/journey.js`) | Mocked | None | |
| AC2 | Same mock, plus a session object reused across two simulated requests | Mocked | None | |
| AC3 | Mock `isEnabled()` that delays resolution or rejects (simulating PostHog timeout) | Mocked | None | |
| AC4 | Mock `isEnabled()` set to true and false in two separate test runs; raw HTML string returned by the handler inspected for a marker element | Mocked | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Session-bootstrap function resolves all relevant flags before returning, and attaches them to the session

- **Verifies:** AC1
- **Precondition:** A bootstrap function (e.g. `bootstrapFlags(req)` in a new `src/web-ui/modules/flag-bootstrap.js`, or inline in `journey.js`'s session-start path) exists, with `isEnabled()` mocked to resolve synchronously-fast fixed values for `wizard-ui`.
- **Action:** Call `bootstrapFlags(req)` where `req.session` is a fresh session object.
- **Expected result:** After the call resolves, `req.session.flags.wizard-ui` (or equivalent key) holds the mocked boolean value — the flag state exists on the session object before any render function is invoked.
- **Edge case:** No.

### Bootstrap falls back to the safe default and resolves promptly when the PostHog call is slow

- **Verifies:** AC3
- **Precondition:** Mock `isEnabled()` that never resolves within a bounded window (e.g. delays 5 seconds) or rejects outright.
- **Action:** Call `bootstrapFlags(req)` with a test-level timeout budget (e.g. assert the call resolves within 250ms even though the mock adapter takes far longer, if the bootstrap applies its own internal timeout — or, if it relies on S1.1 AC4's adapter-level safe-default behaviour, assert the resolved flag value is `false` and the call does not hang).
- **Expected result:** `bootstrapFlags(req)` resolves (does not hang indefinitely) and the affected flag defaults to `false`; session start is not blocked.
- **Edge case:** Yes — this is the "does not block session start indefinitely" case named in AC3.

### Session flags are read from the session cache on a subsequent render within the same session, not re-resolved

- **Verifies:** AC2
- **Precondition:** `req.session.flags` already populated from a prior bootstrap call within this test; mock `isEnabled()` wired with a call-counting spy.
- **Action:** Invoke the render/handler path a second time using the same `req.session` object (simulating a second page view within the same session).
- **Expected result:** The mock `isEnabled()`/adapter spy is not called again for the same flag — the handler reads the already-resolved value from `req.session.flags` rather than re-querying PostHog, meaning a flag toggled in PostHog mid-session would not be picked up until a new session starts.
- **Edge case:** Yes — this is the concrete mechanism that makes AC2 ("does not apply until next session-start") true, rather than an assumption.

---

## Integration Tests

### Session-start handler renders the gated element in the initial HTML when the flag is on

- **Verifies:** AC1, AC4
- **Components involved:** `handleGetWizard` (`src/web-ui/routes/journey.js`), mocked `isEnabled()`/bootstrap function, a fake `res` object capturing the written HTML body.
- **Precondition:** Mock `isEnabled('wizard-ui', ...)` resolves `true`.
- **Action:** Call `handleGetWizard(req, res)` with a fresh session (no session-level `activeFeatureSlug`, so the wizard renders).
- **Expected result:** The HTML string written to `res` contains the wizard-canvas gated element/marker. No separate client-side script call precedes it — i.e., the returned HTML does not include an async `fetch('/api/flags')`-style call positioned before the gated markup.

### Session-start handler omits the gated element from the initial HTML when the flag is off

- **Verifies:** AC1, AC4
- **Components involved:** Same as above.
- **Precondition:** Mock `isEnabled('wizard-ui', ...)` resolves `false`.
- **Action:** Call `handleGetWizard(req, res)` with a fresh session.
- **Expected result:** The HTML string written to `res` does not contain the gated element/marker anywhere — proving the element is server-omitted, not client-hidden after the fact (which would cause the flicker this story exists to prevent).

### Bootstrap timeout does not block the session-start handler's response

- **Verifies:** AC3
- **Components involved:** `handleGetWizard`, mocked slow/rejecting `isEnabled()`.
- **Precondition:** Mock adapter simulates a PostHog timeout (delayed rejection).
- **Action:** Call `handleGetWizard(req, res)` and measure elapsed time to `res.end()` being called.
- **Expected result:** The handler still responds (with the safe-default-gated HTML) within a bounded time — it does not hang waiting on the slow PostHog call indefinitely.

---

## E2E Tests

### Playwright: initial HTML response reflects the flag's on/off state without a subsequent DOM change

- **Verifies:** AC4
- **Precondition:** A staging or local dev server running with the `wizard-ui` flag explicitly forced on (via test-only override) for one run, and off for another.
- **Action:** Load the wizard canvas page in Playwright; inspect the page's initial response body (via `page.on('response')` or `request.get()` against the route directly) rather than the post-hydration DOM.
- **Expected result:** The gated element's presence/absence in the raw initial response matches the forced flag state in both runs — confirming no flicker (element does not appear then get removed by a later script).
- **Note:** This spec is a belt-and-braces addition; the Integration Tests above already satisfy AC4's observable requirement without needing a live browser. If judged unnecessary at implementation time, this may be descoped with a note in `decisions.md` — it is not a hard requirement given the confirmed test-approach context for this story.

---

## NFR Tests

### Flag bootstrap adds no more than 200ms to session-start latency

- **NFR addressed:** Performance
- **Measurement method:** Mock `isEnabled()`/adapter with a fixed simulated PostHog latency (e.g. 50ms); measure wall-clock time for the full bootstrap step using `Date.now()`/`process.hrtime()`.
- **Pass threshold:** Bootstrap step completes within 200ms of the simulated adapter latency, matching S1.1's budget.
- **Tool:** Hand-rolled Node.js timing assertion in `tests/check-bri-s1.3-server-side-bootstrap.js`.

### Accessibility

- **NFR addressed:** Accessibility
- **Measurement method:** Not directly automatable pre-implementation — no assistive-technology testing infrastructure (e.g. axe-core, screen-reader automation) exists in this repo today. The mechanism that delivers this NFR (no post-load DOM mutation) is already verified structurally by the "omits the gated element" and "renders the gated element" integration tests above, since a rapidly-changing DOM is precisely what those tests prove does not happen.
- **Pass threshold:** N/A — see gap note below.
- **Tool:** N/A.
- **Gap type:** Untestable-by-nature (no automated AT-behaviour testing tool exists in this repo; the closest available proxy — absence of post-render DOM mutation — is already covered by the AC1/AC4 integration tests).

### Security

- **NFR addressed:** Security — **None beyond S1.1**, per story text. No separate test written.

### Audit

- **NFR addressed:** Audit — **None identified beyond S1.1**, per story text. No separate test written.

---

## Out of Scope for This Test Plan

- Live, mid-session flag updates without a page reload (websocket/SSE) — explicitly out of scope in the story; no test exercises any live-update mechanism because none is being built.
- Client-side flag override for local development/testing — explicitly out of scope; not tested.
- A full assistive-technology (screen reader) manual audit — see the Accessibility NFR gap above.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Assistive-technology behaviour (screen reader announcement) under the no-flicker mechanism | No AT-automation tooling exists in this repo; genuinely requires a human with a screen reader to observe | Log as an Untestable-by-nature gap in the AC verification script's edge case; the underlying mechanism (no post-render DOM mutation) is already covered structurally by the AC1/AC4 integration tests |
