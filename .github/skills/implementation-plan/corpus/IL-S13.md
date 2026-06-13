# IL-S13 — Trans-Tasman SWIFT + Dual-AML Routing (HIGH difficulty)

**Feature:** 2026-09-01-trans-tasman-payments
**Story:** payments.11
**Difficulty:** HIGH
**Expected Phase A score:** ~0.60–0.70

## Operator input

> You are running /implementation-plan on the following story in eval mode.

DoR artefact:

# IL-S13 DoR Artefact — payments.11

**Feature:** 2026-09-01-trans-tasman-payments
**Story:** payments.11 — Trans-Tasman intra-group routing with dual-AML screening
**DoR verdict:** Proceed: Yes
**Oversight level:** High (dual-regulator AML + SWIFT correspondent obligation — CRO sign-off required on PR; Legal has reviewed C5 SWIFT constraint)
**Hard blocks:** 13/13 passed
**H-NFR1 (RBNZ AML):** PASS — NFR-1 sequential dual screening is a hard AML obligation; not optional
**H-NFR2 (SWIFT):** PASS — NFR-2 notification artefact is a hard contractual obligation per C5
**H-GOV:** PASS — SWIFT correspondent agreement breach risk acknowledged; 24-hour notification deadline starts at first production routing event
**Warnings:** W1 — AUSTRAC transaction reporting API integration is a separate story; for this story AUSTRAC screening uses the existing watchlist client (`src/aml/austrac-client.js`)

## Contract Proposal

**What will be built:**
An extended payment router that:
- Adds an AU routing branch for `{ destinationCountry: 'AU', paymentType: 'INTRAGROUP' }` payments
- Runs dual-AML screening: RBNZ watchlist first, then AUSTRAC watchlist (sequential per C7)
- Blocks payment with `DUAL_AML_HOLD` if either watchlist returns a match
- On first production routing call: writes `artefacts/swift/routing-notification-draft.md` with JPMorgan Chase notification details and 24-hour deadline

**What will NOT be built:**
- FX reporting to RBNZ
- AUSTRAC transaction reporting
- DIA registration renewal
- Inbound AU-to-NZ routing
- SWIFT MT103 message formatting (handled by existing gateway adapter)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — AU intragroup routes via SWIFT | Unit test: `{ destinationCountry: 'AU', paymentType: 'INTRAGROUP' }` → `swiftGateway.forward` called; NZ path not used | Unit |
| AC2 — Dual-AML screening blocks payment | Unit tests: RBNZ match → `DUAL_AML_HOLD`; AUSTRAC match → `DUAL_AML_HOLD`; both clear → forwarded | Unit |
| AC3 — SWIFT notification artefact written | Unit test: first routing call writes `artefacts/swift/routing-notification-draft.md` with required fields | Unit |
| NFR-1 — Sequential screening order | Unit test: mock call order — RBNZ called first, AUSTRAC second | Unit |
| NFR-2 — Notification artefact has 24h deadline | Unit test: `deadlineTimestamp` = routing event time + 86,400,000ms | Unit |

**Estimated touch points:**
- Modify: `src/payments/payment-router.js`
- Create: `src/payments/trans-tasman-router.js`
- Create: `src/aml/dual-aml-screener.js`
- Create: `tests/payments/trans-tasman-router.test.js`

## Coding Agent Instructions

**Goal:** Add trans-Tasman routing path for AU intragroup payments with dual-AML screening and SWIFT notification artefact production.

**Branch:** `feature/payments.11`
**Test command:** `npm test`
**Oversight:** High

**Architecture Constraint (C5 — SWIFT CORRESPONDENT BANK AGREEMENT):** Written notification to JPMorgan Chase within 24 hours is a HARD contractual obligation. The notification draft (`artefacts/swift/routing-notification-draft.md`) MUST be written by the pipeline. Missing file = SWIFT agreement breach.

**Architecture Constraint (C7 — RBNZ AML/CFT ACT):** RBNZ screening MUST precede AUSTRAC screening. This order is mandated by RBNZ regulatory obligation. The dual-AML screener must call `rbnzClient.screen()` before `austracClient.screen()`. Do NOT use `Promise.all` — sequential only.

