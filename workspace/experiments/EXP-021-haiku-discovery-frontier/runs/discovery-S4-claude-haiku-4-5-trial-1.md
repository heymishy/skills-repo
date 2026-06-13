# /discovery Pipeline Output: Card Services Experience API

## Problem Statement Validation

**Core Challenge:** Consolidate 11 fragmented integrations into a single abstraction layer while managing regulatory complexity (PCI DSS, CDR consent), security hardening (least-privilege), and a fixed vendor deprecation deadline.

**Critical Timeline Constraint:** 18-month deprecation window with potential 6-month extension if migration progress demonstrated by month 12. This creates natural phase gates.

---

## Key Discoveries & Unknowns

### 1. **Regulatory & Compliance Scope**

**What we know:**
- PCI DSS scope applies to transaction data handling
- External partners subject to CDR-equivalent consent requirements
- No raw PAN caching allowed

**Critical unknowns that need investigation:**
- [ ] **Consent architecture:** How is customer consent currently captured, stored, and validated? Single source of truth or replicated across systems?
- [ ] **Consent granularity:** Is consent per-data-type (transactions vs. controls vs. summary) or per-partner per-data-type?
- [ ] **Audit trail requirements:** What does PCI DSS audit logging look like for the transformation/caching layer? Are there specific log retention periods beyond data retention?
- [ ] **Data residency:** Are there geographic/sovereignty constraints on where transaction data can be cached (EU GDPR, UK, APAC)?
- [ ] **Dispute initiation scope:** Does initiating a dispute itself create PCI-regulated data that must be cached/logged?

**Recommendation:** Schedule a regulatory/compliance workshop with InfoSec, PCI DSS assessor, and legal before finalizing API design.

---

### 2. **Authentication & Authorization Model**

**Current state (problematic):**
- Single shared service account with admin-level access
- 11 different auth patterns downstream

**Unknowns:**
- [ ] **Consumer identity:** How are the 11 consumer systems currently identified? IP allowlisting, API keys, mTLS, OAuth clients?
- [ ] **Partner vs. internal split:** Are the two external fintech partners already using different auth from internal teams?
- [ ] **Token lifecycle:** For external partners, do we need short-lived tokens with refresh patterns, or longer-lived API keys?
- [ ] **Card core auth limitations:** What auth methods does the vendor API support? (Critical constraint for least-privilege scope)
- [ ] **Service-to-service vs. user context:** Should the Experience API preserve end-user identity (for audit/consent validation) or operate as a service principal?

