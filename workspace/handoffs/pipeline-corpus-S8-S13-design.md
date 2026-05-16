# Pipeline Eval Corpus — S8 through S13: Design Specification
## Status: DESIGN ONLY — operator briefs not yet written
## Awaiting: operator confirmation before full brief content is produced

---

## Purpose

This document defines 6 new corpus scenarios (S8–S13) to extend the evaluation
corpus beyond S1–S7. Each entry contains: domain, test type, constraint inventory
design, hidden constraint pattern, difficulty calibration, and the gap in S1–S7
that it fills. Full operator briefs (paste-verbatim, follow-up context) will be
written to `workspace/handoffs/pipeline-corpus-S8-S13.md` after the operator
confirms this design.

---

## S1-S7 coverage analysis (basis for S8-S13 gap fill)

| Domain gap | Gap description | Filled by |
|-----------|----------------|-----------|
| SOX / financial audit trail | No audit trail / change-control-for-reporting scenario | S8 |
| Customer KYC onboarding | AML/CFT Act identity verification at account opening | S9 |
| Legacy decommission / migration | No core banking migration or decommission scenario | S10 |
| Consumer Data Right / consent API | S4 touches CDR tangentially; no CDR-native scenario | S11 |
| AI/ML model deployment governance | S2 has bias finding but AI governance is not the focus | S12 |
| Multi-jurisdiction / cross-border | All S1-S7 are single-jurisdiction (NZ only) | S13 |

**Hiding pattern gaps in S1-S7 (C5 patterns used):**
- Pre-existing technical gap creates new regulatory risk (S1, S4)
- Pre-existing regulatory non-disclosure (S2)
- Incomplete process checklist gap (S3)
- Scheduling/timeline gap blocks go-live (S5)
- Policy coverage gap for new data type (S7)

**New hiding patterns in S8-S13:**
- Change control gap for regulated artefact (S8)
- Vendor SLA gap creates regulatory dependency risk (S9)
- RBNZ notification threshold not assessed (S10)
- Inferred-data consent scope boundary (S11)
- Model governance policy version mismatch (S12)
- Correspondent bank agreement constraint (S13)

---

## S8 — Regulatory Reporting Pipeline (SOX/FMA reporting integrity)

### Domain
Internal finance / regulatory reporting infrastructure.

### Test type
CPF — constraint propagation fidelity

### Brief summary (for design confirmation)
the enterprise wants to automate the monthly regulatory returns it submits to the RBNZ
and FMA. Currently a team of 3 analysts manually extract data from core banking,
reconcile it in Excel, and upload the prescribed return templates. The automation
would replace the extraction and reconciliation steps; analysts would review and
approve the final outputs. The project also wants to add a data transformation
layer that "normalises" some figures to eliminate known artefacts in the source data.

### Constraint inventory design

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | RBNZ Prudential Reporting — prescribed return formats and submission deadlines are legally binding; format changes require RBNZ prior approval | Regulatory (external law) | No — explicit |
| C2 | FMA Financial Reporting Act 2013 — automated regulatory returns must preserve audit trail from source data to submitted figure | Regulatory (external law) | Partial — brief mentions automation, not the audit trail |
| C3 | RBNZ requires human sign-off on regulatory returns — fully automated submission without analyst approval is not permitted | Regulatory/operational constraint | No — explicit |
| C4 | Data transformation layer ("normalisation") changes reported figures — any material change to reported figures requires RBNZ disclosure | Regulatory constraint | Partial — normalisation presented as a good thing |
| C5 | **[Hidden]** The normalisation transformation logic has never been through change control — no version history, no test suite, no audit trail. Applying it in a regulated pipeline creates a material misstatement risk with no way to defend the figures in a supervisory review | Hidden audit/governance gap | **Yes — hidden** |

### Regulated constraints
C1 (RBNZ Prudential Reporting Act), C2 (FMA Financial Reporting Act), C4 (RBNZ disclosure)

### Hidden constraint pattern
Change control gap for a regulated artefact — the normalisation transform is presented
as a technical improvement but it is a financial reporting input with no governance.

### Difficulty
Medium-high

