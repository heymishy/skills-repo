# /discovery Pipeline Analysis: Consent Management API

## Executive Summary

This is a **high-value, regulated initiative with significant execution complexity**. The core concept is sound and addresses genuine market need, but the combination of compressed timeline, sensitive data types, and enriched insights inclusion creates meaningful risk. The privacy foundation is strong, but several critical gaps need resolution before proceeding.

**Recommendation: Proceed with phased approach — but separate enriched insights to Phase 2.**

---

## What's Working Well

### Strengths of the Model
- **Granular, customer-centric consent design** — data type + third party + time limit + revocation creates genuine control
- **Strong privacy baseline** — explicit consent requirement, Privacy Act alignment, accreditation validation per-call
- **Clear value proposition** — addresses both customer control AND ecosystem enablement
- **Pragmatic scope** (mostly) — transaction history, balances, credit card summaries are well-understood, low-transformation data

### Commercial Logic
- Open banking is table-stakes competitive positioning
- Enriched insights *would* be genuine differentiator if you can deliver them reliably
- 10-partner cohort is sensible starting scale

---

## Critical Gaps & Risks

### 1. **Enriched Insights Inclusion in Phase 1 — HIGH RISK**

**The Problem:**
Enriched insights (spending categories, estimated income, 90-day projection) are **algorithmically derived, not raw data**. This introduces compliance and operational complexity not present in your other data types:

- **Algorithmic transparency obligations**: Depending on jurisdiction (UK/EU especially), you may need to explain *how* these insights are calculated, acknowledge error margins, and disclose if they're used for downstream decision-making by third parties
- **Accuracy liability**: If a fintech uses your "estimated monthly income" to make lending decisions and it's materially wrong, whose liability is that? Your enrichment model? The fintech's use of it?
- **Consent explicitness**: Can customers genuinely consent to "spending category breakdown" without understanding the clustering algorithm? Does Privacy Act require you to disclose algorithm details at consent time?
- **Data minimisation tension**: You're including derivative data that may not be strictly necessary for core use cases (comparison, aggregation)

**What you probably haven't done yet:**
- Algorithmic impact assessment (required under some frameworks)
- Legal review of liability allocation with third parties
- User testing: do customers understand what "enriched insights" means at consent time?
- Audit trail design: if an insight is wrong, can you trace why and notify affected parties?

**Recommendation:**
- **Launch Phase 1 (6 months): transaction history, balances, credit card summaries only**
  - Achieves open banking parity with competitors
  - De-risks regulatory surface
  - Gives you 6 months of operational maturity before adding complexity
- **Phase 2 (months 9-12): enriched insights** — after you've built algorithmic governance, tested consent language, and clarified liability models

This is not a feature cut; it's a sequencing optimization.

---

### 2. **Accreditation Authority Governance — UNDEFINED**

**The Problem:**
You've said "designated accreditation authority" but haven't specified who, what criteria they use, or how you validate them:

- Is this an external body (e.g., FCA Open Banking Standard, industry consortium) or internal?
- What are the accreditation criteria? (Cybersecurity? Financial resilience? Data handling practices?)
- How do third parties *lose* accreditation? What triggers suspension?
- What's your SLA for validating accreditation status on each API call? If the authority's systems are down, do you block all API calls?
- Who bears cost of accreditation administration?

**Why this matters:**
- If you're validating on each call, you're introducing a dependency on an external system. Failure mode: all third parties blocked from new access during an outage.
- Unclear criteria creates liability risk: if you grant access to a party who later breaches customer data, regulators will ask "what accreditation process did you follow?"

**Immediate actions:**
1. Confirm which accreditation authority you'll use (or create a clear internal framework)
2. Document accreditation criteria explicitly
3. Design API architecture to handle authority validation failures gracefully (cached validation? fallback rules?)
4. Draft third-party agreement that clarifies accreditation responsibility and suspension mechanics

---

### 3. **Data Deletion on Revocation — OPERATIONALLY HARD**

**The Problem:**
You've committed to: *"On revocation, the third party must delete all data received under that consent."*

This is legally correct but operationally complex:

- **How do you verify deletion?** You can't audit their systems. Do you require cryptographic proof? Signed deletion certificates?
- **What about derivative data?** If a fintech built a spending profile or credit model using your enriched insights, then you revoke consent, can they keep the *model* (which was trained on your data)?
- **What about backups/archives?** Do they need to delete from cold storage, DR systems, audit logs?
- **What's the SLA?** Immediate? 30 days?
- **Breach scenario:** What if a third party doesn't delete and you discover it 6 months later? What's your remediation?

**Recommendation:**
- Add to Phase 1 scope: **Data Deletion Framework** (design before launch)
  - Define what "deletion" means (active databases only? archives? backups after N days?)
  - Require third parties to sign deletion attestations
  - Build audit logging so you can demonstrate you checked
  - Set realistic SLAs (e.g., 30 days for deletion, with 90-day backup retention window)
  - Create contractual liability framework for failure to delete

---

