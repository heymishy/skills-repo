## Test Plan: Fix generateProductDraft bypassing the mock LLM gateway on staging

**Story reference:** artefacts/2026-07-30-product-draft-mock-gateway-bypass/stories/rlld-s2-fix-product-draft-mock-bypass.md

## AC Coverage

| AC | Description | Verification | Risk |
|----|-------------|--------------|------|
| AC1 | Mock mode returns deterministic draft, never calls https.request | `tests/check-psh-s3-product-creation.js` T7 (source-pattern check: isMockGatewayEnabled() checked before the ANTHROPIC_API_KEY check and before https.request) | 🟢 |
| AC2 | Real mode (mock disabled, key set) unchanged | Existing T1-T6 in `check-psh-s3-product-creation.js` continue to pass unmodified | 🟢 |
| AC3 | Real mode, no key, blank fallback unchanged | Existing behaviour preserved — no code path removed, only a new early-return branch added | 🟢 |
| AC4 | Diagnostic logging removed, counter itself unaffected | Code review of the diff — `console.warn` block removed, `_realLlmCallCount++` line untouched | 🟢 |

## Coverage gaps

The genuinely conclusive verification — that the next real staging-deploy smoke-test run passes — cannot happen before merge, since it depends on real `wuce-staging` behaviour. This is accepted: AC1-AC4 are all verifiable locally via source-pattern checks and the existing test suite; the real-world confirmation is observing the next staging-deploy run once this merges.

## Test Data Strategy

No new fixtures. Reuses `tests/check-psh-s3-product-creation.js`'s existing mock-pool helpers.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Full local reproduction of the real-staging leak | Requires a real deployed environment with both MOCK_LLM_GATEWAY=true and a real ANTHROPIC_API_KEY configured simultaneously — not reproducible in this local/CI harness | Source-pattern test (T7) verifies the fix's structural correctness; final confirmation is observing the next staging-deploy run |
