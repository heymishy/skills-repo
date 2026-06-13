I'll work through this discovery systematically. The input is detailed and well-structured, so I can move directly to artefact production — but before I do, I need to surface several material constraints that the operator brief does not address.

Let me read the regulatory context and product materials before writing sections.

---

**Reading organisational context...**

The context file identifies this operator as a **registered bank in New Zealand** operating under RBNZ and FMA supervision. Several regulatory frameworks are directly triggered by this initiative. I'll surface these as constraints and assumptions throughout.

**Product context:** No `product/` directory referenced — I'll surface missing fields as `[UNKNOWN — requires clarification]`.

**Reference materials:** No `artefacts/` reference folder referenced — proceeding without pre-population.

**EA registry:** `architecture.ea_registry_authoritative` not confirmed in input — treating as Path B (no blast-radius query).

---

## Pre-artefact constraint notice

Before producing the artefact, I need to flag that this initiative triggers **five regulatory constraint clusters** that the brief does not address. These will appear as labelled assumptions in the artefact and drive a mandatory `/clarify` recommendation at the end.

I'm also flagging one **material scope risk** the operator should read before approving:

> ⚠️ **Enriched insights — credit information risk:** The brief describes enriched insights (spending categories, estimated monthly income, 90-day projected balance) as "not raw data from our core banking system." However, estimated income and projected balance are **derived creditworthiness indicators**. Under the Credit Contracts and Consumer Finance Act (CCCFA) and the Privacy Act 2020, derived financial assessments that could influence credit decisions carry specific obligations — including around accuracy, correction rights, and whether they constitute "credit information" under the Privacy Act. Sharing these with third parties who may use them in credit or lending decisions is a materially different risk profile from sharing raw transaction history. This is flagged as an `[ASSUMPTION]` requiring legal review before enriched insights are included in launch scope.

---

# Discovery Artefact

**Feature:** Consent Management API — Open Banking Data Access
**Slug:** `2025-07-15-consent-management-api-open-banking`
**Status:** Draft — Pending Approval
**Date:** 2025-07-15

---

## Problem Statement

Accredited third-party fintechs, comparison services, and financial aggregators currently have no governed, programmatic mechanism to access customer financial data held by the bank. Where data sharing occurs today, it relies on customers sharing credentials (screen-scraping), which the bank has no visibility over, no ability to audit, and no mechanism to revoke. This creates uncontrolled data egress, no audit trail of what data left the bank and when, and no meaningful customer control.

The bank's open banking programme requires a consented, auditable, accreditation-gated API that gives customers genuine granular control — and gives the bank visibility and governance over every data disclosure event.

**Who experiences it and when:** Customers who want to use third-party financial tools today have no safe mechanism. Third parties who want to build on bank data have no legitimate channel. The bank's compliance and privacy teams have no audit trail of what data has been shared.

**Cost of non-resolution:** Continued credential sharing exposes the bank to reputational risk and potential Privacy Act liability. The absence of an open banking API excludes the bank from a regulatory and competitive trajectory that peer institutions are already on.

---

## Personas

| Persona | Role | When they encounter the problem | Impact |
|---|---|---|---|
| **Retail banking customer** | Account holder (personal or small business) | When attempting to connect a third-party tool (budgeting app, comparison service, mortgage broker portal) | No safe consent mechanism — defaults to credential sharing or exclusion |
| **Accredited third-party developer** | Fintech, aggregator, or comparison service holding accreditation | When building a financial data integration on top of bank data | No programmatic API — cannot build compliant integrations |
| **Bank privacy and compliance officer** | Internal — Privacy Act and regulatory obligation owner | After a data-sharing event they were not informed of | No visibility, no audit trail, no revocation capability |
| **Bank open banking programme owner** | Internal — initiative sponsor | Programme delivery gate | No governed channel to offer partners; programme cannot progress |

*[ASSUMPTION] Small business / sole trader customers may have different consent and data sensitivity requirements from retail personal account holders — unconfirmed, requires /clarify before scope is locked.*

---

## Why Now

