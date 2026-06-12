## /discovery — Pipeline Output (Discovery Findings)

### 1) Problem statement (what’s changing and why)
- **Current state:** 11 consumer teams integrate point-to-point directly with the card core system, with **different data models and authentication patterns**.
- **Upcoming change:** Vendor deprecates the **legacy card API** in **18 months** (fixed).
- **Target state:** Build an **Experience API** layer in front of the card core that:
  - abstracts vendor API differences,
  - provides a **stable, versioned** API for all internal consumers + approved partners,
  - centralizes **transformation, caching, and PCI controls**,
  - reduces duplicated migration effort (single migration rather than 11).

---

### 2) Target Experience API capabilities (MVP scope)
The Experience API must expose:

1. **Card account summary**
2. **Transaction history** (last **90 days**)
3. **Spend categories**
4. **Card controls**
   - freeze/unfreeze
   - limit changes
5. **Dispute initiation**

Non-goals (until later): anything beyond these data domains, unless required by consumers.

---

### 3) Key compliance constraint: PCI DSS (transaction data in scope)
**Important requirement:** Experience API handles/transforms/caches card transaction data.

- **Caching rule:**  
  - **Raw PAN cannot be cached**.  
  - **Truncated PAN (last 4 digits)** is acceptable.
- **Implication:** The Experience API must:
  - strictly avoid persisting PAN (full or derived values that allow reconstruction),
  - ensure logs/telemetry never contain PAN,
  - define what identifiers are stored for correlation (e.g., last4 + account/card reference token),
  - implement PCI-oriented retention and encryption controls consistent with PCI DSS and your internal policy.

Deliverable to produce during discovery:
- A **data inventory** of fields per endpoint and a **“store vs compute” decision** for each field.

---

### 4) Partner access and consent (CDR-equivalent)
- **There are external partners** (two fintech companies).
- Access to card data is governed by **customer consent per data type** (CDR-equivalent):
  - partner can access *only* if the user granted consent for that specific data category.
- Experience API must support:
  - **consent-aware authorization** (per partner and per data domain),
  - consistent enforcement across:
    - account summary
    - transactions (90 days)
    - spend categories
    - controls
    - dispute initiation (likely different: may be allowed based on consent/permissions depending on your program rules)

Open question to resolve:
- For **card controls and dispute initiation**, are these governed by consent in the same way as data read? Or are they governed by partner trust/role/eligibility rules?

Deliverable:
- A **consent matrix** mapping: partner ↔ data types ↔ allowed operations ↔ proof model.

---

### 5) Least-privilege integration requirements (current risk)
- Current integration uses a **shared service account with admin-level access**.
- Experience API needs **least-privilege**, but:
  - the team hasn’t defined least-privilege per API operation yet.
- Vendor likely supports granular permissions/scopes or separate service accounts per function.

Deliverables to define:
1. **Operation → required vendor permissions**
2. **Minimum service accounts** required (possibly multiple accounts for read vs write vs disputes)
3. **Isolation of concerns**:
   - read endpoints should not need freeze/limit permissions
   - dispute initiation shouldn’t need direct transaction read unless required
4. **Auditing**: ensure every call is attributable to consumer/partner and endpoint.

---

### 6) Migration & contractual extension strategy (18 months + up to +6)
- Vendor deprecation: **18 months**
- Contractual right: extension up to **6 months** if you can show **active migration progress by month 12**.

Discovery outputs needed:
- A migration plan that produces measurable evidence by month 12, such as:
  - integration(s) onboarded to Experience API,
  - percent of traffic moved,
  - number of consumers migrated,
  - successful end-to-end tests in production,
  - performance and compliance certifications completed.

Key decision:
- Define “active migration progress” metrics with the vendor or contract terms (not provided yet).

---

## 7) Proposed phased discovery work products (to unblock delivery)

### A. API & data inventory (PCI-safe)
For each Experience API endpoint, list:
- source fields from vendor,
- transformation rules,
- which fields are stored vs computed on request,
- whether any PAN or sensitive identifiers appear in:
  - DB
  - cache
  - logs
  - analytics/telemetry
  - error payloads

### B. Caching compliance design
Define:
- caching key strategy using non-sensitive identifiers (e.g., last4 + tokenized card/account id),
- retention window aligned to PCI data retention limits,
- cache invalidation rules:
  - transaction history freshness (e.g., near-real-time constraints)
  - spend category freshness
- encryption at rest for whatever is stored (even if non-PAN).

### C. Authorization model (internal + partners)
Define:
- identity for internal consumers (authn mechanism)
- identity for partners (separate authn + mapping to consent)
- consent enforcement points per endpoint
- how to handle partial consent (e.g., partner may have transactions but not spend categories)

### D. Least-privilege mapping to vendor operations
Produce:
- a mapping from Experience API operations → vendor API calls → vendor permissions/scopes
- required service account(s) and roles
- audit trail requirements

### E. Migration plan / evidence plan for month 12
Produce:
- a rollout plan (consumer onboarding sequence)
- “success criteria” for each onboarded integration
- measurable milestones by month 12 to support the extension

---

## 8) Open questions / items to confirm (must answer early)
1. **Vendor API access model:** does the vendor support scoped permissions / multiple credentials / separate endpoints for read vs write?
2. **PCI details:** what exactly is the retention limit policy you must follow for cached transaction-derived data? (Not just PAN—also metadata.)
3. **Consent granularity:** is consent required for:
   - viewing spend categories?
   - initiating disputes?
   - requesting card freezes/limit changes?
4. **Latency expectations:** how “fresh” must transaction history be vs caching windows?
5. **Operational needs:** do you require an experience API “customer context” (user identity) passed in for every call, or can it be derived from auth tokens?
6. **Versioning strategy:** how many Experience API versions do you expect in the first 2 years, and what backward compatibility guarantees are needed?
7. **Consumer onboarding order:** which integrations are most urgent to migrate (or have highest traffic)?

---

If you want, I can turn this into a concrete checklist format your pipeline can output (e.g., **Workstream: PCI, Workstream: Consent/Authorization, Workstream: Least-Privilege, Workstream: Migration Plan**, each with owners and artifacts).