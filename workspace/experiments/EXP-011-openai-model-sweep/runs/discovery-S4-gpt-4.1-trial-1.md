Thank you for providing detailed context! Here is a discovery summary, key issues, and outline of next steps, organized for clarity and further exploration.

---

**Current Situation**  
- **Card core exposes**: Card account summary, transactions, spend categories, card controls, dispute initiation.  
- **11 downstream consumers**: Mobile, web, contact centre, plus 2 external partners via open banking.  
- **Point-to-point integrations**: Each team built its own custom integration and data model.  
- **Varied authentication**: Each integration handles authentication/authorization differently.  
- **Legacy vendor API deprecated**: 18 months until EOL (+6 month extension if clear migration progress).  
- **PCI DSS scope**: Transaction data, some sensitive fields; data handling and caching must be PCI-compliant.  
- **Shared admin service account**: Current integration model does not follow least-privilege.

---

## **Primary Goals**

1. **Unified Experience API**
   - Abstraction over the vendor API: decouples downstream consumers from vendor changes.
   - Standardized, versioned API for consumers — reduces duplicated engineering effort.
   - Faster future migrations (new vendors, features, APIs, etc.).

2. **Security and Compliance**
   - PCI DSS: Ensure data flows, storage, and transformation obey PCI requirements.
   - Fine-grained/least-privilege access: Move from shared admin account to scoped access.
   - Consent: Respect CDR-equivalent consent for external partners.

3. **Smooth Migration/Transition**
   - Minimize disruption for consumer teams
   - Meet the fixed (18 month) migration timeline
   - Optionally qualify for 6-month extension

---

## **Key Questions and Areas to Clarify**

### **1. Experience API Scope/Design**
- What are the canonical data models for each endpoint? (Gather from all point-to-point integrations)
- What non-functionals are required (performance, rate limits, audit, etc.)?
- What authn/z model is desired for internal apps (OAuth2, mTLS, etc.) vs external partners (OpenID, consent tokens)?
- Will the Experience API allow real-time passthrough only, or is any data caching/aggregation needed?

### **2. PCI DSS & Caching**
- What transaction data needs to be cached, where, and for how long?
- What data fields (PAN, CVV etc.) must be strictly protected?
- How will truncated PAN or tokenization be enforced and verified in the caching layer?

### **3. Consent Management / Open Banking**
- What are the requirements for managing and verifying end-user consent tokens for external partners?
- Is there an existing consent management platform, or does this need to be built/extended?

### **4. Migration Planning**
- Inventory of all 11 downstream integrations: what features do they use, code owners, test coverage?
- Are there consumers with custom features not listed in the standard API scope?
- What is the migration path for consumers: will you build parallel runs, feature flags, or hard cutover?

### **5. Vendor API Coverage**
- Does the new vendor API cover all use cases needed (e.g. dispute initiation, spend categories)?
- Are there breaking changes in the vendor data model that must be mapped or resolved?

### **6. Access Control**
- How will least-privilege be defined for each endpoint/action?
- Can the vendor issue multiple API credentials with scoped roles, or is an internal gateway/proxy needed to enforce scoping?

---

## **Risks and Constraints**

- **Migration Scope/Timeline**: Must coordinate and rewrite all consumer integrations on a hard 18–24 month deadline.
- **PCI DSS**: Any noncompliance can delay or threaten service operation.
- **Consent Violations**: Incorrect data sharing can have regulatory/contractual consequences.
- **Resource contention**: Competing priorities among 11 integration teams.

---

## **Next Steps & Recommendations**

1. **Discovery Workshops**
   - Kick off workshops with business, compliance, architecture, and each consumer team.
   - Objective: inventory data flows, features, permission requirements, consent model, vendor API differences, non-functional needs.

2. **Integration Inventory**
   - Document all existing consumer use cases, current data models, authentication flows.
   - Identify “critical path” consumers (highest risk, most volume).

3. **Canonical API Spec**
   - Draft v1 of the Experience API (OpenAPI spec, endpoints, data objects, authN/Z, error models).
   - Map existing vendor API responses to target model; identify gaps.

4. **PCI/Consent Controls**
   - Meet with security and compliance to define caching policies, data retention, tokenization, and consent enforcement patterns.

5. **Access Model Definition**
   - Define least-privilege scopes for each API operation (read-only, write, customer-specific, etc).
   - Review what is enforceable by vendor API, what needs to be layered internally.

6. **Migration/Milestone Plan**
   - Define phased migration milestones (e.g. Experience API MVP, first consumer live, parallel run window, old API turn-off).
   - Develop extension/contingency criteria.

7. **External Partner Path**
   - Define access patterns for fintech partners — ensure CDR/consent compliance and separate threat model review.

---

## **Artifacts to Produce During Discovery**

- Data flow diagrams and integration maps
- Draft canonical data models and OpenAPI spec
- Consent and access control matrices
- PCI DSS compliance plan for caching and storage
- High-level migration project plan

---

**Summary:**  
Your proposed Experience API layer greatly simplifies the technical landscape and reduces duplicated migration effort. The major challenges are designing PCI DSS-compliant data flows/caching, managing user consent for open banking partners, and delivering a stable API with clear least-privilege access — all on a tight timeline. Early, cross-team discovery and documentation will greatly de-risk the program and enable you to demonstrate migration progress for any extension request.

---

If you need help with any specific artifact (integration inventory, sample API spec, PCI data flow), let me know!