**NFR-1:** Dual screening must complete within 800ms P99. Sequential required (C7 ordering — no parallelisation).
**NFR-2:** Notification draft must contain: `routingRelationship`, `correspondentBank: 'JPMorgan Chase'`, `notificationEmail: 'swiftcorrespondent@jpmorgan.com'`, `deadlineTimestamp` (24h from first routing event).

**Files to touch:**
- Modify: `src/payments/payment-router.js`
- Create: `src/payments/trans-tasman-router.js`
- Create: `src/aml/dual-aml-screener.js`
- Create: `tests/payments/trans-tasman-router.test.js`

**Out of scope:** FX reporting, AUSTRAC transaction reporting, DIA registration, inbound routing, SWIFT MT103 formatting.

---

Definition artefact:

# IL-S13 Definition Artefact — Trans-Tasman Payment Routing

**Feature:** 2026-09-01-trans-tasman-payments
**Story slug:** payments.11

## Story: payments.11 — Trans-Tasman intra-group routing with dual-AML screening

**AC1:** Given `{ destinationCountry: 'AU', paymentType: 'INTRAGROUP' }`, when router processes the payment, then it selects the trans-Tasman SWIFT routing path and forwards to the SWIFT gateway.

**AC2:** Given any cross-border payment, when routed, then it is screened against RBNZ sanctioned party list AND AUSTRAC watchlist. Either match → blocked with `DUAL_AML_HOLD`.

**AC3:** Given the trans-Tasman routing path is first exercised in production, when routing relationship established, then a SWIFT notification draft is written to `artefacts/swift/routing-notification-draft.md` with JPMorgan Chase details and 24-hour deadline timestamp.

**Out of Scope:** FX reporting to RBNZ, AUSTRAC transaction reporting, DIA registration renewal, inbound AU-to-NZ routing, SWIFT MT103 message formatting.

**NFR-1 (RBNZ AML/CFT Act + AUSTRAC):** All cross-border payments screened against both watchlists before routing. Screening MUST be sequential: RBNZ first, AUSTRAC second (C7). Match on either → blocks payment. P99 latency ≤ 800ms.

**NFR-2 (SWIFT Correspondent Bank Agreement):** Notification draft must contain: `routingRelationship`, `correspondentBank: 'JPMorgan Chase'`, `notificationEmail`, `deadlineTimestamp` (24h from routing event).

**Architecture Constraints:**
**C5 (SWIFT Correspondent Agreement):** Written notification to JPMorgan Chase is a HARD contractual obligation. Missing notification draft = SWIFT agreement breach.
**C7 (RBNZ AML/CFT Act):** RBNZ screening MUST precede AUSTRAC screening. Not arbitrary — RBNZ is the domestic regulator obligation, evidenced first in audit logs.

---

Test plan:

# IL-S13 Test Plan — payments.11 Trans-Tasman Routing

| AC / NFR | Tests | Coverage |
|----------|-------|----------|
| AC1 — AU intragroup via SWIFT | T1: AU intragroup → swiftGateway called; T2: NZ domestic → swiftGateway NOT called | Full |
| AC2 — Dual-AML blocks on match | T3: RBNZ match → DUAL_AML_HOLD; T4: AUSTRAC match → DUAL_AML_HOLD; T5: both clear → forwarded | Full |
| AC3 — SWIFT notification artefact | T6: first routing → artefact written; T7: artefact has all required fields | Full |
| NFR-1 — Sequential screening order | T8: RBNZ called before AUSTRAC (mock call order tracking) | Full |
| NFR-2 — 24h deadline in artefact | T9: `deadlineTimestamp` = routing event + 86,400,000ms | Full |

