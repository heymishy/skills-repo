Thank you for the detailed context. Here is a structured discovery summary of your situation, key challenges, and initial recommendations for a card services platform transition to an Experience API layer.

---

## 1. **Current State**

- **Integration Model:**  
  - 11 downstream consumers (internal & external), each with point-to-point custom integrations to card core.
  - Each integration varies in data model and authentication.
- **Card Core Vendor:**  
  - Current API is being deprecated in 18 months.
- **Data Sensitivity:**  
  - Card transaction data is PCI DSS in scope.
- **Users:**  
  - Internal consumers (mobile app, internet banking, contact centre).
  - External partners (fintechs under open banking).

---

## 2. **Key Problems / Challenges**

**A. Integration Overlap & Complexity**
  - Many redundant, inconsistent integrations.
  - High cost and risk if each team migrates separately.

**B. Compliance & Security**
  - PCI DSS: caching, data minimization, secure transmission.
  - Handling of PAN: raw PAN must not be cached; truncated PAN (last 4 OK).
  - Move off shared admin-level account; principle of least-privilege needs to be defined for new API.

**C. Consent Management (CDR/Open Banking)**
  - External access must be consent-based: API layer must enforce consent per data type and customer.

**D. Timeline & Contractual Constraints**
  - 18 months to migrate, with a potential 6-month extension on proof of substantial progress.

---

## 3. **High-Level Requirements for Experience API**

**A. API Scope**
  - Endpoints: 
    - Card account summary
    - Transaction history (90 days)
    - Spend categories
    - Card controls (freeze/unfreeze, limit changes)
    - Dispute initiation

**B. Security and Compliance**
  - PCI DSS compliant data handling, caching, and auditing.
  - Role-based access or scoped tokens for least-privilege.
  - Segregation of access for external partners.
  - No raw PAN in logs or caches; only truncated PAN permitted.

**C. Consent Enforcement**
  - Dynamic consent checks at API layer for each external partner request.
  - Integration with existing consent management system.

**D. Data Abstraction & Stability**
  - API to abstract fluctuations in upstream vendor API.
  - Should offer stable, versioned interfaces.

---

## 4. **Discovery Questions & Gaps**

**A. Consumer Requirements**
  - What are the precise payload/data needs for each consumer?
  - Which consumers use which features?

**B. Current & Planned Consent Infrastructure**
  - How is consent granted, revoked, and checked today?
  - What is the source of truth for customer consents?

**C. Security Model**
  - What identity/authn/authz frameworks are in place?
  - What least-privilege mapping makes sense for the card core (action x consumer type)?
  - What audit requirements exist for accesses and mutations?

**D. Tech Stack / Environments**
  - What are the preferred technologies for the Experience API (language, cloud/on-prem, etc.)?
  - Do you have/integrate with an API Gateway (for rate limiting, JWT validation, etc.)?

---

## 5. **Initial Recommendations & Next Steps**

**A. Discovery & Analysis**
  - Inventory current integrations: endpoints in use, data models, authentication, volumes.
  - Document external partner consent workflows and relevant legal/operational constraints.
  - Conduct PCI DSS scoping workshop for Experience API & caching needs.

**B. Architecture Strategy**
  - Design Experience API to decouple consumers from vendor-specific changes.
  - Implement role-based or attribute-based access for each API operation.
  - Integrate with a centralized consent management system.

**C. Migration & Timeline Management**
  - Plan for phased onboarding: migrate internal consumers first, then external partners.
  - Set up migration KPIs for 12-month checkpoint (to leverage extension if needed).
  - Run regular stakeholder check-ins to anticipate roadblocks early.

**D. Compliance Controls**
  - Design for auditing and reporting access to card data (esp. external).
  - Build in automated tests for PCI DSS policy enforcement.

---

## 6. **Potential Stakeholders to Involve**

- Internal consumer teams (mobile, web, contact centre)
- Card core vendor contact
- Security/compliance (esp. PCI DSS/infosec)
- Consent/legal/privacy
- Open banking partner teams
- API platform/architecture team

---

Let me know which areas you want to drill into, or if you want a more detailed action plan, sample architecture diagram, or a risk log.