# Discovery Report: Card Services Experience API

## Executive Summary

This discovery covers the design and delivery of an Experience API layer that abstracts the card core system, consolidates 11 point-to-point integrations, and establishes a stable, compliant API surface for all consumer teams. The initiative is driven by a fixed vendor deprecation timeline but carries significant scope beyond a straight migration — PCI DSS compliance uplift, consent-enforced access for external partners, and a security model that does not yet exist at the operational level. All of these are delivery risks that need to be resolved before architecture is committed.

---

## Problem Statement

### Current State

The card core system is currently accessed by 11 consumer teams through independent integrations. Each team has built against the vendor's legacy API directly, resulting in divergent data models, inconsistent authentication patterns, and duplicated integration logic across the estate. Two of those consumers are external fintech partners operating under an open banking programme, meaning card data flows outside the organisation under consent obligations that are not currently enforced at the API layer.

The shared service account used for card core access carries admin-level privileges. There is no least-privilege model in place, meaning any compromised consumer integration has unrestricted access to the card core system.

The vendor has confirmed that the legacy API will be deprecated in 18 months. Without intervention, 11 teams face independent migration efforts, each incurring their own testing, security review, and coordination overhead with the card core vendor.

### What We Are Solving For

- Replace 11 independent integrations with a single, stable, versioned abstraction layer
- Eliminate the hard dependency on the vendor's legacy API before deprecation
- Establish PCI DSS-compliant data handling, transformation, and caching
- Enforce CDR-equivalent consent checks for external partner access at the API layer
- Implement least-privilege access to the card core system
- Protect the 6-month extension option as contingency against delivery risk

### What We Are Not Solving For

This is not a card core replacement, a new product capability build, or a consumer-facing feature delivery programme. Existing consumer behaviour should be preserved functionally. The Experience API is infrastructure, not product.

---

## Scope

### In Scope

**API capabilities to be exposed:**

| Capability | Description | PCI Scope | Consent Required (External) |
|---|---|---|---|
| Card account summary | Account status, card type, truncated PAN | Yes | Yes |
| Transaction history | 90-day rolling window | Yes | Yes |
| Spend categories | Derived/categorised transaction data | Yes | Yes |
| Card controls | Freeze/unfreeze, limit changes | Yes | Yes |
| Dispute initiation | Raise and track disputes | Yes | Yes |

**Consumers in scope:**

| Consumer | Type | Auth Pattern (Current) | Notes |
|---|---|---|---|
| Mobile app | Internal | Unknown — needs discovery | High-volume, latency-sensitive |
| Internet banking | Internal | Unknown — needs discovery | Likely session-based today |
| Contact centre tooling | Internal | Unknown — needs discovery | Agent-facing, may have different data needs |
| Fintech Partner A | External | Unknown — needs discovery | CDR consent enforced |
| Fintech Partner B | External | Unknown — needs discovery | CDR consent enforced |
| 6 further integrations | Internal/Unknown | Unknown | Need classification |

> **Gap:** Consumer inventory is incomplete. We have confirmed 11 active integrations but have not yet classified all 11 by consumer type, current auth pattern, data requirements, or migration readiness. This must be completed in the first phase of work.

### Out of Scope

- Changes to card core system internals or vendor API design
- New card product features or business logic
- Consumer-side integration changes beyond what is required to migrate to the Experience API
- CDR consent management platform build (assumed to exist; integration only)
- PCI DSS certification of the Experience API (compliance posture improvement is in scope; formal certification may follow separately)

---

## Constraints and Fixed Points

### Hard Constraints

**Vendor deprecation at 18 months** is non-negotiable. This sets the outer boundary for all 11 consumer integrations to be live on the Experience API. It is not a soft target.

**PCI DSS data handling rules** are non-negotiable by regulation:
- Raw PAN data cannot be cached at any layer
- Truncated PAN (last 4 digits) is acceptable for caching
- Transaction data caching must comply with PCI DSS data retention limits
- The Experience API will be in-scope for PCI DSS; this affects infrastructure, logging, key management, access controls, and audit requirements

**CDR-equivalent consent enforcement** is a legal obligation for external partner access. Data must not be served to external partners without confirmed, active, per-data-type customer consent. This is not an optional enhancement.

### Significant Constraints

**Least-privilege access model does not yet exist.** We are currently operating with a shared admin-level service account against the card core. Before the Experience API can be built securely, we need to define what permissions are required per operation and negotiate those permission scopes with the vendor or card core team. This is a dependency that could block detailed design.

**Consumer integration patterns are heterogeneous.** Eleven teams have built their own auth patterns and data models. Migrating them to a single API will require each consumer to make changes. The Experience API team cannot fully control the migration pace of consumer teams — this is a coordination and governance challenge, not just a technical one.

**Extension option requires demonstrated progress by month 12.** The 6-month extension is available but conditional. "Active migration progress" needs a precise definition agreed with the vendor so we know what evidence will satisfy the condition. We should treat the extension as contingency, not as planned headroom.

---

## Risks

### Risk Register

