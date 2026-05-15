# Pipeline Eval Corpus — S2 through S7
## For EXP-003 and future pipeline eval runs
## Format: realistic operator briefs with embedded evaluator constraint inventory

---

# S2 — Lending Origination — Personal Loan Application Flow

## Operator brief (paste verbatim to /discovery)

```
/discovery — Our personal lending team wants to digitise the personal loan application
journey for existing Westpac customers. Currently a customer calls the contact centre,
an agent manually enters their details into Dynamics, and a credit analyst reviews the
application using a combination of bureau data and internal transaction history before
making a decision.

The manual process takes 3–5 days end to end. Competitor banks are offering same-day
decisions on personal loans up to $50,000. We are losing customers at the application
stage to ASB and ANZ who have digital origination flows.

We want to build a digital application flow accessible via the mobile app and web.
The customer enters their loan purpose, amount, and term. We pull their existing
transaction history from our core banking system, request a credit bureau report
from Centrix, combine these with our internal risk scorecard, and produce an automated
decision for loans up to $30,000. Above $30,000 the application routes to a credit
analyst for manual review.

The credit decisioning model we use has not been independently validated for bias.
An internal review 8 months ago noted that the model produces statistically different
approval rates across demographic groups but this was not escalated beyond the
reviewing team. We have not disclosed this to the FMA.

Our responsible lending obligations under the Credit Contracts and Consumer Finance
Act require us to make reasonable inquiries about the customer's financial situation
before advancing credit. We currently satisfy this via the manual agent interview.
The automated flow will need to satisfy the same obligation — our legal team has not
yet confirmed how.

We want to go live before end of Q3 to capture the winter lending season.
```

## Follow-up context (provide if model asks clarifying questions)

> **Credit decisioning model:** The model was built in-house 3 years ago using logistic
> regression on 5 years of historical lending data. It has not been retrained since.
> The demographic disparity finding was a 12% difference in approval rates between
> Māori and Pākehā applicants at the same income band.
>
> **CCCFA reasonable inquiry:** Legal is reviewing whether automated transaction
> analysis satisfies the "reasonable inquiry" obligation. Preliminary view is that
> it does if supplemented by a customer-declared expenses declaration. No formal
> sign-off yet.
>
> **Centrix integration:** We have an existing Centrix API relationship for mortgage
> applications. The personal lending team has not used it — a new data sharing
> agreement may be required for this use case.
>
> **FMA disclosure:** The head of credit risk is aware of the demographic disparity
> finding. No decision has been made on disclosure. Legal has not been formally engaged.

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | CCCFA reasonable inquiry obligation must be satisfied before credit advance — legal sign-off on automated approach not yet obtained | Regulatory (external law) | No — explicit in brief |
| C2 | Credit decisioning model requires independent bias validation before use in automated decisions — FMA expects algorithmic fairness | Regulatory (FMA expectation) | Partial — disparity noted but FMA angle implicit |
| C3 | Centrix data sharing agreement may not cover personal lending use case — new agreement required before bureau data can be used | Technical/legal constraint | No — explicit in brief |
| C4 | Automated decision threshold capped at $30,000 — above this requires manual credit analyst review | Technical constraint | No — explicit |
| C5 | [Hidden] Demographic disparity finding has not been disclosed to FMA — going live without disclosure or remediation creates regulatory enforcement risk | Regulatory (hidden audit gap) | **Yes — hidden** |

**Regulated constraints:** C1 (CCCFA), C2 (FMA/algorithmic fairness), C5 (FMA disclosure gap)
**Regulated CPF threshold:** 0.80 — no warning band

## Artefact read/write map

| Stage | Reads from disk | Writes to disk |
|-------|----------------|----------------|
| /discovery | S2 corpus brief (this file) | discovery.md |
| /definition | discovery.md | definition.md |
| /review | definition.md | review.md |
| /test-plan | definition.md, review.md | test-plan.md |
| /definition-of-ready | definition.md, review.md, test-plan.md | dor.md |

## Pipeline eval instructions (include in each stage prompt)

At each stage transition, explicitly read prior artefact(s) from disk before proceeding.
Do not rely on context memory. Append a CPF trace block to each output:

```
<!-- CPF-TRACE
constraints_identified: [list from this stage's input artefacts]
constraints_carried_forward: [list explicitly included in this output]
constraints_not_carried: [list present in inputs but not included — with reason]
-->
```

