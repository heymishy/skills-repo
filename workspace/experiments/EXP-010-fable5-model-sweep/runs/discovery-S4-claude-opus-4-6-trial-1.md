

# Discovery Document: Card Services Experience API Layer

## 1. Problem Statement & Context

### Current State
Our card services platform exposes data to downstream consumers (mobile app, internet banking, contact centre tooling) through **11 active point-to-point integrations** built directly against the card core system. Each integration has divergent data models and authentication patterns, creating a fragile, tightly coupled architecture.

### Trigger
The card core system vendor is **deprecating the legacy API in 18 months** (fixed timeline). Without intervention, 11 teams would each independently migrate their integration — multiplying cost, risk, and coordination overhead.

### Proposed Response
Build an **Experience API layer** that sits in front of the card core system, abstracts the vendor API, and exposes a stable, versioned API consumed by all 11 downstream systems (internal and external).

### Experience API Capabilities in Scope
| Capability | Nature |
|---|---|
| Card account summary | Read |
| Transaction history (90 days) | Read |
| Spend categories | Read |
| Card controls (freeze/unfreeze, limit changes) | Write (state-changing) |
| Dispute initiation | Write (process-initiating) |

---

## 2. What We Know

These are facts established from the brief. Each is referenced in downstream analysis.

| ID | Fact | Source/Basis |
|---|---|---|
| **K-1** | 11 active integrations exist with divergent data models and auth patterns | Stated in brief |
| **K-2** | Vendor API deprecation in 18 months; timeline is fixed | Vendor contract |
| **K-3** | Contractual right to a 6-month extension if active migration progress demonstrated by month 12 | Vendor contract |
| **K-4** | Card transaction data is PCI DSS in scope | Compliance classification |
| **K-5** | Raw PAN cannot be cached; truncated PAN (last 4) is acceptable for caching | PCI DSS requirement |
| **K-6** | Two external fintech partners operate under open banking programme | Stated in brief |
| **K-7** | External partner access is governed by CDR-equivalent data sharing consent (per-data-type customer consent required) | Regulatory/programme requirement |
| **K-8** | Current card core integration uses a shared service account with admin-level access | Stated in brief |
| **K-9** | Experience API will handle, transform, and cache card transaction data | Stated in brief |
| **K-10** | Least-privilege access for each API operation has not yet been defined | Stated in brief |

---

## 3. What We Don't Know (Open Questions)

These are gaps that, if left unresolved, will create risk or block design decisions. Each is tagged with a recommended owner and a consequence of deferral.

### 3.1 Architecture & Design

| ID | Question | Why It Matters | Suggested Owner | Consequence of Deferral |
|---|---|---|---|---|
| **Q-1** | What does the new/replacement vendor API look like? Do we have documentation, sandbox access, or a migration guide from the vendor? | The Experience API's internal integration layer depends entirely on the target API's capabilities, pagination model, error semantics, and rate limits. Without this, the abstraction layer is designed against assumptions. | Platform Engineering + Vendor Relationship Manager | We build the abstraction layer against the *legacy* API and then face a second internal migration. Defeats the purpose. |
| **Q-2** | What is the data model mapping between the 11 existing integrations? Have we catalogued the field-level differences? | We need to understand the superset of data fields consumers actually use to design the canonical Experience API model. If one consumer uses fields the others don't, we need to know before we lock the contract. | Integration/API Design Lead | We either over-expose data (PCI risk) or under-serve consumers (adoption risk). |
| **Q-3** | What are the latency and throughput requirements for each consumer? | A mobile app has very different latency tolerances than a batch-oriented analytics consumer. Caching strategy, rate limiting, and SLA tiers depend on this. | Consumer team leads (all 11) | We design a one-size-fits-all layer that underperforms for latency-sensitive consumers or is over-engineered for batch consumers. |
| **Q-4** | What is the Experience API's target hosting environment and network topology? | PCI DSS scoping (see section 4) depends heavily on where the component runs, what network segment it occupies, and what other systems share that environment. | Infrastructure / Cloud Platform team | PCI audit scope may expand unexpectedly if the API is deployed into an environment not already in the CDE or a properly segmented zone. |
| **Q-5** | Will the Experience API fully replace all 11 integrations, or will some consumers retain direct access during or after migration? | Determines whether we need to run dual-path routing, whether the legacy API's retirement is truly clean, and whether the Experience API becomes the *only* path. | Programme Sponsor / Architecture Review | If some consumers never migrate, we maintain two integration surfaces indefinitely, eroding the business case. |
| **Q-6** | What is the vendor's rate limiting / throttling model on the new API? | If 11 consumers previously hit the vendor API independently, consolidating through a single Experience API concentrates all traffic through one integration point. We may hit rate limits we never encountered before. | Platform Engineering + Vendor | Production outages under consolidated load. Need to understand if we need request queuing, bulkheading, or negotiated higher rate limits. |

### 3.2 Security & Compliance

