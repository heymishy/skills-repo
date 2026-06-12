Below is a structured **/discovery output** for the proposed **Card Experience API** initiative.

---

# /discovery

## 1) Problem Statement

Today, 11 downstream consumers integrate directly with the card core using inconsistent data models, auth patterns, and coupling to a vendor API that will be deprecated in **18 months**. This creates migration duplication, operational risk, and inconsistent security/compliance controls.

We need to introduce a **stable, versioned Experience API** in front of the card core to:
- decouple consumers from the vendor API,
- standardise data and authentication,
- centralise PCI DSS controls for card data handling,
- enforce partner consent checks for external fintech consumers,
- enable a controlled migration before vendor deprecation.

---

## 2) Desired Outcomes

### Business outcomes
- Avoid 11 separate migration efforts against the vendor replacement API.
- Reduce future vendor-change impact by abstracting the card core.
- Provide a consistent interface for internal and partner consumers.
- Support controlled migration within fixed deprecation timeline.
- Preserve optionality for a **6-month extension** if needed, contingent on visible migration progress by month 12.

### Customer/user outcomes
- Mobile/web/contact-centre users continue to access card features without disruption.
- External partners can access only customer-consented card data types.
- Card controls and dispute initiation remain available through transition.

### Technical outcomes
- One versioned Experience API exposing:
  - card account summary
  - transaction history (90 days)
  - spend categories
  - card controls:
    - freeze/unfreeze
    - limit changes
  - dispute initiation
- Consistent authn/authz model.
- PCI DSS-compliant handling and caching of transaction/card data.
- Least-privilege access to underlying card core operations.

---

## 3) In Scope

### Functional scope
- Build Experience API abstraction layer for card services.
- Map consumer use cases to canonical API/domain model.
- Support the listed capabilities only:
  - account summary
  - 90-day transaction history
  - spend categories
  - freeze/unfreeze
  - limit changes
  - dispute initiation
- Consumer migration from point-to-point integrations to Experience API.
- Versioning strategy for stable consumer contracts.
- Consent enforcement for external partner access to applicable data types.
- Caching approach for performance/compliance.

### Non-functional scope
- Security architecture for PCI DSS in-scope service.
- Least-privilege access model design.
- Auditability, observability, and migration progress reporting.

---

## 4) Out of Scope / Likely Exclusions

Unless explicitly added later:
- Replacing the card core itself.
- Replatforming all consumer applications.
- Broad card servicing beyond listed operations.
- Historical transaction access beyond 90 days.
- Full dispute lifecycle management after initiation.
- Enterprise-wide consent platform redesign.
- Tokenisation platform replacement.
- PAN vault redesign.

---

## 5) Current State Summary

- 11 active point-to-point integrations.
- Each consumer has its own:
  - data model
  - auth pattern
  - coupling to current vendor legacy API
- Shared service account with **admin-level access** used today.
- No defined least-privilege model per operation.
- Some consumers are external fintech partners subject to consent controls.
- Legacy vendor API deprecated in 18 months.

---

## 6) Target State Summary

A single **Experience API** acts as the standard integration channel for all consumers:
- internal consumers (mobile, internet banking, contact centre)
- external fintech partners

The Experience API:
- hides vendor API complexity and future changes
- exposes stable, versioned contracts
- applies consistent authentication and authorization
- enforces customer consent for partner access
- handles PCI DSS-compliant transformation and caching
- uses role-/scope-based least-privilege access to card core capabilities
- provides centralised monitoring, throttling, audit, and governance

---

## 7) Key Drivers

- **Vendor deprecation deadline**: fixed 18 months.
- **Cost/effort reduction**: avoid 11 independent migrations.
- **Security uplift**: remove admin-level shared account dependency.
- **Compliance uplift**: PCI DSS and customer consent enforcement.
- **Consumer consistency**: stable API and canonical model.
- **Partner enablement**: governed external access.

---

## 8) Constraints

- Vendor deprecation in **18 months** is fixed.
- Extension up to **6 months** only if active migration progress can be demonstrated by **month 12**.
- PCI DSS constraints:
  - raw PAN cannot be cached
  - truncated PAN (last 4) is acceptable
- Consent must be enforced for external partner access by data type.
- Existing consumers have heterogeneous integration patterns.
- Least-privilege model is not yet defined.

---

## 9) Assumptions to Validate

- The replacement vendor API can support all required operations.
- The Experience API can be introduced without materially changing downstream UX.
- Existing consent infrastructure can provide real-time or near-real-time decisions for partner calls.
- Spend categories can be sourced from vendor/core or derived externally.
- Cache contents can be structured to exclude raw PAN while still meeting performance needs.
- Internal consumers may not require the same consent checks as external partners.
- Contact centre workflows can tolerate API contract changes if abstracted appropriately.
- The organisation can obtain PCI DSS approval/assessment for the new in-scope layer.
- The vendor supports service principals/scoped credentials enabling least privilege.

---

## 10) Stakeholders

