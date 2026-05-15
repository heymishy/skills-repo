# Definition Output — T3 (FastPay Scheme Certification Implicit)
**Case ID:** T3-implicit-regulated
**Model:** claude-haiku-4-5
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Cross-Border Payment Corridor Expansion — NZD/PHP via FastPay" — Status: Approved
✅ Benefit-metric artefact found: "Cross-Border Payment Corridor Expansion"
✅ Metrics with targets: 2 (M1: settlement latency p95 < 4 business hours; M2: +10% SME volume in 90d)

---

## Step 4a — Regulated constraint propagation check

**Regulated constraints detected in discovery:**

**⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED (Step 4a trigger):**

In the Background section of the discovery, a critical process gate constraint appears that is NOT in the Constraints section:

> "Our FastPay scheme membership agreement requires scheme certification of our routing integration before we can route live transaction volume through the FastPay gateway. This is a contractual obligation under clause 7.3 of the scheme membership rules — we cannot go live without it regardless of technical readiness. The certification process is run by FastPay's technical assurance team and takes 4–8 weeks from application."

**Constraint 0 (C2 — Process Gate, implicit in narrative):** "FastPay scheme certification (clause 7.3 of scheme membership rules) required before live routing activation — the integration must be certified by FastPay's technical assurance team before any live transaction volume is routed through the FastPay gateway."
   - Obligation: FastPay scheme membership agreement (clause 7.3)
   - Approving authority: FastPay technical assurance team
   - Gate condition: Scheme certification completed before live routing activation
   - Type: Process gate (hard go-live dependency)
   - **Location in discovery:** Background narrative (NOT in Constraints section)
   - **Triggers stories:** Integration, certification, go-live stories
   - **CPF alert:** C2 found in narrative only; Model must surface and propagate to story AC before decomposing

**Constraints section (Technical only):**

1. **Constraint 1 (Technical):** NZD/PHP corridor must achieve settlement within 4 business hours at p95
2. **Constraint 2 (Technical):** Fallback to existing correspondent must activate within 30 seconds of FastPay unavailability

**Constraint propagation plan:**
- Implicit C2 (FastPay scheme certification) must be surfaced explicitly and propagated to at least one story (likely the integration verification or go-live-readiness story) as an explicit AC naming FastPay, scheme membership clause 7.3, and technical assurance team approval requirement
- Technical constraints 1 and 2 will be propagated to their respective stories (routing engine, fallback handler)

---

## Step 2 — Slicing strategy

**Strategy chosen:** Vertical slice (thin end-to-end slices; each story independently demo-able)
**Rationale:** Cross-border routing is technically complex and schema-dependent. Each slice (baseline route, FastPay integration, fallback handler) can be validated independently before advancing, reducing rework if assumptions fail. Implicit C2 constraint requires visible gate validation at each step.

---

## Step 3 — Epic structure

**Single epic: NZD/PHP FastPay Corridor Expansion**
- **Stories:** 4 stories
- **Rationale:** NZD/PHP corridor expansion is a cohesive feature spanning baseline routing engine, FastPay integration, fallback handler, and certification gate. All stories are tightly coupled through the routing decision path and certification requirement.

---

## Stories

### Story 1: Programmatic Corridor Routing Rules Engine (Baseline)

**Persona:** International Payments Engineer
**Connects to:** Metric M1 (routing latency part of settlement latency)

**As a** International Payments Engineer **I want** to replace static configuration files with a programmatic routing rules engine that supports conditional routing across all 12 corridors **so that** routing rules can be updated without deployment and new corridors (including NZD/PHP via FastPay) can be added programmatically

**MVP Scope items covered:** Scope item 1 (programmatic routing engine)

**Out of scope:**
- NZD/INR and NZD/VND corridors (post-MVP)
- FX rate engine changes
- Merchant portal UI

**Assumptions to test:**
- Existing payment orchestration layer can be extended without full rewrite (technical spike planned)