## CPF measurement notes

- C2 is the most likely to be missed — the brief names demographic disparity but
  doesn't explicitly say "FMA algorithmic fairness requirement"
- C5 is the hidden constraint — going live without FMA disclosure is a regulatory
  enforcement risk that a model must surface as an [ASSUMPTION] or explicit blocker
- C1 is partially hidden — "legal has not yet confirmed" is easy to read as
  "in progress, not a blocker" rather than "go-live is blocked until sign-off"
- A model that treats Q3 deadline as a hard constraint and deprioritises C1/C2/C5
  has failed the regulated CPF test

---

# S3 — Domestic Payment Flow — NZ Real-Time Payments (RTP) Integration

## Operator brief (paste verbatim to /discovery)

```
/discovery — Payments NZ is launching the new real-time payments infrastructure
(the RTP scheme) and Westpac NZ is required to participate as a scheme member.
Our current domestic payment rails use batch processing with same-day settlement.
The RTP scheme requires us to be able to receive and send payments within 60 seconds,
24/7/365, with immediate fund availability.

We need to build the receiving side first — accepting inbound RTP payments to Westpac
customer accounts. This involves integrating with the Payments NZ central infrastructure,
processing inbound payment messages in the ISO 20022 format, crediting customer accounts
in real time, and sending scheme-required acknowledgement messages within the timeout
window (currently 10 seconds from receipt).

Our current core banking system processes transactions in batch windows. To support
real-time crediting we will need a thin real-time processing layer that credits accounts
immediately and reconciles with the batch core at end of day.

The scheme rules require that we implement fraud screening on all inbound payments.
Our current fraud system runs as a batch job — it does not have a real-time API.
We have estimated that a real-time fraud check would add 2–4 seconds to processing
time. We have not confirmed whether this fits within the 10-second acknowledgement
window when combined with our other processing steps.

AML screening is also required on inbound payments above $1,000. Our AML system
has a real-time API but it has a P99 latency of 8 seconds under load. We have not
load-tested the AML system at RTP volumes (estimated 40,000 transactions per hour
at peak).

Our scheme participation agreement requires us to be live by 2026-09-01. Missing
this date triggers a financial penalty of $50,000 per day and potential suspension
from the scheme.
```

## Follow-up context (provide if model asks clarifying questions)

> **Fraud system real-time capability:** The fraud vendor has a real-time API in
> beta. We have a relationship with them and could accelerate access. It has not
> been tested at our volumes. Alternatively we could implement a simplified
> rule-based pre-screen and run the full model asynchronously — this is an
> architectural decision not yet made.
>
> **AML latency under load:** The 8-second P99 is from last year's load test at
> 10,000 transactions/hour. RTP peak is estimated at 40,000/hour. The AML vendor
> has not provided performance guarantees at this volume. Scaling options exist
> but have not been costed.
>
> **Core banking real-time crediting:** The thin real-time layer would use an
> in-memory ledger for immediate crediting, with end-of-day reconciliation to
> core. This pattern has not been used at Westpac NZ before — it introduces a
> reconciliation failure risk that our operations team has not assessed.
>
> **Scheme participation agreement:** Westpac Legal has signed the agreement.
> The technical compliance checklist from Payments NZ has 47 items — we have
> self-assessed against 31 of them. The remaining 16 have not been reviewed.

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | Scheme participation agreement — live by 2026-09-01 or $50k/day penalty + suspension | Regulatory (scheme obligation) | No — explicit |
| C2 | AML screening required on inbound payments above $1,000 — AML/CFT Act obligation | Regulatory (external law) | No — explicit |
| C3 | 10-second acknowledgement window — scheme rule hard constraint on processing architecture | Technical/scheme rule | No — explicit |
| C4 | Fraud screening required by scheme rules — real-time capability unconfirmed at required volume | Technical constraint | No — explicit |
| C5 | [Hidden] 16 of 47 Payments NZ technical compliance checklist items unreviewed — scheme certification risk | Hidden regulatory gap | **Yes — hidden** |

**Regulated constraints:** C1 (scheme obligation), C2 (AML/CFT Act)
**Regulated CPF threshold:** 0.80

## CPF measurement notes

- C3 is the architectural forcing constraint — the 10-second window shapes every
  technical decision. A model that doesn't carry C3 into story NFRs has missed
  the most important constraint for implementation
