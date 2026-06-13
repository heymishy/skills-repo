# IL-S13 DoD Input Bundle — payments.11 Trans-Tasman Routing

**Story:** payments.11 — Trans-Tasman intra-group routing with dual-AML screening
**PR:** #263
**Expected DoD verdict:** COMPLETE WITH DEVIATIONS
**Difficulty:** HIGH

---

## Definition artefact (inline)

Story: payments.11 — Trans-Tasman intra-group routing with dual-AML screening

AC1: AU intragroup payments routed via SWIFT gateway (not NZ domestic); NZ domestic payments unaffected.
AC2: All cross-border payments screened against RBNZ + AUSTRAC; match on either → `DUAL_AML_HOLD`.
AC3: SWIFT notification artefact written to `artefacts/swift/routing-notification-draft.md` on first routing call with JPMorgan Chase details and 24h deadline.
NFR-1 (RBNZ AML/CFT): Sequential dual screening — RBNZ first, AUSTRAC second. No parallelisation.
NFR-2 (SWIFT Correspondent Agreement): Notification artefact includes `deadlineTimestamp` = event time + 24 hours.

Out of scope: FX reporting, AUSTRAC transaction reporting, DIA registration renewal, inbound AU-to-NZ routing, SWIFT MT103 formatting.

---

## Test plan summary

| Test | AC/NFR | Status |
|------|--------|--------|
| T1 — AU intragroup → SWIFT gateway | AC1 | PASS |
| T2 — NZ domestic → domestic gateway, not SWIFT | AC1 | PASS |
| T3 — RBNZ match → DUAL_AML_HOLD | AC2 | PASS |
| T4 — AUSTRAC match (RBNZ clear) → DUAL_AML_HOLD | AC2 | PASS |
| T5 — Both clear → payment forwarded | AC2 | PASS |
| T6 — SWIFT artefact written on first routing call | AC3, NFR-2 | PASS |
| T7 — SWIFT artefact has all required fields | AC3 | PASS |
| T8 — RBNZ called before AUSTRAC (call order) | NFR-1, C7 | PASS |
| T9 — deadlineTimestamp = event + 24h | NFR-2 | PASS |

**All 9 tests passing. Test suite command:** `npm test`

---

## Test run evidence

```
PASS tests/payments/trans-tasman-router.test.js
  Trans-Tasman routing — payments.11
    ✓ AU intragroup payment routed via SWIFT gateway (6 ms)
    ✓ NZ domestic payment does not use SWIFT path (4 ms)
    ✓ RBNZ match blocks payment with DUAL_AML_HOLD (5 ms)
    ✓ AUSTRAC match blocks payment when RBNZ clears (4 ms)
    ✓ Both watchlists clear — payment forwarded via SWIFT (5 ms)
    ✓ SWIFT notification artefact written on first routing call (8 ms)
    ✓ SWIFT artefact contains all required fields (6 ms)
    ✓ RBNZ screening called before AUSTRAC (call order verified) (4 ms)
    ✓ deadlineTimestamp is 24 hours after routing event (3 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

---

## AC verification results

| Scenario | Result |
|----------|--------|
| S1 — AU intragroup routing via SWIFT (AC1) | PASS |
| S2 — Dual-AML blocks RBNZ and AUSTRAC matches (AC2) | PASS |
| S3 — SWIFT notification artefact with 24h deadline (AC3 + NFR-2) | PASS — `artefacts/swift/routing-notification-draft.md` present with `correspondentBank`, `notificationEmail`, `deadlineTimestamp` |
| S4 — RBNZ called before AUSTRAC (C7 ordering) | PASS — sequential calls confirmed by mock call index tracking |
| S5 — No FX reporting / AUSTRAC reporting / DIA / inbound routing in diff | PASS — diff contains only `trans-tasman-router.js`, `dual-aml-screener.js`, `payment-router.js` extension, and test file |

---

## PR diff summary

**Files changed:**
- `src/aml/dual-aml-screener.js` — new module; `screenCrossBorder(payment)` calls `rbnzClient.screen()` then `austracClient.screen()` sequentially (NOT `Promise.all`); returns `{ blocked, blockedBy }`
- `src/payments/trans-tasman-router.js` — new module; AU intragroup routing + dual-AML + SWIFT notification artefact production on first call
- `src/payments/payment-router.js` — modified; added AU intragroup routing branch delegating to `trans-tasman-router`
- `tests/payments/trans-tasman-router.test.js` — new file; T1–T9 tests

**Artefact produced at runtime:**
- `artefacts/swift/routing-notification-draft.md` — written by `routeTransTasman()` on first production call; contains JPMorgan Chase notification draft with 24-hour deadline

---

## Out-of-scope check

No FX reporting API calls. No AUSTRAC transaction report submissions. No DIA registration. No inbound AU-to-NZ routing. No SWIFT MT103 formatting (delegated to existing gateway adapter). Sequential screening confirmed — no `Promise.all` parallelisation.

---

## NFR check

NFR-1 (Dual-AML sequential): RBNZ called before AUSTRAC — T8 PASS. `await rbnzClient.screen()` completes before `await austracClient.screen()` is called. C7 ordering enforced.

NFR-2 (SWIFT notification artefact): `routing-notification-draft.md` written with `deadlineTimestamp = routingEventTime + 86400000`. T9 PASS. Physical transmission pending compliance officer action.

---

## Expected DoD verdict

**COMPLETE WITH DEVIATIONS**

Deviation recorded:
- D1: SWIFT notification artefact (`artefacts/swift/routing-notification-draft.md`) produced and correct. Physical transmission to JPMorgan Chase (`swiftcorrespondent@jpmorgan.com`) is pending compliance officer action. 24-hour contractual deadline has started. This is an expected and accepted deviation — transmission is a compliance officer action per the agreed Contract Proposal scope. The coding deliverable (artefact production) is complete.

Gate conditions:
- D1 (AC coverage): 3/3 ACs verified ✓
- D2 (out-of-scope): No FX reporting, no AUSTRAC transaction reporting, no DIA, no inbound routing ✓
- D3 (test plan): 9/9 tests pass ✓
- D4 (NFR): NFR-1 sequential screening enforced; NFR-2 artefact with deadline produced ✓
- D5 (metric signal): All watchlist screening results, routing decisions, artefact write confirmations in test output ✓
- D6 (verdict): COMPLETE WITH DEVIATIONS — SWIFT transmission pending (accepted; not a story defect)
