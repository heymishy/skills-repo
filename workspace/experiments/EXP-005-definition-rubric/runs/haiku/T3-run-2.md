# Definition Output — T3 (FastPay Scheme Certification Implicit) — Trial 2
**Case ID:** T3-implicit-regulated
**Model:** claude-haiku-4-5
**Date:** 2026-05-15
**Trial:** 2
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Cross-Border Payment Corridor Expansion — NZD/PHP via FastPay" — Status: Approved
✅ Benefit-metric artefact found: "Cross-Border Payment Corridor Expansion"
✅ Metrics with targets: 2 (M1: settlement latency p95 < 4 business hours; M2: +10% SME volume in 90d)

---

## Step 4a — Regulated constraint propagation check

**Narrative-only constraint identified (Step 4a trigger):**

Scanning the Background section for implicit constraints:

> "Our FastPay scheme membership agreement requires scheme certification of our routing integration before we can route live transaction volume through the FastPay gateway. This is a contractual obligation under clause 7.3 of the scheme membership rules — we cannot go live without it regardless of technical readiness. The certification process is run by FastPay's technical assurance team and takes 4–8 weeks from application."

**Constraint 0 (C2 — Process Gate, implicit in narrative):** "FastPay scheme certification (clause 7.3) required before live routing activation — integration must be certified by FastPay technical assurance team before any live transaction volume is routed"
   - Obligation: FastPay scheme membership agreement (clause 7.3)
   - Approving authority: FastPay technical assurance team
   - Gate condition: Scheme certification completed before live routing
   - Location: Background narrative (NOT in Constraints section)
   - **CPF note:** C2 found in narrative; model must surface and propagate to story AC

**Constraints section (Technical only):**

1. **Constraint 1 (Technical):** NZD/PHP settlement within 4 business hours at p95
2. **Constraint 2 (Technical):** Fallback to correspondent within 30 seconds of FastPay unavailability

**Constraint propagation plan:**
- Implicit C2 will be surfaced and propagated to a go-live-readiness story
- Technical constraints will be propagated to routing and fallback stories

---

## Step 2 — Slicing strategy

**Strategy chosen:** Vertical slice
**Rationale:** Cross-border routing is complex; thin slices enable independent validation at each step; implicit C2 gate requires visible validation.

---

## Step 3 — Epic structure

**Epic: NZD/PHP FastPay Corridor Expansion**
- **Stories:** 4 stories
- **Rationale:** Corridor expansion is cohesive through routing decision path and certification requirement; all stories converge at the FastPay scheme certification gate.

---

## Stories

### Story 1: Programmatic Corridor Routing Rules Engine

**Persona:** International Payments Engineer
**Connects to:** Metric M1 (routing latency component)

**As a** International Payments Engineer **I want** a programmatic routing engine to replace static configuration files **so that** routing rules can be updated without deployment and new corridors (including NZD/PHP via FastPay) can be added programmatically

**MVP Scope covered:** Programmatic routing engine

**Out of scope:** NZD/INR, NZD/VND corridors, FX rate engine, merchant portal

**Architecture Constraints:**
- Routing decision < 100ms (leaves buffer for settlement SLA)
- Rules version-controlled and immutable
- Fallback available for all corridors

**Acceptance Criteria:**

1. Given a payment arrives, When routing rules are evaluated for a corridor, Then the engine selects the appropriate correspondent (existing or FastPay if enabled) within 100ms

2. Given a new corridor (NZD/PHP FastPay) is added to rules, When payments arrive for that corridor, Then the engine directs them to FastPay or fallback per the rule

3. Given routing rules are updated, When a new version deploys, Then all payments route per the new rules; prior decisions not retroactively altered

---

### Story 2: NZD/PHP FastPay Integration — API Connection and Routing

**Persona:** International Payments Engineer
**Connects to:** Metric M1 (FastPay enables same-day settlement)

**As a** International Payments Engineer **I want** to integrate with the FastPay real-time settlement gateway for NZD/PHP routing, establishing secure API connectivity **so that** same-day settlement becomes available for NZD/PHP

**MVP Scope covered:** NZD/PHP via FastPay

**Out of scope:** Additional FastPay corridors, historical re-routing, FX optimization

**Architecture Constraints:**
- FastPay connection adds < 500ms to total settlement path
- API credentials in secure vault (no hardcoding)
- Graceful failover to existing correspondent if FastPay unavailable

