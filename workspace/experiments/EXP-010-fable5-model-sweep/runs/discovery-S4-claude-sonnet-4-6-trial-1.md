# Discovery Report: Card Services Experience API

## Executive Summary

You're building an abstraction layer to consolidate 11 point-to-point integrations before a hard vendor deprecation deadline. The core problem is well-scoped, but the discovery process has surfaced several gaps that carry material delivery and compliance risk. This report maps what is known, what is not yet known, and what needs to be resolved before architecture and delivery planning can proceed confidently.

---

## 1. Problem Space

### What We Know

The immediate forcing function is clear: the card core vendor is deprecating the legacy API in 18 months. Without intervention, 11 teams each face independent migration work against a new vendor API — duplicated effort, inconsistent outcomes, and no guarantee of coordinated timing. The Experience API consolidates that risk surface and creates a single migration dependency rather than eleven.

Beyond the deprecation event, the current state has structural problems that exist independently of the timeline. Eleven integrations with divergent data models and authentication patterns means there is no canonical representation of card data across the organisation. Each consumer team has likely made local assumptions about field names, data types, nullability, and error shapes that have never been formally reconciled. These assumptions are invisible until something breaks or a new consumer needs to be onboarded.

The proposed scope — account summary, transaction history, spend categories, card controls, dispute initiation — covers both read and write operations. That distinction matters significantly for security architecture, consent handling, and rollback design.

### What Is Not Yet Known

**The vendor's new API is the foundation everything else rests on.** How similar or different is the new vendor API to the current one? If the data model is substantially different, the transformation logic inside the Experience API becomes a significant engineering investment in its own right, not a thin abstraction. If the new API introduces new authentication flows, rate limits, or pagination models, those constraints propagate into Experience API design. This needs to be characterised before architecture decisions are locked.

**The 11 existing integrations have not been formally catalogued.** We know there are 11, with different data models and auth patterns, but do we know which consumers use which data fields? Do any consumers rely on quirks or undocumented behaviours of the current API? Are all 11 actively maintained, or are some dormant? Migrating a consumer to the Experience API requires understanding what that consumer actually depends on today.

**Least-privilege access has been identified as a requirement but not defined.** The current shared admin service account is a known risk, but the replacement model has not been specified. This is not a minor gap — it is a prerequisite for security design, and defining it will require engagement with the card core vendor to understand what permission scopes their new API actually supports.

---

## 2. Compliance and Regulatory Surface

This is the highest-risk dimension of the programme and warrants detailed treatment.

### PCI DSS

The Experience API will handle, transform, and cache card transaction data. This places it squarely in PCI DSS scope. Several specific questions arise from the stated requirements.

The caching constraint — raw PAN cannot be cached, truncated PAN is acceptable — is correctly identified, but caching design needs to go further. What is the cache invalidation model for transaction data? Transaction history can change (pending transactions settle, disputes alter balances) so stale cache has functional consequences beyond compliance. What is the acceptable TTL for cached transaction data, and has this been validated against PCI DSS requirements for the specific data elements involved, not just PAN? Who has reviewed and confirmed this? Has a QSA been engaged or is this based on internal interpretation?

The transformation layer that converts vendor API responses into Experience API responses will process full card data in memory. The infrastructure running that transformation is in scope. Is the target hosting environment — cloud, on-premise, hybrid — already PCI DSS assessed, or does deploying the Experience API extend the cardholder data environment into a new boundary that requires assessment? This question should be answered before infrastructure choices are made, not after.

Dispute initiation is a write operation that may require transmitting card identifiers. The data classification of the dispute initiation payload needs explicit review — what fields are required by the card core for dispute initiation, and do any of those fields constitute sensitive authentication data?

**The key open question here is whether a PCI DSS scoping review has been initiated.** If not, it needs to start now. Eighteen months sounds long until compliance assessment, remediation, and sign-off are added to the critical path.

### CDR-Equivalent Consent for External Partners

Two fintech partners access card data under open banking consent arrangements. This introduces requirements that are architecturally distinct from the internal consumer problem.

Consent must be checked before data is returned. That check cannot be advisory — it must be enforced at the API layer, not assumed to have been handled upstream by the partner. The Experience API needs to know, for each request from an external partner, what data types the customer has consented to share, and it needs to be able to enforce that at field or resource granularity.

This implies the Experience API needs a connection to a consent store or consent service. Does that service exist? Who owns it? What is its API contract, its availability SLA, and its latency profile? If the consent service is unavailable, what is the Experience API's behaviour — fail open, fail closed, or serve from cached consent state? Failing open on consent is a regulatory breach. Failing closed may have customer experience and commercial implications for the partner programme.