### Primary stakeholders
- Card platform / card services product owner
- Enterprise/API platform team
- Security / IAM team
- PCI DSS compliance / risk
- Legal / privacy / open banking or CDR-equivalent compliance
- Consumer application teams:
  - mobile app
  - internet banking
  - contact centre tooling
- External partner management / open banking programme team
- Vendor management / procurement

### Secondary stakeholders
- SRE / operations
- Data governance
- Architecture review board
- Customer support / complaints / disputes operations

---

## 11) Consumers / User Groups

### Internal consumers
- Mobile app
- Internet banking
- Contact centre tools
- Potential future internal servicing channels

### External consumers
- Two fintech partners under open banking programme

### End customers
- Cardholders whose data and controls are exposed through these channels

---

## 12) High-Level Capability Decomposition

### Read capabilities
1. Card account summary
2. Transaction history (90 days)
3. Spend categories

### Write/action capabilities
4. Freeze card
5. Unfreeze card
6. Change card limits
7. Initiate dispute

### Cross-cutting capabilities
8. Authentication
9. Authorization
10. Consent validation
11. Audit logging
12. PCI-compliant data handling
13. Caching
14. API versioning
15. Observability/rate limiting

---

## 13) Compliance and Security Considerations

### PCI DSS
The Experience API is in scope because it will:
- handle card transaction data
- transform card data
- cache transaction data

Implications:
- Strict data minimisation required.
- No raw PAN in cache.
- Truncated PAN only where necessary.
- Need clear retention policy for cached data and logs.
- Need encryption in transit and at rest.
- Strong access controls and audit logging.
- Segmentation and secrets management likely required.

### Consent / CDR-equivalent sharing
For external fintech consumers:
- access must be checked against customer-granted consent
- consent must be granular by data type
- likely applies differently to:
  - account summary
  - transactions
  - spend categories
  - controls
  - disputes

This needs explicit policy definition because not all operations are simple “read data” access. For example:
- Is a partner allowed to freeze/unfreeze?
- Is dispute initiation permitted for partners?
- Are limit changes covered by current consent constructs?

### Identity and access management
Current state is over-privileged:
- shared service account
- admin-level access

Target should support:
- operation-specific permissions
- consumer-specific scopes/roles
- service-to-service auth for internal systems
- partner auth aligned to open banking programme controls
- traceable, non-shared identities

---

## 14) Major Risks

1. **Timeline risk**
   - 18 months may be tight if canonical modelling, security, PCI design, partner consent, and 11 migrations all run sequentially.

2. **Least-privilege definition delay**
   - If underlying vendor permissions are coarse-grained, least-privilege may be difficult or require compensating controls.

3. **Consent model mismatch**
   - Existing consent framework may not map neatly to card operations, especially write actions.

4. **PCI scope expansion**
   - Caching and transformation may increase assessment complexity and delivery overhead.

5. **Canonical model complexity**
   - 11 consumers may rely on subtly different semantics; normalisation may surface hidden incompatibilities.

6. **Performance risk**
   - Transaction history and spend categories may be latency-sensitive; compliance-safe caching may be constrained.

7. **Migration adoption risk**
   - Consumer teams may not prioritise migration without strong governance, threatening the month-12 extension case.

8. **Partner access risk**
   - External access introduces stronger auth, audit, consent, and legal compliance requirements.

9. **Vendor capability risk**
   - Replacement API may not support existing workflows identically.

10. **Operational cutover risk**
   - Freeze/unfreeze, limits, and disputes are customer-impacting operations; migration defects could create high-severity incidents.

---

## 15) Dependencies

- Card core vendor API roadmap and documentation
- IAM/security team for authn/authz and least-privilege design
- Consent management capability for partner decisioning
- PCI DSS/risk/compliance review
- Consumer team migration capacity
- API gateway / platform capabilities
- Logging, monitoring, and audit platforms
- Partner management/legal for external access terms
- Disputes operations process owners

---

## 16) Key Unknowns / Discovery Questions

### Business / product
- Which of the 11 integrations map to which of the listed capabilities?
- Are all 11 consumers required to migrate, or are some decommissioning?
- What are the minimum migration milestones needed by month 12 to qualify for extension?
- What SLAs exist for each consumer/channel?

### Functional
- Exact payloads and variants currently used by each consumer?
- Is spend categorisation sourced from card core, analytics service, or consumer-side logic today?
- What fields are truly required in transaction history?
- Are pending and posted transactions both needed?
- What limit types are in scope for “limit changes”?
- What dispute initiation data is required?

### Consent / legal
- Which operations require explicit customer consent for external partners?
- Is consent data-type based only, or also action-based?
- What is the source of truth for consent?
- What should happen if consent is revoked mid-session?
- Are internal channels exempt from consent checks?

### Security / IAM
- What permission granularity can the vendor support?
- Can separate credentials be provisioned per operation/environment?
- What auth mechanism should be used for internal consumers vs partners?
- What claims/scopes are needed per endpoint?

### PCI / data handling
- What exact transaction fields are PCI-sensitive in this context?
- Can transaction descriptions include PAN-like data from merchants?
- What cache TTLs are permitted?
- What data can be logged safely?
- What redaction standards apply to observability tooling?