**Likely least-privilege principle:** Each consumer should authenticate with their own credential; the Experience API maps that to least-privilege access against the card core (e.g., a mobile app shouldn't need admin-level card control permissions).

**Unknowns blocking design:**
- [ ] What's the minimum permission set needed for each API operation? (Requires: card core capability audit + consumer requirements mapping)
- [ ] Can the card core system support multiple service accounts, or will we need to proxy auth through the Experience API?

---

### 3. **Caching Strategy & PCI Compliance**

**What we know:**
- 90-day transaction history exposed
- Raw PAN cannot be cached; last-4 acceptable
- Must comply with PCI DSS retention limits

**Critical unknowns:**
- [ ] **PCI DSS retention limits:** Standard PCI guidance is "do not retain more than necessary." Is there a defined TTL? (e.g., 90 days, 1 year?)
- [ ] **Refresh vs. static cache:** When a customer requests transaction history, do we cache the full 90-day window and serve from cache, or fetch fresh from card core each time?
- [ ] **Cache invalidation triggers:** When should cached data be purged early? (customer deletion, consent revocation, card cancellation, dispute filed?)
- [ ] **Spend categories data:** Where does this come from? Card core, or enriched/calculated by Experience API? If calculated, is that PCI-regulated?
- [ ] **Encryption requirements:** PCI DSS specifies encryption at rest/in transit. What's the key rotation policy?

**Caching trade-offs to explore:**
| Strategy | Pro | Con |
|----------|-----|-----|
| **Cache all, serve from cache** | Fast, reduced card core load | Requires sophisticated invalidation; higher compliance risk if breach occurs |
| **Cache-aside (on demand)** | Only cache accessed data; simpler invalidation | Higher latency; more card core load; potential performance issues during migration |
| **Write-through (card core source of truth)** | Card core always authoritative | Highest latency; defeats some caching benefits |

---

### 4. **Consumer Consolidation & Migration Path**

**What we know:**
- 11 current integrations with "slightly different data models"
- 18-month hard deadline, potential 6-month extension

**Unknowns:**
- [ ] **Integration inventory:** What are the 11 integrations? (e.g., mobile, web banking, contact centre, partner A, partner B, etc.) Are there dependencies between them?
- [ ] **Data model variations:** What's different? Field names, response structure, field inclusion (some consumers may not need all 5 data types)?
- [ ] **Consumer readiness:** Have the 11 consumer teams agreed to migrate? Do they have capacity in their roadmaps?
- [ ] **Backward compatibility expectations:** During transition, do we support both legacy API and Experience API in parallel, or hard cutover?
- [ ] **Testing & validation:** What's the acceptance criteria for migration? Load testing requirements? Failover testing?

**Migration phase gates (aligned to 18-month timeline):**

| Phase | Months | Deliverable | Gate Criteria |
|-------|--------|-------------|---------------|
| **Design & Build** | 0–6 | Experience API MVP | Compliance review pass, least-privilege model defined, caching architecture validated |
| **Pilot Migration** | 6–10 | 2–3 consumer teams live | <1% transaction data errors, <50ms p99 latency, audit logs passing PCI review |
| **Scale Migration** | 10–15 | Remaining 8 consumers live + partner onboarding | Month 12 gate: ≥80% consumers migrated (unlocks 6-month extension option) |
| **Deprecation Buffer** | 15–18 | Legacy API shutdown preparation | Vendor sunset |

---

### 5. **Partner Consent Management**

**What we know:**
- Two external fintech partners operate under open banking programme
- Access governed by CDR-equivalent consent
- Consent must be per-data-type

**Unknowns:**
- [ ] **Consent storage:** Is consent data held in a separate consent service, in the card core, or in partner systems?
- [ ] **Consent revocation flow:** If a customer withdraws consent, how quickly must partner access be revoked? (Real-time vs. within N hours?)
- [ ] **Consent scope limits:** Can a partner request access to "all data types" or is it always customer-initiated per-type?
- [ ] **Discovery of customer consent:** When a partner calls the Experience API, how does the API validate the customer has consented? (JWT claim? API call to consent service?)
- [ ] **Open banking standards:** Are you following OIDC for consent binding, or custom implementation?

**Design implication:** Experience API needs a **consent enforcement layer** that:
- Intercepts partner requests
- Validates consent for requested data types
- Strips/masks data if consent is absent
- Logs all access for audit

---

## Recommended Next Steps (Priority Order)

### **Phase 0: Unblock Design (Weeks 1–4)**

1. **Regulatory scoping session**
   - Attendees: InfoSec, PCI DSS assessor, legal, card core vendor liaison
   - Outputs: PCI DSS data retention policy, audit logging spec, partner consent architecture doc

2. **Consumer requirements gathering**
   - Interview all 11 consumer teams: current auth methods, data models, latency SLAs, error handling expectations
   - Output: Consumer matrix (auth, data types, SLA)

3. **Card core capability audit**
   - What auth methods does vendor API support?
   - What's the maximum permission set available for service accounts?
   - What's the vendor's deprecation timeline for each endpoint?

4. **Consent architecture design**
   - Map how partner consent is currently captured (if at all)
   - Design consent enforcement layer in Experience API
   - Output: Consent flow diagram + API contract

5. **Least-privilege permissions mapping**
   - For each of the 5 API operations (summary, transactions, categories, controls, disputes), define minimum required permissions against card core
   - Output: Permission matrix

### **Phase 1: Build & Validate (Weeks 5–24)**

- **Prototype caching layer** with PCI DSS compliance review
- **Implement consent enforcement** for partner access
- **Auth/authz hardening** (move from shared service account to least-privilege)
- **Migrate pilot consumers** (2–3 teams) and validate latency/error rates
- **Document migration runbook** for remaining consumers

### **Critical Path Items (Do Not Delay)**

- [ ] Confirm 18-month vendor deadline is non-negotiable (vs. negotiable)
- [ ] Secure sign-off from all 11 consumer teams on migration plan
- [ ] Get PCI DSS assessor involved early (caching/transformation layer needs pre-approval)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Compliance blocker:** PCI DSS assessor rejects caching design | High | Engage assessor in weeks 1–4; prototype before full build |
| **Consumer team delays:** <3 teams migrate by month 12 | High | Lock in migration dates per team by month 3; escalate blockers weekly |
| **Card core auth limitations:** Vendor API doesn't support least-privilege | High | Test auth model in week 2; plan workarounds (e.g., row-level filtering in Experience API) |
| **Partner consent complexity:** Open banking consent not yet implemented | Medium | Design consent service in parallel; may require external vendor integration |
| **Performance regression:** Experience API slower than direct card core calls | Medium | SLA definition + load test plan by month 6; consider async patterns for non-critical data |

---

## Success Criteria for /discovery Phase Completion

✅ **Regulatory clarity:** PCI DSS data retention, caching, and audit requirements documented  
✅ **Consumer alignment:** All 11 teams committed to migration timeline + requirements captured  
✅ **Card core constraints:** Auth/permission capabilities known; deprecation timeline per endpoint mapped  
✅ **Architecture decisions:** Caching strategy, consent enforcement, least-privilege model defined + compliance approved  
✅ **Migration path:** Phase gates, success metrics, and consumer assignment plan drafted  

**Estimated discovery completion:** 4 weeks (with parallel workstreams)