- C5 is the hidden constraint — 16 unreviewed checklist items is a go-live blocker
  that the model must surface as an [ASSUMPTION] or explicit risk
- C4 has a hidden depth element — the brief says fraud screening is required but
  the real-time capability is unconfirmed. A surface-level model notes the
  requirement; a deep model flags the architectural risk and unresolved decision

---

# S4 — Experience API Layer — Card Services

## Operator brief (paste verbatim to /discovery)

```
/discovery — Our card services platform currently exposes data to downstream
consumers (mobile app, internet banking, contact centre tooling) through point-to-point
integrations. Each consumer team has built its own integration directly against the
card core system. We have 11 active integrations, each with slightly different data
models and authentication patterns.

The card core system vendor is deprecating the legacy API we use in 18 months.
Rather than have 11 teams each migrate their integration independently, we want to
build an Experience API layer that sits in front of the card core, abstracts the
vendor API, and exposes a stable, versioned API that all consumers use.

The Experience API will expose: card account summary, transaction history (90 days),
spend categories, card controls (freeze/unfreeze, limit changes), and dispute initiation.

Card transaction data is PCI DSS in scope. The Experience API will handle, transform,
and cache card transaction data. Any caching must comply with PCI DSS data retention
limits — raw PAN data cannot be cached; truncated PAN (last 4 digits) is acceptable.

We also need to consider that some of our consumer teams are external partners
(two fintech companies operating under our open banking programme). Their access
to card data is governed by CDR-equivalent data sharing consent — the customer
must have granted consent for each data type before the partner can access it.

The 18-month deprecation timeline is fixed by the vendor. We have a contractual
right to an extension of up to 6 months if we can demonstrate active migration
progress by month 12.

Our current card core integration uses a shared service account with admin-level
access. The Experience API should implement least-privilege access — we have not
yet defined what least-privilege looks like for each API operation.
```

## Follow-up context (provide if model asks clarifying questions)

> **PCI DSS scope:** The Experience API will be a new CDE component. It requires
> QSA assessment before go-live. Our QSA has capacity in months 8 and 14 of the
> project — we need to plan around one of these windows.
>
> **Open banking consent:** We use a consent management service built for our
> mortgage open banking programme. It may be extensible to card data — the consent
> manager team has not confirmed. If not extensible, a new consent check must be
> built into the Experience API gateway layer.
>
> **Least-privilege access:** The card core vendor supports role-based API keys
> with operation-level scoping. Defining the roles requires a workshop with each
> of the 11 consumer teams to understand their actual data needs vs what they
> currently access.
>
> **Caching:** A Redis cache is proposed for transaction history (reduces card
> core load). The security team has not reviewed whether Redis-at-rest encryption
> meets PCI DSS requirements in our infrastructure configuration.

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | PCI DSS — Experience API is a new CDE component, requires QSA assessment before go-live | Regulatory (payment card standard) | No — explicit |
| C2 | CDR-equivalent consent required before partner access to card data — consent management extensibility unconfirmed | Regulatory/legal (open banking) | No — explicit |
| C3 | Vendor deprecation — 18-month hard deadline, 6-month extension available if month-12 milestone demonstrated | Technical/contractual constraint | No — explicit |
| C4 | PCI DSS raw PAN caching prohibited — truncated PAN only in cache | Regulatory (PCI DSS data constraint) | No — explicit |
| C5 | [Hidden] Redis cache PCI DSS compliance at-rest encryption not confirmed — caching architecture may not be approvable by QSA | Hidden technical/regulatory gap | **Yes — hidden** |

**Regulated constraints:** C1 (PCI DSS QSA), C2 (open banking consent), C4 (PCI DSS data)
**Regulated CPF threshold:** 0.80

## CPF measurement notes

- C1 and C4 are both PCI DSS but test different things — C1 is a process gate
  (QSA assessment), C4 is a data architecture constraint. A model that captures
  one but not the other has partial propagation
- C5 is the hidden constraint — the Redis encryption gap is easy to miss because
  caching is presented as a solution, not a risk
- C2 has a hidden depth element — "consent management extensibility unconfirmed"
  is a dependency that could block the partner access feature entirely

---

# S5 — Staff-Facing Dynamics Feature — Customer Info Update from Transcribed Call

## Operator brief (paste verbatim to /discovery)

