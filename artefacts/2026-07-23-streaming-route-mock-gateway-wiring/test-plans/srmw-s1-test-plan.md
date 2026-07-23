## Test Plan: Wire {stage, scenarioName} into handlePostTurnStreamHtml so MOCK_LLM_GATEWAY actually activates for the real chat UI's streaming turn endpoint

**Story reference:** artefacts/2026-07-23-streaming-route-mock-gateway-wiring/stories/srmw-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | options.stage threaded per-session, two sessions differ | 1 | — | — | — | — | 🟢 |
| AC2 | options.scenarioName defaults to 'success', overridden by session.mockScenarioName | 1 | — | — | — | — | 🟢 |
| AC3 | Real streaming turn with MOCK_LLM_GATEWAY=true returns fixture content, never calls https.request | — | 1 | — | — | — | 🟢 |
| AC4 | Full regression pass, no new baseline failures | — | 1 | — | — | — | 🟢 |
| AC5 | Real staging turn through the real streaming endpoint now uses the mock gateway | — | — | 1 | — | Deploy-dependent | 🟡 |

---

## Test Data Strategy

**Source:** The real, existing `tests/e2e/fixtures/llm-gateway/*.json` fixture set (no new fixtures needed) — AC1/AC2 use a fake injected executor adapter via `setSkillTurnExecutorStreamAdapter` to capture the options object; AC3 uses the REAL `skill-turn-executor.js` + REAL `mock-llm-gateway.js` (the actual production wiring path), with `https.request` monkey-patched only to detect (and fail on) an attempted real network call — not to fabricate a fake response.
**PCI/sensitivity in scope:** No.
**Availability:** AC1-AC4 available now, fully deterministic, no staging/credits/model dependency. AC5 requires a live `flyctl deploy` to `wuce-staging` within this session — if it cannot complete, reported as not run, not fabricated as passing.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Two sessions with different `skillName` values | Test-constructed | None | |
| AC2 | Two sessions, one with `mockScenarioName` unset, one with `mockScenarioName: 'failure'` | Test-constructed | None | |
| AC3 | Real `discovery.success.json` fixture, real `skillTurnExecutorStream`, real `mock-llm-gateway.js` | Repo | None | `https.request` monkey-patched to throw if called, proving no real network attempt |
| AC4 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |
| AC5 | Real `wuce-staging`, `e2e-test-admin` identity or a3/a4's own E2E specs | Real staging | None | Reuses the exact repro steps from the a3/a4 FINDING entries |

### PCI / sensitivity constraints

None.

### Gaps

AC5 depends on a live `flyctl deploy` succeeding within this session, on real `wuce-staging` being reachable/authenticated, and on no concurrent deploy from another agent being clobbered. If it cannot complete, it is reported as pending/not-run, not claimed as passing — AC1-AC4 provide full deterministic verification of the fix itself independent of AC5's outcome.

---

## Unit Tests

### UT1 — options.stage is threaded from session.skillName, differentiated across two sessions (AC1)
- **Verifies:** AC1
- **Component:** `handlePostTurnStreamHtml` (`src/web-ui/routes/skills.js`)
- **Action:** Inject a fake executor adapter via `setSkillTurnExecutorStreamAdapter` that captures its `options` argument. Submit a streaming turn for a session with `skillName: 'discovery'`, then a second streaming turn for a different session with `skillName: 'review'`. Assert `captured[0].stage === 'discovery'`, `captured[1].stage === 'review'`, and the two values are not equal to each other.
- **Expected result:** Both calls' `options.stage` equal their own session's `skillName`; the two differ from each other (D37 wiring-test discipline — a differentiating outcome, not merely "some field is present").
- **RED against current code:** `options.stage` is `undefined` for both calls — the assertion `captured[0].stage === 'discovery'` fails.

### UT2 — options.scenarioName defaults to 'success' and is overridden by session.mockScenarioName (AC2)
- **Verifies:** AC2
- **Component:** `handlePostTurnStreamHtml`
- **Action:** Same fake-adapter pattern as UT1. Submit a streaming turn for a session with no `mockScenarioName` field, then a second turn for a session with `mockScenarioName: 'failure'`. Assert `captured[0].scenarioName === 'success'`, `captured[1].scenarioName === 'failure'`, and the two differ.
- **Expected result:** Default is `'success'`; override is read and threaded through; the two differ.
- **RED against current code:** `options.scenarioName` is `undefined` for both calls.

---

## Integration Tests

### IT1 — real streaming turn with MOCK_LLM_GATEWAY=true routes through the mock gateway, never touches the real network (AC3)
- **Verifies:** AC3
- **Components involved:** `handlePostTurnStreamHtml`, real `skill-turn-executor.js`, real `mock-llm-gateway.js` (wired via `wireDefaultMockGatewayClient()`, the actual production wiring path)
- **Action:** With `MOCK_LLM_GATEWAY=true` set and the real default mock gateway client wired, submit a real streaming turn for a `discovery` session via `handlePostTurnStreamHtml`, with `https.request` monkey-patched to throw (proving no real network call is attempted) rather than to fabricate a response. Capture all SSE `data:` payloads written to the response.
- **Expected result:** `https.request` is never invoked; the streamed SSE content contains `discovery.success.json`'s own distinguishing fixture text ("canned discovery artefact used by the...").
- **RED against current code:** `https.request` IS invoked (the real Anthropic path is attempted since `options.stage` is undefined), and the monkey-patched throw surfaces as an SSE `error` event with no fixture content — proving the exact live defect described in the a4 FINDING.

### IT2 — full existing regression suite (AC4)
- **Verifies:** AC4
- **Action:** Run `npm test`.
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`.

---

## E2E / Manual Tests

### E2E1 — real `wuce-staging` deploy + real streaming turn (AC5)
- **Verifies:** AC5
- **Components involved:** Real `wuce-staging` Fly app
- **Precondition:** No concurrent deploy in progress from another agent (checked via `flyctl releases --app wuce-staging` before deploying); this fix is deployed via `flyctl deploy --app wuce-staging`.
- **Action:** Drive a real turn through the actual streaming endpoint — either directly (mirroring the a3/a4 FINDING repro steps) or via the existing a3/a4 Playwright specs re-run against real staging.
- **Expected result:** The response now genuinely uses the mock gateway (fixture content), not an empty or real-model response.
- **Contingency:** If deploy cannot complete this session (e.g. a concurrent agent is mid-deploy), reported as not run — IT1 (the real-adapter-but-no-network integration test) remains the deterministic, always-available verification level for the fix's correctness.

---

## NFR Tests

None beyond IT2 (no new NFR-specific behaviour introduced — this is a two-line options-wiring fix, not new application logic).

---

## Out of Scope for This Test Plan

- Re-verifying a3's/a4's already-passing ACs.
- Any test of `mock-llm-gateway.js`'s or `skill-turn-executor.js`'s internal logic (both already covered by `tests/check-bri-s3.1-mock-llm-gateway.js` and `tests/check-s6.1-cache-scope-session-threading.js`; unchanged by this fix).
- Any test of `server.js`'s adapter-wiring block (already covered by `mgfd-s1`'s own test suite).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| E2E1 depends on a live `flyctl deploy` succeeding within this session and no concurrent deploy from another agent | Deploy environment availability and shared-staging concurrency are not guaranteed at test-plan-authoring time | Contingency clause requires explicit "not run" reporting rather than a fabricated pass; UT1/UT2/IT1 provide full deterministic verification of the fix's correctness independent of E2E1's outcome |