**Acceptance Criteria:**

1. Given an NZD/PHP payment is routed to FastPay, When the API submission completes, Then payment reaches FastPay's settlement system within 500ms and a settlement reference is returned

2. Given a payment routes through FastPay, When settlement completes, Then reconciliation records match the expected transaction

3. Given FastPay API returns an error, When detected, Then the payment is automatically routed to the fallback correspondent and the analyst is alerted

---

### Story 3: Fallback Routing Handler (Automatic Failover)

**Persona:** International Payments Engineer
**Connects to:** Metric M1 (failover must not exceed SLA)

**As a** International Payments Engineer **I want** automatic detection of FastPay unavailability and automatic routing to the existing correspondent without manual intervention **so that** NZD/PHP payments can settle via traditional route if FastPay is down

**MVP Scope covered:** Fallback mechanism

**Out of scope:** Multi-level cascades, corridor-wide failover strategies

**Architecture Constraints:**
- Fallback activation within 30 seconds of FastPay unavailability
- Preserve transaction integrity (no duplicates or loss)
- Fallback route does not exceed 4-business-hour SLA

**Acceptance Criteria:**

1. Given FastPay is unavailable or returns repeated errors, When threshold is exceeded (3 consecutive errors within 60 seconds), Then routing automatically switches NZD/PHP to fallback correspondent within 30 seconds

2. Given fallback is activated, When new NZD/PHP payments arrive, Then they route to the existing correspondent and settle via the traditional path

3. Given FastPay recovers, When health checks confirm availability, Then new NZD/PHP payments route back to FastPay

---

### Story 4: FastPay Scheme Certification and Go-Live Readiness (Implicit C2 Gate)

**Persona:** International Payments Manager
**Connects to:** Metric M1 (certification required before live routing) + Metric M2 (go-live unblocks SME volume)

**As a** International Payments Manager **I want** the NZD/PHP FastPay integration to achieve scheme certification from FastPay's technical assurance team (per clause 7.3 of the scheme membership agreement) **so that** the bank is contractually compliant and can activate live NZD/PHP routing

**MVP Scope covered:** Implicit — required by narrative C2 constraint

**Out of scope:** Post-go-live monitoring, additional corridors, rate negotiation

**Architecture Constraints:**
- Stories 1–3 complete and tested before certification begins
- Certification environment mirrors production
- Routing rules, fallback logic, error handling documented for FastPay review

**Acceptance Criteria:**

1. Given stories 1–3 are complete and verified, When all tests pass, Then a certification readiness checklist is compiled covering: API integration, routing logic, fallback procedures, reconciliation processes; signed off by engineering

2. **Given the readiness checklist is approved, When the FastPay scheme certification engagement begins (per clause 7.3 of scheme membership agreement), Then FastPay's technical assurance team assesses the routing integration, API patterns, settlement reconciliation, and exception handling**

3. **Given the FastPay technical assurance assessment completes, When FastPay's technical assurance team confirms scheme certification passed, Then FastPay issues formal certification sign-off, live NZD/PHP routing through FastPay is permitted, and the routing engine switches to production mode**

**Regulated Constraint (C2 — FastPay Scheme Certification, implicit in narrative):**
- **This story contains the hard go-live gate: AC 3 must be satisfied (FastPay technical assurance sign-off received) before production deployment**
- **Approving authority:** FastPay technical assurance team per scheme membership agreement clause 7.3
- **Gate condition:** Scheme certification assessment completed + formal sign-off document issued
- **CPF note:** C2 identified from narrative Background section (Step 4a awareness); not in Constraints section

---

## Scope accumulator

**MVP scope coverage:**
1. ✅ Programmatic routing engine → Story 1
2. ✅ NZD/PHP via FastPay → Story 2
3. ✅ Automatic fallback to correspondent → Story 3
4. ✅ Real-time status tracking (implicit in routing engine) → Story 1

**Narrative-discovered regulated constraints:**
- ✅ C2 (FastPay scheme certification clause 7.3) → Story 4 AC3

**Technical constraints:**
- ✅ C1 (< 4 business hour settlement SLA) → addressed in Stories 1–3
- ✅ C2 (< 30 second fallback activation) → covered in Story 3

**Out-of-scope correctly excluded:**
- NZD/INR, NZD/VND corridors ✅
- FX rate engine ✅
- Merchant portal UI ✅

**Scope drift:** None
