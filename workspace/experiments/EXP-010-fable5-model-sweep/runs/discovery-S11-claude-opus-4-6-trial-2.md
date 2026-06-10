

# Discovery Summary: Consent Management API for Open Banking

## Overview

Building a consent management API enabling accredited third parties to access customer financial data with granular, customer-controlled consent. Part of the enterprise's open banking programme, targeting launch to 10 accredited partners within 6 months, including enriched insights from day one.

---

## What I Understood

The following aspects of the brief are clear and well-defined:

**Data Scope:**
- Four data tiers: transaction history (up to 12 months), account balances/available credit, credit card summaries, and enriched insights (spending categories, estimated income, 90-day projected balance)
- Enriched insights are derived analytics from an internal engine, not raw core banking data

**Consent Model:**
- Granular consent: per data type, per third party
- Time-limited up to 12 months
- Revocable at any time
- Consent managed through the existing member portal
- Privacy team has reviewed and approved the overall consent model

**Third-Party Access Control:**
- Accreditation required from a designated accreditation authority
- Accreditation validated on every API call, not just onboarding
- Loss of accreditation triggers immediate access blocking

**Data Deletion Obligation:**
- On revocation, third parties must delete all data received under that consent

**Launch Target:**
- 10 accredited partners, 6-month timeline, enriched insights available at launch

---

## Assumptions I'm Making

These are things the brief implies or leaves unsaid that I'm treating as likely true. Flag any that are wrong.

1. **The member portal already exists** and has authenticated sessions for customers — the consent UI will be built into it rather than requiring a new standalone application.

2. **The accreditation authority is an external body** (e.g., a regulator or industry body), not the enterprise itself, and it exposes some mechanism (API, registry, or certificate) for validating a third party's current accreditation status.

3. **Third-party API access will be machine-to-machine** (server-to-server), not browser-based, and the third party authenticates with credentials issued after accreditation — likely OAuth 2.0 client credentials or a similar pattern.

4. **The consent grant is the authorisation artefact** — meaning a third party presents a token or reference tied to a specific customer's consent, and the API resolves what data that consent permits before returning anything.

5. **The internal analytics engine that produces enriched insights already exists** and can be queried or its outputs retrieved programmatically — we are exposing its outputs, not building the engine.

6. **"Delete all data" on revocation is a contractual obligation on the third party**, not something the API can technically enforce — the API stops serving data, but deletion compliance is governed by the accreditation agreement.

7. **The 12-month transaction history window is rolling** from the point of each API call, not fixed from the date consent was granted.

8. **Rate limiting and throttling will be needed** but specific thresholds haven't been defined yet.

9. **The API will serve current-state data at time of call** (pull model), not push data to third parties or provide webhook-based real-time streaming.

10. **This is a read-only API** — third parties cannot write back to customer accounts or modify any data through this interface.

---

## Open Questions and Risks

These are gaps, tensions, or decisions that need resolution before or during design.

### Consent Model Design

**Q1: What is the consent granularity for enriched insights?**
Enriched insights bundle three distinct sub-types: spending categories, estimated income, and projected balance. Estimated income and projected balance are significantly more sensitive than spending categories. Is consent for "enriched insights" a single toggle, or should customers be able to consent to sub-types independently?

*Why it matters:* A customer might be comfortable sharing spending breakdowns with a comparison service but not their estimated income. If we bundle them, we risk over-sharing relative to customer intent, which could create Privacy Act exposure despite the overall model being approved. The privacy team's review may not have considered sub-type granularity.

**Q2: How is consent renewal handled at expiry?**
When a 12-month consent grant expires, does the customer need to re-consent through the portal, or is there a renewal/extension flow? Can the third party prompt renewal, or must it originate from the customer?

*Why it matters:* This affects both UX design and API behaviour. If there's no renewal flow, third parties will experience a hard cut-off, which they'll need to handle gracefully. If third parties can trigger renewal prompts, that creates a notification/redirect flow that needs design.

**Q3: Is there a consent receipt or audit trail exposed to customers?**
Can customers see a history of what data was accessed, by whom, and when — not just what they consented to?

*Why it matters:* "Meaningful control" (stated aim) typically implies visibility into actual access, not just the permission grant. This is also becoming a regulatory expectation in open banking regimes. If we want this, the API needs to log access events in a customer-visible way.

### Enriched Insights — Risk and Readiness

**Q4: Have the enriched insights been validated for accuracy and bias at the customer level?**
Estimated monthly income and 90-day projected balances are model outputs. What is the known accuracy range? Have they been tested across different customer segments (irregular income, joint accounts, recently opened accounts)?

*Why it matters:* This is the highest-risk data tier. If a third party makes a lending, pricing, or eligibility decision based on an inaccurate income estimate we provided, the enterprise could face reputational harm, complaints, or regulatory scrutiny — even if the third party made the decision. Exposing these externally is a materially different risk profile from using them internally.

**Q5: What liability framework applies to enriched insights?**
If a third party relies on our projected balance or income estimate and it's materially wrong, where does liability sit? Is this covered in the accreditation agreement, or does it need a separate data disclaimer/terms layer?

*Why it matters:* Raw transaction data is factual. Enriched insights are opinions/estimates derived from models. The legal and liability treatment needs to be different. This may not have been addressed in the privacy review, which focused on the consent model rather than data quality liability.

