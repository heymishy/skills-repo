Below is a structured **/discovery output** for the proposed **Card Services Experience API** initiative.

---

# 1) Problem Summary

Today, 11 downstream consumers integrate directly with the card core using inconsistent models and auth patterns. The card core vendor is deprecating the legacy API in **18 months**, creating a high-risk multi-team migration if handled independently.

The proposed solution is to introduce an **Experience API** that:

- abstracts the card core vendor API,
- provides a **stable, versioned interface** to all consumers,
- centralises security, consent enforcement, and PCI controls,
- reduces duplication across 11 consumers,
- supports migration off the legacy API before vendor deprecation.

This API will expose:

- card account summary
- transaction history (90 days)
- spend categories
- card controls:
  - freeze/unfreeze
  - limit changes
- dispute initiation

Key constraints:

- **PCI DSS scope** applies to transaction/card data handling, transformation, and caching.
- **Raw PAN cannot be cached**; truncated PAN is acceptable.
- Some consumers are **external fintech partners**, and access requires **customer consent by data type** under a CDR-equivalent model.
- Current integration uses a **shared admin service account**; future state requires **least-privilege access**, not yet defined.
- Vendor deprecation timeline is fixed, with a possible **6-month extension** if active migration progress is demonstrated by **month 12**.

---

# 2) Business Outcomes

## Primary outcomes
- Avoid 11 separate vendor migration efforts.
- Decouple consumers from future card core vendor API changes.
- Standardise consumer access patterns, contracts, and security.
- Improve governance for card data access and partner integrations.
- Reduce operational and change risk during migration.

## Secondary outcomes
- Better observability and usage analytics across all card capabilities.
- Faster onboarding for future channels/partners.
- Better control over versioning and backward compatibility.
- Stronger access control model than current shared admin account.

---

# 3) Scope

## In scope
- New Experience API in front of card core.
- Stable, versioned API contract for all consumers.
- Support for all 11 current integrations to migrate onto the new API.
- Functional coverage:
  - card account summary
  - transaction history (90 days)
  - spend categories
  - freeze/unfreeze
  - limit changes
  - dispute initiation
- Authentication and authorisation model for:
  - internal consumers
  - external fintech partners
- Consent enforcement for partner access by data type.
- PCI-compliant transformation and caching controls.
- Migration approach from legacy point-to-point integrations.

## Likely in scope
- Canonical data model for card domain consumption.
- Auditing, monitoring, rate limiting, and error standardisation.
- Token/service identity redesign to replace shared admin account.
- Vendor API abstraction/adaptor layer.

## Out of scope unless stated otherwise
- Replacing the card core system itself.
- Rebuilding downstream channels beyond integration changes.
- Full consent platform redesign if one already exists.
- Historical transaction retrieval beyond 90 days.
- Broader enterprise API platform replacement.

---

# 4) Stakeholders

## Business / product
- Card services product owner
- Digital/mobile banking product team
- Internet banking team
- Contact centre tooling team
- Open banking / partner programme owner
- Risk/compliance
- Operations/service management

## Technology
- Card core integration team
- API platform / integration architecture
- Security / IAM
- PCI / cyber compliance
- Data/privacy architecture
- Consumer application teams (11 current integrations)
- External fintech partner integration contacts
- SRE / platform operations

## External
- Card core vendor
- Fintech partners
- Potential regulator/compliance auditors

---

# 5) Current State Assessment

## Integration pattern
- 11 active point-to-point integrations.
- Each consumer has:
  - its own data model,
  - its own authentication pattern,
  - direct dependency on vendor legacy API.

## Risks in current state
- High duplication and inconsistent business logic.
- Migration complexity multiplied across 11 teams.
- Shared admin service account is a major security and audit weakness.
- No stable abstraction from vendor API evolution.
- Likely inconsistent handling of sensitive card data.
- Consent enforcement for external consumers may be fragmented or absent.

## Current security posture concern
- Shared service account with admin-level access suggests:
  - poor traceability,
  - excessive privilege,
  - weak segregation of duties,
  - difficult auditability,
  - elevated blast radius if compromised.

---

# 6) Target State Vision

A single **Card Experience API** becomes the system-facing integration layer for all consumers.

## Characteristics
- Stable, versioned API contract.
- Canonical card domain model.
- Centralised authN/authZ and consent enforcement.
- PCI-compliant handling of card data.
- No raw PAN cached.
- Controlled caching of allowed data only.
- Unified observability, throttling, auditing, and policy enforcement.
- Vendor API hidden behind an adaptor/anti-corruption layer.