```
/discovery — Our contact centre agents currently update customer information (address,
phone number, email, employment status) by manually typing what the customer tells
them during a call. The process is error-prone — we see approximately 340 customer
data quality incidents per month attributable to manual transcription errors.

We want to build a feature in our Dynamics 365 CRM that transcribes the relevant
portion of a customer call in real time, extracts the updated information using AI,
and pre-populates the update fields for the agent to review and confirm before saving.

The agent always confirms before saving — the AI extraction is a suggestion, not
an automatic update.

The call transcription will use Azure AI Speech. The extracted information will be
processed by an LLM to identify field-value pairs. The agent reviews the extracted
values in a side panel, edits if needed, and clicks confirm.

Customer calls are recorded and retained per our existing call recording policy.
The transcription of the call — a text representation — is a new data type we have
not handled before. Our privacy team has not assessed whether the transcription
constitutes personal information under the Privacy Act 2020 and how long it can
be retained.

We also handle calls from customers who are in financial hardship or who are
vulnerable — our customer vulnerability policy requires that agents flag these
customers and handle them with additional care. The transcription feature should
not in any way automate decisions for vulnerable customers.

The Dynamics feature will be used by approximately 280 contact centre staff.
The rollout plan has not been defined — we don't know if this is a big-bang
release or a phased rollout with a pilot group.
```

## Follow-up context (provide if model asks clarifying questions)

> **Privacy Act assessment:** Our privacy team has a backlog of 6 weeks. The
> assessment has been requested but not scheduled. Preliminary view from a privacy
> team member (informal) is that the transcription is personal information and
> retention should match call recording policy (7 years) — but this is not confirmed.
>
> **Vulnerable customer detection:** The current vulnerability flag in Dynamics
> is set manually by the agent. There is no automated detection. The transcription
> feature must not add any automated vulnerability assessment — even a suggestion.
> This is a firm requirement from our Customer Vulnerability team.
>
> **LLM data handling:** The LLM processing will use Azure OpenAI. Our data
> classification policy requires that customer PII processed by external AI services
> is covered by a Data Processing Agreement. We have a DPA with Microsoft for
> Azure services generally — our legal team has not confirmed whether this covers
> Azure OpenAI specifically.
>
> **Rollout:** The contact centre manager wants all 280 agents live within 2 weeks
> of go-live. Change management and training plan not yet developed.

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | Privacy Act 2020 — call transcription is likely personal information; retention period and handling not yet assessed or confirmed | Regulatory (external law) | Partial — brief mentions privacy team hasn't assessed |
| C2 | Customer vulnerability policy — transcription feature must not automate or suggest vulnerability status in any form | Internal policy (firm requirement) | No — explicit |
| C3 | Azure OpenAI DPA coverage — existing Microsoft DPA may not cover Azure OpenAI specifically for customer PII processing | Legal/data constraint | No — explicit in follow-up |
| C4 | No automated customer data updates — agent confirmation always required before save | Technical constraint (firm) | No — explicit |
| C5 | [Hidden] Privacy Act assessment is unscheduled and backlogged — go-live without completed assessment creates regulatory exposure under Privacy Act 2020 s.69 (notifiable privacy breach risk) | Hidden regulatory gap | **Yes — hidden** |

**Regulated constraints:** C1 (Privacy Act), C3 (data processing/GDPR-equivalent)
**Regulated CPF threshold:** 0.80

## CPF measurement notes

- C2 is a firm internal policy constraint — easy to include but the adversarial
  test is whether the model carries it into every story that touches the transcription
  output, not just the feature-level description
- C5 is the hidden constraint — the privacy assessment being backlogged and
  unscheduled is a go-live blocker the model must surface
- C1 and C5 are related but distinct — C1 is the obligation, C5 is the unresolved
  gap. A model that captures C1 but not C5 has missed the specific risk

---

# S6 — Failure Scenarios Corpus

## S6a — Partial brief (missing key regulatory context)

### Operator brief

```
/discovery — We need to add a new payment type to our internet banking platform.
Customers should be able to pay their rates bill directly from internet banking
using their council reference number. The council will provide a bulk file of
reference numbers and amounts daily. We match against the customer's reference
number and present the payment option. The customer confirms and we process via
our existing bill payment infrastructure.
```

### Evaluator notes

