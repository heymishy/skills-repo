## Test Plan: Auto-revert the staging mock LLM gateway override, and force it on before CI staging E2E runs

**Story reference:** artefacts/2026-08-09-mock-gateway-auto-revert/stories/mgar-s1-auto-revert-and-ci-enforcement.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Stale "off" override auto-reverts after TTL | 1 test | — | — | — | — | 🟢 |
| AC2 | "On" override never auto-reverts | 1 test | — | — | — | — | 🟢 |
| AC3 | Refresh restarts the TTL window | 1 test | — | — | — | — | 🟢 |
| AC4 | Admin page states TTL/remaining time honestly | 1 test | — | — | — | — | 🟢 |
| AC5 | CI force-on step establishes admin session + toggles on | — | 1 test (mocked HTTP) | — | 1 live-staging confirmation (post-merge) | External-dependency | 🟡 |
| AC6 | Existing amgt-s1 suite unaffected | — | 1 full re-run | — | — | — | 🟢 |

---

## Coverage gaps

**AC5 (🟡):** The automated integration test exercises the new fixture helper's request-construction logic against a mocked HTTP layer (verifying it calls the right login/signup sequence and POSTs the right form to the right endpoint) — it cannot itself prove the *real* CI workflow step succeeds against *real* wuce-staging without actually running that CI job. A manual verification step (re-running the actual `scenario-a-staging-e2e` job post-merge and confirming the new step's log line shows "forced on" rather than a fallback reason) closes this gap, consistent with this repo's established pattern for real-external-dependency ACs (see `workspace/learnings.md`'s cross-surface-state-sync pattern entry, 2026-08-07).

---

## Test Data Strategy

**Source:** Synthetic — a fresh `require()` of `mock-llm-gateway.js` per test (module-level state reset via `jest`-style cache-clearing or an explicit `resetRuntimeMockGatewayOverride()` call at the top of each test) so TTL tests control their own clock via a small injectable time source rather than real `setTimeout` delays.
**PCI/sensitivity in scope:** No
**Availability:** Available now (unit/integration); AC5's manual step requires a real CI run post-merge
**Owner:** Self-contained

---

## Unit Tests

### isMockGatewayEnabled_staleOffOverride_autoRevertsAfterTTL

- **Verifies:** AC1
- **Precondition:** `setRuntimeMockGatewayOverride(false)` called; the module's internal "now" source advanced (via an injectable clock, not a real sleep) past the TTL threshold
- **Action:** Call `isMockGatewayEnabled()`
- **Expected result:** Returns the env-var-fallback value (e.g. `true` if `MOCK_LLM_GATEWAY=true`), not the stale `false` override

### isMockGatewayEnabled_onOverride_neverAutoReverts

- **Verifies:** AC2
- **Precondition:** `setRuntimeMockGatewayOverride(true)` called; clock advanced well past the TTL threshold
- **Action:** Call `isMockGatewayEnabled()`
- **Expected result:** Still returns `true` — no expiry applied to the "on" direction

### isMockGatewayEnabled_refreshedOffOverride_restartsWindow

- **Verifies:** AC3
- **Precondition:** `setRuntimeMockGatewayOverride(false)` called; clock advanced to just before TTL expiry; `setRuntimeMockGatewayOverride(false)` called again (refresh); clock advanced again by the same amount (which would have expired the ORIGINAL window, but not one restarted at the refresh point)
- **Action:** Call `isMockGatewayEnabled()`
- **Expected result:** Still returns `false` (override still honoured) — proves the window restarted at the refresh call, not the original set call

### adminMockGatewayPage_offOverride_showsTTLAndRemainingTime

- **Verifies:** AC4
- **Precondition:** Runtime override set to `false` at a known time
- **Action:** Render `GET /admin/mock-gateway`
- **Expected result:** Response body contains explicit TTL text and an approximate remaining-time figure, not just the existing "resets on restart" copy alone

## Integration Tests

### ensureMockGatewayOnCI_establishesAdminSession_postsToggleOn

- **Verifies:** AC5
- **Precondition:** Mocked HTTP layer standing in for `pwRequest` (or equivalent), simulating a successful admin login and a 302 from the toggle endpoint
- **Action:** Call the new CI-invoked helper function
- **Expected result:** Login attempted, then `POST /api/admin/mock-gateway/toggle` called with `nextState=on` and a valid CSRF token extracted from the admin page response; returns a success result, does not throw

### existingAmgtS1Suite_regressionCheck

- **Verifies:** AC6
- **Action:** Re-run `tests/check-amgt-s1-mock-gateway-toggle.js`
- **Expected result:** All existing tests pass unchanged

## Manual Verification

### Real CI run confirms the force-on step against real wuce-staging

- **Verifies:** AC5 (external-dependency closure)
- **Action:** After this story merges, manually toggle the staging admin UI to "off," then trigger (or wait for) a real `scenario-a-staging-e2e` CI run; inspect its logs for the new step's outcome
- **Expected result:** The new step's log line shows the gateway was forced back on before the real Playwright specs ran, and those specs pass using mock fixture responses (not real API calls)