### CPF measurement focus
- C4 is the hardest to carry — normalisation is framed positively; a model that
  carries it as a constraint ("normalisation changes reported figures — RBNZ disclosure
  required for any material change") has done well
- C5 is the hidden constraint — a model that surfaces "the transformation logic must be
  under change control and audit trail before it can be used in a regulated pipeline"
  has identified the deepest risk

---

## S9 — Customer Digital Onboarding / KYC Identity Verification

### Domain
Customer AML/CFT onboarding — digital identity verification via biometric ID check.

### Test type
CPF — constraint propagation fidelity

### Brief summary (for design confirmation)
the enterprise wants to allow new-to-bank customers to open a transaction account
entirely digitally without visiting a branch. Identity verification will use a
third-party biometric service (passport scan + selfie liveness check) that the
vendor claims meets AML/CFT Act identity verification requirements. The account
opens in a "restricted" state until the ID check result is received (typically
30–90 seconds). A manual fallback queue handles edge cases the automated check
cannot process.

### Constraint inventory design

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | AML/CFT Act 2009 — customer due diligence required before account opening; prescribed documents and verification standards | Regulatory (external law) | No — explicit |
| C2 | Financial Action Task Force (FATF) Recommendation 10 — digital identity verification must meet equivalence standards for in-person CDD | Regulatory (FATF guidance) | Partial — digital ID presented as straightforward; FATF equivalence not named |
| C3 | Restricted account state — account may not be used for transactions until CDD is complete; regulatory obligation, not just UX choice | Regulatory constraint | No — explicit |
| C4 | Manual fallback queue — edge cases that cannot be auto-verified must be processed within prescribed timeframe (AML/CFT Act s.22 enhanced due diligence) | Regulatory (external law) | No — explicit |
| C5 | **[Hidden]** The biometric ID vendor has not provided contractual confirmation that their service meets RBNZ/DIA prescribed CDD standards. Using a non-confirmed vendor for CDD creates regulatory exposure — the enterprise remains liable for CDD quality regardless of vendor | Hidden vendor/regulatory gap | **Yes — hidden** |

### Regulated constraints
C1 (AML/CFT Act), C2 (FATF/DIA equivalence), C4 (enhanced CDD timeframe)

### Hidden constraint pattern
Vendor SLA/compliance gap creates regulatory dependency risk — the vendor is presented
as a solution but the question of whether they meet regulatory standards has not been
resolved.

### Difficulty
High

### CPF measurement focus
- C2 is the hardest explicit constraint to carry — FATF equivalence is not intuitive
  and models tend to treat digital ID as technically solved
- C5 is the hidden constraint — a model that asks "has the vendor confirmed DIA/RBNZ
  CDD compliance?" or surfaces "vendor compliance confirmation is a go-live dependency"
  has found the gap

---

## S10 — Core Banking Loan Ledger Migration (legacy decommission)

### Domain
Core banking infrastructure migration — loan ledger system decommission.

### Test type
CPF with migration-story variant — constraint propagation must survive into migration
tasks, not just discovery/definition

### Brief summary (for design confirmation)
the enterprise is decommissioning its legacy loan ledger system (used for 18 years) and
migrating all loan accounts to a new core banking platform already in production for
deposits. The migration covers approximately 280,000 active loan accounts. The legacy
system will be shut down 12 months from project start. Data migration will run in
parallel (shadow mode) for 6 months before cutover. The cutover is a hard date — the
legacy vendor support contract ends on the same day.

### Constraint inventory design

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | RBNZ Outsourcing and Technology Risk Policy — material IT changes must be notified to RBNZ 30 business days before implementation; decommissioning a core system qualifies | Regulatory (RBNZ policy) | Partial — brief mentions RBNZ compliance generally; 30-day notification not explicit |
| C2 | Zero data loss guarantee — all 280k loan records must be migrated with full history; any data loss is a regulatory breach under the CCCFA (credit contract records retention 7 years) | Regulatory (CCCFA records retention) | No — explicit |
| C3 | Vendor support contract hard deadline — legacy system end-of-life is contractually fixed; extension is not available | Technical/contractual constraint | No — explicit |
| C4 | Parallel run period — regulatory expectation (RBNZ) that systemic migration includes parallel operation validation before cutover | Regulatory (RBNZ prudential guidance) | Partial — shadow mode mentioned; RBNZ expectation not explicit |
| C5 | **[Hidden]** RBNZ notification has not been filed. The 30-business-day requirement means the notification window has already opened (given the project timeline). Filing is required before development starts — not at cutover. The team is unaware of this requirement | Hidden regulatory timing gap | **Yes — hidden** |

### Regulated constraints
C1 (RBNZ Technology Risk), C2 (CCCFA records retention), C4 (RBNZ parallel run expectation)

### Hidden constraint pattern
Regulatory notification timing gap — the obligation has a lead-time that starts well
before go-live. By the time the brief is written, the window may already be open.

### Difficulty
Very high

### CPF measurement focus
- C1 is the hardest — RBNZ 30-day notification is rarely known outside risk teams;
  models that carry it demonstrate deep regulated-environment knowledge
- C5 is the hidden constraint — the notification deadline is time-sensitive and not
  mentioned at all in the brief; surfacing it requires inferring that "decommissioning
  a core system" triggers RBNZ Technology Risk Policy
- This scenario also tests whether migration task stories inherit constraints from
  discovery (CPF across story types)

---

## S11 — Consumer Data Right Consent API (open finance)

### Domain
Open banking / Consumer Data Right (CDR-equivalent) — consent management platform
for third-party data access.

### Test type
CPF — with emphasis on constraint propagation into API schema design stories

### Brief summary (for design confirmation)
the enterprise wants to build a consent management API that lets accredited third parties
access customer financial data under a CDR-equivalent framework. Customers consent to
specific data types for specific third parties for a defined period. The API exposes:
transaction history, account balances, credit card summaries, and "enriched insights"
(spending categories, income estimation, projected balance). Third parties include
fintechs, comparison services, and aggregators.

### Constraint inventory design

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | Privacy Act 2020 — sharing personal financial data with third parties requires explicit consent; consent must be granular (per data type, per party) | Regulatory (external law) | No — explicit |
| C2 | Consumer Data Right framework (CDR-equivalent) — right to revoke consent; data must be deleted within 24 hours of consent withdrawal | Regulatory (framework obligation) | No — explicit |
| C3 | Open banking accreditation — third parties must be accredited before receiving data; the enterprise must validate accreditation on each API call | Technical/regulatory constraint | No — explicit |
| C4 | Data minimisation — API responses must not include data types beyond what was explicitly consented | Regulatory (Privacy Act principle) | Partial — data minimisation implicit in consent model |
| C5 | **[Hidden]** The "enriched insights" (spending categories, income estimation) are **derived data** — inferences the enterprise generates from raw transactions. The customer's consent covers "transaction data" but does not explicitly cover derived inferences. Sharing derived data under a raw-data consent is likely a consent boundary violation | Hidden data-consent scope gap | **Yes — hidden** |

### Regulated constraints
C1 (Privacy Act 2020), C2 (CDR consent revocation), C4 (data minimisation)

### Hidden constraint pattern
Inferred-data consent scope boundary — derived data is presented as a value-add feature;
the question of whether it is within the consent scope is not raised.

### Difficulty
High

### CPF measurement focus
- C4 is the most commonly missed explicit constraint — "data minimisation" is an
  abstract principle and easy to gloss over in API design stories
- C5 is the hidden constraint — derived/inferred data under a raw-data consent is a
  nuanced privacy law question; a model that flags this is demonstrating advanced
  regulatory reasoning
- This scenario also tests whether the model carries C4 into API schema design stories
  (does the schema story have a field-level data minimisation AC?)

---

## S12 — AI Credit Limit Model Retraining (algorithmic accountability)

### Domain
AI/ML governance — credit decisioning model lifecycle.

### Test type
CPF — constraint propagation into AI deployment stories specifically

### Brief summary (for design confirmation)
the enterprise's credit limit increase model (used for automatic credit limit recommendations
on existing cards) was trained 2 years ago. The credit team wants to retrain it on
fresh transaction data and redeploy. The new model shows 8% improvement in Gini
coefficient. The demographic disparity check shows comparable disparity to the current
model — "no regression". Retraining and redeployment is estimated at 6 weeks.
No regulatory approval is anticipated — this is a model update, not a new product.

