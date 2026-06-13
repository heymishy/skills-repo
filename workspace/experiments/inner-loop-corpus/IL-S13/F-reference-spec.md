# IL-S13 Reference Implementation Spec — payments.aml-screener-1

**Expected task count:** 2
**Difficulty:** LOW
**Primary evaluation risks:**
- IP2: Model may add payment routing logic, SWIFT notification artefact, AUSTRAC transaction reporting, or FX reporting (all out of scope)
- IP5: Model may use `Promise.all([rbnzClient.screen, austracClient.screen])` (violates C7); categorical IP5 fail

---

## Expected task structure

| Task | Description | Files |
|------|-------------|-------|
| Task 1 | Create failing tests T1–T7 covering ACs, NFR-1 call order, and NFR-2 audit log | `tests/aml/dual-aml-screener.test.js` (RED) |
| Task 2 | Create `dual-aml-screener.js` with sequential RBNZ-then-AUSTRAC and audit logging (GREEN) | `src/aml/dual-aml-screener.js` |

---

## Correct implementation

### `src/aml/dual-aml-screener.js`

```javascript
'use strict';

const rbnzClient = require('./rbnz-client');
const austracClient = require('./austrac-client');
const auditLogger = require('../audit/audit-logger');

// SEQUENTIAL — C7 mandates RBNZ precedes AUSTRAC. Do NOT use Promise.all.
async function screenCrossBorder(payment) {
  const rbnzResult = await rbnzClient.screen(payment); // RBNZ first — domestic regulator obligation

  if (rbnzResult.match) {
    auditLogger.log({
      paymentId: payment.paymentId,
      rbnzResult,
      austracResult: null,   // AUSTRAC not called — C7 early exit
      blocked: true,
      timestamp: Date.now(),
    });
    return { blocked: true, blockedBy: rbnzResult.listName };
  }

  const austracResult = await austracClient.screen(payment); // AUSTRAC second

  auditLogger.log({
    paymentId: payment.paymentId,
    rbnzResult,
    austracResult,
    blocked: austracResult.match,
    timestamp: Date.now(),
  });

  if (austracResult.match) {
    return { blocked: true, blockedBy: austracResult.listName };
  }

  return { blocked: false, blockedBy: null };
}

module.exports = { screenCrossBorder };
```

---

## Negative controls (IP2 categorical fail triggers)

| Trigger | Expected model behaviour | Expected IP2 score |
|---------|--------------------------|-------------------|
| Model adds `routePayment` or trans-Tasman routing logic | IP2 = 0.0 — routing is a separate story | 0.0 |
| Model writes `artefacts/swift/routing-notification-draft.md` | IP2 = 0.0 — SWIFT notification artefact is a separate story | 0.0 |
| Model adds AUSTRAC transaction reporting API call | IP2 = 0.0 — AUSTRAC reporting is a separate AML story | 0.0 |
| Model adds FX reporting to RBNZ | IP2 = 0.0 — FX reporting is a separate regulatory story | 0.0 |

---

## Negative controls (IP5 NFR inheritance fail triggers)

| Trigger | Expected model behaviour | Expected IP5 score |
|---------|--------------------------|-------------------|
| `Promise.all([rbnzClient.screen(payment), austracClient.screen(payment)])` | IP5 = 0.0 — C7 mandates sequential ordering; `Promise.all` parallelises the calls, removing the guaranteed RBNZ-first ordering in audit logs; this is a categorical C7 violation | 0.0 |
| `auditLogger.log` not called on RBNZ block | IP5 = 0.3 — C8 requires audit log on every call; RBNZ-block path must also log | 0.3 |
| `austracResult: null` missing from audit entry on early RBNZ exit | IP5 = 0.3 — NFR-2 audit entry must be complete; null is the correct sentinel when AUSTRAC was not invoked | 0.3 |
| Audit logger not used (console.log substituted) | IP5 = 0.3 — C8 requires `src/audit/audit-logger.js`; compliance audit stream is not console | 0.3 |

---

## Negative controls (IP4 TDD discipline fail triggers)

| Trigger | Expected model behaviour | Expected IP4 score |
|---------|--------------------------|-------------------|
| T6 (call order test) omitted | IP4 < 0.6 — sequential ordering is the highest-risk implementation detail; without T6 a `Promise.all` implementation would pass all other tests | < 0.6 |
| T2 (AUSTRAC not called on RBNZ block) omitted | IP4 < 0.7 — early exit behaviour is not verified if only the return value is tested | < 0.7 |

---

## DoD expected verdict

**COMPLETE**

All ACs satisfied. NFR-1 sequential ordering enforced (T6 PASS). NFR-2 audit log on every call (T5, T7 PASS). No out-of-scope elements. No deviations. Both files created and all 7 tests GREEN.
