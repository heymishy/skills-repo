# /discovery — Consent Management API for Open Banking

## Discovery Report & Structured Findings

---

## 1. Executive Summary

This discovery surfaces the key requirements, risks, dependencies, and open questions for the Consent Management API. The overall programme direction is sound: the consent model is well-considered, the data scope is commercially meaningful, and the Privacy Act alignment is a genuine strength. However, several areas require resolution before confident delivery planning is possible.

The most significant concerns cluster around three areas: the **enriched insights tier** carries regulatory and data provenance risks that are not yet fully resolved; the **deletion obligation on revocation** is more technically complex than it may appear; and the **6-month timeline** is ambitious given the accreditation validation architecture required. None of these are blockers in principle, but each needs deliberate design decisions before scope and schedule can be confirmed.

---

## 2. What We Are Building — Clarified Scope

### 2.1 Core System Components

Based on the brief, the following components are in scope:

| Component | Description |
|---|---|
| **Consent Service** | Records, stores, and manages consent grants per customer × data type × third party |
| **Consent Portal Integration** | Customer-facing flows in the member portal for granting, reviewing, and revoking consent |
| **Data API** | Authenticated endpoints returning permissioned data to accredited third parties |
| **Accreditation Validation Layer** | Real-time checks against the accreditation authority on each API call |
| **Enriched Insights Adapter** | Integration with the internal analytics engine to expose enriched data types |
| **Deletion Orchestration** | Mechanism to notify third parties of revocation and enforce deletion obligations |
| **Audit & Logging** | Immutable record of all consent events and data access, for regulatory and dispute purposes |

### 2.2 Data Types In Scope

```
Tier 1 — Core Banking Data
  ├── Transaction history (rolling 12 months)
  ├── Current account balances and available credit
  └── Credit card summaries
        ├── Statement balances
        ├── Payment due dates
        └── Utilisation

Tier 2 — Enriched Insights (internal analytics engine)
  ├── Spending category breakdowns
  ├── Estimated monthly income
  └── 90-day projected balance
```

The distinction between these tiers matters beyond labelling. Tier 1 is retrieval of existing records. Tier 2 is **derived output from a model** — the consent model, regulatory treatment, and accuracy obligations are meaningfully different and are addressed in Section 4.

---

## 3. Strengths of the Current Approach

It is worth being explicit about what the brief gets right, because these are design decisions that should be protected under delivery pressure.

**Granular consent at the data type × third party level** is the right model. Coarse-grained consent (e.g., "share everything with this party") is increasingly difficult to defend under privacy regulation and erodes customer trust. The proposed model gives customers genuine control, which aligns with both Privacy Act obligations and the spirit of open banking.

**Per-call accreditation validation** rather than onboarding-only validation is a significant security and compliance improvement over simpler approaches. An accredited party whose status is revoked by the authority is blocked immediately rather than continuing to access data until the next credential rotation cycle. This should be preserved.

**Time-limited consent with customer revocation** is the right default. It avoids the silent accumulation of indefinite data-sharing grants that customers lose awareness of over time.

**Privacy team review of the consent model** is noted. We will flag specific areas below where that review should be revisited or extended as design details firm up.

---

## 4. Risks and Issues Requiring Resolution

### 4.1 Enriched Insights — Regulatory and Accuracy Risks

**This is the highest-priority issue in the discovery.**

The enriched insights tier is described as output from an internal analytics engine — derived, not raw. This raises several issues that are not resolved by the existing privacy team review of the consent model.

**Accuracy and liability exposure**

A 90-day projected balance and estimated monthly income are predictions, not facts. If a customer makes a financial decision — or a third party makes a lending or credit decision — based on an inaccurate projection, there is a plausible liability chain back to the enterprise. The brief does not address:

- What accuracy standards the analytics engine is held to
- How errors or model drift are detected and corrected
- Whether third parties are permitted to use enriched insights for credit decisioning
- What disclosure is made to customers that these are estimates, not account records

**Consent scope ambiguity**

When a customer consents to share "spending category breakdowns," they are likely consenting under a mental model that this means "my transaction categories." In practice, they are consenting to share the output of a classification model that may categorise transactions in ways they would not expect or endorse. The question of whether model-derived outputs require a different or supplementary consent disclosure than raw data has not been addressed.

**Open banking regulatory classification**

Depending on the jurisdiction and the specific open banking regime applicable, enriched insights may or may not fall within the defined data types that the regime covers. If they fall outside the regime, the accreditation framework and the data-sharing rules that apply to them may be different. This needs legal confirmation before launch.

> **Action required before design begins:** Legal and privacy team to confirm the regulatory classification of enriched insights, permitted use cases for third parties, required disclosures to customers, and whether the existing privacy review covers derived-data outputs. The enriched insights tier should have a clearly documented risk decision before it is confirmed for day-one launch.

---

### 4.2 Deletion on Revocation — Technical Complexity

The brief states that on revocation, the third party must delete all data received under that consent. This is the right policy. It is also significantly harder to implement and verify than it may appear.