### Architecture
- What caching is actually needed to meet latency/availability objectives?
- Is the API synchronous only, or are async patterns needed for disputes/limits?
- How will API versioning be governed?
- How will consumer-specific views be handled without reintroducing channel-specific APIs?

### Migration
- Which consumers should migrate first?
- Will Experience API support both old and new vendor APIs during transition?
- Is dual-running required?
- What test environments and certification processes are needed for partners?

---

## 17) Initial Requirements View

### Functional requirements
- Provide a canonical API for listed card services.
- Support 90-day transaction retrieval.
- Expose spend categories.
- Support card control actions and dispute initiation.
- Validate external partner access against customer consent.
- Return stable, versioned responses independent of vendor API shape.

### Non-functional requirements
- PCI DSS-compliant data handling and storage/caching.
- High availability for customer-facing channels.
- Strong auditability for reads and writes.
- Low-latency reads, especially account summary and transactions.
- Backward-compatible API evolution.
- Secure service-to-service and partner authentication.
- Fine-grained authorization model.

### Operational requirements
- Migration tracking across all 11 consumers.
- Usage analytics by consumer and endpoint.
- Error observability and traceability to vendor dependencies.
- Feature flags or rollout controls for phased migration.

---

## 18) Candidate Architecture Characteristics

Not a final design, but likely characteristics:
- API gateway in front of Experience API
- canonical domain model
- adapter/facade to vendor card core APIs
- policy enforcement layer for:
  - authn/authz
  - consent
  - rate limiting
- cache layer with PCI-safe data shaping
- audit/event logging for sensitive reads/writes
- versioning strategy:
  - URI or header-based
- consumer onboarding standards and SDK/docs if needed

---

## 19) Delivery Approach Considerations

### Suggested migration pattern
- Build Experience API around highest-value common capabilities first.
- Onboard internal consumers first to prove model and migration path.
- Prioritise enough migrations by month 12 to demonstrate “active progress” for extension eligibility.
- Introduce partner access only once consent and audit controls are proven.

### Potential sequencing
1. Discovery and consumer capability mapping
2. Canonical model definition
3. Security/PCI/consent architecture
4. MVP read APIs
5. Internal consumer migration
6. Write operations
7. External partner onboarding
8. Legacy integration decommissioning

---

## 20) Likely Epics

1. **Consumer and integration discovery**
2. **Canonical card domain model**
3. **Experience API platform foundation**
4. **Authentication and authorization**
5. **Consent enforcement for partners**
6. **PCI-compliant data handling and caching**
7. **Account summary API**
8. **Transaction history API**
9. **Spend categories API**
10. **Card controls API**
11. **Dispute initiation API**
12. **Observability, audit, and reporting**
13. **Consumer migration wave 1**
14. **Consumer migration wave 2**
15. **Partner onboarding**
16. **Legacy integration decommissioning**

---

## 21) Decisions Needed Soon

1. Is the Experience API the mandatory front door for all card consumers going forward?
2. What is the canonical API versioning strategy?
3. Which consumers are in wave 1?
4. What counts as sufficient migration progress for extension negotiation?
5. What is the consent policy by endpoint/data type/action?
6. What minimum least-privilege model is acceptable if vendor permissions are coarse?
7. What caching strategy is permitted under PCI DSS constraints?
8. Are partner write actions allowed at all?
9. Do we support coexistence with old integrations during transition, and for how long?

---

## 22) Recommended Immediate Next Steps

### First 4–6 weeks
- Inventory all 11 integrations:
  - endpoints used
  - auth methods
  - data fields
  - traffic volumes
  - SLAs
  - business criticality
- Define consumer-by-capability matrix.
- Run security/IAM workshop to define target authn/authz model.
- Run compliance workshop on:
  - PCI scope
  - permitted caching
  - log redaction
  - retention
- Run consent/legal workshop for partner access rules by endpoint/action.
- Validate vendor replacement API capability and permission granularity.
- Establish migration governance and month-12 extension evidence criteria.

### Near-term deliverables
- Current-state integration map
- Canonical API draft
- Security/compliance decision log
- Migration roadmap with waves
- Risks/dependencies register
- Initial target operating model

---

## 23) Discovery Output Summary

This initiative is not just an API build; it is a **platform abstraction, security uplift, compliance control point, and migration programme**. The major challenge is not only technical abstraction of the vendor API, but aligning:
- 11 existing consumer integrations,
- PCI DSS obligations for card data caching/handling,
- external-partner consent enforcement,
- and a least-privilege access model that does not yet exist.

The fixed 18-month deadline makes **early scoping, governance, and migration planning critical**. The most important discovery focus areas are:
1. consumer integration inventory,
2. consent policy definition,
3. PCI-compliant caching/data handling,
4. least-privilege design feasibility with the vendor,
5. migration wave planning tied to the month-12 extension checkpoint.

If you want, I can next turn this into one of the following:
1. a **discovery backlog / question set**,
2. a **problem statement + scope one-pager**,
3. a **risks/assumptions/dependencies/issues (RADI) log**,
4. a **strawman target architecture**,
5. or a **12–18 month migration roadmap**.