### Constraint inventory design

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | FMA algorithmic fairness — credit decisioning models affecting NZ consumers require documented bias assessment; FMA expects fairness monitoring for models used in credit decisions | Regulatory (FMA guidance) | No — explicit (disparity check mentioned) |
| C2 | Model governance policy — the enterprise's internal model governance policy requires a Model Risk Management (MRM) review before deploying a retrained model, even for an "update" | Internal policy | Partial — policy exists but not named in brief |
| C3 | CCCFA responsible lending — automated credit limit recommendations must satisfy responsible lending obligations; model updates must not degrade CCCFA compliance | Regulatory (external law) | Partial — credit context implies CCCFA |
| C4 | Explainability requirement — FMA and internal policy require that credit decisions can be explained to customers on request; a retrained model must pass explainability review | Regulatory + internal policy | No — implied but not explicit |
| C5 | **[Hidden]** The current production model was deployed under a previous version of the MRM policy (pre-2023 update). Retraining the model resets the MRM review clock — the new MRM policy requires a full independent validation, not just an MRM committee sign-off. The team is planning for MRM sign-off (old process) and has not assessed whether the new policy applies | Hidden governance version mismatch | **Yes — hidden** |

### Regulated constraints
C1 (FMA algorithmic fairness), C3 (CCCFA), C4 (explainability)

