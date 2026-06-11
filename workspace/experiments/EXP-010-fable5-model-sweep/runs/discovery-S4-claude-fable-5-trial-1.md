# Discovery: Card Services Experience API

## 1. Problem Statement

Eleven point-to-point integrations against the card core system create duplicated effort, inconsistent data models, divergent authentication patterns, and a shared admin-level service account that violates least-privilege principles. The vendor's deprecation of the legacy API in **18 months** forces a migration; doing it 11 times independently multiplies cost, risk, and inconsistency.

**Proposed direction:** Build an Experience API layer that abstracts the card core vendor API and exposes a stable, versioned contract to all consumers — internal and external — so that the vendor migration happens **once**, behind the abstraction.

---

## 2. Drivers & Forcing Functions

| Driver | Nature | Implication |
|---|---|---|
| Vendor API deprecation | Hard deadline, 18 months | All 11 integrations must be off the legacy API or covered by the Experience API |
| Contractual extension clause | Conditional: +6 months if active migration demonstrated by **month 12** | Month 12 is the real internal checkpoint — plan must produce demonstrable migration progress (consumers live on the new API) by then |
| PCI DSS scope | Regulatory, non-negotiable | Caching design constrained from day one; raw PAN never cached, truncated PAN (last 4) permitted |
| CDR-equivalent consent (open banking) | Regulatory, per-customer, per-data-type | Consent enforcement must be a first-class capability of the API, not bolted on |
| Shared admin service account | Security debt | Least-privilege model must be designed; currently **undefined** per operation |

---

## 3. Scope

### In scope — API capability domains
1. **Card account summary**
2. **Transaction history** (90 days)
3. **Spend categories**
4. **Card controls** — freeze/unfreeze, limit changes (write operations)
5. **Dispute initiation** (write operation)

### Consumers
- **Internal:** mobile app, internet banking, contact centre tooling
- **External:** two fintech partners under the open banking programme (consent-gated)