**Q6: Should enriched insights be clearly labelled as derived/estimated in the API response?**
Will the API response distinguish between factual data (balances, transactions) and modelled estimates (income, projected balance)?

*Why it matters:* Without clear labelling, third parties might treat estimates as facts. This is both a liability risk and a data quality concern. Industry best practice in open banking is to flag derived data explicitly.

### Accreditation and Access Control

**Q7: What is the specific mechanism for real-time accreditation validation?**
Is there an API we can call on the accreditation authority's side? A signed certificate with an OCSP-like revocation check? A registry we poll and cache?

*Why it matters:* Validating on every API call is the stated requirement, but the feasibility and latency implications depend entirely on what the accreditation authority provides. If it's a slow registry, we may need a caching strategy with a defined staleness tolerance — which means "real-time" needs a precise definition.

**Q8: What happens to in-flight data when accreditation is revoked?**
"Blocked immediately" — does this mean mid-session API calls are terminated? What about data already served in the current session but not yet persisted by the third party?

*Why it matters:* Defines the technical implementation of "immediate" and whether we need session-level controls or just request-level blocking.

**Q9: Is there a process for suspended vs. fully revoked accreditation?**
Some accreditation regimes distinguish between temporary suspension and permanent revocation. Does the API need to handle both states differently (e.g., suspend access but preserve consent grants vs. revoke access and trigger deletion obligations)?

*Why it matters:* If we treat suspension and revocation identically, a temporarily suspended partner loses all consent grants, and customers would need to re-consent when the partner is reinstated.

### Data Deletion Obligation

**Q10: How will deletion compliance be verified?**
The brief states third parties must delete data on revocation. Beyond contractual obligation, is there any verification mechanism planned — attestation, audit rights, technical proof?

*Why it matters:* This is a known weak point in open banking regimes globally. If a breach occurs after revocation and the third party hadn't deleted, the enterprise's exposure depends on whether we had reasonable verification measures. "Trust but don't verify" is a position, but it should be a deliberate one.

**Q11: What is the expected deletion timeframe?**
Is deletion expected to be immediate, or is there a grace period (e.g., 24 hours, 7 days)? Does the third party need to confirm deletion via a callback or attestation endpoint?

*Why it matters:* Affects both the legal agreements and whether the API needs a deletion-confirmation mechanism.

### Privacy and Regulatory

**Q12: Does the Privacy Act review cover derived/analytical data specifically?**
The privacy team reviewed the consent model. Did that review explicitly address sharing model-derived insights (income estimates, projections) as distinct from sharing factual customer data? Some privacy frameworks treat inferred data differently from collected data.

*Why it matters:* If the privacy review assumed all data types were factual customer records, the inclusion of enriched insights may need a supplementary review. Getting this wrong could delay launch.

**Q13: Is there a CDR (Consumer Data Right) or equivalent open banking regulation in scope?**
The brief references Privacy Act but not CDR or any sector-specific open banking regulation. If CDR applies, there are specific technical standards, consent flows, and data holder obligations that constrain design choices significantly.

*Why it matters:* CDR compliance is not optional if it applies, and it prescribes specific API standards, authentication flows (including redirect-based consent), and data standards that would override many design decisions.

### Technical and Operational

**Q14: What is the expected API call volume and latency requirement?**
10 partners at launch — but what are their expected polling patterns? Are they pulling data on-demand when their end user logs in, batch-pulling overnight, or continuously polling?

*Why it matters:* Drives infrastructure sizing, rate limiting strategy, and whether the core banking integrations can handle the load without impacting internal systems.

**Q15: How does the API interact with the core banking system?**
Is there an existing internal API layer or data platform, or does this API need to query core banking directly? What are the availability and latency characteristics of the upstream systems?

*Why it matters:* If the API is a thin proxy over core banking, it inherits all of core banking's availability constraints. If there's a data platform or replica, the architecture is fundamentally different.

**Q16: Is there an existing API gateway, identity provider, or developer portal?**
Or are these all greenfield?

*Why it matters:* Significantly affects the 6-month timeline. Building OAuth infrastructure, a developer portal, and an API gateway from scratch alongside the consent engine and data APIs is aggressive for 6 months.

---

## Suggested Next Steps

1. **Resolve Q12 and Q13 first** — the regulatory posture (Privacy Act only vs. CDR) and the privacy treatment of enriched insights are foundational constraints that affect every downstream design decision.

2. **Pressure-test enriched insights at launch (Q4, Q5, Q6)** — this is where I see the highest risk-to-timeline tension. The enterprise is keen to include them, but the liability, accuracy, and privacy questions could introduce delay if they surface late. A deliberate decision to include, defer, or include-with-caveats should be made early with privacy, legal, and the analytics team in the room.

3. **Clarify the accreditation validation mechanism (Q7)** — this is a hard external dependency. If the accreditation authority doesn't offer a real-time check, the "validate on every call" requirement needs to be re-scoped.

4. **Map the existing technical landscape (Q15, Q16)** — the 6-month feasibility depends heavily on what already exists.

5. **Define the consent sub-type granularity (Q1)** — this is an early UX and data model decision that cascades into API design, consent storage, and privacy compliance.