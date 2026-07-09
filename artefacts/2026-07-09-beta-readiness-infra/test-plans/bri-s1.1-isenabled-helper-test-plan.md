## Test Plan: Build the isEnabled() flag helper shared by API and UI

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.1-isenabled-helper.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `isEnabled()` returns `true` when PostHog adapter resolves `true` | 2 tests | — | — | — | — | 🟢 |
| AC2 | Default stub throws `Adapter not wired: posthogFlagsAdapter...` when adapter unwired | 1 test | — | — | — | — | 🟢 |
| AC3 | Same function instance used by API route and UI-rendering call sites returns identical result | — | 1 test | — | — | — | 🟢 |
| AC4 | PostHog API failure (network error/timeout) returns safe default `false`, does not throw | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are covered by unit or integration tests against a mocked PostHog adapter — no live PostHog dependency required.

---

## Test Data Strategy

**Source:** Mocked (PostHog SDK client mocked via the D37 injectable adapter — `setPostHogFlagsAdapter()`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock adapter returning `{ evaluateFlag: async () => true }` | Mocked | None | flagKey `'wizard-ui'`, context `{ tenantId: 'acme' }` per story example |
| AC2 | No adapter wired (fresh module load / reset via `setPostHogFlagsAdapter(null)` if supported, or fresh `require`) | Mocked | None | Must assert exact error message text |
| AC3 | Mock adapter returning a fixed value; two separate `require()` call sites (simulating a route module and a UI-render module) both importing the same `posthog-flags` module | Mocked | None | Verifies module singleton behaviour, not just equal output |
| AC4 | Mock adapter whose `evaluateFlag` rejects with a network-style error (e.g. `ECONNRESET`) or times out | Mocked | None | Must confirm no unhandled rejection propagates to caller |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### isEnabled returns true when the wired adapter resolves true for the given flag/context

- **Verifies:** AC1
- **Precondition:** `setPostHogFlagsAdapter()` has been called with a mock `{ evaluateFlag: async (flagKey, context) => true }`.
- **Action:** Call `isEnabled('wizard-ui', { tenantId: 'acme' })`.
- **Expected result:** Resolves to `true`.
- **Edge case:** No.

### isEnabled returns false when the wired adapter resolves false for the given flag/context

- **Verifies:** AC1 (inverse case, guards against a helper that always returns true)
- **Precondition:** Mock adapter wired with `evaluateFlag: async () => false`.
- **Action:** Call `isEnabled('wizard-ui', { tenantId: 'acme' })`.
- **Expected result:** Resolves to `false`.
- **Edge case:** Yes — confirms the helper is not hardcoded to a truthy return.

### isEnabled throws the documented D37 error when no adapter is wired

- **Verifies:** AC2
- **Precondition:** Module freshly loaded (via `delete require.cache`) with no prior `setPostHogFlagsAdapter()` call in this test's scope.
- **Action:** Call `isEnabled('wizard-ui', {})`.
- **Expected result:** Throws (or rejects) with message exactly `Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.` — not `undefined`, not a generic TypeError, not a silent `false`.
- **Edge case:** Yes — this is the D37 mandatory stub-throws case; a silent `false` return here would be a regression per the injectable adapter rule.

### isEnabled returns the documented safe default (false) when the adapter's PostHog call fails

- **Verifies:** AC4
- **Precondition:** Mock adapter wired with `evaluateFlag: async () => { throw new Error('ECONNRESET'); }` (simulating a PostHog network failure).
- **Action:** Call `isEnabled('wizard-ui', { tenantId: 'acme' })` and await the result (not a caught exception).
- **Expected result:** Resolves to `false` — the call does not throw, and the caller receives a normal resolved value, not a rejected promise.
- **Edge case:** Yes — this is the "does not crash the request" behaviour the AC specifically calls out.

### isEnabled never forwards session/access-token fields to the adapter's evaluateFlag call

- **Verifies:** Security NFR (no `accessToken` or session token passed as part of flag evaluation context)
- **Precondition:** Mock adapter's `evaluateFlag` spy records the `context` argument it received.
- **Action:** Call `isEnabled('wizard-ui', { tenantId: 'acme', accessToken: 'secret-token-value' })`.
- **Expected result:** The `context` object received by the mock adapter's `evaluateFlag` does not contain an `accessToken` key (or any key matching a token-shaped field) — either the helper strips it before forwarding, or the test documents that callers must never pass it (whichever the implementation chooses, the observable contract is: no token value reaches the adapter call).
- **Edge case:** Yes — this is the injection point where a caller might accidentally pass the whole session object.

---

## Integration Tests

### API route call site and UI-render call site receive identical isEnabled() results for the same flag/context

- **Verifies:** AC3
- **Components involved:** `src/web-ui/modules/posthog-flags.js` (the shared helper), a simulated route-handler call site, a simulated UI-render call site.
- **Precondition:** Mock adapter wired once via `setPostHogFlagsAdapter()`, returning a deterministic value per flag key (e.g. `wizard-ui` → `true`).
- **Action:** Require the `posthog-flags` module from two different simulated "call sites" in the same test (representing a route module and a render module) and call `isEnabled('wizard-ui', { tenantId: 'acme' })` from each within the same request/test scope.
- **Expected result:** Both call sites resolve to the identical value (`true`), and both resolve via the same exported function reference (`require('.../posthog-flags').isEnabled === require('.../posthog-flags').isEnabled` across the two require calls, proving there is one shared implementation, not two).

---

## NFR Tests

### isEnabled adds no more than 200ms of its own overhead under normal PostHog latency

- **NFR addressed:** Performance
- **Measurement method:** Wire a mock adapter whose `evaluateFlag` resolves after a fixed, simulated "normal" PostHog latency (e.g. 50ms, via `setTimeout`). Measure wall-clock time from calling `isEnabled()` to it resolving using `process.hrtime()` or `Date.now()`. Assert the measured total is within 200ms of the simulated adapter latency (i.e., the helper's own wrapper logic — not the adapter call itself — adds negligible overhead, well under the 200ms budget).
- **Pass threshold:** Total `isEnabled()` call duration ≤ (simulated adapter latency + 200ms).
- **Tool:** Hand-rolled Node.js timing assertion in `tests/check-bri-s1.1-isenabled-helper.js`.

### Flag evaluation context never includes accessToken or session-token fields when passed to PostHog

- **NFR addressed:** Security
- **Measurement method:** Same mechanism as the "isEnabled never forwards session/access-token fields" unit test above — a spy on the mock adapter's `evaluateFlag` call, asserting the received context object contains no token-shaped key.
- **Pass threshold:** Zero occurrences of `accessToken` (or equivalent token field) in the object passed to the adapter, across all tested call shapes.
- **Tool:** Hand-rolled Node.js assertion.

### Accessibility

- **NFR addressed:** Accessibility — **Not applicable**, per story text: "this is a server-side/shared helper, not a rendered UI element." No test written — confirmed with story owner via the story's own NFR section.

### Audit

- **NFR addressed:** Audit — **Not applicable at this story's level**, per story text: flag evaluation calls are not individually audit-logged; PostHog's own dashboard provides evaluation history. No test written — confirmed with story owner via the story's own NFR section.

---

## Out of Scope for This Test Plan

- Caching/memoization of flag state across requests — explicitly out of scope in the story; no test asserts caching behaviour (or its absence) beyond confirming each call reaches the adapter.
- Percentage-based or multivariate flag values — the story restricts `isEnabled()` to boolean state only; no test exercises non-boolean adapter returns.
- The real PostHog Node SDK's own internal behaviour (its own caching, retry logic) — only the injectable adapter boundary is tested; the real `posthog-node` client wiring in `server.js` is a separate D37 wiring task per the story's Architecture Constraints, and its own smoke check is out of scope for this unit/integration-level plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real PostHog API latency/error behaviour under production network conditions | Cannot be observed pre-implementation without a live PostHog project; this test plan only exercises the mocked adapter boundary | The D37 wiring task (real client construction in `server.js`) is tracked separately; a manual smoke check against the real staging PostHog project is a `pendingActions` item once S1.2's staging project exists |
