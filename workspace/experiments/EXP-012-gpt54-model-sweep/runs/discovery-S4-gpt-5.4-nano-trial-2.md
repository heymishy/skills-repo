## /discovery — Outputs (Experience API initiative)

### 1) Current-state assessment
- **What exists:** 11 point-to-point integrations from consumer teams into the card core vendor (mobile, internet banking, contact centre tools, plus **2 external fintech partners** under an open banking / consent regime).
- **Pain points:**
  - **Data model drift:** each integration maps vendor fields differently → inconsistent semantics for “spend categories”, “available limits”, transaction attributes, etc.
  - **Auth fragmentation:** different auth patterns per consumer (service accounts, token handling, bespoke request signing, etc.).
  - **Upgrade risk:** vendor legacy API deprecation forces 11 migrations on different timelines and with varying quality.
- **Security posture issue (key finding):** current vendor access uses a **shared admin-level service account**, which violates least-privilege principles and will likely fail security reviews for an Experience API intermediary.

### 2) Target-state goals
- Build an **Experience API** in front of the card core:
  - **Abstracts vendor API** and exposes a **stable, versioned** Experience API for all consumers.
  - Provides capabilities:
    1) **Card account summary**
    2) **Transaction history (90 days)**
    3) **Spend categories**
    4) **Card controls** (freeze/unfreeze, limit changes)
    5) **Dispute initiation**
  - Enables **controlled access** for external partners using **consent per data type** (CDR-equivalent consent).

### 3) Constraints & non-functional requirements
- **Vendor timeline:** fixed deprecation in **18 months**, with potential **+6 month extension** if active migration progress is shown by **month 12**.
- **PCI DSS scope:** card transaction data is **in scope**.
  - Experience API must handle, transform, and cache transactions.
  - **Caching constraint:** raw PAN cannot be cached.
  - **Allowed:** cache **truncated PAN (last 4 digits)**.
  - Ensure transformation/cache design prevents storing full PAN or sensitive authentication data.
- **Least-privilege access requirement:** Experience API should not use an admin-level shared account; least privilege must be defined per operation.

---

## Key discovery questions (to confirm before design)
1) **PCI architecture boundaries**
   - Do we currently tokenize PAN or do we ever receive full PAN from the vendor API?
   - What exact transaction fields are returned today (do they include PAN, expiry, CVV-like data, etc.)?
   - Are there existing PCI environments, encryption standards, and logging redaction requirements we must follow?

2) **Experience API identity model**
   - How are cardholders/consumers identified across mobile/online/contact centre/partners? (customer ID, household ID, external partner ID)
   - How do we map from a consumer request to the correct card accounts at the core?

3) **Consent enforcement model for partners**
   - What is the canonical consent store (source system, consent IDs, scopes)?
   - How are consents expressed: by product type (cards), by data type (transactions vs categories vs controls/disputes), and by time window?
   - Are partner access tokens already consent-scoped, or do we need runtime enforcement?

4) **Operational requirements**
   - Expected peak QPS and SLA/SLO for:
     - transaction history retrieval
     - category views
     - card controls (should be near-real time)
   - Rate limiting needs by consumer and by partner.

5) **Data freshness**
   - Is 90-day history required to be “eventually consistent”, or is real-time/near-real-time required for recent transactions?

6) **Dispute initiation workflow**
   - Does the vendor support dispute initiation synchronously with an ID returned?
   - What data is required (transaction id, amount, merchant info, timestamps), and does it include sensitive data?

---

## 4) Proposed domain model for Experience API (high-level)
Even before detailed endpoints, the API should standardize around stable concepts:

- **CardAccountSummary**
  - balances/available limit, current status (frozen/unfrozen), expiry (if allowed), product metadata.
- **Transaction**
  - transaction id, posted date, amount, currency, merchant descriptor, normalized categories, status (pending/posted), and **reference links** to support disputes.
  - **PAN handling:** store only last-4 (or a vendor-provided non-sensitive identifier). Avoid caching full PAN.
- **SpendCategorySummary / SpendCategory**
  - category name/id, totals by period, mapping to transactions.
- **CardControls**
  - Freeze/unfreeze state, limit change request/response, audit metadata.
- **Disputes**
  - dispute create request (with transaction reference), confirmation + tracking id.

---

## 5) Security & access model (what least-privilege should cover)
### 5.1 Least-privilege for Experience API operations (definition needed)
We need to map each Experience API function to the minimal vendor permissions required. Typical least-privilege approach:

