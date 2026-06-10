

# Discovery Document: Card Services Experience API Layer

## 1. Problem Statement & Context

### Current State
Our card services platform exposes data to downstream consumers (mobile app, internet banking, contact centre tooling) through **11 active point-to-point integrations** built directly against the card core system. Each integration uses slightly different data models and authentication patterns, creating a fragile, duplicated integration landscape.

### Trigger
The card core system vendor is **deprecating the legacy API in 18 months** (fixed deadline, with a contractual right to a 6-month extension contingent on demonstrating active migration progress by month 12). Rather than 11 independent migration efforts, we propose building an **Experience API layer** that abstracts the vendor API and exposes a stable, versioned interface for all consumers.

### Proposed Solution (High-Level)
An Experience API layer that sits in front of the card core system, exposing:
- Card account summary
- Transaction history (90 days)
- Spend categories
- Card controls (freeze/unfreeze, limit changes)
- Dispute initiation

---

## 2. What We Know

These items are sufficiently understood to plan and build against.

### 2.1 Functional Scope
The five API domains are defined: account summary, transaction history, spend categories, card controls, and dispute initiation. These map to capabilities the 11 existing integrations already consume in various forms.

### 2.2 Consumer Landscape
- **Internal consumers:** Mobile app, internet banking, contact centre tooling (and others across the 11 integrations).
- **External consumers:** Two fintech companies operating under the open banking programme.
- All 11 integrations are active and will need to migrate to the Experience API.

### 2.3 PCI DSS Data Handling Constraints
- Card transaction data is **PCI DSS in scope**.
- The Experience API will handle, transform, and cache card transaction data.
- **Raw PAN cannot be cached.** Truncated PAN (last 4 digits) is acceptable for caching.
- Any caching layer and the API itself must operate within PCI DSS compliance boundaries.

### 2.4 External Partner Consent Requirements
- The two fintech partners' access to card data is governed by **CDR-equivalent data sharing consent**.
- The customer must have **granted consent for each data type** before a partner can access it.
- This means the Experience API must enforce consent-based data filtering for external consumers at the data-type level.

### 2.5 Vendor Deprecation Timeline
- **18 months** to deprecation (fixed).
- **6-month extension** available if active migration progress is demonstrated by **month 12**.
- This creates two hard milestones: a month-12 evidence checkpoint and an 18-month cutoff.

### 2.6 Current Access Model (Known Problem)
- The current card core integration uses a **shared service account with admin-level access**.
- This is explicitly identified as needing replacement with **least-privilege access** in the Experience API.

---

## 3. What We Don't Know

These are gaps, ambiguities, and unresolved questions that need investigation before or during build. Each is tagged by impact.

### 3.1 Least-Privilege Access Model — Not Yet Defined
**Impact: Security architecture, card core integration design, timeline**

We know we need least-privilege access. We have not defined what this looks like for each API operation. This is a critical gap because:
- The card core vendor may or may not support fine-grained service accounts or scoped credentials.
- We don't know if the **new vendor API** (the one replacing the deprecated one) has a different access control model.
- Until this is defined, we cannot design the Experience API's backend authentication to the card core.

**What needs to happen:** We need to map each of the five API domains to the minimum card core permissions required, then determine whether the vendor's system supports that granularity. If it doesn't, we need a compensating control strategy.

### 3.2 New Vendor API Specification
**Impact: Core integration design, effort estimation**

The vendor is deprecating the legacy API, which means there is presumably a replacement. We don't have visibility (or haven't stated visibility) into:
- Whether the new API is already available or in development.
- What its data model, authentication, rate limits, and capabilities look like.
- Whether it covers all five domains we need, or whether some operations (e.g., dispute initiation) require a different integration path.

**What needs to happen:** Obtain the new API specification from the vendor. If it's not yet available, establish a timeline for when it will be, because this is a hard dependency.

### 3.3 Consent Enforcement Architecture
**Impact: External partner access, regulatory compliance**