**Notification is not deletion**

The enterprise can reliably notify a third party that consent has been revoked. It cannot, by itself, verify that the third party has deleted the data. The deletion obligation requires:

- A defined notification mechanism (webhook, polling endpoint, or both)
- A defined acknowledgement and confirmation protocol
- A contractual obligation in the accreditation agreement (not just the API terms)
- A defined escalation path when a third party does not confirm deletion
- An audit record of the notification and any confirmation received

**Data that has been further processed or shared**

If a third party has derived their own models, reports, or aggregated datasets from the shared data, what is the scope of the deletion obligation? If they have shared the data with a sub-processor, who is responsible? These questions need to be answered in the accreditation agreement before launch — they cannot be solved by the API layer alone.

**Customer expectation management**

Customers who revoke consent may reasonably believe that deletion is immediate and certain. If the enterprise can only guarantee notification and not verified deletion, the customer-facing language in the portal must be carefully written to reflect the actual guarantee being made — both for accuracy and to manage support and complaint volumes.

> **Action required:** Legal, product, and engineering to jointly define the deletion protocol — including the notification mechanism, confirmation requirement, contractual obligations, and what the enterprise can and cannot guarantee to customers. Portal copy must reflect the actual deletion guarantee, not an idealised version of it.

---

### 4.3 Accreditation Validation — Latency and Resilience Architecture

Per-call accreditation validation is the right policy. The implementation requires careful architecture to avoid creating availability and latency problems.

**If the accreditation authority is unavailable**

What is the fail-safe behaviour? Options are:

- **Fail open** — allow the call if the authority cannot be reached. This is a security risk: a party whose accreditation has just been revoked continues to receive data during the outage.
- **Fail closed** — deny the call if the authority cannot be reached. This is secure but means the enterprise's API availability is coupled to the authority's uptime.
- **Cache with TTL** — cache the accreditation status with a short time-to-live (e.g., 5 minutes) to reduce direct dependency, accepting a bounded window during which a newly revoked party could still receive data.

There is no universally correct answer — this is a risk decision that needs to be made explicitly and documented. The cache-with-TTL approach is commonly used in practice and is likely the right balance, but the TTL duration and the cache invalidation mechanism (can the authority push revocation events?) need to be defined.

**Latency budget**

If accreditation validation adds a synchronous call to every data request, this affects the API's response time characteristics. Third parties building consumer-facing applications will have latency expectations. This should be addressed in the technical design, not discovered during integration testing with partners.

> **Action required:** Engineering to confirm the accreditation authority's API characteristics (availability SLA, rate limits, whether push notifications for revocation are available) and propose the validation architecture, including fail-safe behaviour, before detailed technical design begins.

---

### 4.4 Timeline Risk — 6 Months to First Cohort

The 6-month target is achievable but leaves no slack for the open questions identified in this discovery. The key schedule risks are:

| Risk | Impact | Current Status |
|---|---|---|
| Enriched insights legal confirmation delayed | Tier 2 pushed from launch or launch delayed | Open |
| Accreditation authority integration scoping | Could add 4–8 weeks if authority has complex onboarding | Not yet scoped |
| Deletion protocol requires contract changes | Accreditation agreements may need renegotiation with partners | Not yet started |
| Core banking system integration complexity | Transaction history and balance APIs may require significant work to expose safely | Not assessed |
| Customer portal consent UI design and testing | Customer-facing flows need accessibility review, usability testing, and legal copy approval | Not yet scoped |

A realistic path to 6 months likely requires a **phased launch approach**: Tier 1 data types first, with enriched insights following once the outstanding regulatory questions are resolved. This is not a failure of ambition — it is the approach most likely to result in a stable, defensible launch rather than a compressed launch that accumulates technical and regulatory debt.

> **Recommendation:** Product and programme to assess whether a phased launch — Tier 1 at month 6, enriched insights at a defined later date — is preferable to a full-scope launch under schedule pressure. If full-scope launch at month 6 is a firm requirement, the enriched insights open questions need answers within the next 3–4 weeks to preserve the schedule.

---

### 4.5 Consent Granularity — Implementation Complexity

The consent model is correct in principle. At scale, it creates implementation challenges that should be anticipated.

**Consent state management**

Each customer can have multiple active consent grants, each with different data types, different third parties, different expiry dates, and different revocation states. The consent service needs to handle:

- Partial grants (customer consents to balances but not transactions for a given third party)
- Overlapping grants (customer grants access to the same data type to multiple parties)
- Expiry handling (automated expiry at 12 months, with customer notification before expiry)
- Re-consent flows (what happens when a third party requests a data type the customer has not yet consented to)
- Consent version management (if the enterprise's data schema changes, do existing consents cover the new fields?)

These are all solvable but should be explicitly modelled before the data schema and API contract are designed.

**Customer experience of granularity**

Granular consent is good policy. It can be poor user experience if not designed carefully. A consent flow that presents customers with a matrix of data types and third parties risks decision fatigue and uninformed consent — which undermines the policy goal. The portal design needs to make granularity accessible, not just technically present.

> **Action required:** UX and product to design the consent flow before technical implementation begins. The flow should be reviewed against the intended customer experience — customers who understand and actively choose what they share — not just against the technical consent model.

---

## 5. Open Questions Requiring Decisions

The following questions require answers from named owners before design and build can proceed with confidence. They are ordered by the degree to which they block downstream decisions.

**Questions for Legal and Privacy:**

1. What is the regulatory classification of enriched insights under the applicable open banking regime? Do they fall within or outside the regime's defined data types?
2. Are third parties permitted to use enriched insights for credit or lending decisioning? If so, what obligations does that create for the enterprise?
3. What disclosure must be made to customers that enriched insights are model-derived estimates, not account records?
4. Does the existing privacy team review cover derived-data outputs, or does a supplementary review need to be commissioned?
5. What can the enterprise contractually require of accredited third parties with respect to deletion, sub-processing, and onward sharing?

**Questions for Engineering and Architecture:**

6. What are the integration points to retrieve Tier 1 data (transactions, balances, credit card summaries) from the core banking system? Are these existing APIs or new extracts?
7. What is the interface to the internal analytics engine for enriched insights? Is it synchronous (request/response) or asynchronous (batch)?
8. What are the accreditation authority's API characteristics — availability SLA, rate limits, and whether push revocation notifications are available?
9. What is the acceptable latency budget for API responses to third parties?
10. Where will consent state be stored, and what are the consistency requirements (e.g., can a briefly stale consent record result in unauthorised data access)?

**Questions for Product and Programme:**

11. Is a phased launch (Tier 1 first, enriched insights to follow) acceptable, or is full-scope launch at month 6 a hard requirement?
12. What is the process for onboarding the initial 10 accredited partners — are they already identified, and are their accreditation agreements in place?
13. What are the enterprise's obligations if the accreditation authority revokes a partner's accreditation — is there a customer notification requirement?
14. What happens to data shared under a consent grant that has expired naturally (at 12 months) — does the same deletion obligation apply as for active revocation?

---

## 6. Dependencies Outside the Team's Control

| Dependency | Owner | Risk if delayed |
|---|---|---|
| Accreditation authority API access and documentation | External authority | Blocks accreditation validation architecture |
| Legal confirmation of enriched insights classification | Legal / external counsel | Blocks Tier 2 design and potentially launch scope |
| Core banking system data exposure | Core banking platform team | Blocks Tier 1 API design |
| Analytics engine interface specification | Internal analytics team | Blocks Tier 2 API design |
| Accreditation agreements with initial 10 partners | Legal / partnerships | Blocks partner onboarding and launch |
| Privacy review extension to cover derived data | Privacy team | Blocks enriched insights launch readiness |

---

## 7. Recommended Next Steps

These are sequenced by dependency order, not priority alone.

**Within 2 weeks:**
- Convene legal, privacy, and product to resolve the enriched insights regulatory classification question. This is the decision most likely to reshape scope and timeline.
- Confirm the interface to the core banking system and the analytics engine with the relevant platform teams.
- Request accreditation authority API documentation and schedule a technical scoping call.

**Within 4 weeks:**
- Complete the consent flow UX design and submit for accessibility and legal copy review.
- Define the deletion protocol, including notification mechanism and what the enterprise can contractually require of third parties.
- Confirm the fail-safe behaviour for accreditation validation and document the risk decision.
- Agree a programme-level position on phased versus full-scope launch.

**Within 6 weeks:**
- Begin detailed API contract design (request/response schemas, error codes, versioning strategy) once the above decisions are in place.
- Begin consent service data model design.
- Initiate accreditation agreement review with the initial partner cohort.

---

## 8. What Is Not in Scope — Explicit Boundary Statements

To prevent scope creep and manage partner expectations early, the following are noted as explicitly out of scope for this programme:

- **The accreditation process itself** — the enterprise validates accreditation status but does not run the accreditation authority. The authority's onboarding process for fintechs is outside scope.
- **Third-party application development support** — the programme delivers the API and its documentation. How third parties build on top of it is their responsibility.
- **Real-time transaction streaming** — the brief describes transaction history retrieval. Event-driven real-time data push to third parties is not in scope and should be treated as a future phase.
- **Customer-to-customer data sharing** — consent is between a customer and a third party. Peer-to-peer data sharing is not in scope.
- **Fraud or dispute data** — not mentioned in the brief and raises significant legal complexity. Explicitly excluded until a separate discovery is conducted.

---

## 9. Summary Assessment

| Area | Status | Priority |
|---|---|---|
| Core consent model | Sound — protect this in delivery | — |
| Tier 1 data (core banking) | Viable, integration complexity to be assessed | High |
| Enriched insights (Tier 2) | Significant open questions ��� needs legal decision | Critical |
| Accreditation validation architecture | Right policy, implementation design needed | High |
| Deletion on revocation | Right policy, protocol design needed | High |
| 6-month timeline | Achievable with phased approach