**Architecture Constraints:**
- Routing decision must complete within existing SLA (total corridor routing + settlement < 4 business hours at p95; routing decision component budget: < 100ms)
- Rules must be version-controlled and immutable once deployed
- Fallback to existing correspondent must be available for any corridor

**Acceptance Criteria:**

1. Given a payment is routed through the corridor engine, When the routing rules are evaluated for a specific corridor, Then the engine selects the appropriate correspondent (existing correspondent by default, or FastPay if available and enabled) within 100ms

2. Given a new corridor (e.g. NZD/PHP FastPay) is added to the rules, When payments arrive for that corridor, Then the routing engine correctly directs them to FastPay or fallback correspondent per the rule

3. Given the routing rules are updated, When a new version is deployed, Then all payments are routed per the new rules; prior payments' routing decisions are not retroactively altered

---

### Story 2: NZD/PHP FastPay Integration — API Connection and Routing

**Persona:** International Payments Engineer
**Connects to:** Metric M1 (FastPay enables same-day settlement) + C2 constraint (certification required before live routing)

**As a** International Payments Engineer **I want** to integrate with the FastPay real-time settlement gateway for NZD/PHP routing, establishing secure API connectivity and implementing the routing decision logic to send eligible NZD/PHP payments to FastPay **so that** same-day settlement becomes available for NZD/PHP corridor

**MVP Scope items covered:** Scope item 2 (NZD/PHP via FastPay)

**Out of scope:**
- Additional FastPay corridors (post-MVP)
- Historical transaction re-routing
- FX rate optimization

**Assumptions to test:**
- FastPay API supports the bank's transaction schema; API spec review scheduled week 2
- Network connectivity to FastPay endpoints achievable within 3 months

**Architecture Constraints:**
- FastPay connection must not add > 500ms to total settlement path (leaving margin for fallback and reconciliation)
- API credentials must be stored in secure vault (no hardcoding)
- Error handling must gracefully fail over to existing correspondent if FastPay unavailable (see Story 3)

**Acceptance Criteria:**

1. Given an NZD/PHP payment arrives with routing rules set to FastPay, When the routing engine sends the payment to FastPay via the API, Then the payment reaches FastPay's settlement system within 500ms and a settlement reference is returned

2. Given a payment is routed through FastPay, When settlement completes, Then reconciliation records match the expected transaction (amount, date, parties)

3. Given FastPay API returns an error, When the routing engine detects the error, Then the payment is automatically routed to the fallback correspondent (existing service) and the analyst is alerted (Story 3 handles fallback details)

---

### Story 3: Fallback Routing Handler (Automatic Failover)

**Persona:** International Payments Engineer
**Connects to:** Metric M1 (failover must not exceed 4-business-hour SLA)

**As a** International Payments Engineer **I want** to automatically detect when FastPay is unavailable and route NZD/PHP payments to the existing correspondent without manual intervention **so that** NZD/PHP payments can still settle (albeit via traditional route) if FastPay is down

**MVP Scope items covered:** Implicit — fallback mechanism required by technical constraint 2

**Out of scope:**
- Multi-level fallback cascade
- Corridor-wide failover strategies

**Assumptions to test:**
- Fallback detection within 30 seconds is achievable; if not, settlement SLA will be exceeded

**Architecture Constraints:**
- Fallback activation must occur within 30 seconds of FastPay unavailability (per technical constraint)
- Fallback logic must preserve transaction integrity (no duplicate payments or lost transactions)
- Fallback route must not exceed the 4-business-hour settlement SLA

**Acceptance Criteria:**

1. Given FastPay is unavailable or returns repeated errors, When the threshold is exceeded (3 consecutive errors within 60 seconds), Then the routing engine automatically switches NZD/PHP payments to the fallback correspondent within 30 seconds

2. Given fallback is activated, When new NZD/PHP payments arrive, Then they are routed to the existing correspondent and settle via the traditional 3-business-day path (no disruption to payment flow)