The bank's open banking programme has reached a stage where an initial partner cohort (10 accredited third parties) is ready to onboard. The 6-month launch target is programme-driven. There is also a regulatory direction of travel — open banking frameworks are being implemented across the New Zealand and Australian financial sector — that creates strategic urgency to establish a governed consent infrastructure before external mandates impose one.

Additionally, continued exposure to credential-sharing practices carries increasing Privacy Act 2020 risk as enforcement activity in New Zealand matures.

---

## MVP Scope

**In scope for initial launch (10-partner cohort, 6 months):**

1. **Consent grant and management** — Customer-facing flows in the member portal to grant, review, and revoke consent, with granular selection of data types and third party
2. **Consent data store** — Durable record of every consent grant, amendment, and revocation with full audit trail
3. **Accreditation validation** — Real-time validation of third-party accreditation status on each API call; immediate block on accreditation loss
4. **Data delivery API** — Authenticated, consent-scoped API delivering the four data types to accredited third parties: transaction history (12 months), account balances and available credit, credit card summaries, and enriched insights
5. **Revocation enforcement** — On revocation, data deletion obligation is surfaced to the third party via API response and audit-logged; deletion confirmation mechanism is required
6. **Time-limit enforcement** — Consent grants expire at 12 months maximum; expiry triggers the same revocation flow as manual revocation

**Explicitly deferred from MVP (see Out of Scope):**

- Consent portability or transfer between third parties
- Bulk or programmatic consent management for business customers
- Expansion beyond the initial 10-partner accredited cohort (partner count scaling)
- New enriched insight types beyond the three named (spending categories, estimated income, 90-day projected balance)

---

## Out of Scope

1. **Business / commercial account data sharing** — The MVP targets personal retail account holders. Business account consent and data sharing involve different legal entity structures, authority delegation, and data sensitivity. Deferred to a subsequent phase.

2. **Write access / action initiation** — The API is read-only data sharing under consent. Payment initiation, direct debit mandates, or any action-initiation capability (common in PSD2-style open banking) is not in scope for this initiative.

3. **Consent portability between third parties** — A customer consenting to Party A cannot transfer that consent to Party B. Each consent grant is bilateral (customer ↔ named third party). Consent transfer or delegation is deferred.

4. **Third-party data deletion verification** — The bank will surface the deletion obligation on revocation. Audit verification that the third party has actually deleted data (e.g. deletion certificates, third-party audit rights) is a downstream compliance workstream, not in MVP scope.

5. **Enriched insights model governance and validation** — The analytics engine producing enriched insights is treated as an existing system in this scope. Model governance, backtesting, and CPG 220 validation of the underlying models are not in scope for the consent API project — but see Constraints below for the hard gate this creates.

6. **SWIFT or payment channel modification** — This initiative does not touch payment rails, correspondent bank arrangements, or transaction settlement. No RBNZ BS11 notification is triggered by payment rail changes in this project.

---

## Assumptions and Risks

### Unconfirmed assumptions (require /clarify)

[ASSUMPTION] The Privacy Act 2020 (NZ) disclosure obligations for sharing **enriched insights** (estimated income, projected balance) with third parties have been assessed as equivalent to sharing raw transaction data — unconfirmed, requires /clarify before scope is locked. *(Risk: enriched insights may constitute derived credit information with additional obligations under Privacy Act 2020 Information Privacy Principle 11 and CCCFA.)*

[ASSUMPTION] The accreditation authority whose status the API will validate in real-time is an existing, operational body with a published API or data feed for accreditation status — unconfirmed, requires /clarify before scope is locked. *(Risk: if the accreditation authority has no machine-readable status feed, real-time per-call validation cannot be implemented as described.)*

[ASSUMPTION] The enriched insights analytics engine has completed CPG 220 (or equivalent RBNZ-accepted) model risk validation — unconfirmed, requires /clarify before scope is locked. *(Risk: if the underlying models have not been independently validated, including them in the launch scope may breach CPG 220 obligations if any third party uses enriched insights in credit decisioning. This is a hard go-live gate.)*