## Benefits
- One migration from vendor API changes instead of 11.
- Consistent customer and partner experience.
- Reduced security risk.
- Better compliance posture.
- Easier future evolution of card capabilities.

---

# 7) Functional Discovery Notes

## 7.1 Card account summary
Questions to validate:
- What fields are required by each of the 11 consumers?
- Does summary include card status, available credit, product type, linked accounts, masked PAN, expiry?
- Are there differences between primary/additional cards?
- Are there partner-specific restrictions on fields exposed?

## 7.2 Transaction history (90 days)
Questions to validate:
- Is 90 days always available from source, or must some data be cached/replicated?
- What are the expected transaction volumes and peak read patterns?
- Are pending and posted transactions both included?
- What transaction enrichment is required?
- How are reversals, chargebacks, and foreign exchange transactions represented?

## 7.3 Spend categories
Questions to validate:
- Are categories sourced from vendor, derived internally, or from MCC mapping?
- Are categories deterministic and auditable?
- Is category data covered by the same consent model as transactions?
- Do consumers require category rollups, per-transaction categories, or both?

## 7.4 Card controls
### Freeze/unfreeze
- Real-time or near-real-time?
- What are the operational safeguards?
- Are there exceptions, e.g. temporary card blocks vs permanent status changes?

### Limit changes
- Which limits: cash withdrawal, purchase, online transactions, contactless?
- Are changes temporary or persistent?
- Approval rules?
- Which channels are permitted to invoke this operation?

## 7.5 Dispute initiation
- Is Experience API only initiating disputes, or also tracking status later?
- What evidence payload is required?
- Is document upload part of scope?
- What SLAs and customer notifications apply?

---

# 8) Non-Functional Requirements to Elicit

## Availability / resilience
- Required uptime for consumer channels?
- Contact centre dependency may imply business-hours criticality; mobile/internet may imply 24/7.
- Degradation strategy if vendor API is unavailable.

## Performance
- Target latency by operation.
- Throughput and burst profiles across all consumers.
- Read/write split.
- Pagination requirements for transaction history.

## Scalability
- Combined load of all 11 consumers plus future partners.
- Need to support growth in partner usage under open banking programme.

## Security
- Strong service-to-service auth for internal consumers.
- Strong partner auth aligned to open banking / delegated consent patterns.
- Fine-grained authorisation by operation and data type.
- Audit trail for all access and state-changing actions.

## Compliance
- PCI DSS controls for storage, transmission, logging, monitoring, and retention.
- Consent enforcement and evidencing for partner access.
- Privacy/data minimisation requirements.

## Operability
- Tracing per consumer.
- Operational dashboards.
- Audit reports for data access and control actions.
- API analytics per version and consumer.

---

# 9) Regulatory / Compliance Considerations

## PCI DSS
This is a major design driver because the Experience API will handle, transform, and cache card transaction data.

### Confirmed constraints
- Raw PAN must not be cached.
- Truncated PAN (last 4 digits) is acceptable.

### Discovery implications
Need to determine:
- Whether raw PAN is ever required in-flight for any operation.
- Whether PAN can be tokenised or excluded completely from downstream contracts.
- Cache retention and eviction policy.
- Whether logs, traces, metrics, and dead-letter queues could inadvertently capture cardholder data.
- Encryption requirements for data in transit and at rest.
- Segmentation and scope minimisation strategies.

### Important architecture implication
Caching is not just a performance decision; it is a **compliance-sensitive capability** and must be designed with:
- field-level data classification,
- cache payload filtering,
- retention controls,
- secure purge capability,
- evidence for auditors.

## Consent / CDR-equivalent obligations
For external fintech partners:
- customer must have granted consent for each data type before access,
- consent likely needs validation at request time,
- consent auditability is required,
- revocation handling must be near-real-time or clearly bounded.

Need to define:
- what counts as a “data type” for consent:
  - account summary?
  - transactions?
  - spend categories?
  - controls?
  - disputes?
- whether action endpoints like freeze/unfreeze and dispute initiation are covered by same or different consent/authorisation framework,
- whether internal channels are exempt from consent but still governed by customer authentication and channel entitlements.

---

# 10) Security Discovery

## Key security gap
Current state uses a **shared admin-level service account**. Future state requires least privilege, but operation-level privileges are undefined.