**R1 — Consumer migration not complete by month 18**
*Probability: High without governance intervention. Impact: Critical.*
If any consumer team is still on the legacy API at deprecation, their integration fails. Eleven teams migrating independently, even to a common target, represents significant coordination risk. There is no single team accountable for the aggregate migration timeline today.

Mitigation required: Establish a migration programme with named owners per consumer, milestone tracking, and escalation paths. Start consumer team engagement immediately — do not wait for the Experience API to be built before onboarding teams to the migration plan.

**R2 — Least-privilege scope definition blocks architecture**
*Probability: Medium. Impact: High.*
We cannot finalise the card core integration design until we know what permission model is achievable. If the vendor's new API does not support granular permissions, we may be forced into a compensating control design (e.g., operation-level access tokens managed by the Experience API itself).

Mitigation required: Treat least-privilege scope definition as a spike in the first phase. Engage the card core vendor and internal security team within the first 4 weeks to define what is achievable and document the outcome.

**R3 — PCI DSS scope creep into infrastructure**
*Probability: Medium. Impact: High.*
The Experience API handling, transforming, and caching transaction data brings new infrastructure components into PCI scope. If this is not planned from the start, late-stage infrastructure changes to meet PCI requirements will compress delivery timelines.

Mitigation required: Engage the PCI compliance team and security architecture in the first phase, before infrastructure decisions are made. Define the PCI scope boundary explicitly — what is in-scope, what is out of scope, and what compensating controls apply.

**R4 — CDR consent service integration is more complex than assumed**
*Probability: Medium. Impact: High.*
We are assuming a consent management platform exists and that the Experience API will integrate with it. If consent data is not available in a queryable, real-time form, or if consent granularity does not align with the API capability model, enforcement logic will be more complex.

Mitigation required: Validate the consent service interface and data model against the Experience API capability list in the first phase. Identify gaps before design is committed.

**R5 — Admin service account remains in use during transition**
*Probability: High if not actively managed. Impact: High.*
Until the Experience API is live and consumers have migrated, the existing admin service account continues to represent a security exposure. There is a risk this persists throughout the 18-month delivery window.

Mitigation required: Define a timeline for decommissioning the shared service account as part of the security uplift plan. Do not treat this as a post-migration cleanup task.

**R6 — Extension option lost through insufficient progress evidence**
*Probability: Low if managed. Impact: High.*
"Active migration progress" by month 12 is not defined. If we cannot demonstrate this to the vendor's satisfaction, we lose the 6-month safety net.

Mitigation required: Agree the definition of qualifying evidence with the vendor before month 6. Document it formally. Track against it.

**R7 — Caching design violates PCI DSS**
*Probability: Low with correct design. Impact: Critical.*
Any caching layer that inadvertently stores raw PAN, full card numbers, or non-compliant cardholder data creates a PCI DSS violation with regulatory consequences.

Mitigation required: Cache design must be reviewed by the PCI compliance team before implementation. Define a data classification standard for every field the Experience API will handle, and apply it to the cache key and value design explicitly.

---

## Assumptions

The following assumptions are being carried into this discovery. Each needs to be validated or the dependent design decision revisited.

| # | Assumption | Impact if Wrong | Owner to Validate |
|---|---|---|---|
| A1 | A CDR consent management platform exists and is queryable in real-time | Consent enforcement requires additional platform build | Product / Open Banking team |
| A2 | The vendor's new API supports equivalent functionality to the legacy API for all 5 capability areas | Scope change or workaround design required | Vendor engagement / Architecture |
| A3 | The vendor's new API supports service account permission scoping at the operation level | Compensating control design required for least-privilege | Security / Vendor engagement |
| A4 | All 11 consumer teams are reachable and have capacity to participate in migration planning | Migration timeline at risk | Delivery lead / Consumer team leads |
| A5 | "Active migration progress" by month 12 is definable and agreeable with the vendor | Extension option may not be available | Commercial / Vendor relationship lead |
| A6 | Existing consumer teams can accept a breaking change to data models as part of migration | Versioning and translation layer complexity increases | Architecture / Consumer leads |
| A7 | Transaction history caching is required for performance reasons | Caching layer complexity removed if not required | Architecture / Mobile / IB teams |
| A8 | The 6 unclassified integrations are internal teams, not additional external partners | Additional consent enforcement scope | Integration audit |

---

## Open Questions

These are blockers or significant decision points that require resolution before detailed design can proceed.

**On the vendor migration:**
- What does the vendor's new API look like? Has it been reviewed against all five capability areas?
- What is the vendor's definition of "active migration progress" for the extension clause?
- Is there a sandbox environment available for the new API, and when?

**On security and least privilege:**
- What permissions does the card core system actually support at the API level?
- What does the new vendor API's authentication model look like (OAuth scopes, API keys, mTLS)?
- Who owns the decision on compensating controls if granular permissions are not available in the vendor API?

**On PCI DSS:**
- Has the PCI compliance team been engaged on this initiative? If not, this is urgent.
- What is the current PCI scope boundary? Is any existing infrastructure already in scope?
- What are the specific caching and logging restrictions that apply to transaction history?
- What logging is permissible for transaction data at the Experience API layer for observability purposes?

