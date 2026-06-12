# Corpus Case T1 — Payment Card Tokenisation (C2 explicit)

**Case ID:** T1-explicit-regulated
**Experiment:** EXP-005-definition-rubric
**C2 present:** Yes — explicit, named, in Constraints section
**Expected D1:** 1.0 (PCI DSS QSA identified correctly)
**Expected D2:** 1.0 (QSA gate propagated to story AC naming all three elements)
**Expected CPF C2:** 1.0
**Pass condition:** QSA sign-off appears as an explicit AC with regulation named (PCI DSS), approving body named (external QSA), and gate condition stated (before production activation)
**Fail condition:** All story ACs are technical only (tokenisation, vault integration, latency); QSA gate absent from all ACs and Architecture Constraints

---

## Operator input

> /definition — decompose the discovery artefact below into user stories.

Discovery artefact: Payment Card Tokenisation
Status: Approved
Approved By: Jane Smith (Head of Payments Compliance), Tom Jones (CTO)
Date: 2026-04-01

PROBLEM
The bank's payment platform stores raw Primary Account Numbers (PANs) in the core banking database, placing the entire platform within PCI DSS scope. Annual QSA audits cover 14 systems across 3 domains, costing £180k/year in external audit fees and 6 weeks of internal engineering effort. The payments team estimates 80% of the audit scope could be eliminated by tokenising PANs at the point of capture.

PERSONAS
- Payments Engineer: Maintains card processing integration; faces 6 weeks of audit prep annually; blocked on QSA findings before deploying card-related changes.
- Payments Compliance Manager: Manages PCI DSS assessment and QSA relationship; spends 3 weeks per cycle coordinating evidence across engineering and operations.
- Finance Director: Pays £180k/year QSA fees; wants scope reduction evidence before approving next year's budget.

MVP SCOPE
1. Tokenise PANs at API boundary (card capture endpoint) — raw PANs never stored in application layer
2. Integrate with third-party tokenisation vault (TrustVault API)
3. Detokenise at point-of-use (payment submission only) — no PAN held in application memory
4. Audit logging for all tokenise/detokenise operations (who, when, outcome)

OUT OF SCOPE
- Mobile SDK changes — separate workstream with different QSA scope boundary
- Refund and chargeback flows — handled via existing vault reference, no PAN access in this phase
- Merchant portal — no PAN access, outside CDE scope
- Bulk PAN migration for historical records — post-MVP, separate data project with dedicated data governance review

ASSUMPTIONS
- TrustVault API supports idempotent tokenisation (same PAN → same token across calls) — not yet verified against TrustVault API documentation
- Detokenise call latency < 50ms at p99 — no load test performed against production vault endpoints yet
- Network path from application tier to TrustVault can be isolated to a dedicated subnet — depends on network team capacity in Q3

CONSTRAINTS
1. PCI DSS QSA sign-off required before production go-live — the tokenisation system must achieve SAQ D compliance and pass an external QSA assessment prior to production activation.
2. Tokenise/detokenise operations must complete within existing payment processing SLA (< 200ms additional latency at p99).
3. No PAN may appear in application logs, error messages, or debug output at any point.

SUCCESS INDICATORS
- External QSA audit scope reduced from 14 systems to ≤ 3 systems within 6 months of go-live
- Annual QSA audit cost ≤ £60k (from £180k baseline) from the first post-go-live assessment cycle

---

Benefit metric artefact: Payment Card Tokenisation — PCI Scope Reduction
Status: Active

Metric M1: PCI DSS audit scope
Target: ≤ 3 in-scope systems (from 14 baseline)
Measurement: Count of systems assessed by QSA at next annual audit cycle after go-live

Metric M2: Annual QSA cost
Target: ≤ £60k per audit cycle (from £180k baseline)
Measurement: Invoice total from next QSA engagement after go-live

---

## What to look for in the output

**Pass signals:**
- Step 4a triggered: model lists "PCI DSS QSA sign-off" as a regulated constraint before decomposing
- At least one story (likely a hardening, compliance, or deployment-readiness story) contains an AC such as:
  - Given the tokenisation system has been deployed to staging, When QSA assessment is requested, Then the system must have achieved SAQ D compliance and received external QSA sign-off before production activation is permitted
- The AC names: PCI DSS (obligation), external QSA (approving body), SAQ D compliance + QSA sign-off received (gate condition)
- Architecture Constraints field in the triggering story references Constraint #1

**Fail signals:**
- No story AC mentions QSA, SAQ D, or external assessment
- QSA gate present only in a comment, epic overview, or story description — not in an enumerated AC
- Model produces only technical ACs (vault integration, latency, audit logging) with no process gate AC
- QSA gate vaguely stated as "must be PCI DSS compliant before go-live" without naming the QSA approver or SAQ D specifics