## Discovery objectives
Define a target access model covering:
- machine identities,
- human-initiated channel calls,
- partner calls,
- card core access permissions,
- support/operations break-glass access.

## Access model dimensions to define
- Which consumers can call which API operations?
- Which operations are read-only vs state-changing?
- Which permissions are required at card core/vendor side?
- Can the Experience API use separate service identities per operation group?
- Is impersonation/on-behalf-of needed for audit?
- What customer context must be propagated?

## Candidate least-privilege decomposition
At minimum, separate privileges for:
- account summary read
- transaction history read
- spend category read
- card control actions
- dispute initiation

Possibly further segmented by:
- internal channel vs external partner
- customer-owned data vs staff-assisted access
- production vs non-production
- read own customer vs broader support access

## Security controls to consider
- OAuth2/OIDC or mTLS for internal and external consumers
- scopes/claims aligned to operation and data type
- consent verification middleware for partner requests
- central policy decision point / authorisation engine
- full audit of state changes
- secrets management and service identity rotation
- removal of shared admin account
- separate vendor credentials with constrained permissions if vendor supports it

---

# 11) Data & Domain Discovery

## Canonical model challenge
There are 11 current integrations with different data models. A core discovery task is defining a canonical Experience API model that is:
- stable for consumers,
- decoupled from vendor specifics,
- expressive enough for all required use cases,
- versionable without frequent breaking changes.

## Important data questions
- What common fields exist across all 11 consumers?
- Which fields are channel-specific and should be optional or excluded?
- Which fields are partner-safe?
- Which fields are PCI-sensitive?
- How is transaction categorisation represented?
- How are errors normalised?

## Data transformation considerations
- Vendor-specific statuses and codes need mapping.
- Transaction and dispute statuses likely need standard enums.
- Need consistent representation for:
  - pending vs posted transactions
  - limits
  - card states
  - merchant descriptors
  - category codes

---

# 12) Caching Discovery

Caching is attractive for performance and reducing card core dependency, but highly constrained.

## Known constraint
- No raw PAN in cache.
- Truncated PAN allowed.

## Discovery questions
- Which endpoints need caching?
  - account summary?
  - transactions?
  - spend categories?
- Is cache required for performance, resilience, or cost reasons?
- What freshness tolerances exist per endpoint?
- Can response payloads be split so PCI-sensitive elements are excluded from cache?
- Are write operations required to invalidate or bypass cache?
- How is retention enforced and evidenced?

## Likely cache strategy principles
- Cache only minimum necessary fields.
- Exclude raw PAN entirely.
- Prefer derived/normalised payloads over raw vendor payloads.
- Use short TTLs aligned to data freshness and PCI retention rules.
- Encrypt cache at rest if persistent.
- Ensure no sensitive data enters logs on cache miss/hit flows.

---

# 13) Migration Discovery

This initiative is as much a migration programme as an API build.

## Migration challenge
11 active integrations must move within 18 months.

## Key timeline constraint
- 18 months fixed deprecation.
- Potential 6-month extension if active migration progress is demonstrated by month 12.

## Discovery implications
Need a migration plan that proves meaningful progress before month 12.

## Migration questions
- Which integrations are most critical/high-volume?
- Which are easiest to migrate first?
- Which consumers can adopt a new auth pattern quickly?
- Which have the biggest data model divergence?
- Are there contractual commitments to partners affecting sequencing?
- Can both old and new integrations run in parallel?

## Likely migration strategy
- Build Experience API MVP around highest-common-value read capabilities first.
- Migrate selected internal consumers early to demonstrate progress.
- Use phased onboarding by capability and consumer.
- Establish clear decommission milestones for direct vendor integrations.

## Suggested milestone framing
- Months 0–3: discovery, target architecture, security model, canonical contract
- Months 3–6: build foundational platform + read APIs
- Months 6–9: onboard first internal consumers
- Months 9–12: onboard several consumers, show measurable migration progress, seek extension if needed
- Months 12–18: complete remaining migrations, harden controls, decommission legacy integrations

---

# 14) Delivery Risks

## High risks
1. **Consent complexity underestimated**
   - Partner access by data type may significantly affect API gateway, auth, and policy design.

2. **Least-privilege model undefined**
   - Could delay implementation if vendor/system permissions are coarse-grained.

3. **PCI scope expansion**
   - Caching, logging, tracing, and transformation may create compliance overhead.

4. **Canonical model disagreement**
   - 11 consumers may have conflicting expectations.

