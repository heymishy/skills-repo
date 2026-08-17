# Definition of Done: Let an admin toggle the mock LLM gateway on/off from an in-app admin page, without a redeploy

**PR:** #578 (commit `0343cdc3`) | **Merged:** 2026-07-24 (merge-marker commit `ca773b8e`, same date)
**Story:** artefacts/2026-07-24-admin-mock-gateway-toggle/stories/amgt-s1.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 -- admin page shows live effective state, not stale/cached | Yes | `adminToggleReflectsLiveEffectiveState` -- asserts a 200 response, confirms `isMockGatewayEnabled()` precondition, and re-renders after flipping the underlying env var to prove the page tracks the live value, not a load-time cached one | Automated (`check-amgt-s1-mock-gateway-toggle.js`) | None |
| AC2 -- toggle flip takes effect immediately, no restart | Yes | `toggleFlipTakesEffectImmediately` (unit-level flip both directions) and `toggleFlipAffectsRealTurnFlow` (integration -- drives `skillTurnExecutor` through the real turn-execution path with a mocked `https`, confirms zero real `https.request` calls and the mock fixture response is returned) | Automated | None |
| AC3 -- in-memory only, resets on restart, honest page copy | Yes | `toggleResetsOnRestartAndPageLabelsThisHonestly` -- flips the override, simulates a restart via `resetRuntimeMockGatewayOverride()`, confirms the env-var default re-applies, and asserts the admin page body contains explicit "resets to the configured default" copy naming `MOCK_LLM_GATEWAY` | Automated | None |
| AC4 -- production hard-override unaffected by the new toggle | Yes | `productionHardOverrideUnaffectedByToggle` -- sets `NODE_ENV=production`, flips the runtime override on, asserts `isMockGatewayEnabled()` still returns `false` | Automated | None |
| AC5 -- unauthenticated/non-admin requests rejected by `requireAdmin` on both routes | Yes | `toggleEndpointRequiresAdmin` (non-admin session, POST), `toggleGetEndpointRequiresAdmin` (unauthenticated, GET), plus a source-level check that both `/admin/mock-gateway` and `/api/admin/mock-gateway/toggle` route blocks in `server.js` call `requireAdmin` | Automated | None |

## Scope Deviations

None. All three explicitly out-of-scope items from the story (durable cross-restart persistence, per-tenant/per-request toggling, PostHog flag unification) remain untouched, consistent with the story's own accepted scope boundary.

## Test Plan Coverage

`check-amgt-s1-mock-gateway-toggle.js`: 9 passed, 0 failed (freshly re-run 2026-08-17). This covers all 5 ACs plus the NFR audit-logging requirement (`auditLogOnToggleFlip`, asserting a structured `mock_gateway_toggled` log line naming the admin identity and new state) and one additional wiring check (`server.js wires requireAdmin for both new mock-gateway toggle routes`). The manual verification script (`amgt-s1-verification.md`, 5 scenarios) exists but shows no recorded manual pass/fail marks -- coverage for all 5 ACs is fully satisfied by the automated suite above, so the absence of manual sign-off is not a gap.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | Met | Single in-memory boolean check, as designed; no separate test needed given the negligible cost class stated in the story |
| Security | Met | `requireAdmin` gate confirmed on both routes (AC5 evidence above); production hard-override confirmed unaffected (AC4 evidence above) |
| Accessibility | Not independently verified | Story specifies a standard `renderShell`-consistent form/toggle control; no automated accessibility check exists in the test suite for this story -- inherited from the reused `renderShell` pattern, not separately audited here |
| Audit | Met | `auditLogOnToggleFlip` confirms a `mock_gateway_toggled` structured log line with `adminId`, `newState`, and `timestamp` on every POST |

## Metric Signal

No benefit-metric artefact exists for this story -- confirmed in the story's own "Benefit-metric reference: None" line, per the short-track convention that skips `/benefit-metric`. The story states its benefit directly as closing an operational gap (redeploy required to flip mock/real model behaviour); no Tier 1 product metric is tied to this change, so there is no metric signal to report.

## Outcome

**COMPLETE**
**Follow-up actions:** None. Note for context (not a gap in this story): the in-memory-only toggle's known risk of a stale "off" override silently leaking real-token-cost real-model-calls into later sessions was subsequently addressed by a real follow-up story, `mgar-s1` (PR #692, "auto-revert stale mock-gateway override, force on before CI E2E"), which is already merged and whose auto-revert/TTL logic is visible in the current `admin-mock-gateway.js` (`getRuntimeOverrideExpiresAt`, 30-minute auto-revert copy). This was an accepted MVP trade-off at amgt-s1 time (AC3), not an open defect of this story.

## DoD Observations

The implementation has been in production since 2026-07-24 (about 3.5 weeks at time of this DoD) and has already had a real follow-up story (`mgar-s1`) build on top of it to close the anticipated stale-override risk, which is a healthy sign the honest-persistence design (AC3) worked as intended rather than causing a silent incident.
