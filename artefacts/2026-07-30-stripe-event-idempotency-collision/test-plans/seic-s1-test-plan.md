## Test Plan: Give bri-s3.5's webhook event IDs unique per-run values so the AC5 idempotency guard doesn't silently skip processing

**Story reference:** artefacts/2026-07-30-stripe-event-idempotency-collision/stories/seic-s1-stripe-event-idempotency-collision.md

## AC Coverage

| AC | Description | Unit | Verification | Risk |
|----|-------------|------|--------------|------|
| AC1 | All 5 webhook event IDs suffixed with RUN_SUFFIX | — | Code review of the diff; grep for the 5 old hardcoded `evt_e2e_*` literals to confirm none remain unsuffixed | 🟢 |
| AC2 | Idempotency guard treats each POST as new, switch statement runs | — | Cannot verify locally (requires the real, persisted `stripe_events` table on staging) — observe the next staging-deploy run | 🟡 |
| AC3 | tpwd-s1's diagnostic logging fully removed | — | Code review of the diff — `tenant-plan.js` restored to pre-diagnostic form | 🟢 |
| AC4 | No unit-test regressions | 17 | `tests/check-bri-s3.5-usage-gate.js` (unchanged, still 17/17) plus full local suite vs. baseline | 🟢 |

## Coverage gaps

This is a pure test-fixture fix confirmed via live staging log analysis, not local reproduction — the `stripe_events` idempotency table's cross-run persistence can't be meaningfully simulated locally (a fresh in-memory fake DB is used for local unit tests, per `check-bri-s3.5-usage-gate.js`'s existing pattern). Real confirmation is observing the next staging-deploy run and checking whether AC1/AC3/AC4 (the spec's own ACs) now pass consistently, with no leftover "Expected: paid, Received: trial" symptom.

## Test Data Strategy

None new — reuses the existing `RUN_SUFFIX` token already introduced by `btii-s1`, now applied to a second field (webhook event IDs) that needed the same treatment.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot locally reproduce the idempotency collision | Local unit tests use a fresh fake adapter with no persisted `stripe_events` state across "runs" | Observe the next staging-deploy run's logs; the temporary diagnostic logging (now removed) already confirmed the exact failure mode, so this fix directly targets a proven cause |
| Possible remaining, still-undiscovered static identifier elsewhere in the same spec | Two separate static-identifier bugs (tenant IDs, webhook event IDs) were found sequentially in this one file already | If a third distinct symptom appears after this merges, treat it as a new investigation rather than assuming this fix was incomplete |