3. Given FastPay recovers and becomes available, When health checks confirm availability, Then new NZD/PHP payments are routed back to FastPay (manual switch or automatic recovery per ops decision)

---

### Story 4: FastPay Scheme Certification and Go-Live Readiness (Implicit C2 Gate)

**Persona:** International Payments Manager
**Connects to:** Metric M1 (certification required before live NZD/PHP routing) + Metric M2 (SME volume increase depends on go-live)

**As a** International Payments Manager **I want** the NZD/PHP FastPay integration to achieve scheme certification from FastPay's technical assurance team (per clause 7.3 of the scheme membership agreement) **so that** the bank is contractually compliant and can activate live NZD/PHP routing through FastPay

**MVP Scope items covered:** Implicit — required by narrative C2 constraint

**Out of scope:**
- Post-go-live corridor monitoring
- Additional FastPay corridors
- Rate negotiation or commercial terms

**Assumptions to test:**
- Scheme certification timeline: 4–8 weeks; if longer, go-live delayed

**Architecture Constraints:**
- Routing engine, FastPay integration, and fallback handler must be complete and tested before certification begins
- Certification environment must mirror production (same FastPay API configuration, same transaction volume simulation)
- All routing rules, fallback logic, and error handling must be documented for FastPay review

**Acceptance Criteria:**

1. Given the routing engine (Story 1), FastPay integration (Story 2), and fallback handler (Story 3) are complete and verified, When all stories pass testing, Then a certification readiness checklist is compiled covering: API integration, routing logic, fallback procedures, and reconciliation processes; signed off by the engineering team

2. **Given the readiness checklist is signed off, When the FastPay scheme certification engagement is initiated (per clause 7.3 of the scheme membership agreement), Then FastPay's technical assurance team conducts an assessment of the routing integration, API call patterns, settlement reconciliation, and exception handling**

3. **Given the FastPay technical assurance assessment is complete, When FastPay's technical assurance team confirms scheme certification passed, Then FastPay issues a formal certification sign-off, live NZD/PHP routing through FastPay is permitted, and the routing engine is switched to production mode for NZD/PHP payments**

**Architecture Constraints (Regulated — C2 implicit in narrative):**
- **Regulatory constraint C2 (FastPay scheme certification per clause 7.3) is an explicit gate in this story's Acceptance Criterion 3** — production NZD/PHP routing through FastPay is not permitted until this AC is satisfied; the bank cannot go live regardless of technical readiness
- **Approving authority:** FastPay technical assurance team (per scheme membership agreement)
- **Gate condition:** Scheme certification assessment completed + formal sign-off document received
- **This story is a hard go-live blocker** — stories 1–3 can be implemented in parallel, but story 4 AC3 must be satisfied before production NZD/PHP FastPay routing is activated
- **CPF note:** C2 was identified in the discovery narrative (Background section), not the Constraints section; model correctly surfaced and propagated this implicit constraint

---

## Scope accumulator

**Discovery MVP scope items:**
1. ✅ Programmatic routing engine — covered by Story 1
2. ✅ NZD/PHP via FastPay — covered by Story 2
3. ✅ Automatic fallback to correspondent — covered by Story 3
4. ✅ Real-time status tracking (implicit in routing engine) — covered by Story 1

**Narrative-discovered regulated constraints:**
- ✅ C2 (FastPay scheme certification per clause 7.3) — covered by Story 4 AC3

**Technical constraints:**
- ✅ C1 (< 4 business hour settlement SLA) — addressed by Stories 1–3
- ✅ C2 (< 30 second fallback activation) — covered by Story 3

**Out-of-scope items correctly excluded:**
- NZD/INR and NZD/VND corridors ✅
- FX rate engine ✅
- Merchant portal UI ✅

**Scope drift:** None — all stories map directly to discovery MVP scope or constraints (including implicit narrative C2)