### 4. **Consent Revocation UX & Timing — UNDERSPECIFIED**

**The Problem:**
Customers can revoke "at any time," but several operational questions are unanswered:

- **Real-time or eventual consistency?** If a customer revokes consent at 2pm, do third parties get blocked from new requests immediately, or is there a sync delay?
- **In-flight requests:** If a third party's request is processing at the moment of revocation, what happens?
- **Grace period?** Some frameworks require notice periods before revocation takes effect (allows third party to complete transactions in progress)
- **Customer experience:** How obvious is the revocation flow in the portal? Can customers revoke one data type without revoking others?

**For launch planning:**
- Prototype the member portal consent & revocation flows early (Q2)
- Test with real users: can they understand granular selections? Do they know how to revoke?
- Decide: real-time revocation (complex, requires synchronous API gating) vs. eventual (simpler, but requires T+1 sync)

---

### 5. **Enriched Insights Governance Gap**

If you do include enriched insights in Phase 1, you need to answer:

**Before launch:**
- [ ] Algorithm documentation: How are spending categories assigned? What's the error rate? Any known biases?
- [ ] Consent language: Can you explain enriched insights in plain English that customers actually understand?
- [ ] Liability: If a fintech makes a lending decision based on your "estimated income" and it's wrong, who's liable? Draft the clause now.
- [ ] Accuracy SLA: What's your commitment to accuracy? How do you handle discovered errors?
- [ ] Audit trail: Can you replay why a given insight was generated for a given customer at a given time?

---

## 6-Month Timeline Assessment

**Achievable:**
- Consent model design & legal review ✓
- Accreditation framework ✓
- API design for transaction history, balances, credit card summaries ✓
- Core banking integration for data extraction ✓
- Member portal consent flows ✓
- Third-party onboarding & testing with 10 partners ✓

**Risky if you include enriched insights:**
- Algorithmic governance & impact assessment (usually takes 8-12 weeks)
- Liability framework testing with partners
- User consent testing for algorithmic data
- Regulatory pre-notification (some frameworks require this)

**Recommendation: Keep the 6-month timeline, but launch Phase 1 without enriched insights. If you slip to 7-8 months trying to include them, you lose competitive momentum.**

---

## Privacy Act Compliance — Specific Points

Your privacy team's comfort is good, but ensure they've explicitly signed off on:

1. **Legitimate interest vs. consent:** Is customer consent sufficient, or do you need to prove legitimate interest for the *open banking programme itself*? (Usually consent alone is fine, but worth confirming.)
2. **Third-party liability:** Once you share data with accredited parties, they become data controllers/processors. Have you drafted data processing agreements that specify their obligations?
3. **Enriched insights classification:** Are these treated as new data (requiring fresh consent) or as processed versions of transaction data (covered by existing consent)? → **This distinction matters for consent language.**
4. **Retention periods:** How long can third parties retain data? Your consent model says "up to 12 months," but does that mean they delete after 12 months automatically, or just that they can't request renewals?

---

## Recommended Next Steps (Next 4 Weeks)

| Priority | Action | Owner | Output |
|----------|--------|-------|--------|
| **P0** | Accreditation authority governance decision | Product/Legal | Written specification of accreditation model |
| **P0** | Phase 1 vs. Phase 2 decision on enriched insights | Leadership | Go/no-go; adjust roadmap |
| **P1** | Data deletion framework design | Product/Security/Legal | Deletion SLA, attestation model, audit logging approach |
| **P1** | Consent revocation timing & architecture | Product/Engineering | Real-time vs. eventual consistency decision |
| **P1** | Member portal UX prototype (consent & revocation) | UX/Product | Testable prototype for user research |
| **P2** | Third-party data processing agreement template | Legal | Draft for review with partners |
| **P2** | Privacy Act pre-notification (if required) | Legal/Privacy | Regulatory confirmation |

---

## Key Success Metrics to Define Now

Before you brief engineering, define:
- Time to API access after customer consent (target: minutes? hours?)
- Consent acceptance rate (baseline expectation?)
- Third-party activation rate (of 10 partners, how many live in first 90 days?)
- Data revocation rate (as signal of customer trust)
- Regulatory/compliance incidents (target: zero)

---

## Summary Position

**This is a strong initiative, but enriched insights in Phase 1 creates outsized risk relative to the 6-month timeline.** The move to Phase 2 is not a compromise — it's a smarter sequencing that lets you:

1. **De-risk regulatory surface** (algorithmic transparency is a growing area)
2. **Achieve parity with competitors faster** (transaction/balance APIs are table-stakes; enriched insights are nice-to-have)
3. **Build operational maturity** before adding complexity (6 months of consent/revocation/accreditation experience informs Phase 2 design)
4. **Clarify liability models** with early partners before staking them on algorithmic data

**If leadership insists on enriched insights in Phase 1, you need 8 months, not 6, and you need algorithmic governance and user testing budgeted explicitly.**

What's the decision on Phase 1 vs. Phase 2 for enriched insights? And who's currently designated as the accreditation authority?