We know consent is required per data type for external partners. We don't know:
- **Where consent records live.** Is there an existing consent management system, or does one need to be built or integrated?
- **What the consent granularity is.** "Each data type" could mean consent per API domain (e.g., "transaction history") or finer (e.g., "spend categories within transaction history").
- **How consent is checked at runtime.** Does the Experience API call a consent service on every request? Is consent embedded in the OAuth token/scope? Is it cached (and if so, what's the invalidation model when a customer revokes consent)?
- **What happens on consent revocation.** Must data already retrieved by the partner be deleted? Is that the Experience API's responsibility or the partner's?

**What needs to happen:** Engage the open banking / CDR compliance team to define the consent model, identify or build the consent store, and define the runtime enforcement mechanism.

### 3.4 Caching Strategy Details
**Impact: Performance, PCI DSS compliance, architecture**

We know raw PAN cannot be cached and truncated PAN is acceptable. We don't know:
- **What other data elements require PCI-sensitive handling** beyond PAN (e.g., CVV, expiry date, full track data — these should never be stored post-authorisation, but the transformation logic needs to be explicit).
- **What caching infrastructure will be used** and whether it's already within our PCI DSS cardholder data environment (CDE), or whether introducing caching extends the CDE boundary.
- **Cache TTLs and invalidation strategy** — particularly for transaction history, which updates frequently, and card controls, which must reflect real-time state.
- **Whether caching is even appropriate for card controls and dispute initiation**, which are state-changing operations (or their read-side equivalents need near-real-time accuracy).

**What needs to happen:** PCI DSS scoping exercise for the Experience API's caching layer. Define which data elements are cached, in what form, with what TTLs, and confirm the CDE boundary implications with the QSA or internal compliance team.

### 3.5 Migration Sequencing for 11 Consumers
**Impact: Delivery planning, risk management, month-12 milestone**

We don't know:
- **The order in which the 11 consumers will migrate.** Some will be higher risk, some will have more complex integrations, some teams may have limited capacity.
- **Whether all 11 consumers need all five API domains**, or whether some only use a subset (which would affect prioritisation of which API domains to build first).
- **What "active migration progress" means to satisfy the month-12 extension criteria.** Is it one consumer migrated? Five? A percentage of traffic?

**What needs to happen:** Map each consumer to the API domains they use. Assess migration complexity per consumer. Define the month-12 milestone criteria explicitly (ideally in writing with the vendor). Build a sequenced migration plan.

### 3.6 API Versioning and Contract Strategy
**Impact: Long-term stability, consumer onboarding**

The stated goal is a "stable, versioned API." We don't know:
- **The versioning strategy** (URL path versioning, header-based, etc.).
- **The backwards compatibility policy** (what constitutes a breaking change, how long old versions are supported).
- **Whether internal and external consumers will use the same API version/contract**, or whether external partners get a restricted surface area by design (beyond consent filtering).

**What needs to happen:** Define the API versioning strategy and the governance model for API changes. This should be resolved before external partners onboard, as it becomes a contractual interface.

### 3.7 Authentication and Authorisation Architecture for Consumers
**Impact: Security, consumer onboarding, external partner integration**

Each of the 11 integrations currently uses "slightly different authentication patterns." We don't know:
- **What the target authentication model is** for the Experience API (OAuth 2.0, mutual TLS, API keys, or a combination).
- **Whether internal and external consumers will use the same authentication mechanism** or different ones.
- **How consumer identity maps to customer identity** — particularly for card controls and dispute initiation, which are customer-specific actions requiring strong authorisation.

**What needs to happen:** Design the authn/authz model for the Experience API, differentiating between internal and external consumers, and define how customer-level authorisation is enforced for sensitive operations.

### 3.8 Non-Functional Requirements
**Impact: Architecture decisions, infrastructure, SLA commitments**

Not stated and needed:
- **Throughput and latency requirements** (what are the current 11 integrations' traffic patterns? what SLAs do consumer teams expect?).
- **Availability target** (the Experience API becomes a single point of dependency for all card data consumers).
- **Rate limiting and throttling** (especially for external partners).
- **Disaster recovery and failover** (if the Experience API is unavailable, is there a fallback, or is all card functionality down?).

**What needs to happen:** Gather current traffic data from existing integrations. Define SLAs for the Experience API. Assess single-point-of-failure risk and define resilience requirements.

### 3.9 Dispute Initiation Complexity
**Impact: API design, integration complexity**

Dispute initiation is qualitatively different from the other four domains. It is:
- A **write operation** with potentially complex business logic (reason codes, supporting documentation, regulatory timeframes).
- Likely subject to **different card core API endpoints** and possibly different backend systems (disputes may route to a separate disputes platform).
- Subject to **regulatory requirements** around acknowledgement timeframes and status tracking.

We don't know whether the scope includes dispute **status tracking** and **resolution**, or only initiation.

**What needs to happen:** Define the full dispute lifecycle scope. Confirm the card core's dispute capabilities via the new API. Identify whether a separate disputes system integration is needed.

---

## 4. Assumptions (Requiring Validation)

| # | Assumption | Risk if Wrong | Suggested Validation |
|---|-----------|---------------|---------------------|
| A1 | The vendor's replacement API covers all five functional domains we need. | May need alternative integration paths or the scope of the Experience API changes. | Obtain and review the new API specification. |
| A2 | The vendor's replacement API is available now (or will be available with enough lead time to build against). | Hard dependency — if delayed, our timeline is at risk. | Confirm API availability and roadmap with the vendor immediately. |
| A3 | The two external fintechs are willing and able to migrate to the Experience API within the 18-month window. | If not, we either maintain legacy integrations or lose partners. | Engage both partners early; assess their migration capacity and willingness. |
| A4 | Our existing PCI DSS CDE can be extended to include the Experience API's caching layer without a full re-assessment. | If a new QSA assessment is triggered, this adds months of timeline and significant cost. | Consult QSA/compliance early to confirm scoping implications. |
| A5 | A consent management capability exists or can be built/procured in time. | Without it, external partner access cannot be lawfully enabled. | Confirm current consent infrastructure status with the open banking team. |
| A6 | "Active migration progress" for the month-12 extension is demonstrable with partial migration (not all 11 consumers). | If the vendor requires full migration, 18 months is a harder deadline. | Get the extension criteria in writing from the vendor. |
| A7 | Consumer teams have capacity to migrate within the planned timeline. | Teams with competing priorities may delay migration, leaving integrations on the deprecated API. | Survey all 11 teams for capacity and constraints. |

---

## 5. Key Risks (Pre-Decision)

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | **New vendor API not ready or not feature-complete** — blocking Experience API development. | Medium | Critical | Engage vendor immediately; establish API access and confirm feature coverage. |
| R2 | **PCI DSS scope expansion** — introducing a caching layer extends the CDE, triggering re-assessment and additional controls. | Medium | High | Early engagement with QSA; architecture review before caching design is finalised. |
| R3 | **Consent model not defined in time** — blocking external partner access and potentially violating CDR obligations. | Medium | High | Prioritise consent architecture as a workstream parallel to API design. |
| R4 | **Month-12 milestone not met** — losing the 6-month extension option. | Medium | High | Define milestone criteria early; sequence delivery to hit the milestone with margin. |
| R5 | **Single point of failure** — all 11 consumers depending on one API layer. | High (by design) | Critical | Define resilience requirements early; consider circuit breakers, fallback strategies, and SLA commitments. |
| R6 | **Consumer migration slower than planned** — teams can't or won't migrate on schedule. | High | High | Start consumer engagement now; build migration tooling and support; consider a parallel-run period. |
| R7 | **Least-privilege model infeasible** — vendor system may not support fine-grained access, leaving a security gap. | Medium | Medium | Investigate vendor access controls early; design compensating controls if needed. |

---

## 6. Recommended Next Steps

These are sequenced by dependency and urgency, not by workstream.

### Immediate (Weeks 1–4)

1. **Obtain the new vendor API specification** and confirm its availability, feature coverage, and access model. This is the single highest-priority action — almost everything else depends on it.

2. **Clarify the month-12 extension criteria with the vendor** in writing. This defines our delivery strategy.

3. **Map each of the 11 consumers to the API domains they use.** This scopes the migration and informs build prioritisation.

4. **Engage the QSA/PCI compliance team** on the caching architecture's CDE scoping implications.

5. **Engage the open banking/CDR compliance team** to define the consent model and identify existing consent infrastructure.

### Short-Term (Weeks 4–8)

6. **Define the least-privilege access model** for each API domain, informed by the new vendor API's access control capabilities.

7. **Design the authentication and authorisation architecture** for the Experience API (internal and external consumers).

8. **Define the API versioning and governance strategy.**

9. **Gather non-functional requirements** (throughput, latency, availability) from consumer teams.

10. **Define the dispute initiation scope** — initiation only, or full lifecycle?

### Medium-Term (Weeks 8–12)

11. **Produce the sequenced migration plan** for all 11 consumers, with the month-12 milestone explicitly targeted.

12. **Begin Experience API build** against the first priority API domain(s).

13. **Engage external fintech partners** on migration timeline and requirements.

---

## 7. Open Questions Register

| # | Question | Owner | Status | Needed By |
|---|---------|-------|--------|-----------|
| Q1 | What does the new vendor API look like? Is it available now? | TBD (vendor relationship owner) | Open | Week 2 |
| Q2 | What constitutes "active migration progress" for the month-12 extension? | TBD (vendor relationship owner) | Open | Week 3 |
| Q3 | Where do consent records live? What is the consent granularity? | TBD (open banking team) | Open | Week 4 |
| Q4 | Does introducing an Experience API caching layer extend our PCI DSS CDE boundary? | TBD (security/compliance) | Open | Week 4 |
| Q5 | What does least-privilege look like for each API operation at the card core level? | TBD (security + vendor) | Open | Week 6 |
| Q6 | What are the throughput, latency, and availability requirements? | TBD (consumer teams) | Open | Week 6 |
| Q7 | Is dispute initiation only, or does it include status tracking and resolution? | TBD (product owner) | Open | Week 6 |
| Q8 | Do all 11 consumers need all five API domains? | TBD (consumer teams) | Open | Week 4 |
| Q9 | What happens to data already retrieved by an external partner when consent is revoked? | TBD (legal/compliance) | Open | Week 6 |
| Q10 | Is there a fallback strategy if the Experience API is unavailable? | TBD (architecture) | Open | Week 8 |