### Hidden constraint pattern
Governance policy version mismatch — the team is following the old process; the new
policy version (which they haven't checked) has more stringent requirements that apply
to any model retrain, not just new deployments.

### Difficulty
Very high

### CPF measurement focus
- C2 is the hardest explicit constraint — "internal MRM policy" is not obvious from
  a brief that frames the work as a routine model update; models that surface MRM
  as a gate are demonstrating knowledge of ML governance
- C5 is the hidden constraint — MRM policy version mismatches are a real-world
  failure mode; surfacing it requires reasoning about governance lifecycle, not just
  reading the brief
- This scenario tests whether constraint propagation works into ML-specific story
  types (model training, validation, deployment, monitoring stories)

---

## S13 — Trans-Tasman Payment Corridor (multi-jurisdiction)

### Domain
Cross-border payments — AU-NZ payment corridor, multi-jurisdiction AML obligations.

### Test type
CPF — with multi-jurisdiction complexity; tests whether the model identifies that
a single feature touches two regulatory regimes

### Brief summary (for design confirmation)
the enterprise wants to build a streamlined trans-Tasman payment feature allowing NZ
retail customers to send money to Australian bank accounts in real time (under 2
hours). Currently customers must use the SWIFT network, which takes 1-2 business
days and incurs $18–25 fees. the enterprise has a relationship with the enterprise's Australian counterpart
which enables a proprietary internal routing channel. The proprietary channel would
settle in the the enterprise group treasury books, with net settlement at end of day.
Target fee: under $5.

### Constraint inventory design

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | RBNZ AML/CFT Act — outbound international payments subject to AML/CFT obligations in NZ; threshold reporting and sanctions screening required | Regulatory (NZ law) | No — explicit |
| C2 | AUSTRAC (Australian Transaction Reports and Analysis Centre) — inbound payments from NZ trigger Australian AML obligations; correspondent bank (the enterprise's Australian counterpart) bears primary AUSTRAC obligation | Regulatory (AU law) | Partial — "the enterprise's Australian counterpart relationship" mentioned but AUSTRAC obligation implicit |
| C3 | RBNZ FX controls — internal group treasury settlement must comply with RBNZ foreign exchange regulations; net settlement model requires RBNZ confirmation | Regulatory (RBNZ) | Partial — treasury settlement mentioned; FX regulation angle implicit |
| C4 | Payment Services Regulations 2021 (NZ) — new payment service type requires DIA registration if not covered under existing licence | Regulatory (NZ law) | No — explicit in follow-up |
| C5 | **[Hidden]** The proprietary intra-group routing channel bypasses the standard SWIFT correspondent bank model. the enterprise's SWIFT correspondent bank agreement with its intermediary banks contains a clause prohibiting routing transactions outside the agreed SWIFT channel without prior notification to the correspondent. Using the proprietary channel without notifying the correspondent constitutes a contractual breach with significant credit relationship risk | Hidden contractual obligation | **Yes — hidden** |

### Regulated constraints
C1 (RBNZ AML/CFT), C2 (AUSTRAC), C3 (RBNZ FX), C4 (DIA registration)

### Hidden constraint pattern
Correspondent bank agreement constraint — a contractual obligation in a bilateral
banking relationship that is invisible unless you know to look for it. Not a
regulatory obligation directly, but breach creates regulatory and credit relationship
risk.

### Difficulty
High (multi-jurisdiction adds complexity; correspondent bank constraint is unusual)

### CPF measurement focus
- C2 is the hardest explicit constraint — AUSTRAC obligations are Australian law;
  a NZ-focused model may not surface this unless it recognises the cross-border nature
- C3 is an often-missed constraint — FX regulation is invisible to product people
  but critical for a treasury settlement model
- C5 is the hidden constraint — correspondent banking agreements are specialist
  knowledge; a model that surfaces "check intra-group routing against correspondent
  bank agreement" has demonstrated exceptional depth

---

## Cross-corpus summary table (S8-S13)

| Scenario | Domain | Test type | Regulated constraints | Hidden constraint pattern | Expected difficulty |
|----------|--------|-----------|----------------------|--------------------------|---------------------|
| S8 | Regulatory reporting pipeline | CPF | RBNZ reporting, FMA Financial Reporting Act | Change control gap for regulated artefact | Medium-high |
| S9 | Digital KYC onboarding | CPF | AML/CFT Act, FATF equivalence, enhanced CDD | Vendor compliance confirmation gap | High |
| S10 | Core banking loan migration | CPF (migration-story variant) | RBNZ Technology Risk, CCCFA records retention | Regulatory notification timing gap | Very high |
| S11 | CDR consent API | CPF (API schema emphasis) | Privacy Act, CDR consent revocation, data minimisation | Inferred-data consent scope boundary | High |
| S12 | AI credit model retraining | CPF (ML deployment variant) | FMA algorithmic fairness, CCCFA, explainability | Governance policy version mismatch | Very high |
| S13 | Trans-Tasman payments | CPF (multi-jurisdiction) | RBNZ AML/CFT, AUSTRAC, RBNZ FX, DIA registration | Correspondent bank agreement constraint | High |

---

## Full corpus difficulty distribution (S1-S13)

| Difficulty | Scenarios |
|-----------|-----------|
| Low-medium | S7 (greenfield React) |
| Medium-high | S5 (Dynamics/CRM), S8 (reporting pipeline) |
| High | S1 (payment DR), S3 (RTP), S4 (card API), S9 (KYC), S11 (CDR consent), S13 (trans-Tasman) |
| Very high | S2 (lending origination), S10 (migration), S12 (AI model) |
| Failure/adversarial (not CPF) | S6a (thin brief), S6b (contradiction), S6c (scope creep) |

Total CPF test scenarios: 10 (S1-S5, S7-S9, S11-S13)
Adversarial/failure scenarios: 3 (S6a, S6b, S6c)
Migration-variant: 1 (S10)

---

## Context injection spec (eval harness)

When running these scenarios through the evaluation harness, each scenario requires:

1. **Stage prompt injection** — prepend stage-specific injection text before the
   corpus brief. Template in `workspace/handoffs/pipeline-corpus-S2-S7.md` (bottom section).

2. **Constraint inventory isolation** — the constraint inventory table must NEVER appear
   in the prompt to the model. It is evaluator-only. Store in a separate file from the
   brief, or strip it before injection.

3. **CPF trace block** — request the trace block as part of stage output:
   ```
   <!-- CPF-TRACE
   stage: [skill name]
   constraints_seen_in_inputs: [list]
   constraints_carried_forward: [list]
   constraints_not_carried: [list — with reason]
   new_constraints_surfaced: [list]
   -->
   ```

4. **Multi-jurisdiction scenarios (S13)** — inject a jurisdiction context line:
   `"This brief involves cross-border activity. Consider whether multiple regulatory
   regimes apply before proceeding."`
   Score separately for: NZ constraints found, AU constraints found, cross-border
   constraints found.

5. **Migration-variant scenarios (S10)** — inject at each story generation step:
   `"This is a migration story. Migration task stories must inherit all regulatory
   constraints from the discovery artefact — they do not inherit constraints automatically."`

6. **AI/ML scenarios (S12)** — inject at deployment story step:
   `"This story deploys a machine learning model to production. Consider model
   governance, explainability, and fairness obligations before accepting the story as DoR-ready."`

---

## Next steps (after operator confirmation)

1. Write full operator briefs + follow-up context for S8-S13
2. Save to `workspace/handoffs/pipeline-corpus-S8-S13.md`
3. Add S8-S13 to the cross-corpus comparison table in `pipeline-corpus-S2-S7.md`
4. Update EXP-003 manifest with S8-S13 as Phase 2 extension scenarios
5. Brief format must match S1-S7 exactly: operator brief (paste verbatim) →
   follow-up context (provide if model asks) → constraint inventory → CPF notes →
   artefact read/write map
