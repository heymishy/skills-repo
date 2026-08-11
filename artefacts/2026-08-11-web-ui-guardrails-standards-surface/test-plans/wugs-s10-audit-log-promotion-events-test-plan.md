## Test Plan: Audit-log promotion request, approval, and rejection events

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s10-audit-log-promotion-events.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-3-promotion-approval.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | request fires `guardrail_promotion_requested` | 1 test | — | — | — | — | 🟢 |
| AC2 | approval fires `guardrail_promotion_approved` | 1 test | — | — | — | — | 🟢 |
| AC3 | rejection fires `guardrail_promotion_rejected` | 1 test | — | — | — | — | 🟢 |
| AC4 | capture failure doesn't block the real action | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock PostHog client)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1-AC3 | Mock PostHog client asserting `.capture()` calls | Mock client | None | |
| AC4 | Mock PostHog client whose `.capture()` throws | Mock client | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### requestPromotion_fires_guardrailPromotionRequested

- **Verifies:** AC1
- **Precondition:** Mock PostHog client injected
- **Action:** Call `wugs-s8`'s request handler
- **Expected result:** `.capture()` called with event name `guardrail_promotion_requested` and properties `tenantId`, `productId`, `requestId`, `filePath`
- **Edge case:** No

### approveRequest_fires_guardrailPromotionApproved

- **Verifies:** AC2
- **Precondition:** Mock PostHog client injected
- **Action:** Call `wugs-s9`'s approve handler
- **Expected result:** `.capture()` called with `guardrail_promotion_approved` and properties `tenantId`, `requestId`, `approvedBy`, `prNumber`
- **Edge case:** No

### rejectRequest_fires_guardrailPromotionRejected

- **Verifies:** AC3
- **Precondition:** Mock PostHog client injected
- **Action:** Call `wugs-s9`'s reject handler
- **Expected result:** `.capture()` called with `guardrail_promotion_rejected` and properties `tenantId`, `requestId`, `rejectedBy`
- **Edge case:** No

---

## Integration Tests

### captureFailure_doesNotBlockRealAction

- **Verifies:** AC4
- **Components involved:** request/approve/reject handlers, PostHog capture call
- **Precondition:** Mock PostHog client's `.capture()` throws synchronously or rejects
- **Action:** Call each of the three handlers with the failing mock
- **Expected result:** In all three cases, the underlying state change (request created / approved / rejected) still completes successfully — the capture failure is swallowed, not propagated as a request failure
- **Edge case:** Yes — this is the story's core reliability guarantee

---

## NFR Tests

- **Performance:** Capture calls are fire-and-forget (async, non-blocking) — no hard latency target; not separately tested beyond AC4's non-blocking assertion.
- **Security:** No PII/credential content in event properties — assert captured property values are only IDs and paths, never token/credential strings.

---

## Out of Scope for This Test Plan

- A dashboard visualising these events — not built in this story.

---

## Test Gaps and Risks

None identified as blocking.