### In scope — cross-cutting
- Canonical data model unifying the 11 divergent models
- Versioned API contract and deprecation policy (avoid recreating today's problem)
- Caching layer compliant with PCI DSS retention limits
- Consent enforcement for external partner access (per data type)
- Least-privilege access model per API operation
- Migration of all 11 consumer integrations
- Decommissioning of the shared admin service account

### Out of scope (proposed — confirm)
- Changes to the card core system itself
- New product capabilities beyond the five listed domains
- Migration of consumers' internal application logic beyond the integration boundary
- Real-time event streaming (unless discovered as a requirement during consumer interviews)

---

## 4. Key Constraints

### 4.1 PCI DSS
- Experience API **handles, transforms, and caches** card transaction data → the API layer is **in PCI scope**.
- **Raw PAN must never be cached.** Truncate to last 4 digits at ingestion, before any cache write.
- Cache retention must comply with PCI DSS data retention limits — define explicit TTLs per data type.
- Architectural recommendation to validate: tokenise/truncate at the boundary with the card core so PAN never enters the caching tier at all, minimising the cardholder data environment (CDE) footprint.

### 4.2 CDR-equivalent consent (external partners)
- Consent is **per customer, per data type**. The API must check consent at request time for partner-originated calls.
- Data-type granularity maps to the capability domains — e.g., a customer may consent to transaction history but not card controls.
- Open question whether external partners get card controls / dispute initiation at all (see §7).
- Consent revocation handling: cached data and in-flight access must respect revocation. Define revocation propagation SLA.

### 4.3 Least privilege (currently undefined — discovery output needed)
Proposed starting frame, to be validated with security:

| Operation class | Examples | Privilege profile |
|---|---|---|
| Read, low sensitivity | Account summary, spend categories | Read-only, scoped to customer's own cards |
| Read, PCI-sensitive | Transaction history | Read-only + PCI handling controls, audit logging |
| Write, reversible | Freeze/unfreeze | Scoped write, step-up auth consideration |
| Write, financial impact | Limit changes, dispute initiation | Scoped write, strong audit trail, possible approval/limits |

Each consumer gets credentials scoped only to the operations it uses (e.g., a partner with transaction-read consent scope cannot call card controls). The single shared admin account is replaced by per-consumer, per-scope credentials, then decommissioned.

### 4.4 Timeline
- **Month 0–18:** vendor deadline (hard)
- **Month 12:** extension checkpoint — must demonstrate *active migration progress*
- Practical implication: Experience API must be production-live with at least some consumers migrated **well before month 12**.

---

## 5. Stakeholders

| Stakeholder | Interest / role |
|---|---|
| 11 consumer integration teams | Migration effort, contract design input, data model needs |
| Mobile app, internet banking, contact centre product owners | Feature parity, no customer-facing regression |
| Two fintech partners | Contract stability, consent flows, migration coordination across org boundary |
| Card core vendor | Deprecation timeline, extension clause, new API capabilities/limits |
| Security / PCI compliance | CDE scoping, caching design, least-privilege model, QSA assessment |
| Open banking / regulatory compliance | CDR-equivalent consent enforcement, audit |
| Platform/API team (likely owners) | Build, operate, version the Experience API |
| Vendor contract owner | Extension negotiation, evidence of progress at month 12 |

---

## 6. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Vendor's replacement API lacks parity with legacy API (data fields, semantics, rate limits) | Medium | High | Gap analysis against all 11 consumers' actual usage in first 4–6 weeks |
| R2 | Consumer teams deprioritise migration; long tail misses deadline | High | High | Migrate highest-traffic consumers first; exec sponsorship; published migration schedule tied to month-12 checkpoint |
| R3 | Canonical data model can't satisfy all 11 divergent models without breaking consumers | Medium | High | Field-level usage audit per consumer; version negotiation; adapter shims for outliers |
| R4 | Caching design pulls more of the platform into PCI scope than intended | Medium | High | Truncate/tokenise at ingestion boundary; early QSA/security review of architecture |
| R5 | Consent enforcement gaps expose partner access to non-consented data types | Low | Critical | Consent check as mandatory policy enforcement point in the gateway, not in business logic; automated testing per data type |
| R6 | Least-privilege migration breaks consumers dependent on admin-level behaviours | Medium | Medium | Inventory actual operations used per consumer before scoping credentials; parallel-run period |
| R7 | External partners (outside our control) migrate slowly | Medium | Medium | Early engagement; longer notice period; contractual migration commitments if available |
| R8 | Experience API becomes a single point of failure for all card data access | Medium | High | Availability targets ≥ strictest current consumer SLA; resilience design; cache-as-fallback strategy (within PCI limits) |
| R9 | Month-12 evidence threshold ("active migration progress") is ambiguous | Medium | High | Clarify with vendor in writing what qualifies; design milestone plan to exceed it |

---

## 7. Open Questions

**Vendor & timeline**
1. What does the vendor's replacement API look like — does it cover all five capability domains? Rate limits? Auth model?
2. What evidence specifically satisfies the "active migration progress" extension clause?
3. Can the Experience API initially front the *legacy* API (decoupling consumer migration from the vendor migration), then swap the backend? This is the strongest de-risking move available — validate feasibility early.

**Consumers**
4. What data fields does each of the 11 integrations actually use? (Drives canonical model.)
5. Which consumers use write operations (controls, disputes) vs read-only?
6. Do external partners need all five domains, or read-only subsets? Does our open banking programme even permit partner-initiated card controls?
7. What are current per-consumer SLAs, traffic volumes, and peak loads?

**Compliance & security**
8. What are the exact PCI DSS retention TTLs we'll apply per cached data type? Who signs off?
9. Where is consent state held today, and what's the integration path for real-time consent checks and revocation propagation?
10. Is step-up authentication required for card controls / disputes via the Experience API, or is that the consumer's responsibility?
11. What audit logging is required for partner access under the open banking programme?

**Architecture & operations**
12. Who owns and operates the Experience API long-term (team, funding, on-call)?
13. What is the versioning and deprecation policy for the Experience API itself?
14. Does spend categorisation come from the card core, or do we compute it? (Affects scope materially.)

---

## 8. Assumptions (to validate)

- A1: The vendor's replacement API (or the legacy API during transition) can support all five capability domains.
- A2: The Experience API can launch against the legacy API and swap backends later (subject to Q3).
- A3: Consent state is queryable in real time from an existing consent management system.
- A4: Truncated PAN (last 4) plus a non-PAN account identifier is sufficient for all consumer use cases — no consumer has a legitimate need for full PAN through this API.
- A5: All 11 consumers can complete migration within the window given a stable contract by ~month 6.
- A6: Spend categories are derivable from data the card core already provides.

---

## 9. Success Criteria

1. **Zero consumers on the legacy vendor API** by month 18 (or month 24 with extension secured).
2. **Extension eligibility secured** as insurance: demonstrable migration progress documented before month 12.
3. **Single versioned contract:** all 11 integrations consume the Experience API; no new point-to-point integrations created.
4. **PCI compliance:** caching design passes assessment; no raw PAN at rest in the cache tier — verifi