Consent scope also needs to map to Experience API endpoints. Which of the five proposed capabilities — account summary, transaction history, spend categories, card controls, dispute initiation — require explicit consent for external partners? Are card controls (freeze, limit changes) within the consent scope of the open banking programme at all, or are those internal-consumer-only operations? This mapping has not been done and needs to be, in conjunction with whoever owns the open banking programme legally and commercially.

Consent withdrawal is a scenario that needs explicit handling. If a customer revokes consent mid-session or between API calls, the Experience API needs a mechanism to be notified or to check current consent state. Event-driven notification versus poll-on-request are different architectural patterns with different latency and complexity profiles.

**The open question is whether there is an existing consent enforcement service, or whether that is also in scope for this programme to build or procure.**

---

## 3. Timeline and Delivery Risk

### The 18-Month Structure

The fixed deprecation is month 18. The contractual extension right to 24 months requires demonstrating active migration progress by month 12. This means the real planning horizon has two gates, not one.

To claim the extension at month 12, there needs to be something demonstrable. A deployed Experience API serving at least some production traffic from at least some migrated consumers would be a credible demonstration. This means the Experience API needs to be in production, and at least some consumer migrations need to be complete, within 12 months — not 18.

Working backward from month 12 for a meaningful production deployment, assuming reasonable lead times for compliance review, security assessment, consumer onboarding, and testing, the effective build window for the Experience API core is closer to 7 or 8 months. That is achievable but not comfortable, and it assumes the open questions identified in this report are resolved quickly.

The 6-month extension should be treated as a contingency, not a planning assumption. If the programme plans to month 18 and slips, there is no buffer. If it plans to month 12 with extension as contingency, there is a managed fallback.

### Dependencies That Are Not Owned by This Programme

The vendor's new API availability for development and testing is a dependency. When will a sandbox environment be available? Has this been confirmed contractually? If the Experience API cannot be built and tested against the new vendor API until month 10, the timeline collapses regardless of internal execution quality.

Consumer team availability and commitment is another dependency. Migrating 11 consumers to the Experience API requires those teams to do work. They have their own roadmaps and priorities. Has there been any engagement with consumer teams to understand their capacity and willingness to migrate on this timeline? A technically complete Experience API that no consumers have migrated to does not solve the deprecation problem.

The two external fintech partners are a specific concern here. Their migration timelines may be governed by their own regulatory and contractual obligations. They cannot simply be told to migrate by a given date in the same way an internal team can. What notice periods, contractual obligations, or partner management processes apply?

### What the Timeline Risk Register Should Include

The following items represent timeline risks that are not yet mitigated:

The vendor sandbox availability date is unknown. If it is delayed, the build timeline compresses with no slack to absorb it.

The PCI DSS assessment timeline is unknown. Compliance assessments have their own scheduling constraints and cannot be expedited arbitrarily.

The consent service existence and readiness is unknown. If it needs to be built, that is potentially a parallel workstream of significant size.

Least-privilege definition requires vendor engagement. If the vendor's new API does not support granular permission scopes, the least-privilege requirement may require a design workaround that adds complexity.

Consumer team capacity and migration commitment is unconfirmed for all 11 integrations.

---

## 4. Security Architecture Gaps

### The Least-Privilege Problem

The current shared admin service account is a known, named risk. Replacing it with least-privilege access is the right direction. But least-privilege is not a principle that can be implemented without knowing what the vendor's new API actually exposes in terms of permission scopes.

The practical questions are: Does the new vendor API support per-operation permission scopes? If yes, what are they? If no — if the vendor only supports broad access tiers — then least-privilege at the vendor integration layer has a ceiling, and compensating controls elsewhere in the architecture will need to make up the difference.

For internal consumers versus external partners, the permission model may need to be different. External partners under the open banking programme likely should not have access to card controls or dispute initiation — or if they can, that access should require additional authorisation steps. The Experience API's own authorisation model needs to reflect the distinction between consumer types, not just pass through whatever the upstream vendor supports.

### Authentication Patterns for Experience API Consumers

The problem statement notes that the 11 existing integrations have different authentication patterns. The Experience API creates an opportunity to standardise. What authentication and authorisation standard will the Experience API use? OAuth 2.0 with scopes is the natural choice for an API serving both internal and external consumers under a consent framework, but this has not been confirmed.

For external partners specifically, the authentication model needs to align with the open banking programme's existing identity and consent infrastructure, if that infrastructure exists. If it does not exist, this programme is implicitly in scope for building it.

### Secrets and Credential Management