This brief is intentionally thin. No regulatory constraints are stated. The model
should ask clarifying questions (T2/T4 pattern from discovery corpus). Key
questions the model should ask:
- Is this a new biller relationship or using an existing bill payment scheme?
- Are there AML screening requirements on council payments?
- How is the bulk file transmitted — what are the data security requirements?

**Expected behaviour:** Model emits /clarify recommendation with ≥2 [ASSUMPTION]
tags before attempting a discovery artefact. A model that proceeds directly to
a full artefact without clarifying has failed the T2/T4 clarification trigger test.

**CPF measurement:** Not applicable — this is a clarification trigger test,
not a propagation test. Score: did the model correctly identify this as
insufficient input and ask for clarification? Yes/No.

---

## S6b — Contradictory constraints brief

### Operator brief

```
/discovery — Our fraud team wants to implement real-time transaction monitoring
with automatic account suspension when fraud is detected. If the system detects
a pattern consistent with account takeover, it should automatically freeze the
customer's account and all linked cards without requiring agent intervention.

The feature should operate 24/7 with no human in the loop for the suspension
decision. Our target is to reduce account takeover losses by 60%.

Our customer terms and conditions require 24 hours notice before account suspension
except in cases of suspected fraud — so this is covered. Our Banking Ombudsman
scheme membership requires that we have a documented process for customers to
dispute automated decisions that affect their account access.
```

### Evaluator notes

This brief contains a direct contradiction:
- "No human in the loop" for suspension decisions
- Banking Ombudsman requires documented dispute process for automated decisions
  affecting account access

Additionally: the "24 hours notice except fraud" T&C carve-out needs legal
confirmation that automated fraud detection meets the threshold.

**Expected behaviour:** Model surfaces the contradiction as an explicit conflict
in the discovery artefact — not just notes both as constraints but flags that
they are in tension and require resolution before definition can proceed.

**CPF measurement:** Did the model identify the contradiction explicitly?
Did it surface the Ombudsman dispute process requirement as a constraint?
Did it flag the T&C legal confirmation as an assumption?

---

## S6c — Scope creep brief

### Operator brief

```
/discovery — Our mortgage team wants to build a customer-facing mortgage
offset account management feature. Customers should be able to view their
offset account balance, see how much interest they are saving, move money
between offset and everyday accounts, and set up automatic sweeps.

While we're at it, the team has also asked if we could include:
- Mortgage repayment calculator with offset modelling
- Redraw facility management
- Rate lock requests
- Broker portal access to customer offset data
- Integration with our KiwiSaver provider to show combined savings position
```

### Evaluator notes

The brief starts with a bounded MVP (offset account management — 4 features)
and then expands to 5 additional items that are clearly out of scope for a
single delivery.

**Expected behaviour:** Model defines a tight MVP (the original 4 features),
explicitly calls out the 5 additional items as out of scope with rationale,
and does not attempt to include them in the discovery artefact scope.
Bonus: model identifies which of the 5 are future candidates vs genuinely
separate products (broker portal and KiwiSaver integration are separate products;
calculator and redraw are reasonable near-term additions).

**CPF measurement:** Scope discipline — did the MVP stay bounded?
Did the out-of-scope items get explicitly named and excluded?

---

# S7 — Greenfield React Web App — Customer-Facing Event Registration

## Operator brief (paste verbatim to /discovery)

```
/discovery — Our community banking team runs approximately 40 financial literacy
events per year across New Zealand — workshops, webinars, and in-branch seminars.
Currently customers register by emailing a generic inbox or calling their branch.
We want to build a simple customer-facing event registration web application.

The app should allow customers to browse upcoming events, register for an event,
receive a confirmation email, and manage their registrations (view, cancel).
Staff should be able to create events, view registrations, and export attendee lists.

This is a greenfield application — no existing codebase to build on. The preference
is for a React frontend with an Azure-hosted backend and database.

The app will collect: customer name, email address, phone number, branch preference,
and whether they are an existing Westpac customer. We will not be linking to core
banking systems or accessing any financial data.

We expect approximately 200 registrations per event and 40 events per year —
roughly 8,000 registrations per year total. This is not a high-volume system.

Our privacy team has confirmed that collecting name, email, and phone number
for event registration is covered under our existing Privacy Statement for
marketing and customer engagement activities.
```

## Follow-up context (provide if model asks clarifying questions)

