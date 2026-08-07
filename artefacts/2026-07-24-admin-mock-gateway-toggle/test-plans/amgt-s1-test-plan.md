## Test Plan: Let an admin toggle the mock LLM gateway on/off from an in-app admin page

**Story reference:** artefacts/2026-07-24-admin-mock-gateway-toggle/stories/amgt-s1.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Admin page shows live effective mock-gateway state | 1 test | — | — | — | — | 🟢 |
| AC2 | Toggling takes effect immediately, no restart | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | In-memory-only, resets on restart, honestly labelled | 1 test | — | — | — | — | 🟢 |
| AC4 | Production hard-override unaffected by toggle | 1 test | — | — | — | — | 🟢 |
| AC5 | requireAdmin gate enforced on both routes | — | 2 tests | — | — | — | 🟢 |

---

## Coverage gaps

None — this is pure server-side logic with no CSS-layout/visual dependency.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1-AC4 | Mocked `process.env.NODE_ENV`/`MOCK_LLM_GATEWAY` combinations | Direct env manipulation in test setup/teardown | None | |
| AC5 | An authenticated non-admin session, an unauthenticated request | Existing `requireAdmin` test fixtures (mirrors `check-arl-s2-admin-middleware.js`) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### adminToggleReflectsLiveEffectiveState

- **Verifies:** AC1
- **Precondition:** `NODE_ENV=test`, toggle unset (default)
- **Action:** Call the (extended) `isMockGatewayEnabled()` directly after rendering the admin toggle page's state
- **Expected result:** Page-rendered state matches `isMockGatewayEnabled()`'s real return value at render time, not a stale/cached value

### toggleFlipTakesEffectImmediately

- **Verifies:** AC2
- **Precondition:** Toggle initially off (or in its default state)
- **Action:** Flip the toggle via the new setter function, then call `isMockGatewayEnabled()` in the same process without any restart
- **Expected result:** `isMockGatewayEnabled()` returns the new state immediately

### toggleResetsOnRestartAndPageLabelsThisHonestly

- **Verifies:** AC3
- **Precondition:** Toggle flipped away from the env-var default
- **Action:** Simulate a process restart (re-require the module fresh, or reset the in-memory store's own reset function), then re-check `isMockGatewayEnabled()`; separately, parse the admin page's rendered copy
- **Expected result:** Post-restart, `isMockGatewayEnabled()` reflects only the env-var default (toggle state lost); the admin page's rendered HTML contains explicit text describing the reset-on-restart behaviour (e.g. "resets to the configured default on restart") — not silent or misleading

### productionHardOverrideUnaffectedByToggle

- **Verifies:** AC4
- **Precondition:** `NODE_ENV=production`
- **Action:** Set the new runtime toggle to "on" via the setter function, then call `isMockGatewayEnabled()`
- **Expected result:** Returns `false` — the toggle has zero effect when `NODE_ENV === 'production'`, confirming the existing hard-override line is untouched and still evaluated first

---

## Integration Tests

### toggleEndpointRequiresAdmin

- **Verifies:** AC5
- **Components involved:** New toggle POST endpoint, `requireAdmin` middleware
- **Precondition:** An authenticated, non-admin session
- **Action:** POST to the new toggle endpoint
- **Expected result:** Rejected exactly as `/admin/credits`'s existing `requireAdmin` gate already rejects non-admin requests (same status code, same redirect/error shape)

### toggleGetEndpointRequiresAdmin

- **Verifies:** AC5
- **Components involved:** New toggle GET endpoint, `requireAdmin` middleware
- **Precondition:** An unauthenticated request
- **Action:** GET the new toggle page
- **Expected result:** Rejected exactly as `/admin/credits`'s existing GET route already rejects unauthenticated requests

### toggleFlipAffectsRealTurnFlow

- **Verifies:** AC2 (end-to-end confirmation)
- **Components involved:** Toggle setter, `skill-turn-executor.js`'s real vs mock dispatch logic
- **Precondition:** Toggle flipped to "on" (mock enabled) in a `NODE_ENV=test` context where the real dispatch path is otherwise reachable
- **Action:** Drive a real turn immediately after flipping
- **Expected result:** The turn resolves via the mock gateway's fixture response, not a real model call — confirms the toggle's effect reaches the actual turn-execution path, not just `isMockGatewayEnabled()`'s own return value in isolation

---

## NFR Tests

### auditLogOnToggleFlip

- **NFR addressed:** Audit
- **Measurement method:** Assert a log line is emitted (via the existing `console.info`/structured-log pattern) naming the admin identity and the new state, on every toggle flip
- **Pass threshold:** Log line present and parseable
- **Tool:** Node test runner (log-capture assertion)

---

## Out of Scope for This Test Plan

- Durable (non-in-memory) persistence — out of scope per the story.
- PostHog feature-flag integration — out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
