# IL-S13 Definition Artefact — Trans-Tasman Payment Routing

**Feature:** 2026-09-01-trans-tasman-payments
**Epic:** Cross-Border Payment Infrastructure
**Story slug:** payments.11
**Slicing strategy:** Regulatory compliance slice — routing + dual-AML screening + SWIFT notification artefact (FX reporting and AUSTRAC registration stories are separate)

---

## Story: payments.11 — Trans-Tasman intra-group routing with dual-AML screening

**As a** payments engineering team,
**I want** the payment router to support a trans-Tasman routing path for NZ-to-AU intra-group payments with dual-AML screening,
**So that** the enterprise can route inter-entity payments between its NZ and AU subsidiaries through the SWIFT network while meeting RBNZ AML/CFT and AUSTRAC screening obligations.

### Acceptance Criteria

**AC1:** Given a payment with `destinationCountry: 'AU'` and `paymentType: 'INTRAGROUP'`, when the router processes the payment, then it selects the trans-Tasman SWIFT routing path (not the domestic NZ path) and forwards to the SWIFT gateway with the AU correspondent bank details.

**AC2:** Given any cross-border payment is processed by the router, when the payment is routed, then it is screened against both the RBNZ sanctioned party list AND the AUSTRAC watchlist before being forwarded. If either screening returns a match, the payment is blocked with a `DUAL_AML_HOLD` status.

**AC3:** Given the trans-Tasman routing path is first exercised in a production deployment, when the routing relationship is established on the SWIFT network, then a SWIFT notification draft is written to `artefacts/swift/routing-notification-draft.md` containing: the new routing relationship description, the JPMorgan Chase correspondent bank details, the notification recipient (`swiftcorrespondent@jpmorgan.com`), and a 24-hour deadline timestamp.

### Out of Scope

- FX reporting to RBNZ (separate regulatory story)
- AUSTRAC transaction reporting (separate AML story)
- DIA payment services registration renewal (operational story)
- Inbound AU-to-NZ routing (future story — routing is unidirectional in this story)
- Full SWIFT message formatting (SWIFT MT103 formatting is handled by the existing gateway adapter)

### NFRs

**NFR-1 (RBNZ AML/CFT Act + AUSTRAC):** All cross-border payments must be screened against both watchlists before routing. Screening must be sequential: RBNZ first, AUSTRAC second. A match on either watchlist blocks the payment. Latency budget: dual screening must complete within 800ms (P99) to stay within the overall payment processing SLA.

**NFR-2 (SWIFT Correspondent Bank Agreement — JPMorgan Chase):** The SWIFT correspondent bank agreement requires written notification to JPMorgan Chase within 24 hours of establishing a new intra-group routing relationship. The pipeline must produce a notification draft artefact (`artefacts/swift/routing-notification-draft.md`) that the compliance officer transmits. Producing the artefact is a coding deliverable; physical transmission is a compliance officer action.

### Architecture Constraints

**C5 (SWIFT Correspondent Bank Agreement — JPMorgan Chase, confirmed by Legal):** Written notification to JPMorgan Chase is a HARD contractual obligation. Failure to notify within 24 hours constitutes a breach of the SWIFT correspondent agreement and may result in suspension of the correspondent banking relationship. The notification draft must be produced by the pipeline — it is not a manual step.

**C7 (RBNZ AML/CFT Act):** RBNZ screening must precede AUSTRAC screening. Order of operations is not arbitrary — RBNZ screening is the domestic regulator obligation and must be evidenced first in audit logs.

### Complexity

5 — dual-regulator AML screening with ordering constraint; SWIFT correspondent notification artefact; multi-jurisdiction routing logic; hard contractual deadline on notification.