5. **Timeline risk**
   - 18 months may be tight if migration sequencing and partner onboarding are slow.

6. **Vendor constraints**
   - Legacy and new vendor API capabilities, rate limits, and permission granularity may not support desired target design cleanly.

7. **Operational dependency concentration**
   - Introducing a central Experience API creates a new critical dependency for all channels.

## Medium risks
- External partner contract/testing cycles are slower than internal teams.
- Transaction categorisation ownership unclear.
- State-changing operations may need stronger fraud/risk controls.
- Extension rights may depend on vendor’s interpretation of “active migration progress.”

---

# 15) Key Assumptions to Validate

- All 11 consumers can migrate to a common Experience API within programme timeframe.
- Card core vendor supports required operations in replacement APIs.
- Vendor supports enough auth granularity to enable least privilege, or compensating controls are acceptable.
- Consent can be checked reliably at runtime for partner requests.
- 90-day transaction history is available from source or can be served compliantly via controlled caching/storage.
- Truncated PAN satisfies all consumer display needs.
- Internal channels can adopt standardised auth without excessive rework.
- A single canonical model can satisfy all channels with manageable optionality.

---

# 16) Key Unknowns / Open Questions

## Business
- Which consumers are in priority order?
- Are all listed capabilities required at day one?
- What defines success for extension eligibility by month 12?

## Security / compliance
- What exact PCI DSS retention and storage controls apply to cache implementation?
- What is the approved consent source of truth?
- What data types require explicit customer consent?
- Are control actions for partners permitted at all, or read-only access only?

## Technical
- What replacement vendor APIs exist and how do they differ?
- What are vendor rate limits and performance characteristics?
- What are current consumer traffic volumes and peaks?
- What data fields are used today by each integration?
- Can the Experience API maintain statelessness while meeting performance needs?

## Operational
- Who owns API versioning and lifecycle governance?
- Who handles partner support and onboarding?
- What support model is needed for incidents across all channels?

---

# 17) Recommended Discovery Workstreams

## Workstream 1: Consumer and capability mapping
- Catalogue all 11 integrations
- Map fields, operations, auth patterns, usage volumes, and criticality
- Identify common denominators and divergences

## Workstream 2: Vendor API assessment
- Assess replacement APIs
- Confirm capability parity
- Confirm auth models, scopes, limits, SLAs, and migration constraints

## Workstream 3: Security and IAM design
- Define least-privilege matrix by operation
- Design service identity model
- Design partner auth and consent enforcement
- Identify compensating controls where vendor permissions are coarse

## Workstream 4: PCI and data handling design
- Data classification
- Caching strategy
- Logging/tracing restrictions
- Retention and purge controls
- Audit evidence requirements

## Workstream 5: Canonical API/domain design
- Define resource model
- Error model
- Versioning strategy
- Field-level compatibility rules
- Partner-safe vs internal-only contract rules

## Workstream 6: Migration planning
- Prioritisation and wave plan
- Parallel run approach
- Adoption readiness per consumer
- Month-12 progress evidence plan

---

# 18) Initial Recommendations

1. **Treat this as both a platform build and a migration programme**
   - Success depends as much on onboarding and decommissioning as on API implementation.

2. **Prioritise security and consent design early**
   - Least privilege and partner consent are architectural constraints, not later add-ons.

3. **Define a canonical model from consumer needs, not vendor structure**
   - Avoid leaking vendor-specific concepts into the Experience API.

4. **Minimise PCI scope where possible**
   - Exclude raw PAN from contracts, cache, logs, and telemetry unless absolutely necessary.

5. **Use a phased delivery**
   - Read capabilities first, then state-changing operations, unless business priority says otherwise.

6. **Get to “migration progress” before month 12 deliberately**
   - Choose early adopter consumers with high visibility and manageable complexity.

7. **Establish policy-based authorisation**
   - Especially important for partner consent and operation-level entitlements.

8. **Design for auditability from day one**
   - Access to card data and control actions will require strong evidence trails.

---

# 19) Candidate Discovery Artifacts

Recommended outputs from this discovery phase:

- Stakeholder map
- Consumer integration inventory
- Capability-to-consumer matrix
- Current-to-target architecture
- Canonical domain model draft
- API contract draft
- Data classification matrix
- PCI control impact assessment
- Consent enforcement model
- Least-privilege access matrix
- Migration wave plan
- Risks, assumptions, issues, dependencies log
- Month