**On CDR consent:**
- What is the consent service's interface? REST? Event-based?
- What granularity does consent exist at — per customer, per partner, per data type, or per operation?
- What is the behaviour if consent cannot be verified in real-time (latency, outage)?
- Who is responsible for consent revocation propagation to the Experience API?

**On consumers:**
- Who owns the complete list of 11 integrations? Is there a formal integration registry?
- Are there any consumer teams that cannot migrate within 18 months due to their own delivery constraints?
- Do the two external fintech partners have contractual SLAs that affect the Experience API's uptime or versioning obligations?

**On the programme:**
- Who is the single accountable owner for the aggregate migration programme (not just the Experience API build)?
- What is the governance model for accepting consumers onto the Experience API and signing off their decommission of the legacy integration?

---

## Proposed Phases

This is a recommended phasing approach based on current understanding. It will be refined once open questions are resolved and consumer discovery is complete.

### Phase 0 — Foundation (Months 1–2)

Resolve the blockers that prevent architecture from being committed. Nothing in this phase produces production software, but without it, later phases carry unacceptable design risk.

- Complete consumer integration audit: classify all 11 integrations by type, auth pattern, data model, and migration readiness
- Vendor engagement: review new API capability coverage, agree "active migration progress" definition, obtain sandbox access
- Security spike: define least-privilege permission model for card core access; document what is achievable and what requires compensating controls
- PCI engagement: define PCI scope boundary for the Experience API and its infrastructure; identify logging, caching, and key management requirements
- Consent service validation: confirm interface, granularity, and real-time availability against the Experience API capability model
- Produce Architecture Decision Records (ADRs) for: caching strategy, authentication model, consent enforcement pattern, versioning strategy

**Exit criteria:** All critical open questions answered or risk-accepted with documented mitigations. Architecture committed. Programme governance in place.

### Phase 1 — Core API Build (Months 2–8)

Build and test the Experience API against the vendor's new API. Prioritise the highest-risk capabilities first.

- Infrastructure provisioning within PCI scope boundary
- Authentication and authorisation layer (internal consumers first, then external partner pattern)
- Card account summary and transaction history endpoints (highest consumer dependency, PCI-critical path)
- Card controls and dispute initiation endpoints
- Consent enforcement middleware for external partner routes
- Caching layer — PCI-compliant, no raw PAN, reviewed by compliance team before deployment
- Least-privilege service account configuration
- Internal consumer migration — start with lowest-risk integrations to validate migration process

**Exit criteria:** API functional and tested against vendor new API. At least 3 consumers live on the Experience API. This satisfies the month-12 progress evidence requirement with margin.

### Phase 2 — Consumer Migration (Months 6–16)

Migrate all remaining consumers. Overlap with Phase 1 to avoid compressing the migration window.

- Structured migration programme for all remaining internal consumers
- External partner migration — requires consent enforcement to be live and tested
- Legacy integration decommission per consumer as each migration completes
- Monitor for month-12 evidence milestone

**Exit criteria:** All 11 consumers live on Experience API. Legacy integrations decommissioned. Month-12 evidence submitted to vendor.

### Phase 3 — Stabilise and Decommission (Months 16–18)

- Shared admin service account decommissioned
- Legacy API usage confirmed at zero
- Observability and alerting baseline established for the Experience API in steady state
- Post-migration documentation and runbooks complete

**Exit criteria:** Legacy API not called by any system. Experience API operating in steady state. PCI audit evidence package prepared.

---

## What We Need to Proceed

The following decisions and inputs are required before detailed design work begins.

| Item | Type | Required By | Owner |
|---|---|---|---|
| Complete integration inventory (all 11) | Information | End of week 2 | Integration/Platform team |
| Vendor new API documentation and sandbox access | External dependency | End of month 1 | Vendor relationship lead |
| PCI compliance team engagement confirmed | Decision | Immediately | CISO / Compliance |
| Consent service interface documentation | Information | End of month 1 | Open Banking / Platform |
| Programme governance model agreed | Decision | End of month 1 | Delivery lead / Sponsors |
| Security architecture review initiated | Decision | Immediately | Security Architecture |
| Definition of "active migration progress" agreed with vendor | Commercial | End of month 2 | Commercial / Legal |

---

## Recommendations

**Start consumer discovery immediately, in parallel with this report.** The migration timeline risk is a programme coordination problem as much as a technical one. Waiting until the Experience API is built before engaging consumers will compress the migration window to a point where the month-18 deadline becomes unachievable.

**Treat PCI and security as first-class design inputs, not review gates.** Engaging the PCI compliance team and security architecture after design is committed is the most common cause of late-stage rework in this type of programme. They need to be in the room before infrastructure decisions are made.

**Do not plan to use the 6-month extension.** Plan to deliver by month 18 and protect the extension as genuine contingency. Agreeing the evidence definition with the vendor by month 6 is a low-cost action with high option value.

**Define the admin service account decommission plan now.** The security exposure from the shared admin account is live today. Reducing it should not wait for the full migration to complete — partial reduction is possible