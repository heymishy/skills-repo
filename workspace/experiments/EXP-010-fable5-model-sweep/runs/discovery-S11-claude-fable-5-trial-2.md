# Discovery Report: Consent Management API for Open Banking

## 1. Brief Summary

Build a consent management API enabling accredited third parties (10 launch partners) to access customer financial data with granular, time-limited, revocable customer consent. Four data tiers: transactions (12 months), balances/credit, card summaries, and **enriched insights** (derived analytics). Launch in 6 months with enriched insights in scope from day one.

---

## 2. What's Well-Defined

- Granular consent model: per data-type × per third-party
- Consent lifetime cap (12 months) and revocation right
- Per-call accreditation validation (not just onboarding) — this is a strong design choice
- Deletion obligation on revocation
- Clear launch cohort and timeline

---

## 3. Highest-Risk Area: Enriched Insights

This is the single biggest discovery gap. The brief treats enriched insights as "just another data type," but derived data behaves very differently from raw data, legally and operationally.

**Regulatory classification.** In most open banking regimes (and this brief strongly resembles Australia's CDR), *derived data* generated from regulated data is itself regulated data. Has legal confirmed which regime the enriched insights fall under, and whether sharing inferences requires different or additional consent language than raw data?

**The privacy sign-off is narrower than it looks.** The brief says the privacy team "reviewed the overall consent model." That is not the same as a privacy impact assessment on sharing *inferred income* and *predicted balances*. Specific concerns:

- **Estimated monthly income** is an inference a third party will almost certainly use for credit or affordability decisions. If it's wrong and a customer is denied credit, who is liable? Does this trigger accuracy obligations (e.g., APP 10-style "reasonable steps to ensure accuracy") or credit-reporting adjacent rules?
- **90-day projected balance** is a prediction, not data. What disclaimers, confidence bounds, and model governance accompany it? Can the recipient distinguish "fact" from "forecast" in the payload?
- **Consent comprehension.** Will customers understand that consenting to "enriched insights" means sharing *what the bank has inferred about them*, including income estimates they never provided? This is a meaningful-consent question, not just UX polish.

**Recommendation to test with stakeholders:** decouple enriched insights from the launch critical path. Launch raw data tiers at month 6; ship enriched insights as a fast-follow once a dedicated PIA, accuracy/liability framework, and model governance review are complete. The brief says "keen to include at launch" — discovery should pressure-test whether that keenness survives a liability conversation.

---

## 4. Open Questions by Theme

### Consent Model
1. **Joint accounts.** What happens when account holder A consents but holder B objects? Is there a co-approval flow, a notification, a veto? This is a known hard problem in open banking and is entirely absent from the brief.
2. **Account-level granularity.** Consent is described as data-type × third-party. Can a customer share transactions from account 1 but not account 2?
3. **Consent amendment.** Can a customer modify an active consent (add/remove data types), or is it revoke-and-regrant only? This affects API design materially.
4. **Expiry behaviour.** At 12 months, does consent lapse silently? Are customers notified before expiry? Is there a re-authorization flow, and can third parties initiate it?
5. **Vulnerable customers, minors, business accounts, deceased estates** — in scope or explicitly excluded for launch?

### Revocation & Deletion
6. **Enforcement.** "Third party must delete all data" — enforced how? Contractual attestation, deletion receipts via API, audit rights? An obligation without a verification mechanism is a compliance gap.
7. **Scope of deletion.** Does it cover data the third party has *derived* from our data? Data passed to fourth parties (outsourced providers)? De-identified data?
8. **Deletion on accreditation loss.** The brief blocks *new* access when accreditation lapses — but what happens to data already held under live consents? Are those consents terminated?

### Accreditation
9. What is the accreditation registry's availability and latency SLA? Per-call validation creates a hard runtime dependency — define caching/TTL strategy and fail-open vs fail-closed behaviour. (Recommend fail-closed, but that has availability consequences partners will care about.)

### Security & Standards (entirely absent from brief)
10. Which security profile? FAPI / OAuth 2.0 / mTLS / certificate-bound tokens? Is the consent grant itself the OAuth authorization?
11. Audit and non-repudiation: can we prove, per request, what was shared, under which consent, to whom, when? This is essential for dispute resolution.
12. Rate limiting, traffic management, and abuse detection per third party.

### Operations & Liability
13. Customer dispute path: customer claims data was shared without consent, or shared data was wrong — who handles it, with what evidence?
14. Third-party breach: incident response obligations, notification timelines, our liability exposure.
15. Data corrections: if we correct a transaction after sharing, is there an obligation or mechanism to propagate the correction?

### Delivery
16. Is the internal analytics engine production-grade for external consumption (SLA, versioning, output stability), or was it built for internal use? Productizing an internal analytics engine in 6 months alongside a greenfield consent API is a significant schedule risk.
17. What are the success metrics? Consent conversion rate, active consents, revocation rate, partner API adoption? None are defined.

---

## 5. Assumptions to Validate

| # | Assumption | Validation owner |
|---|------------|------------------|
| A1 | Privacy sign-off covers derived/inferred data, not just the consent model | Privacy / Legal |
| A2 | Enriched insights are permissible to share under the applicable open banking regime | Legal / Compliance |
| A3 | Accreditation authority offers a real-time queryable registry suitable for per-call checks | Architecture |
| A4 | Member portal can accommodate consent dashboard within the 6-month window | Portal team |
| A5 | Joint-account consent is solvable within launch scope (likely false — probably needs explicit scoping) | Product / Legal |
| A6 | 10 launch partners can complete onboarding, testing, and conformance within the same 6 months the API is being built | Partnerships |

---

## 6. Recommended Scope Decisions for Stakeholder Review

1. **Tier the launch:** raw data tiers (transactions, balances, card summaries) at month 6; enriched insights gated behind dedicated PIA + liability framework.
2. **Explicitly exclude or solve joint accounts before design starts** — this cannot be discovered mid-build.
3. **Define the deletion verification mechanism now** (attestation API or contractual audit) — it shapes both the API contract and partner agreements.
4. **Adopt a recognized security profile (FAPI) rather than designing bespoke** — accelerates partner integration and likely required for accreditation interop anyway.

---

## 7. Suggested Next Steps

1. Workshop with Legal/Privacy specifically on derived data and inferred income (Questions 1–5, A1–A2) — this gates the launch scope decision.
2. Technical spike on accreditation registry integration (Q9, A3).
3. Joint-account scoping decision with Product and Legal (Q1).
4. Draft consent lifecycle state machine (grant → amend → expire/revoke → delete) as the anchor artifact for design phase.

**Discovery verdict:** the consent model core is well-conceived, but the brief is not ready for design until (a) enriched insights' regulatory and liability position is resolved, (b) joint accounts are scoped in or out, and (c) deletion enforcement is defined.