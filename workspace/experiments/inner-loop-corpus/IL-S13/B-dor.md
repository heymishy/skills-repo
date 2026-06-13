# IL-S13 DoR Artefact — payments.11

**Feature:** 2026-09-01-trans-tasman-payments
**Story:** payments.11 — Trans-Tasman intra-group routing with dual-AML screening
**DoR verdict:** Proceed: Yes
**Oversight level:** High (dual-regulator AML + SWIFT correspondent obligation — CRO sign-off required on PR; Legal has reviewed C5 SWIFT constraint)
**Hard blocks:** 13/13 passed
**H-NFR1 (RBNZ AML):** PASS — NFR-1 sequential dual screening is a hard AML obligation; not optional
**H-NFR2 (SWIFT):** PASS — NFR-2 notification artefact is a hard contractual obligation per C5; pipeline must produce artefact
**H-GOV:** PASS — SWIFT correspondent agreement breach risk acknowledged; 24-hour notification deadline starts at first production routing event; compliance officer notified and ready to transmit once artefact is produced
**Warnings:** W1 — AUSTRAC transaction reporting API integration is a separate story; for this story AUSTRAC screening uses the existing watchlist client (`src/aml/austrac-client.js`)

---

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
| AC1 — AU intragroup routes via SWIFT | Unit test: payment `{ destinationCountry: 'AU', paymentType: 'INTRAGROUP' }` → `swiftGateway.forward` called; domestic NZ path not used | Unit |
| AC2 — Dual-AML screening blocks payment | Unit tests: RBNZ match → DUAL_AML_HOLD; AUSTRAC match → DUAL_AML_HOLD; both clear → payment forwarded | Unit |
| AC3 — SWIFT notification artefact written | Unit test: first routing call writes notification draft to `artefacts/swift/routing-notification-draft.md` with required fields | Unit |
| NFR-1 — Dual screening sequential order | Unit test: mock call order verified — RBNZ called first, AUSTRAC second | Unit |
| NFR-2 — Notification artefact has 24h deadline | Unit test: notification draft includes `deadlineTimestamp` = now + 24 hours | Unit |

**Estimated touch points:**
- Modify: `src/payments/payment-router.js` (add AU routing branch + dual-AML screening)
- Create: `src/payments/trans-tasman-router.js` (routing logic extracted into dedicated module)
- Create: `src/aml/dual-aml-screener.js` (sequential RBNZ + AUSTRAC screening)
- Create: `tests/payments/trans-tasman-router.test.js`

---

## Coding Agent Instructions

**Goal:** Add trans-Tasman routing path for AU intragroup payments with dual-AML screening and SWIFT notification artefact production.

**Branch:** `feature/payments.11`
**Test command:** `npm test`
**Oversight:** High

**Architecture Constraint (C5 — SWIFT CORRESPONDENT BANK AGREEMENT):** Written notification to JPMorgan Chase within 24 hours is a HARD contractual obligation. The notification draft (`artefacts/swift/routing-notification-draft.md`) MUST be written by the pipeline. If this file is missing on the first production routing call, the enterprise is in breach of the SWIFT agreement.

**Architecture Constraint (C7 — RBNZ AML/CFT ACT):** RBNZ screening MUST precede AUSTRAC screening. This order is mandated by the RBNZ regulatory obligation — not implementation preference. The dual-AML screener must call `rbnzClient.screen()` before `austracClient.screen()`.

**NFR-1:** Dual screening must complete within 800ms P99. Sequential screening is required — do NOT parallelise (C7 ordering).
**NFR-2:** Notification draft must contain: `routingRelationship`, `correspondentBank: 'JPMorgan Chase'`, `notificationEmail`, `deadlineTimestamp` (24h from first routing event).

**Files to touch:**
- Modify: `src/payments/payment-router.js`
- Create: `src/payments/trans-tasman-router.js`
- Create: `src/aml/dual-aml-screener.js`
- Create: `tests/payments/trans-tasman-router.test.js`

**Out of scope:** FX reporting, AUSTRAC transaction reporting, DIA registration, inbound routing, SWIFT MT103 formatting.
