# /discovery Pipeline: Experience API for Card Services

## Problem Statement Validation

You're solving a genuine platform problem: **consolidating 11 point-to-point integrations into a managed API layer while the vendor deprecation clock is running.** The constraints are real and interconnected (PCI compliance, CDR consent, vendor timeline, privilege model).

---

## Critical Discovery Questions

### 1. **Compliance & Data Handling**

**What you've stated clearly:**
- PCI DSS scope, no cached PAN data, truncated PAN acceptable
- CDR-equivalent consent model for external partners
- You understand the constraints

**What you need to discover:**

- **Data retention policy specifics**: Does PCI DSS compliance mean you *can't* cache truncated PAN + transaction metadata, or just that you *must have a retention policy*? (e.g., 90 days max, auto-purge)
  - Action: Get written clarification from your compliance/security team on what "compliant caching" means operationally
  
- **Consent data storage**: Where/how do you store CDR consent states? Is this a real-time lookup against a consent service, or cached? (Affects API latency and data freshness requirements)
  - Action: Map consent service architecture—does it exist, or is this a dependency you need to build?

- **Audit trail requirements**: PCI DSS requires access logging. Does your current card core integration provide audit trails? Will the Experience API need to log every data access?
  - Action: Confirm audit logging scope (all API calls? sensitive operations only? include partner team access?)

---

### 2. **Least-Privilege Access Model**

**This is your biggest architectural gap.** You can't build security if you don't define it.

**Discover:**
- **Per-operation privilege mapping**: For each Experience API operation, what's the minimum access needed?
  - Example: `GET /accounts/{id}/transactions` — does it need read-only access to transaction tables, or does the vendor API expose transaction data via a different principal?
  - Example: `POST /accounts/{id}/controls/freeze` — does this need write access to card control settings? What's the audit trail?

- **Service account vs. consumer identity**: Should the Experience API:
  - Use a single service account (current model) with row-level security in the Experience layer?
  - Use *different* service accounts per consumer team (11 accounts)?
  - Use *dynamic credentials* (request each consumer's user context and impersonate in the vendor API)?
  - Action: **Model each approach against your vendor API capabilities** — some legacy systems don't support delegation

- **External partner access**: Do external fintech partners need:
  - Real-time access, or batch data export?
  - Different rate limits, SLAs, or data visibility than internal consumers?
  - Separate audit trails?

---

### 3. **Vendor API Deprecation Timeline Risk**

**Your 18-month window is tight with a 6-month extension option.**

**Discover:**
- **Vendor API stability**: Does the vendor provide a long-term stable endpoint, or is the new API in flux?
  - Action: Get the vendor's API stability roadmap. When does the *new* API reach feature parity with legacy?

- **Migration sequencing**: 11 teams, 18 months. What's the safe order?
  - Are consumer teams' deprecation timelines aligned, or do some have more flexibility?
  - Action: Survey each of the 11 teams: "If the Experience API is ready in month 6, can you migrate then? Month 9? Month 15?"

- **Fallback plan**: If you can't meet the 18-month deadline, what's the cost of running dual APIs?
  - Action: Quantify the cost of maintaining both card core integrations through month 24 (worst case)

---

### 4. **Performance & Caching Strategy**

**Transaction history caching directly affects UX and compliance.**

**Discover:**
- **Latency requirements**: 
  - What's acceptable latency for `GET /accounts/{id}/transactions`? (Real-time vs. eventual consistency)
  - Do mobile app users tolerate 2-second delays? Contact centre agents?
  - Action: Define SLO per consumer

- **Cache invalidation**: 
  - When a new transaction posts, how quickly must it appear in the API response?
  - Can you cache for 5 minutes? 1 minute? Real-time?
  - Action: Check vendor API transaction posting lag (some systems batch hourly)

- **90-day transaction window**: Is this a hard requirement because:
  - Users need 90-day history for dispute initiation?
  - PCI DSS requires retention of 90 days of audit logs?
  - Something else?
  - Action: Clarify—this affects your cache size and retention policy

---

### 5. **Consumer Team Readiness**

**You need to understand what 11 teams are actually building.**

**Discover:**
- **Current integration patterns**: For each team, document:
  - Which operations do they use? (All 5 core operations, or a subset?)
  - What data model do they expect? (This affects API design)
  - Are there undocumented dependencies on the vendor API?
  - Action: **Run a structured intake with each team** (1-hour interview, document their API contract)

- **Migration effort**: Which teams will have the hardest migration?
  - Teams using deprecated vendor features?
  - Teams with custom authentication logic?
  - Action: Identify high-risk teams early (month 2, not month 12)

---

### 6. **Architecture Decision Points**

**These need discovery before you design:**

| Question | Impact |
|----------|--------|
| **API style**: REST, GraphQL, gRPC? | Affects client implementation effort (11 teams) |
| **Versioning strategy**: URL-based (`/v1/`, `/v2/`) or header-based? | CDR compliance & external partner contracts |
| **Rate limiting**: Per-team? Per-user? Per-endpoint? | Affects fairness under high load; compliance with CDR |
| **Error handling**: Standard error codes/messages? | Reduces downstream team implementation variance |
| **Timeout/retry policy**: Vendor API timeouts + Experience API timeouts? | Transaction history queries can be slow |

---

## Recommended Discovery Roadmap (Weeks 1-4)

### Week 1: Compliance & Data
- [ ] Security/compliance team: written definition of "PCI-compliant caching"
- [ ] Legal/data: CDR consent implementation model (real-time vs. cached)
- [ ] Define audit logging scope + retention policy
- [ ] Confirm vendor deprecation timeline in writing

### Week 2: Access Control
- [ ] Map current vendor API authentication/authorization capabilities
- [ ] Define privilege model for each of 5 core operations
- [ ] Decide: single service account vs. multi-account vs. delegation
- [ ] Document external partner access requirements

### Week 3: Consumer Teams
- [ ] Structured intake (1-hour interviews) with all 11 teams
- [ ] Document current API contracts + dependencies
- [ ] Identify high-risk migrations
- [ ] Survey migration timeline expectations

### Week 4: Architecture
- [ ] Vendor API feature matrix (legacy vs. new)
- [ ] Performance requirements (latency SLOs per consumer)
- [ ] Draft API spec (endpoints, data models, versioning)
- [ ] Risk assessment: what breaks if you miss month 18?

---

## Red Flags to Watch

1. **"We're not sure which teams use which vendor API features"** → You'll hit surprises in month 12
2. **"PCI DSS caching rules are unclear to us"** → This will block deployment; clarify now
3. **"External partners haven't defined data consent requirements"** → Late discovery here = rework
4. **"We don't have least-privilege definitions yet"** → Build them into the spec, don't retrofit later

---

## Deliverable: Discovery Summary (End of Week 4)

You'll need to write:
1. **Compliance matrix**: What caching is allowed? What audit trails required?
2. **Privilege mapping**: Per-operation, what access does the Experience API need?
3. **Team migration plan**: Which teams migrate when? What's the critical path?
4. **Vendor API assessment**: Feature parity, timeline, fallback costs
5. **API design constraints**: Latency SLOs, error handling, versioning strategy

---

**What's the highest-confidence item you already have clarity on? Start your discovery with the gaps around that.**