| ID | Question | Why It Matters | Suggested Owner | Consequence of Deferral |
|---|---|---|---|---|
| **Q-7** | What are the least-privilege permission sets for each of the five API operations against the card core? | K-10 explicitly states this is undefined. We cannot implement least-privilege (a PCI DSS requirement and basic security hygiene) without defining it. The shared admin service account (K-8) is a current vulnerability. | Security Architecture + Card Core Vendor | We either ship with the existing admin service account (security regression / PCI finding) or block on this during build. |
| **Q-8** | Does the card core vendor support granular service accounts or role-based access, or only the current shared admin pattern? | If the vendor doesn't support granular access, least-privilege must be enforced *at the Experience API layer*, not at the backend. This significantly changes the security architecture. | Vendor Relationship Manager + Security | We design for a backend capability that doesn't exist, then discover we need a compensating control late in the programme. |
| **Q-9** | What is the consent management system of record for CDR-equivalent consent? Does it exist today, and does it expose a real-time API? | The Experience API must enforce per-data-type consent checks for external partners (K-7). It needs a runtime integration with a consent store. If this doesn't exist, it's a dependency we must build or procure. | Open Banking Programme Lead | External partner access is either ungoverned (regulatory breach) or blocked entirely (commercial impact). |
| **Q-10** | What is the PCI DSS certification scope today, and has a QSA reviewed the proposed Experience API architecture? | Introducing a new component that handles, transforms, and caches card data (K-9) changes the Cardholder Data Environment (CDE) boundary. This needs QSA input *before* design is finalised, not after. | Compliance / PCI QSA | Post-build QSA review identifies scope issues, forcing re-architecture or compensating controls that delay launch. |
| **Q-11** | What data retention and purging policy applies to cached transaction data in the Experience API? | K-5 addresses PAN specifically, but PCI DSS and CDR have broader data minimisation requirements. Cached transaction data (amounts, merchant names, dates) also has retention implications. | Compliance + Data Governance | Cache grows unbounded or retains data beyond policy limits. Audit finding. |
| **Q-12** | How are external partner API credentials currently managed, and what is the revocation process? | Two external partners (K-6) need distinct auth. If a partner's consent or contract is revoked, we need to terminate access immediately. Current auth patterns are divergent (K-1). | Open Banking Programme Lead + Security | No ability to rapidly revoke partner access in a breach or consent withdrawal scenario. |

### 3.3 Programme & Migration

| ID | Question | Why It Matters | Suggested Owner | Consequence of Deferral |
|---|---|---|---|---|
| **Q-13** | What does "active migration progress" mean to the vendor for the purposes of the 6-month extension (K-3)? | This is our safety valve. If we don't know the vendor's criteria, we can't plan to meet them by month 12. | Vendor Relationship Manager / Legal | We reach month 12, request the extension, and are denied because we can't demonstrate progress in the vendor's terms. |
| **Q-14** | What is each consumer team's capacity and willingness to migrate to the Experience API? Do any have competing priorities in the 18-month window? | Migration requires consumer-side work. The Experience API is useless if consumers don't adopt it. We need 11 teams to re-point their integrations. | Programme Manager + Consumer Team Leads | The API is built but adoption stalls. We hit the vendor deadline with consumers still on the legacy path. |
| **Q-15** | Is there a budget and team allocated for this work, or is this still at business case stage? | Scope, timeline, and risk mitigations are meaningless without confirmed funding and staffing. | Programme Sponsor | Planning proceeds in a vacuum; work starts late or under-resourced. |
| **Q-16** | What is the rollback strategy if the Experience API is not production-ready before the vendor deprecation deadline? | We need a contingency. If the Experience API is delayed, do consumers fall back to direct integration with the *new* vendor API? That recreates the current problem. | Architecture + Programme Sponsor | No contingency plan; a delay becomes a crisis. |

---

## 4. Risks and Tensions Identified

These are not merely open questions — they are structural tensions or risks that emerge from the combination of known facts.

### Risk 1: The PCI Caching Paradox
- **Tension:** The brief states the Experience API will cache card transaction data (K-9) to reduce latency and load on the card core. PCI DSS prohibits caching raw PAN (K-5). However, transaction data includes more than PAN — merchant details, amounts, timestamps, and card metadata all have varying sensitivity levels.
- **Risk:** The caching strategy is under-specified. "Truncate PAN to last 4" is necessary but not sufficient. The cache itself becomes part of the CDE, expanding PCI scope to the caching infrastructure (Redis, database, etc.), its network segment, and its access controls.
- **Mitigation needed:** A field-level data classification of all cached data, QSA review of the caching architecture, and a defined cache TTL and purge mechanism.