- **Read-only permissions** for:
  - account summary
  - transaction history (for a given account/card)
  - spend categories
- **Write permissions** for:
  - card freeze/unfreeze
  - limit changes
  - dispute initiation
- **No permission** for anything not required (e.g., admin actions, bulk exports, cardholder identity management, or any access to full PAN fields).

### 5.2 Service account strategy
Preferred approach (to be decided with security + vendor):
- Use **separate credentials** (or separate roles) for:
  - read operations
  - write operations  
- Avoid shared admin accounts.
- If vendor supports scoped OAuth/client roles, configure per scope; otherwise use separate service accounts with constrained roles.

### 5.3 Logging, masking, and PCI-safe observability
- Ensure logs never contain full PAN or sensitive auth data.
- If vendor returns PAN, strip/mask immediately in the PCI boundary.
- Cache keys should use **last-4** and card/account identifiers that are PCI-safe.

---

## 6) PCI-compliant caching and data handling (design principles)
- **Cache only what is needed** for performance and transformation.
- **Do not cache raw PAN.** Only store:
  - last 4 digits (if required for downstream correlation)
  - non-sensitive card/account reference IDs
  - transaction metadata required to render history (within 90 days)
- **Retention window:** align cache TTL to **90 days** (or stricter if policy requires).
- **Segmentation:** transaction-cache should live in a PCI-controlled environment with restricted access.
- **Tokenization (if applicable):** if the system already uses token vaulting, consider caching token references rather than PAN-derived identifiers.

---

## 7) Consent enforcement for external partners (CDR-equivalent)
Discovery conclusions:
- Consent must be enforced **per data type**, not just “cards overall”.
- Experience API must check consent before returning:
  - transaction history
  - spend categories  
  (and potentially account summary—confirm your policy)
- For operations that are customer-initiated but can be partner-initiated:
  - **card controls**: should only be allowed if consent and authentication allow partner to act (often controls are tightly restricted)
  - **dispute initiation**: same—confirm whether partner can initiate and what consent scope is required

Implementation pattern to confirm:
- Partner requests arrive with an access token that includes:
  - partner identity
  - customer identity
  - consent scopes (or consent reference)
- Experience API validates consent scopes *before* hitting the card core (and avoids storing consent data insecurely in logs).

---

## 8) Vendor migration plan alignment to the 18-month timeline
### 8.1 Evidence for month-12 extension
To secure the +6 months, we need measurable migration progress by month 12, e.g.:
- Experience API **MVP in production** with at least one internal consumer + one external partner live.
- **Backlog and cutover completion**:
  - number of endpoints/features parity achieved
  - number of consumers migrated off legacy vendor API
- Demonstrate reduction in reliance on legacy API (e.g., % of traffic through Experience API).

### 8.2 Migration sequencing (recommended)
- Wave 1: **read-only** capabilities (account summary, transaction history, categories)
  - easier to prove correctness + less operational risk than write actions
- Wave 2: write operations (card controls, limit changes)
- Wave 3: dispute initiation integration

---

## 9) Deliverables from discovery (what we should produce next)
1) **Experience API capability map**: each API capability → vendor operations/permissions required.
2) **Least-privilege role matrix**:
   - Experience API operation → vendor permission scope(s) → required service account/role.
3) **PCI data inventory**:
   - fields returned by vendor
   - which must not be cached
   - which can be stored (including truncated PAN handling rules)
   - logging redaction rules.
4) **Consent scope mapping**:
   - which Experience API endpoints require which consent scopes
   - enforcement points (pre-core call vs post).
5) **Initial API contract sketch** (v1):
   - endpoints, request/response schemas, versioning strategy, pagination model for 90-day history.
6) **Migration plan with month-12 milestones**:
   - target consumers per wave
   - definition of “active progress” for extension.

---

## What I need from you to finalize discovery (short list)
1) Vendor legacy vs new API difference summary (even a high-level doc).
2) Exact data elements the vendor returns for transactions (especially whether PAN appears and in what format).
3) Current consent system details for partners (how scopes are represented and validated).
4) Any existing PCI reference architecture constraints (environments, encryption, logging, retention).
5) Target consumers to start with for Wave 1.

If you share those, I can turn this discovery into (a) a concrete endpoint/role matrix and (b) an actionable month-1 to month-12 delivery plan tied to the extension criteria.