[ASSUMPTION] Customer consent granted through the member portal constitutes valid, informed consent under Privacy Act 2020 IPP 2 (collection for a lawful purpose) and IPP 11 (disclosure) for all four data types including enriched insights — unconfirmed, requires /clarify before scope is locked. *(Risk: consent notice wording and granularity must satisfy the Act's requirements; privacy team "comfortable with the approach" at a model level is not the same as signed-off consent notice wording.)*

[ASSUMPTION] Third parties receiving enriched insights (estimated income, 90-day projected balance) are not using them as inputs to credit or lending decisions — unconfirmed, requires /clarify before scope is locked. *(Risk: if they are, the bank may have Credit Reporting Privacy Code obligations regarding the accuracy, correction, and auditing of the derived values shared.)*

[ASSUMPTION] The 6-month launch deadline is compatible with the RBNZ BS11 notification window — unconfirmed, requires /clarify before scope is locked. *(See Constraints — BS11 30-business-day window may already be running or may not yet have been opened.)*

[ASSUMPTION] Data delivered through the consent API does not flow through any cross-border channel that would trigger RBNZ FX transaction reporting or AML/CFT obligations on the NZ leg — unconfirmed, requires /clarify before scope is locked. *(Risk: if any accredited third party is domiciled offshore, the data delivery may constitute a cross-border disclosure with implications under Privacy Act 2020 IPP 12 (transborder data flows) and potentially AML/CFT reporting obligations if the data is used in a transaction context.)*

[ASSUMPTION] The data deletion obligation imposed on third parties on revocation is enforceable through the accreditation agreement — unconfirmed, requires /clarify before scope is locked. *(Risk: if the accreditation agreement does not include a contractual deletion obligation, the bank cannot enforce it regardless of what the API signals.)*

### Confirmed risks (operator-stated or context-file sourced)

- **Enriched insights accuracy:** Estimated income and projected balance are model outputs. If a third party or customer relies on them for a financial decision and the model is materially wrong, the bank carries reputational and potentially Privacy Act accuracy obligation risk.
- **Accreditation status latency:** Real-time per-call validation is described as the design intent — but if the accreditation authority's system is slow or unavailable, it creates API latency and availability risk on every call.
- **6-month timeline:** Given the regulatory constraint surface (BS11, Privacy Act consent notice sign-off, CPG 220 model gate), the 6-month target is aggressive. If any hard regulatory gate is not already in progress, the timeline may not be achievable.

---

## Directional Success Indicators

| Indicator | Baseline | Target | Measurement |
|---|---|---|---|
| **API availability for accredited partners** | No API exists today | ≥ 99.5% uptime during business hours for launch cohort | API monitoring / SLA reporting |
| **Customer consent grant completion rate** | [UNKNOWN BASELINE] — no prior consent flow exists | ≥ 70% of customers who initiate consent grant complete it without abandonment | Member portal funnel analytics |
| **Consent revocation latency** | [UNKNOWN BASELINE] | Revocation effective within 60 seconds of customer action (third party blocked on next API call) | Consent store / API gate logs |
| **Accreditation validation accuracy** | [UNKNOWN BASELINE] | 0 API calls succeeding for a third party whose accreditation has lapsed | Accreditation check logs vs. authority status feed |
| **Partner onboarding to first successful API call** | [UNKNOWN BASELINE] — no prior partner API onboarding | ≤ 5 business days from accreditation confirmation to first successful API call | Partner onboarding tracking |
| **Data minimisation compliance** | [UNKNOWN BASELINE] | 0 instances of data returned beyond the consented data types (verified by automated API response audit) | API response audit log |

---

## Constraints

**Regulatory constraints (sourced from injected regulatory context — RBNZ registered bank, NZ jurisdiction):**

**RBNZ BS11 — Material change notification**
The consent management API represents a new data access channel interfacing with core banking system data (transaction history, balances, credit card summaries). This is a material change to data access architecture at a registered bank. RBNZ must be notified at least **30 business days before any irreversible project activity begins**. If infrastructure provisioning, data pipeline work, or API development has already commenced, the notification window must be opened immediately.
> *[ASSUMPTION] The RBNZ BS11 notification has not yet been filed — unconfirmed. If it has been filed, this constraint is resolved; confirm with RBNZ relationship team.*

**Privacy Act 2020 (NZ) — IPP 11 (disclosure) and IPP 12 (transborder data flows)**
Every data disclosure to a third party requires valid consent under IPP 11. If any accredited third party is domiciled outside New Zealand, IPP 12 (transborder data flow obligations) applies and must be assessed per third party before data sharing commences.
> The privacy team's review of the consent model is noted — but this must extend to signed-off consent notice wording for each data type, including enriched insights.

**CCCFA — Credit contract record retention**
The data delivery API will expose credit card summaries (statement balances, payment due dates, utilisation). These touch consumer credit data. Any consent audit logs and data delivery records relating to credit contract data must be retained for **7 years from the end of the credit contract**, not 7 years from the API call. The data retention architecture must satisfy this requirement.

**CPG 220 — Model risk validation (hard go-live gate)**
The enriched insights tier (spending categories, estimated monthly income, 90-day projected balance) is generated by the bank's internal analytics engine. If any of these outputs could be used by a third party in a credit, lending, or risk decisioning context, CPG 220 requires independent model validation before the model is activated in customer-facing use. **This is a hard gate: enriched insights cannot go live on day one if the underlying models have not completed independent validation with CRO sign-off.** This constraint directly threatens the operator's stated intention of including enriched insights from day one of launch.

**DIA Payment Services Regulations 2021**
The consent API creates a new data access service type. If any of the data types (or their use by third parties) constitute a new payment service under the Payment Services Regulations, DIA registration must be assessed and confirmed (or exemption confirmed) before customer-facing piloting. This is most likely to be relevant if third parties use account balance or transaction data to initiate payment instructions.

**Accreditation framework**
The brief states third parties must be accredited by "a designated accreditation authority." The identity and legal status of this authority is not confirmed in the input. The accreditation framework's legal basis, the bank's obligation to validate against it, and the contractual terms imposed on accredited third parties (including data deletion obligations) must be confirmed before the API is designed around it.
> *[ASSUMPTION] The designated accreditation authority is an existing, operational body with a machine-readable accreditation status feed — unconfirmed.*

**Technical / programme constraints (operator-stated):**
- Launch target: **6 months** to initial 10-partner cohort
- Enriched insights must be available **from day one** (operator-stated, but subject to CPG 220 gate above)
- Consent management UI to be delivered through the **existing member portal** (integration constraint on portal team capacity)
- Third-party data deletion on revocation must be enforced — mechanism and auditability to be confirmed

---

## Architecture / Technical Context

**Systems touched (inferred from scope):**
- Core banking system — read access for transaction history, balances, credit card data
- Internal analytics engine — source of enriched insights (spending categories, estimated income, projected balance)
- Member portal — customer-facing consent grant / revocation UI
- Accreditation authority — external, real-time accreditation status validation
- Third-party API consumers — 10 accredited partners at launch

**Known integration risk:**
The enriched insights data originates from an internal analytics engine that is architecturally separate from the core banking system. The API will need to aggregate data from at least two internal sources per API call. Latency, consistency, and failure-mode behaviour (e.g. analytics engine unavailable — does the API return partial data or fail closed?) must be defined before API contract is published to partners.

**EA registry:** EA registry authoritative flag not confirmed in context.yml — no blast-radius query performed. Recommend running `getBlastRadius()` against the core banking system and analytics engine system IDs before finalising scope, as downstream consumer count may affect change governance.

---

## Regulatory Constraint Summary

| Framework | Triggered | Status | Hard gate? |
|---|---|---|---|
| RBNZ BS11 — Material change notification | Yes — new data access channel on core banking data | [ASSUMPTION] Not yet filed | Yes — must be filed before irreversible project activity |
| Privacy Act 2020 (NZ) — IPP 11 / IPP 12 | Yes — disclosure of customer financial data to third parties; potential transborder flows | Partial — privacy team reviewed model, not consent notice wording | Yes — consent notice wording must be signed off per data type |
| CCCFA — Credit record retention | Yes — credit card summary data is consumer credit data | [UNKNOWN BASELINE] | No hard gate on project, but architecture must satisfy 7-year retention |
| CPG 220 — Model risk validation | Yes — enriched insights are ML/analytics model outputs | [ASSUMPTION] Not yet validated | **Hard go-live gate** — enriched insights cannot launch without CRO-level sign-off on model validation |
| DIA Payment Services Regulations 2021 | Possible — new data service type | Not assessed | Yes — assessment and exemption confirmation required before customer pilot |
| Privacy Act 2020 — IPP 12 transborder | Possible — if any of the 10 partners are offshore-domiciled | Not assessed per partner | Yes — per-partner assessment required before data sharing commences |

---

## Attribution

**Contributors:**
- [Operator name not provided] — Open Banking Programme Owner — 2025-07-15

**Reviewers:**
- Pending

**Approved By:**
- Pending

---

## /clarify recommendation

This discovery contains **8 unconfirmed assumptions** that materially affect scope, go-live viability, and regulatory compliance. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. [ASSUMPTION] Privacy Act 2020 disclosure obligations for enriched insights (estimated income, projected balance) assessed as equivalent to raw transaction data — unconfirmed
2. [ASSUMPTION] Accreditation authority is an existing, operational body with a machine-readable accreditation status feed — unconfirmed
3. [ASSUMPTION] Enriched insights analytics engine has completed CPG 220 model risk validation — unconfirmed *(this is a hard go-live gate for the enriched insights tier)*
4. [ASSUMPTION] Customer consent via member portal constitutes valid Privacy Act 2020 IPP 2 / IPP 11 consent for all four data types including enriched insights — unconfirmed
5. [ASSUMPTION] Third parties receiving enriched insights are not using them in credit or lending decisions — unconfirmed
6. [ASSUMPTION] The 6-month launch deadline is compatible with the RBNZ BS11 30-business-day notification window — unconfirmed *(if project activity has already commenced, this notification may already be overdue)*
7. [ASSUMPTION] Data delivery does not flow through cross-border channels triggering AML/CFT or FX reporting obligations �� unconfirmed
8. [ASSUMPTION] Third-party data deletion obligation on revocation is enforceable through the accreditation agreement — unconfirmed

**The CPG 220 assumption (item 3) is the highest-priority item.** The operator's stated intent to include enriched insights from day one of launch cannot be confirmed until independent model validation with CRO sign-off is complete. If this validation is not in progress, the enriched insights tier should be descoped from the 6-month MVP and treated as a fast-follow release.

**The BS11 assumption (item 6) is time-critical.** If the notification has not been filed and irreversible project activity has commenced (or is about to), the notification must be filed immediately. The 30-business-day window cannot be shortened.

---

> **Discovery draft complete ✓**
>
> This artefact has a high regulatory constraint density. Before approving and moving to `/benefit-metric`, I strongly recommend running `/clarify` — particularly to resolve the CPG 220 model validation gate and the BS11 notification status, both of which could materially affect the 6-month launch timeline and the enriched insights day-one scope.
>
> How do you want to proceed?
> 1. Run `/clarify` now (strongly recommended given CPG 220 and BS11 open items)
> 2. Review and approve without `/clarify` — skip to sign-off
>
> Reply: 1 or 2

---

> **Before we close — estimate prompt (E1):**
> Run `/estimate` to record a rough focus-time forecast for this feature. This seeds the normalisation model for calibration at `/improve`.
> Reply: `/estimate` — or `skip` to continue without an estimate

---

*Pipeline state will be updated to `stage: discovery`, `health: green`, `regulated: true`, `complianceProfile: "regulated"` upon approval. Compliance frameworks to be seeded in guardrails: `CF-RBNZ-BS11`, `CF-PRIVACY-ACT-2020`, `CF-CCCFA`, `CF-CPG220`, `CF-DIA-PAYMENT-SERVICES`.*

<!-- eval-mode: true -->