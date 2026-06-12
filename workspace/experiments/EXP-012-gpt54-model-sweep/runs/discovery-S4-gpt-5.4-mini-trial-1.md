## Discovery Summary — Card Experience API

### 1) Problem statement
You have a fragmented integration landscape:
- **11 point-to-point integrations**
- Each consumer uses **different data models and auth patterns**
- A **legacy card core API is being deprecated in 18 months**
- You need a **versioned Experience API** in front of the core to:
  - standardize access
  - reduce duplication
  - manage vendor API abstraction
  - support migration off the legacy API

### 2) Scope of the Experience API
The Experience API will expose:
- **Card account summary**
- **Transaction history (90 days)**
- **Spend categories**
- **Card controls**
  - freeze / unfreeze
  - limit changes
- **Dispute initiation**

### 3) Key constraints and concerns
#### PCI DSS
- **Transaction data is PCI DSS in scope**
- The Experience API will **handle, transform, and cache** card transaction data
- Caching must comply with retention limits:
  - **Raw PAN must not be cached**
  - **Truncated PAN (last 4 digits) is allowed**

#### Consent / partner access
- Two consumer teams are **external fintech partners**
- Their access is governed by **CDR-equivalent consent**
- Requirement: **customer must have granted consent for each data type before partner access**
- This implies **fine-grained authorization by data type**, not just by application/client

#### Vendor deprecation
- Legacy vendor API deprecates in **18 months**
- You have a **6-month extension option** if you can demonstrate active migration progress by **month 12**
- This creates a **hard dependency** on early delivery and measurable migration milestones

#### Security / access model
- Current integration uses a **shared admin-level service account**
- Experience API must implement **least privilege**
- Least privilege is **not yet defined per operation**
- This is a key design gap that must be resolved early

---

## 4) Primary discovery themes

### A. API consolidation and consumer abstraction
The Experience API should become the **single canonical integration layer** for downstream consumers:
- Normalize the card core vendor model into a stable contract
- Provide **versioned endpoints**
- Hide vendor-specific API changes
- Support both internal consumers and external partner consumers

### B. Data sensitivity and PCI controls
Because transaction data is in scope:
- Determine exactly which fields are:
  - permitted in API responses
  - permitted in logs
  - permitted in caches
  - permitted in traces/metrics
- Ensure **PAN handling is minimized**
- Ensure storage, caching, and observability pipelines do not retain prohibited data

### C. Consent enforcement
For partner access:
- Consent must be checked **per customer, per data type**
- Likely required controls:
  - consent registry / consent decision service
  - token claims or entitlement mapping
  - runtime authorization checks before data retrieval
- Need to define what happens when:
  - consent is missing
  - consent is revoked
  - consent scope expires

### D. Least-privilege access model
You will need a **new authorization model** for the Experience API:
- separate service identity from shared admin account
- likely use distinct technical credentials/roles per operation or capability
- define minimum read/write privileges for:
  - account summary read
  - transaction read
  - spend category read
  - freeze/unfreeze write
  - limit change write
  - dispute initiation write

### E. Migration and timeline management
The vendor deadline makes this a **time-critical modernization**
- You need:
  - an implementation sequence
  - migration waves for 11 consumers
  - measurable progress by month 12
  - a fallback plan if some consumers lag

---

## 5) Likely key decisions required
1. **API contract design**
   - resource structure
   - versioning strategy
   - pagination/filtering for 90-day transaction history

2. **AuthN/AuthZ model**
   - internal vs external access paths
   - consent-based authorization for partners
   - service-to-service credentials and least privilege

3. **PCI handling model**
   - what transaction fields are cacheable
   - what is masked/tokenized
   - retention periods
   - logging/observability rules

4. **Caching strategy**
   - what to cache
   - TTLs
   - whether cache is per-customer/per-consent scope
   - invalidation on card control changes

5. **Migration approach**
   - coexistence strategy with current integrations
   - consumer onboarding sequence
   - deprecation plan for point-to-point integrations

6. **Operational model**
   - monitoring
   - auditability
   - incident response
   - consent revocation handling
   - dispute initiation traceability

---

## 6) Main risks identified
- **Timeline risk**: 18 months is fixed; missing month 12 progress could forfeit the 6-month extension
- **Security risk**: shared admin account is incompatible with least privilege
- **Compliance risk**: raw PAN leakage into cache/logs/traces
- **Consent risk**: partner access without per-data-type consent enforcement
- **Migration risk**: 11 consumers may each require different adaptation efforts
- **Design ambiguity**: least privilege and data classification are not yet defined

---

## 7) Discovery outputs to produce next
Recommended next artefacts:
1. **Current-state integration map**
   - all 11 consumers
   - data used
   - auth method
   - call patterns
   - criticality

2. **Target API capability matrix**
   - endpoint list
   - consumer eligibility
   - auth requirements
   - PCI classification
   - caching rules

3. **Consent and authorization model**
   - entitlement rules per data type
   - partner access flow
   - revocation behavior

4. **Least-privilege access design**
   - service accounts / roles
   - permissions per operation
   - secrets and key management approach

5. **PCI data handling standard**
   - masking rules
   - cache retention
   - logging exclusions
   - audit requirements

6. **Migration roadmap**
   - wave plan for 11 integrations
   - month-12 evidence plan for extension
   - decommission milestones

---

## 8) Immediate discovery questions
To continue the /discovery pipeline, the next questions to answer are:

### Consumer landscape
- Who are the 11 consumers?
- Which are internal vs external?
- What data does each consume today?
- Which are business-critical?

### Data scope
- Exactly what fields exist in transaction history?
- Which fields are PCI-sensitive besides PAN?
- Is spend category derived or sourced?

### Consent
- What consent system exists today, if any?
- How is consent represented and checked?
- Does consent apply per API, per dataset, or per field?

### Security
- What identity platform will the Experience API use?
- Can the core vendor support role-based accounts?
- Can we separate read vs write privileges?

### Caching
- What cache technology is proposed?
- What is the required retention window?
- Is encrypted cache mandatory?

### Migration
- Which consumers can move first?
- Are there contract changes needed?
- What progress metrics will satisfy the month-12 extension requirement?

If you want, I can turn this into a **formal discovery template** with sections for stakeholders, assumptions, open questions, risks, and decisions.