### Risk 2: Consent Enforcement as a Runtime Dependency
- **Tension:** External partners (K-6) require per-data-type customer consent (K-7). This means the Experience API cannot simply authenticate the caller — it must, *on every request*, verify that the specific customer has consented to the specific data type being requested by the specific partner.
- **Risk:** This introduces a real-time dependency on a consent management system. If that system is unavailable, external partner API calls either fail (availability impact) or proceed without consent checks (compliance breach). Neither is acceptable.
- **Mitigation needed:** Confirm consent system exists and its availability SLA. Design a consent-check failure mode (fail-closed: deny access if consent cannot be verified). Consider consent caching with short TTL — but this creates its own regulatory question (what if consent is withdrawn between cache refresh?).

### Risk 3: Single Point of Failure / Concentration Risk
- **Tension:** We are deliberately consolidating 11 independent integration paths into one. This solves the consistency and maintenance problem but creates a single point of failure. If the Experience API is unavailable, *all* card services across *all* channels go down simultaneously.
- **Risk:** The blast radius of an outage moves from "one consumer's card feature is degraded" to "all card services across mobile, internet banking, contact centre, and partner channels are down."
- **Mitigation needed:** Resilience requirements (availability target, redundancy, circuit-breaking, graceful degradation). Consumer teams need to understand they are trading independence for a shared dependency.

### Risk 4: Least-Privilege Definition Chicken-and-Egg
- **Tension:** K-10 states least-privilege is undefined. K-8 states the current access is admin-level via a shared service account. The Experience API *should* implement least-privilege, but we cannot define it without understanding the vendor's permission model (Q-8), and we cannot implement it if the vendor doesn't support granular access.
- **Risk:** If the vendor only supports admin-level access, the Experience API becomes a privilege boundary — it connects to the card core with admin rights but must enforce fine-grained access control at its own layer. This is a valid pattern but significantly increases the security responsibility of the Experience API itself. It becomes the *de facto* authorisation layer for all card operations.
- **Mitigation needed:** Vendor capability assessment (Q-8) is a prerequisite. If vendor supports granular accounts, create per-operation service accounts. If not, the Experience API must implement robust operation-level authorisation internally, and this must be included in PCI scope.

### Risk 5: The 18-Month Timeline Is Actually Shorter Than It Appears
- **Tension:** 18 months sounds like the delivery window, but it is not. The actual sequence is: (1) design and build the Experience API, (2) migrate 11 consumers to it, (3) decommission legacy integrations. Consumer migration requires each of the 11 teams to do their own work — schedule, test, deploy. The 6-month extension (K-3) is conditional on demonstrating progress by month 12.
- **Risk:** If we assume 18 months = build time, we will have a built API with no consumers migrated when the legacy API is switched off. A realistic breakdown might be ~8-10 months to build, ~6-8 months for all consumers to migrate with a staggered rollout. This leaves essentially no slack.
- **Mitigation needed:** A phased migration plan with committed dates from each consumer team. Identify 2-3 early adopter consumers for parallel development. Treat month 12 vendor milestone as a hard internal deadline with clear evidence artefacts defined per Q-13.

---

## 5. Recommended Next Steps

Ordered by criticality and sequencing dependency.

| Priority | Action | Resolves | Target Completion |
|---|---|---|---|
| **1** | Obtain and review vendor documentation for the replacement API; secure sandbox access | Q-1 | Week 2 |
| **2** | Confirm programme funding, team allocation, and sponsorship | Q-15 | Week 2 |
| **3** | Clarify vendor's criteria for "active migration progress" at month 12 | Q-13 | Week 3 |
| **4** | Conduct a data model audit across all 11 existing integrations | Q-2 | Week 4-6 |
| **5** | Engage PCI QSA to review the proposed architecture and caching approach | Q-10, Risk 1 | Week 4-6 |
| **6** | Assess vendor's capability for granular/role-based service accounts | Q-8, Risk 4 | Week 4 |
| **7** | Confirm consent management system capability and availability for runtime consent checks | Q-9, Risk 2 | Week 4-6 |
| **8** | Collect latency/throughput requirements and migration capacity from all 11 consumer teams | Q-3, Q-14 | Week 4-6 |
| **9** | Define the least-privilege permission model (dependent on outcomes of #6) | Q-7, K-10 | Week 6-8 |
| **10** | Draft a phased migration plan with consumer team commitments and a rollback/contingency strategy | Q-14, Q-16, Risk 5 | Week 6-8 |

---

## 6. Assumptions to Validate

These are things implicitly assumed in the brief that should be explicitly confirmed before proceeding to design.

| ID | Assumption | Risk if Wrong |
|---|---|---|
| **A-1** | The replacement vendor API supports all five capabilities listed (account summary, transactions, spend categories, card controls, disputes) | If any capability is missing from the new API, we have a feature gap with no vendor-side solution. |
| **A-2** | All 11 consumers can be served by a single canonical API contract (with possible consumer-specific scoping) | If consumer needs are fundamentally incompatible, one Experience API may not be sufficient — we may need multiple API profiles. |
| **A-3** | The Experience API team will own the API long-term (not just build it and hand off) | If there is no long-term ownership model, the API will degrade in the same way the current integrations have. |
| **A-4** | External partners will accept a migration to a new API contract and authentication pattern |