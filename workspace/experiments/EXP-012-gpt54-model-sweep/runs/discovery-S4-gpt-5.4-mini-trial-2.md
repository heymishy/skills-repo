## Discovery summary

You want to replace 11 point-to-point consumer integrations into the card core with a single Experience API layer that:

- abstracts a soon-to-be-deprecated vendor API
- provides stable, versioned APIs for:
  - card account summary
  - 90-day transaction history
  - spend categories
  - card controls: freeze/unfreeze, limit changes
  - dispute initiation
- handles PCI DSS-sensitive transaction data correctly
- supports external partner access under consent controls
- moves off a shared admin service account to least-privilege access
- fits a fixed vendor deprecation window of 18 months, with a possible 6-month extension if migration progress is demonstrated by month 12

## Key discovery findings

### 1) The main architectural driver is integration consolidation
You currently have 11 consumer-specific integrations with inconsistent data models and auth patterns. The Experience API should become the single canonical contract for all consumers, reducing duplication and vendor lock-in.

### 2) PCI DSS constraints materially affect the design
Transaction data is in PCI scope. Important implications:
- raw PAN must not be cached
- truncated PAN last 4 digits may be cached
- any transformation/caching approach must be explicitly designed to avoid retaining prohibited data
- logging, observability, and error handling must also avoid leaking PAN data

### 3) Partner access needs consent-aware authorization
External fintech partners can only access card data if the customer has granted consent for each data type. This means the API must enforce data-type-level authorization, not just user-level authentication.

### 4) Least privilege is currently undefined but mandatory
Your current shared admin service account is incompatible with the target state. The Experience API needs to use purpose-built service identities and granular permissions per operation.

### 5) Timeline is tight but manageable if migration is treated as a program
The 18-month deprecation deadline is fixed, with a 6-month extension only if you can show active progress by month 12. That means:
- migration must start immediately
- the first 12 months should include measurable consumer cutover progress
- the Experience API should be designed to support incremental onboarding

---

## Likely target-state principles

### A. Single canonical API layer
Use the Experience API as the consumer-facing abstraction layer, hiding vendor-specific card core details.

### B. Versioned, stable contracts
Expose versioned endpoints so consumer teams can migrate independently without breaking changes.

### C. Security-by-design
- fine-grained authN/authZ
- consent checks for partners
- no raw PAN caching
- scoped service credentials
- auditability for card controls and disputes

### D. Consumer decoupling
Consumers should integrate to a common API, not directly to the core vendor.

### E. Migration-friendly
Support coexistence during migration, with old integrations phased out progressively.

---

## Recommended discovery decisions to make next

### 1) Define the least-privilege model per operation
You should determine which card core permissions are needed for each API capability:
- account summary: read-only access to masked card/account data
- transaction history: read-only access to transaction data, with PCI-safe handling
- spend categories: read-only access, likely derived from transactions
- card controls: privileged command access, ideally separate credentials from read paths
- dispute initiation: write access, probably highest sensitivity after controls

Recommendation: split service identities by functional domain, not one shared identity.

### 2) Define consent rules per data type for external partners
For each partner-facing API response, map required consent:
- account summary consent
- transaction history consent
- spend categories consent
- card controls consent, if applicable
- dispute initiation consent, if applicable

Recommendation: enforce consent at the Experience API layer before any call to card core.

### 3) Decide caching boundaries
Because you must handle transaction data and cannot cache raw PAN:
- cache only non-sensitive transformed views
- use tokenized or masked representations
- explicitly exclude raw transaction payloads containing PAN from cache
- define TTLs and retention controls aligned to PCI DSS

### 4) Define migration milestones now
To preserve the option of a 6-month extension, track progress by month 12:
- number of consumers migrated
- percentage of traffic on Experience API
- decommissioned direct integrations
- risk burn-down and operational readiness

---

## Key risks

### Security and compliance risks
- accidental caching of raw PAN
- over-broad service account permissions
- missing consent enforcement for partners
- logging sensitive card data

### Delivery risks
- 11 consumer teams migrating at different speeds
- incompatible data models and auth approaches
- unclear ownership across platform, security, and card operations

### Vendor/timeline risks
- core API deprecation may force rushed migration if you miss month 12 progress thresholds
- extension is conditional, so evidence of active migration is essential

---

## Suggested discovery outputs

You’ll likely want the following artifacts from the discovery phase:

1. **Target architecture diagram**
   - consumers
   - Experience API
   - consent service
   - authN/authZ
   - card core
   - cache layers
   - audit/logging

2. **API capability matrix**
   - endpoint
   - consumer types allowed
   - required consent
   - required core permissions
   - sensitivity classification
   - cacheability

3. **Security and compliance controls**
   - PCI handling rules
   - PAN masking/tokenization rules
   - audit requirements
   - service account strategy

4. **Migration plan**
   - onboarding sequence for the 11 integrations
   - milestones through month 12
   - decommission plan for direct integrations

5. **Open questions log**
   - unresolved data ownership
   - consent semantics
   - operational SLAs
   - dispute workflow dependencies

---

## Immediate next steps

1. Inventory all 11 existing integrations:
   - data used
   - auth method
   - transaction volumes
   - consumer type
   - partner/internal classification

2. Classify each API capability by:
   - PCI sensitivity
   - consent requirement
   - write vs read
   - cacheability

3. Define a least-privilege access model:
   - separate read/write service identities
   - separate privilege sets per operation

4. Confirm consent enforcement requirements with legal/compliance:
   - what consent is needed for each data type
   - partner obligations
   - revocation behavior

5. Establish migration KPIs before implementation:
   - traffic migrated
   - consumers onboarded
   - direct integrations retired

If you want, I can turn this into a **formal discovery output** with sections like **problem statement, current state, target state, risks, assumptions, and recommended architecture principles**.