The current shared admin service account implies credentials are managed somewhere — likely a secrets store, possibly not. The Experience API's credential management for its own identity, and for the service account it uses to call the vendor API, needs to be addressed as part of security design. This is operational hygiene but it is also PCI DSS relevant.

---

## 5. Functional Scope Considerations

### The Five Capabilities Are Not Equal in Risk Profile

Account summary and transaction history are read operations. They carry PCI DSS and consent implications but are functionally straightforward from a transaction design perspective.

Spend categories — depending on implementation — may be derived data computed from transaction history. If categories are computed by the Experience API rather than provided by the card core, there is a data processing step that needs to be scoped. Where does the categorisation logic live? Is it the Experience API's responsibility or does the card core provide pre-categorised data in the new API?

Card controls — freeze, unfreeze, limit changes — are write operations with real-world financial consequences. A failed or partially applied freeze has customer harm potential. The failure mode design for these operations needs explicit attention. What happens if the card core call fails after the Experience API has acknowledged the request? Is there a retry model? An idempotency mechanism? This is not exotic engineering but it needs to be designed, not assumed.

Dispute initiation is the highest-stakes operation in scope. It triggers a formal financial process. The error handling, idempotency, and audit logging requirements for dispute initiation are more stringent than for the read operations. Has the card core vendor's dispute initiation API been reviewed? Are there specific data requirements, timing constraints, or confirmation flows that the Experience API needs to implement?

### Versioning Strategy

The problem statement specifies a stable, versioned API. Versioning strategy needs to be defined before the API is built, not added later. What versioning scheme will be used — URI versioning, header versioning, or something else? What is the policy for introducing breaking changes? What is the support lifecycle for a given API version? These questions matter because the consumer teams are making a commitment to migrate to the Experience API — they need to understand what stability guarantees they are getting.

---

## 6. Recommended Next Steps

The following items are blocking or near-blocking for moving into architecture and delivery planning. They are ordered by the degree to which they are blockers for other things.

**Characterise the vendor's new API.** Obtain API documentation, sandbox access timelines, and confirm the data model differences from the current API. Everything else — transformation complexity, least-privilege scope, timeline confidence — depends on this.

**Initiate PCI DSS scoping review.** Engage a QSA or internal compliance team to scope the cardholder data environment boundary for the Experience API. Do not design caching, infrastructure, or data handling in detail until the scope boundary is understood.

**Resolve the consent service question.** Determine whether a consent enforcement service exists, who owns it, what its contract looks like, and whether it can serve the Experience API's needs. If it does not exist, define whether it is in scope for this programme or a separate workstream, and what the dependency handshake looks like.

**Catalogue the 11 existing integrations.** Document each consumer's data dependencies, authentication pattern, and team contact. Identify which consumers are internal versus the two external fintech partners. Flag any consumers with unusual dependencies or known technical debt that would complicate migration.

**Engage consumer teams on migration commitment.** Before delivery planning can be credible, there needs to be at least informal confirmation that the 11 consumer teams understand the timeline and can commit to migration work within it. External partner engagement may need to go through a formal partner management channel.

**Define least-privilege access in collaboration with the vendor.** This requires the vendor's new API documentation as input. Define what scopes or permission tiers are available, map them to the five Experience API capabilities, and identify any gaps that require compensating controls.

**Clarify card controls and dispute initiation scope for external partners.** Determine with the open banking programme owners whether these operations are within scope for external partner access, and what additional authorisation or consent requirements apply if they are.

---

## 7. What This Discovery Has Confirmed

The Experience API is the right architectural response to the deprecation problem. The consolidation rationale is sound — 11 independent migrations carry more risk, more cost, and less consistency than a single well-designed abstraction. The scope of capabilities to expose is reasonable and covers the evident consumer needs.

The compliance requirements — PCI DSS and CDR-equivalent consent — are correctly identified as first-class concerns, not afterthoughts. The constraint on PAN caching is correctly stated.

The timeline has a viable structure if the open questions are resolved promptly. The 12-month extension gate is a useful forcing function for production deployment.

What this discovery has also confirmed is that several decisions that feel like implementation details are actually architectural prerequisites. The consent enforcement model, the vendor's new permission structure, and the PCI DSS scope boundary will each shape the Experience API's design in ways that cannot easily be changed after build has started. Treating them as things to figure out during delivery would be a material programme risk.

---

*This discovery report is intended to inform the decision to proceed to architecture design and delivery planning. It is not a recommendation to pause — the timeline does not allow for an extended discovery phase. It is a recommendation to run the open questions listed above in parallel with early delivery work, and to treat the answers as inputs that may require architecture decisions to be revisited before they are finalised.*