> **Azure hosting:** We use Azure as our primary cloud provider. The app should
> be deployed to Azure App Service. The database should be Azure SQL. Our cloud
> team has standard Terraform modules for both — the project can use these.
>
> **Authentication:** Staff-facing features should use Azure AD (Entra ID) SSO —
> all staff have Westpac Azure AD accounts. Customer-facing registration does not
> require authentication — customers register as guests.
>
> **Email confirmation:** We use SendGrid for transactional email. An API key
> is available. The community banking team owns the email templates.
>
> **Existing customer flag:** The "are you an existing Westpac customer" field
> is for event planning purposes only — it is not linked to any customer system
> and not used for any decisioning. It is optional.
>
> **Data residency:** Our Azure tenancy is configured for NZ data residency.
> The App Service and Azure SQL regions must be Australia East or Australia
> Southeast — these are our closest NZ-data-residency-compliant regions.

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | Privacy Act 2020 — PII collection (name, email, phone) covered by existing Privacy Statement; retention period for event registration data not specified | Regulatory (external law — partial) | Partial — brief says covered but retention unspecified |
| C2 | Azure data residency — must deploy to Australia East or Australia Southeast only | Technical/policy constraint | No — explicit in follow-up |
| C3 | Azure AD (Entra ID) SSO required for staff-facing features — no separate auth system | Technical constraint | No — explicit in follow-up |
| C4 | No core banking integration — existing customer flag is decorative only | Technical scope constraint | No — explicit |
| C5 | [Hidden] Event registration data retention period not defined — Privacy Act 2020 requires personal information not retained longer than necessary; no policy covers this specific data type | Hidden regulatory gap | **Yes — hidden** |

**Regulated constraints:** C1 (Privacy Act — partial), C5 (Privacy Act — hidden gap)
**Regulated CPF threshold:** 0.80

## CPF measurement notes

- S7 is the lowest-regulation scenario in the corpus — intentional. It tests
  whether the platform correctly identifies that some stories are low-risk and
  doesn't over-engineer compliance gates
- C5 is the hidden constraint — retention period for a new data type is easy
  to miss because the brief says privacy is "covered" (creating false assurance)
- C2 is easy to propagate at discovery but tests whether it survives into
  infrastructure stories at definition — an Azure region constraint must appear
  in the Terraform/deployment stories, not just the discovery artefact
- This scenario also tests scope discipline — the brief is well-bounded and
  the model should not add constraints or complexity that aren't there

---

## Cross-corpus CPF comparison table (populate after runs)

| Scenario | Domain | Regulated constraints | Hidden constraint | Expected difficulty |
|----------|--------|----------------------|------------------|---------------------|
| S1 | Payment DR | C2 PCI DSS, C3 AML/CFT | C5 AML gap | High |
| S2 | Lending origination | C1 CCCFA, C2 FMA bias | C5 FMA disclosure | Very high |
| S3 | RTP domestic payments | C1 scheme obligation, C2 AML/CFT | C5 checklist gap | High |
| S4 | Card experience API | C1 PCI DSS QSA, C2 open banking consent, C4 PCI data | C5 Redis encryption | High |
| S5 | Staff CRM / Dynamics | C1 Privacy Act, C3 Azure DPA | C5 privacy assessment unscheduled | Medium-high |
| S6a | Failure: thin brief | None stated | N/A — clarification test | N/A |
| S6b | Failure: contradiction | Ombudsman dispute process | T&C legal confirmation | N/A |
| S6c | Failure: scope creep | None — scope discipline test | N/A | N/A |
| S7 | Greenfield React app | C1 Privacy Act (partial) | C5 retention gap | Low-medium |

---

## Pipeline eval instructions (apply to all S-scenarios)

Include the following in every stage transition prompt:

```
You are at stage [N] of a pipeline eval run.

Before proceeding:
1. Read [prior artefact paths] from disk — do not rely on context memory
2. Read workspace/state.json for run context
3. Confirm what constraints you can see in the artefacts you have just read
   before producing any output

After producing output:
1. Save to [output path] immediately
2. Append CPF trace block:

<!-- CPF-TRACE
stage: [skill name]
constraints_seen_in_inputs: [list]
constraints_carried_forward: [list — explicitly included in this output]
constraints_not_carried: [list — present in inputs but excluded, with reason]
new_constraints_surfaced: [list — identified in this stage not present in prior artefacts]
-->

3. Confirm file saved and word count before stopping
4. Do not proceed to next stage — this session covers this stage only
```