**T1:** Payment `{ destinationCountry: 'AU', paymentType: 'INTRAGROUP' }`; AML mocked to clear → `swiftGateway.forward` called
**T3:** RBNZ mock returns `{ match: true }` → `{ status: 'DUAL_AML_HOLD' }`; SWIFT NOT called
**T4:** RBNZ clear; AUSTRAC mock returns `{ match: true }` → `{ status: 'DUAL_AML_HOLD' }`
**T6:** First call to `routeTransTasman()` → `artefacts/swift/routing-notification-draft.md` exists
**T8:** Track call order via Jest spy — `rbnzClient.screen` call index precedes `austracClient.screen` call index
**T9:** `deadlineTimestamp - Date.now()` ≈ 86,400,000ms (within 100ms tolerance)

---

Codebase context:

```js
// src/payments/payment-router.js (existing — payments.11 MODIFIES this)
'use strict';

const nzDomesticGateway = require('../gateways/nz-domestic-gateway');
const swiftGateway = require('../gateways/swift-gateway');
const rbnzClient = require('../aml/rbnz-client');          // existing: RBNZ screening
const austracClient = require('../aml/austrac-client');    // existing: AUSTRAC screening

async function routePayment(payment) {
  const { destinationCountry, paymentType, amount, creditorAccount, debtorAccount } = payment;

  if (destinationCountry === 'NZ') {
    return nzDomesticGateway.forward({ amount, creditorAccount, debtorAccount });
  }

  // TODO payments.11: Add AU intragroup routing branch
  // TODO payments.11: Dual-AML screening (RBNZ first per C7, then AUSTRAC)
  // TODO payments.11: SWIFT notification artefact (C5)

  throw new Error(`Unsupported routing: destinationCountry=${destinationCountry}`);
}
module.exports = { routePayment };

// rbnzClient.screen({ creditorAccount, debtorAccount, amount }) → { match: boolean, listName: 'RBNZ_SANCTIONED' | null }
// austracClient.screen({ creditorAccount, debtorAccount, amount }) → { match: boolean, listName: 'AUSTRAC_WATCHLIST' | null }
//
// Files to create:
// src/payments/trans-tasman-router.js — AU intragroup routing + dual-AML + SWIFT artefact production (C5)
// src/aml/dual-aml-screener.js — sequential RBNZ then AUSTRAC (C7 ordering; NO Promise.all)
```

Produce the implementation plan. Write it to artefacts/2026-09-01-trans-tasman-payments/plans/payments.11-plan.md.

## Expected characteristics

# IL-S13 DoR Artefact — payments.11

**Feature:** 2026-09-01-trans-tasman-payments
**Story:** payments.11 — Trans-Tasman intra-group routing with dual-AML screening
**Oversight level:** High

## Contract Proposal

**What will be built:**
- AU routing branch for `{ destinationCountry: 'AU', paymentType: 'INTRAGROUP' }`
- Dual-AML screening: RBNZ first, AUSTRAC second (sequential — C7)
- Block with `DUAL_AML_HOLD` if either watchlist matches
- Write `artefacts/swift/routing-notification-draft.md` on first production routing call (C5)

**What will NOT be built:** FX reporting, AUSTRAC transaction reporting, DIA registration, inbound routing, MT103 formatting.

**ACs:**
- AC1: AU intragroup → SWIFT gateway, not NZ domestic
- AC2: RBNZ or AUSTRAC match → `DUAL_AML_HOLD`; both clear → forwarded
- AC3: First routing call writes `artefacts/swift/routing-notification-draft.md`

**NFR-1:** Sequential RBNZ → AUSTRAC (C7). P99 ≤ 800ms. NO `Promise.all`.
**NFR-2:** Artefact contains `routingRelationship`, `correspondentBank: 'JPMorgan Chase'`, `notificationEmail`, `deadlineTimestamp` (+ 24h).

**Architecture Constraints:**
- C5: SWIFT notification draft is a HARD contractual obligation. Missing = breach.
- C7: RBNZ MUST precede AUSTRAC. Sequential only — NO parallelisation.

**Files to touch:**
- Modify: `src/payments/payment-router.js`
- Create: `src/payments/trans-tasman-router.js`
- Create: `src/aml/dual-aml-screener.js`
- Create: `tests/payments/trans-tasman-router.test.js`
