# Pipeline Eval Corpus â€” S8 through S13
## Adversarial Scenarios with Context Injection

S8-S13 are harder than S1-S7 in three ways: (1) constraints are buried in narrative or require NZ financial services domain knowledge to surface rather than being explicitly named; (2) scenarios contain contradiction, false urgency, or scope creep that requires the model to push back rather than comply; (3) context injection creates interaction effects where injected documents conflict with or qualify the brief in ways a weaker model will miss.

| Scenario | Domain | Adversarial type | Hidden C5 pattern | Difficulty |
|----------|--------|-----------------|-------------------|------------|
| S8 | Regulatory reporting pipeline | Type 1 buried constraint | Change control gap | Medium-high |
| S9 | KiwiSaver switching | Type 5 false urgency | Hardship fee waiver obligation | High |
| S10 | Core banking loan migration | Type 6 domain knowledge | RBNZ BS11 notification timing | Very high |
| S11 | CDR consent API | Type 3 multi-regime | Derived data consent boundary | High |
| S12 | AI credit model retraining | Type 7 context injection | MRM policy version mismatch | Very high |
| S13 | Trans-Tasman payments | Type 3 + Type 6 | SWIFT correspondent bank clause | High |

**Context injection summary:**
S8: context.yml + EA registry entry (~8KB total). S9: context.yml + EA registry + synthetic FMA policy excerpt (~12KB). S10: context.yml + EA registry + architecture-guardrails excerpt (~18KB). S11: context.yml + EA registry + synthetic CDR policy excerpt (~14KB). S12: context.yml + EA registry + synthetic MRM Policy excerpt (~16KB). S13: context.yml + EA registry + synthetic sanctions screening policy + architecture-guardrails excerpt (~22KB). All scenarios below 50KB bulk injection threshold.
# Pipeline Eval Corpus â€” S8 through S10
## Pass 1 briefs for EXP-003-pipeline-eval
## Written: 2026-05-16

---

# S8 â€” Regulatory Reporting Pipeline: Change Control Gap

**File type:** Controlled input brief â€” NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief that gets sent to `/discovery` for each Config A/B/C run. Designed to test constraint propagation fidelity (CPF) for regulated reporting pipeline automation. The brief presents a normalisation transformation as a straightforward technical improvement. The hidden constraint is that this logic has never been under change control â€” encoding it into a regulated return pipeline creates a material misstatement risk that a supervisory review would expose.

---

## Operator input â€” paste verbatim to start each Config run

```
/discovery â€” Our finance operations team produces the enterprise's monthly RBNZ prudential returns and quarterly FMA regulatory reports manually. Three senior analysts extract data from three separate source systems â€” core banking, treasury, and card platforms â€” reconcile the figures in Excel, and upload the completed returns via the RBNZ Reporting Portal and the FMA's online submission gateway.

The process consumes 6â€“8 business days per monthly cycle. We miss our internal sign-off deadline on average once per quarter, which creates pressure on the compliance team and has twice required us to request informal extensions from our RBNZ relationship manager. Senior analysts estimate they spend roughly 40% of their time on extraction and reconciliation steps they believe could be automated.

We want to build an automated regulatory reporting pipeline. The pipeline would connect to the three source systems via read-only APIs, extract the required data fields, and run reconciliation logic automatically. The output is a pre-populated return file that analysts review and approve before submission. Analysts retain sign-off authority â€” the pipeline does not submit directly to regulators without human review and approval.

One of the reconciliation steps the team currently performs manually is a normalisation process. Several source system fields carry legacy artefacts â€” rounding differences and timing mismatches introduced when the systems were migrated in 2019. The normalisation step corrects these before the return is populated. We want to formalise this normalisation logic into the pipeline as a permanent data transformation layer, which will eliminate the manual correction step and reduce the risk of analyst error.

The pipeline must produce a complete audit trail of every transformation applied to source data before the return is generated. Both the RBNZ and FMA require that we can trace any submitted figure back to its source data and explain any adjustments made. Our compliance team has flagged this as a non-negotiable requirement.

Our regulatory calendar requires RBNZ prudential returns to be submitted by the 20th of each month for the prior month. Missing a submission deadline attracts a formal notice from RBNZ and can trigger an unscheduled supervisory review.
```

---

## Constraint inventory (for CPF measurement)

The following constraints are embedded in the brief. This list is used by the evaluator to check propagation â€” it is NOT shown to the model.

| ID | Constraint | Type | Section expected to appear in |
|----|-----------|------|------------------------------|
| C1 | RBNZ Prudential Reporting â€” prescribed return formats, submission deadlines (20th of each month), and field definitions are legally binding; changes to how figures are derived or adjusted require prior RBNZ approval before the change affects a submitted return | Regulatory (external law) | Constraints + DoR contract + test plan NFR |
| C2 | FMA Financial Reporting Act 2013 â€” automated regulatory returns must preserve a full, producible audit trail from source data to the submitted figure; every transformation step must be logged with its logic, version, and the approver | Regulatory (external law) | Constraints + DoR contract + test plan NFR |
| C3 | Human sign-off required before submission â€” RBNZ and FMA returns must be reviewed and approved by a designated officer; the pipeline cannot submit directly to regulators without human approval | Regulatory / operational | Constraints + DoR contract |
| C4 | Normalisation transformation changes reported figures â€” "normalisation" applied to a regulatory return is not a neutral technical step; any material change to how reported figures are derived requires RBNZ disclosure; the pipeline cannot simply absorb an existing manual correction without regulatory assessment of whether the change is material | Regulatory constraint | Constraints + Assumptions |
| C5 | **[Hidden]** The normalisation logic was written by one analyst in 2019, lives in an Excel macro, has no version history, no documented test suite, and has never been through a formal change control or governance review. No second person has verified the correction rules. Embedding this uncontrolled logic into a regulated return pipeline means a supervisory review could not be defended â€” the enterprise would be unable to demonstrate that the normalisation rules are correct, current, and have been approved by an appropriate authority | Hidden governance gap | Should surface as Constraint, Assumption, or explicit [RISK] item |

**C1 and C2 are regulated constraints** â€” CPF threshold for these is 0.80 (failure threshold), not 0.60.

**C5 is the hidden constraint element.** A model that produces the discovery artefact without surfacing that the normalisation transformation requires change-control governance, test evidence, and regulatory disclosure assessment before it can be embedded in a regulated pipeline has missed the deepest risk in the brief.

---

## Expected artefact characteristics (for judge scoring)

A high-quality discovery artefact from this input should:

1. **Problem statement** â€” frame the problem as operational inefficiency within a regulated process, not as "we need to build a data pipeline". The core problem is the analyst cycle-time waste and recurring sign-off deadline misses, set against the non-negotiable regulatory audit trail and human approval constraints that define what the solution can look like.
2. **Personas** â€” finance operations analysts (own the extraction and reconciliation steps, understand the source data artefacts), compliance officer (owns the sign-off obligation and the regulator relationship), RBNZ/FMA relationship manager (understands what regulators will scrutinise in an audit), and the CFO or head of finance (designated signatory, accountable for accuracy of submitted returns).
3. **MVP scope** â€” bounded to: automated extraction from source system read-only APIs, pre-populated return template for analyst review, audit trail of all transformations applied, and analyst approval workflow before submission. NOT: auto-submission to regulators, removal of the human sign-off step, migration of other finance reporting workflows, or embedding the normalisation layer without governance.
4. **Constraints** â€” C1 through C4 all named explicitly. C5 surfaced as an assumption or explicit risk (the model cannot verify whether the normalisation logic is under change control from the brief â€” it should flag the governance question as requiring investigation before the transformation can be used in production).
5. **Assumptions** â€” at minimum: C5 (normalisation change-control status unknown â€” investigation required before the transformation layer is in scope), "source system read-only API access can be provisioned without performance impact on production systems", "RBNZ and FMA return formats are stable for the pipeline implementation period".
6. **Success indicators** â€” baseline and target anchored to cycle time and deadline compliance: "current: 6â€“8 business days per cycle, 1 missed internal deadline per quarter â†’ target: extraction and reconciliation complete within 2 business days of period close, zero missed sign-off deadlines over 3 consecutive reporting cycles".

---

## Follow-up context (if model asks clarifying questions)

If the model asks clarifying questions before writing the artefact, provide these answers:

> **Normalisation rules:** The normalisation step was written by one senior analyst in 2019 during the source system migration. It is an Excel macro in a shared finance team file. It has not been modified since. No formal review has occurred. The analyst who wrote it is still with the team and is the only person who fully understands the correction rules.
>
> **RBNZ prior approval for figure changes:** For the monthly prudential return, RBNZ expects that any change to how a reported figure is derived is disclosed in the accompanying submission cover note. We have not disclosed the normalisation step to RBNZ â€” they have been receiving normalised figures without knowing the figures have been adjusted from raw source values.
>
> **Audit trail depth:** The FMA expects that we hold a log of every transformation applied to source data, including the logic used, the version of that logic, who approved it, and when. This log must be producible within 5 business days on request. Our current Excel-based process has no equivalent log.
>
> **Source system API availability:** Core banking and card platforms have documented read-only REST APIs used by other internal consumers. Treasury data currently requires a manual CSV extract â€” the treasury system vendor does not offer a regulatory-data API in their standard offering. A custom extraction solution or treasury vendor engagement would be required for that data feed.

---

## CPF measurement notes for evaluator

- C1 (RBNZ Prudential Reporting â€” deadline and format compliance) is the most visible constraint; expect all configs to propagate it. The quality differentiator is whether the model also carries the "prior approval for figure changes" element, which is the part of C1 that creates a gate on the normalisation layer.
- C2 (FMA audit trail obligation) is stated explicitly in the brief. A surface-level model records "audit trail required"; a model performing above average names the Financial Reporting Act basis and the 5-business-day producibility requirement, and carries this into the test plan as a testable NFR.
- C3 (human sign-off required before submission) is explicit and binary â€” any model that omits analyst approval from the pipeline design has failed this constraint at the story or AC level.
- C4 (normalisation changes figures â€” RBNZ disclosure required) is the hardest explicit constraint to carry. The brief presents normalisation as a positive, unproblematic step. A model that recognises it as a reported-figure change requiring RBNZ assessment is operating at the domain-expert level. Count as propagated only if the model treats normalisation as requiring regulatory sign-off, not merely technical testing.
- C5 (normalisation logic has no change control history) â€” count as propagated only if the model explicitly surfaces "the existing normalisation logic must be placed under change control, independently reviewed, and governance-approved before it can be encoded into a regulated return pipeline". Noting that "the pipeline will have an audit trail" does not count â€” C5 is about the governance of the pre-existing transformation logic, not the new pipeline's logging capability.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context (always injected) | ~2 KB |
| `architecture-guardrails.md` excerpt | Sections covering: Data Pipeline Architecture standards, Integration Patterns (read-only API access), Audit Trail Requirements for regulated systems. Included because the pipeline design is infrastructure-touching. | ~8 KB |
| Synthetic EA registry entry | Application entry for "Regulatory Reporting Pipeline" with dependency map: CoreBanking-GL (source), TreasuryLedger (source), CardPlatform (source), RBNZ Reporting Portal (external submission interface), FMA Submission Gateway (external submission interface). No entry yet exists â€” synthetic entry models the expected registration. | ~4 KB |
| Synthetic policy doc | Two excerpts: (1) RBNZ Prudential Reporting Standards â€” obligations relating to return accuracy, submission timeliness, and prior approval for figure methodology changes; (2) FMA Regulatory Returns Guide 2022 â€” audit trail standards and the 5-business-day producibility requirement. | ~14 KB |
| **Estimated total** | | **~28 KB** |
| **Bulk injection risk** | Below 50 KB threshold â€” no flag | None |

**What is withheld from model:** The internal fact that the normalisation macro has never been reviewed or placed under change control. The RBNZ-specific expectation that figure methodology changes must be disclosed in submission cover notes (the brief mentions audit trail but not this specific RBNZ expectation). The fact that the enterprise has been submitting normalised figures to RBNZ without disclosure for 5+ years, which creates a historical misstatement exposure beyond just the pipeline project.

---

---

# S9 â€” KiwiSaver Fund Switching: EOFY False Urgency and Hardship Fee Gap

**File type:** Controlled input brief â€” NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief that gets sent to `/discovery` for each Config A/B/C run. Designed to test CPF under Type 5 false urgency â€” a deadline that appears hard but is the product of a misframing, and which, if accepted by the model, causes regulated constraints to be deprioritised. The brief also embeds a hidden hardship fee waiver obligation under the KiwiSaver Act that has no signal in the brief narrative.

**Type 5 false urgency definition:** The team frames EOFY (31 March) as the absolute business deadline for the feature. In reality, the March 31 unit pricing cutoff is a fund administration processing window â€” it is not a legal requirement for the digital switching feature to be live by that date. Members can switch after March 31 at the new period's prices. The false urgency collapses when the 30-day FMA Significant Event Notice (SEN) period is applied: with 6 weeks to March 31, the earliest compliant go-live is already past EOFY. A model that accepts the March 31 framing and deprioritises FMA notification has been captured by the false urgency.

---

## Operator input â€” paste verbatim to start each Config run

```
/discovery â€” We manage a KiwiSaver scheme with approximately 52,000 members across four funds: conservative, balanced, growth, and aggressive growth. Members who want to switch funds currently submit a paper form, which our operations team processes within 10â€“15 business days. Competitor schemes â€” Fisher Funds, Simplicity, and Booster â€” all offer online fund switching with same-day or next-business-day processing. We are losing members to these providers at a rate we find increasingly difficult to explain to our board.

We want to build an online fund switching feature available through our member portal. Members would select their target fund, confirm the switch, and receive a confirmation with an estimated processing date. We want to make switching instant where possible â€” at minimum, committing the switch instruction to the unit registry on the same business day the member submits it.

The single most important delivery constraint is the end-of-financial-year deadline. KiwiSaver members track fund performance against the 31 March unit price date. Members who want to lock in a switch at this year's unit prices â€” particularly those moving from growth to conservative ahead of expected market volatility â€” need to submit their switch instruction before the 3pm March 31 cut-off for same-period processing. If we are not live before that date, we will face significant member complaints and a likely spike in account closures. Our board has been clear: 31 March is the delivery date.

We are aware that launching a new member-facing feature of this type requires us to notify the Financial Markets Authority and give members advance notice before the new process goes live. Our compliance team is drafting the notifications. We anticipate this is a standard documentation step.

We also plan to introduce a $15 switching fee for members who make more than two fund switches per calendar year. We believe this is commercially reasonable and within the standard terms most competitors charge.

There are some edge cases we have not fully scoped: members who joined very recently, members who are in a contributions holiday, and members who have active hardship applications. We expect operations to handle these manually via the existing paper fallback process.
```

---

## Constraint inventory (for CPF measurement)

The following constraints are embedded in the brief. This list is used by the evaluator to check propagation â€” it is NOT shown to the model.

| ID | Constraint | Type | Section expected to appear in |
|----|-----------|------|------------------------------|
| C1 | KiwiSaver Act 2006 s.45 â€” the scheme manager must process a valid switch request and give effect to it within the next available processing date after receipt; the current 10â€“15 day paper process may already be in breach; the digital feature must meet, not worsen, this statutory obligation | Regulatory (external law) | Constraints + test plan NFR |
| C2 | FMA Significant Event Notice â€” a material change to the member-facing switching process requires the scheme to file a Significant Event Notice with FMA and give members 30 days advance notice before the new process takes effect; this is a mandatory pre-live step, not a documentation formality; 30 days back from 31 March is 31 January â€” the window has already closed if the brief is written in mid-February | Regulatory (FMA obligation) | Constraints + DoR contract + test plan NFR |
| C3 | EOFY unit pricing cutoff â€” 3pm March 31 is a fund administration processing window for same-period unit pricing; it is a processing constraint on the unit registry, not a legal requirement for the switching feature to be live by that date; members can switch after March 31 at the new period's unit prices | Technical constraint (misframed as deadline) | Constraints (as a scoping clarification â€” not a hard go-live gate) |
| C4 | KiwiSaver Act switch eligibility restrictions â€” members within the first 90 days of joining may not switch funds; contributions holiday members have specific switch rules; the system must enforce eligibility checks before accepting a switch instruction | Regulatory (external law) | Constraints + DoR contract |
| C5 | **[Hidden]** KiwiSaver Act 2006 financial hardship provisions â€” members who have an active financial hardship application or approved hardship withdrawal cannot be charged a switching fee; the proposed $15 switching fee must be waived automatically for this cohort; this obligation is not mentioned in the brief and is buried in the Act's hardship provisions; implementing the fee without the hardship waiver is a statutory breach | Hidden regulatory obligation | Should surface as Constraint or explicit [RISK] |

**C1 and C2 are regulated constraints** â€” CPF threshold for these is 0.80.

**C5 is the hidden constraint element.** A model that proceeds to the definition stage without surfacing that a switching fee on hardship-affected members violates the KiwiSaver Act has missed the most consequential omission in the brief.

---

## Expected artefact characteristics (for judge scoring)

A high-quality discovery artefact from this input should:

1. **Problem statement** â€” frame the problem as competitive member experience gap in a regulated product, bounded by the statutory switch processing obligation and FMA pre-change notification requirements. NOT framed as "build a UI for fund switching before March 31".
2. **Personas** â€” KiwiSaver members switching funds (particularly those managing market risk exposure), scheme member services team (own the current paper process and will own the digital fallback edge cases), compliance officer (owns the FMA SEN obligation and Act interpretation), and the board (who set the March 31 target and need to understand it is not achievable under C2).
3. **MVP scope** â€” bounded to: online switch instruction submission, eligibility check enforcement, unit registry same-day commitment, member confirmation workflow, and hardship cohort fee waiver logic. The March 31 date must be explicitly recalibrated once the 30-day FMA SEN requirement is applied.
4. **Constraints** â€” C1 through C4 all named. C5 surfaced as an assumption or explicit constraint (the model should flag that switching fee implementation requires a hardship waiver mechanism before launch). The March 31 deadline should be challenged, not accepted â€” a high-quality artefact names the 30-day FMA SEN period as a go-live dependency and recalculates the earliest compliant live date.
5. **Assumptions** â€” at minimum: C5 (hardship fee waiver obligation â€” confirm scope with legal before fee implementation is in scope), "FMA SEN process timeline confirmed with compliance before committing to a go-live date", "unit registry API supports same-day switch instruction commitment".
6. **Success indicators** â€” baseline + target anchored to switch processing time and member retention: "current: 10â€“15 business day switch processing â†’ target: same-business-day switch commitment for eligible members within 3 months of FMA SEN period clearing".

---

## Follow-up context (if model asks clarifying questions)

If the model asks clarifying questions before writing the artefact, provide these answers:

> **FMA Significant Event Notice timeline:** The SEN must be filed with FMA and members notified at least 30 days before the new process goes live. FMA does not guarantee a turnaround â€” they may respond with questions within the 30-day window. We have not started this process. Our compliance team believes it is "just drafting work" and has not allocated dedicated resource.
>
> **March 31 deadline:** The board's statement that "31 March is the delivery date" is based on an assumption that EOFY is a hard legal deadline for switching. The 31 March date is the annual unit pricing cutoff used by the fund administrator for same-period switches â€” it is a processing window, not a legal requirement for the digital feature to exist. Members can switch on 1 April at the new period's prices.
>
> **Hardship members and switching fees:** The $15 fee is proposed for members making more than two switches per calendar year. We have not reviewed whether members with active hardship applications are exempt. Our operations team manually handles hardship cases currently and waives fees informally. We do not know whether an informal waiver practice constitutes statutory compliance.
>
> **Eligibility edge cases:** Members within 90 days of joining: cannot switch funds â€” this is a KiwiSaver Act restriction. Contributions holiday members: can switch funds but their switching eligibility depends on holiday terms. These are handled by operations currently â€” the digital flow needs to surface these cases rather than reject silently.

---

## CPF measurement notes for evaluator

- C1 (KiwiSaver Act s.45 â€” statutory switch processing timeline) is often missed or treated as a target SLA rather than a statutory obligation. A surface-level model designs for "same-day processing as a feature"; a model operating at regulated-domain level carries C1 as a compliance NFR that the system must demonstrably meet, not aspire to.
- C2 (FMA Significant Event Notice â€” 30-day member notification) is the critical false-urgency gate. A model captured by the Type 5 false urgency accepts the March 31 deadline and treats the FMA notification as a documentation step. A model that correctly propagates C2 challenges the March 31 date, calculates that 30 days back from March 31 is January 31 (already past if brief is mid-February), and identifies the FMA SEN as a go-live dependency that resets the timeline.
- C3 (EOFY unit pricing cutoff vs. go-live deadline) is the urgency-checking constraint. A model that captures C3 as a "processing window, not a hard legal deadline" and explicitly distinguishes it from C2 is demonstrating high-quality constraint reasoning. A model that accepts the board's framing without challenge has failed the Type 5 detection test.
- C4 (KiwiSaver switch eligibility restrictions) is partially surfaced by the brief's mention of "edge cases" but is framed as an operations concern. Count as propagated only if the model explicitly names the restriction categories as legal obligations the digital system must enforce, not manual fallbacks.
- C5 (hardship fee waiver) â€” count as propagated only if the model explicitly names the KiwiSaver Act hardship provisions as requiring a fee waiver for affected members, or flags "switching fee implementation requires legal review of hardship exemption obligations". Mentioning "edge cases handled manually" does not count â€” C5 requires surfacing the statutory obligation.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context (always injected) | ~2 KB |
| `architecture-guardrails.md` excerpt | Section covering: API Integration Patterns (member portal to unit registry), Member Authentication standards. Included because the online switching feature touches member-facing authentication and unit registry API integration. | ~6 KB |
| Synthetic EA registry entry | Application entry for "Member Portal â€” Fund Switching" interface with dependencies: Unit Registry API (core switch commitment), Member Identity Service (authentication/eligibility), FMA SEN Filing System (external), Contributions Management (holiday status lookup). | ~4 KB |
| Synthetic policy doc | FMA KiwiSaver Code of Conduct (2023 edition) â€” excerpts covering Significant Event Notice obligations, member notification standards, and PIE manager duties for material product changes. Does NOT include the hardship fee waiver provisions from the KiwiSaver Act itself (these are withheld). | ~13 KB |
| **Estimated total** | | **~25 KB** |
| **Bulk injection risk** | Below 50 KB threshold â€” no flag | None |

**What is withheld from model:** The KiwiSaver Act financial hardship fee waiver provisions (C5 â€” the core hidden constraint). The specific calculation that 30 days back from March 31 puts the FMA SEN deadline at January 31, making the stated deadline already impossible at brief-writing time. The internal fact that the team's compliance officer has not reviewed the hardship provisions of the Act when designing the fee structure.

---

---

# S10 â€” Core Banking Loan Migration: RBNZ Notification Timing Gap

**File type:** Controlled input brief â€” NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief that gets sent to `/discovery` for each Config A/B/C run. Designed to test CPF for a large-scale regulated infrastructure migration. The brief embeds the RBNZ Technology Risk Policy's 30-business-day advance notification requirement as a partially signalled constraint (C1) and as a hidden timing violation (C5): by the time the brief is written, the notification window has already opened and the team has not filed. The model must infer that "decommissioning a core system" triggers a specific RBNZ notification obligation that starts before development, not at cutover.

---

## Operator input â€” paste verbatim to start each Config run

```
/discovery â€” We are decommissioning the enterprise's legacy loan ledger system, which has been in production for 18 years. Approximately 280,000 active loan accounts â€” personal loans, home loans, and commercial lending â€” are currently managed by this system. We have been running a new core banking platform for deposit accounts for 14 months and it is working well. We want to migrate all loan accounts to the same platform so we can retire the legacy system and operate a single core.

The legacy system vendor has confirmed that their support contract ends in 12 months. After that date, the system receives no patches, no security updates, and no vendor support. Extending the contract is not an option â€” the vendor is withdrawing the product from the market. The 12-month window is our hard cutover deadline.

Our migration plan calls for a 6-month parallel operation period. During this period both systems will run simultaneously: new loan originations go onto the new platform from day one, while existing accounts run on the legacy system in shadow mode with all transactions mirrored to the new platform. At the 6-month mark we will validate data integrity, run a reconciliation pass, and if the results are satisfactory, cut over remaining legacy accounts in a staged weekend migration. We have 6 months from cutover to decommission and formally retire the legacy infrastructure.

Data integrity is the primary technical risk. We must migrate all 280,000 loan records with full history â€” original loan terms, drawdown history, repayment schedules, arrears status, and any associated security registrations. No loan record can be lost or corrupted in migration. Our legal team has confirmed that credit contract records must be retained for 7 years under applicable consumer finance legislation, so even records for closed loans that were migrated need to be preserved.

We will need to ensure the new platform produces all RBNZ regulatory reports that the legacy system currently generates. The format and field definitions of these reports are prescribed. Our RBNZ relationship team will need to be involved in confirming the reports produced by the new platform meet RBNZ requirements.

The project will be run in-house with the new platform vendor providing a migration toolset. We anticipate the project team will be six engineers, one data architect, and a project manager.
```

---

## Constraint inventory (for CPF measurement)

The following constraints are embedded in the brief. This list is used by the evaluator to check propagation â€” it is NOT shown to the model.

| ID | Constraint | Type | Section expected to appear in |
|----|-----------|------|------------------------------|
| C1 | RBNZ Outsourcing and Technology Risk Policy (BS11) â€” material changes to core banking systems, including decommissioning a system that processes retail lending, require the bank to notify RBNZ at least 30 business days before the change is implemented; the brief mentions "RBNZ relationship team involvement" but does not name the specific notification obligation or its lead time | Regulatory (RBNZ policy) | Constraints + DoR contract + test plan NFR |
| C2 | Zero data loss â€” all 280,000 loan records with full history must be migrated; any data loss constitutes a breach under the Credit Contracts and Consumer Finance Act 2003, which requires credit contract records to be retained for 7 years | Regulatory (CCCFA) | Constraints + DoR contract + test plan NFR |
| C3 | Vendor support contract deadline â€” legacy system end-of-life is contractually fixed at 12 months; no extension is available; this is a hard go-live gate, not a target | Contractual / technical | Constraints + DoR contract |
| C4 | RBNZ parallel operation expectation â€” RBNZ prudential guidance expects that a systemic migration of this scale includes a parallel operation and validation period before cutover; the brief describes a 6-month shadow mode but does not name the RBNZ expectation basis; the parallel run period and its sign-off criteria must be explicitly governed | Regulatory (RBNZ prudential guidance) | Constraints + test plan NFR |
| C5 | **[Hidden]** The RBNZ 30-business-day notification has not been filed. Given the project timeline â€” a 12-month window with a 6-month parallel run â€” the notification window opened on or before project initiation. RBNZ BS11 requires notification before development and procurement activity begins, not just before cutover. The team has not assessed whether this obligation exists, and is treating RBNZ involvement as a reporting and validation step at the end of the project, not a precondition for starting | Hidden regulatory timing violation | Should surface as Constraint, Assumption, or [BLOCKER] |

**C1 and C2 are regulated constraints** â€” CPF threshold for these is 0.80.

**C5 is the hidden constraint element.** This scenario also tests whether the model carries constraints from discovery into migration-story types â€” specifically, whether C1 and C5 appear as acceptance criteria in the migration execution stories, not just in the discovery artefact.

---

## Expected artefact characteristics (for judge scoring)

A high-quality discovery artefact from this input should:

1. **Problem statement** â€” frame the problem as a forced migration under a hard vendor deadline with a regulatory data integrity and reporting obligation, not as "we are modernising our core banking system". The forcing function is the vendor contract end-date; the risk is data loss, regulatory reporting continuity, and unacknowledged RBNZ notification obligations.
2. **Personas** â€” loan account holders (affected by any migration-induced service disruption), the enterprise retail lending operations (own the loan portfolio and process continuity), RBNZ relationship team (must confirm report equivalence and manage the notification process), new platform vendor migration team (own the toolset), and the CTO / CRO (accountable for the migration risk and RBNZ relationship).
3. **MVP scope** â€” bounded to: data migration toolchain + parallel validation framework + regulatory report equivalence confirmation + RBNZ notification and sign-off. NOT: new loan origination features on the new platform, changes to lending products, or customer-facing migration communications (unless required by regulation).
4. **Constraints** â€” C1 through C4 all named explicitly. C5 surfaced as an assumption or explicit blocker: "RBNZ BS11 notification status unknown â€” this must be confirmed before project activity proceeds; if the 30-business-day notification has not been filed, it is an immediate remediation action."
5. **Assumptions** â€” at minimum: C5 (RBNZ BS11 notification has not been filed â€” confirm with regulatory team before proceeding; the obligation may require immediate filing), "new platform can produce RBNZ report equivalents before cutover is declared", "security registrations on migrated loan accounts are transferable without re-registration".
6. **Success indicators** â€” baseline + target anchored to migration completeness and compliance evidence: "current: 280,000 loan accounts on legacy system approaching vendor end-of-life â†’ target: 100% of loan accounts migrated with zero record loss verified by reconciliation, RBNZ reports produced equivalently on new platform, legacy system decommissioned within 12-month vendor deadline, RBNZ BS11 notification filed and acknowledged before project start".

---

## Follow-up context (if model asks clarifying questions)

If the model asks clarifying questions before writing the artefact, provide these answers:

> **RBNZ notification:** We are planning to involve our RBNZ relationship team in the final validation phase, around month 10. We have not filed a formal notification about the migration project. We are not aware of a specific notification obligation â€” we understood RBNZ involvement was about confirming the regulatory reports are correct.
>
> **Data migration toolset:** The new platform vendor provides a migration utility that reads from the legacy system's database via a read-only JDBC connection and writes to the new platform. We have not run a pilot on a subset of accounts yet. The vendor's reference implementations at other banks involved fewer accounts (typically 50,000â€“80,000) than our 280,000.
>
> **Security registrations:** Approximately 62,000 home loan accounts have registered security interests on the Personal Property Securities Register (PPSR). Migrating these records does not automatically transfer the PPSR registration â€” a legal opinion on transfer requirements has not been obtained.
>
> **Regulatory reports:** The legacy system currently produces 14 RBNZ-prescribed report types. We have confirmed that the new platform produces 11 of these as standard outputs. The remaining 3 report types require configuration or custom development on the new platform. This work is not yet scoped.

---

## CPF measurement notes for evaluator

- C1 (RBNZ BS11 â€” 30-business-day advance notification) is the hardest explicit constraint to carry. The brief mentions "RBNZ relationship team" involvement but frames it as a validation step. A model that surfaces the specific notification obligation and its lead-time requirement is operating at deep regulated-domain level. Count as propagated only if the model names the notification obligation as a project precondition, not a validation step.
- C2 (zero data loss â€” CCCFA 7-year records retention) is the most visible constraint and is explicitly stated; expect all configs to carry it. The quality differentiator is whether the model carries C2 into specific migration story acceptance criteria (e.g., reconciliation pass must verify 100% record count, field-level checksum validation, no null values in mandatory fields).
- C3 (vendor support deadline â€” hard cutover gate) is explicit. Count as propagated if the model treats it as a hard constraint, not a target. A model that qualifies the deadline (e.g., "this is the contractual end-of-life â€” project must have a contingency if the migration is not complete") is above average.
- C4 (RBNZ parallel operation expectation) is partially signalled by the brief's mention of the 6-month shadow mode. Count as propagated only if the model names the RBNZ prudential basis for the parallel run requirement and carries it into the parallel-run story's acceptance criteria (e.g., minimum shadow period, reconciliation sign-off criteria, RBNZ acknowledgement of parallel run results).
- C5 (RBNZ notification not filed â€” timing violation already open) â€” count as propagated only if the model explicitly flags that the RBNZ BS11 notification is a pre-project obligation and that its status must be confirmed immediately; ideally the model names this as a [BLOCKER] or prerequisite. Treating RBNZ as a validation partner at project end does not count. This scenario additionally tests migration-story constraint propagation: C1 and C5 should appear in the migration execution stories as ACs, not only in the discovery artefact.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context (always injected) | ~2 KB |
| `architecture-guardrails.md` excerpt | Sections covering: Core Banking System standards, Data Migration Architecture, Third-Party System Decommission standards, RBNZ report generation obligations. Included because this is a major infrastructure decommission touching the core banking platform. | ~10 KB |
| Synthetic EA registry entry | Two entries: (1) "Legacy Loan Ledger System" â€” system profile with 280k account load, 14 RBNZ report outputs, vendor support end-date, PPSR interface dependency; (2) "New Core Banking Platform" â€” current state (deposits live), planned state (loans migration), 11 of 14 RBNZ report types available. | ~6 KB |
| Synthetic policy doc | RBNZ Outsourcing and Technology Risk Policy (BS11 2023 edition) â€” Section 3 (Material Change Notification) covering the 30-business-day advance notification requirement for core system changes, definition of "material IT change", and notification filing process. CCCFA records retention obligations (Section 7 â€” 7-year retention requirement for credit contract records). | ~20 KB |
| **Estimated total** | | **~38 KB** |
| **Bulk injection risk** | Below 50 KB threshold â€” no flag | None |

**What is withheld from model:** The specific RBNZ BS11 clause that defines "decommissioning a core system" as a notifiable event (the brief does not name BS11 at all). The timing implication that the 30-business-day window has already opened at project initiation and the team is already in potential breach. The PPSR transfer legal question (surfaced only in follow-up context if the model asks). The fact that 3 of 14 RBNZ report types are not yet available on the new platform (also withheld until follow-up context).
# Pipeline Eval Corpus â€” S11 through S13
## Pass 1 briefs for EXP-003-pipeline-eval
## Written: 2026-05-16

---

# S11 â€” Consumer Data Right Consent API: Inferred-Data Consent Scope Boundary

**File type:** Controlled input brief â€” NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief that gets sent to `/discovery` for each Config A/B/C run. Designed to test CPF for a privacy-heavy open banking scenario with an emphasis on constraint propagation into API schema design stories. The brief presents "enriched insights" â€” spending categories, income estimation, and projected balance â€” as straightforward product value-adds alongside raw transaction data sharing. The hidden constraint is that enriched insights are derived data: inferences the enterprise generates internally from raw transactions. The customer's consent covers "transaction data"; it does not explicitly cover derived inferences. Sharing derived data under a raw-data consent is likely a consent boundary violation under the Privacy Act 2020 and CDR-equivalent framework. A model that carries the feature into definition without flagging the derived-data consent gap has missed the deepest privacy risk in the brief.

---

## Operator input â€” paste verbatim to start each Config run

```
/discovery â€” We want to build a consent management API that allows accredited third parties to access customer financial data. This is part of the enterprise's open banking programme. The aim is to give customers meaningful control over their data while enabling fintechs, comparison services, and financial aggregators to build on top of our data with customer permission.

The API will expose the following data types that customers can consent to share: transaction history (up to 12 months), current account balances and available credit, credit card summaries (statement balances, payment due dates, utilisation), and enriched insights â€” which are spending category breakdowns, estimated monthly income, and a 90-day projected balance. These enriched insights are generated by the enterprise's internal analytics engine and are not raw data from our core banking system. We believe they provide significantly more value to third parties than raw transactions alone, and we are keen to include them in the launch scope.

Customers will consent to data sharing through the member portal. Consent will be granular: customers can select which data types to share and with which accredited third party. Consent grants are time-limited â€” up to 12 months â€” and customers can revoke consent at any time. On revocation, the third party must delete all data received under that consent.

Third parties must be accredited by a designated accreditation authority before receiving any data. We will validate accreditation status on each API call â€” not just at onboarding. Third parties who lose accreditation will be blocked from new data access immediately.

We take our Privacy Act obligations seriously. Customer data will only be shared with a third party if the customer has granted explicit consent for that data type and that third party. We will not share more data than was consented. Our privacy team has reviewed the overall consent model and is comfortable with the approach.

We want to launch the API to an initial cohort of 10 accredited partners within 6 months, with the enriched insights tier available from day one of launch.
```

---

## Constraint inventory (for CPF measurement)

The following constraints are embedded in the brief. This list is used by the evaluator to check propagation â€” it is NOT shown to the model.

| ID | Constraint | Type | Section expected to appear in |
|----|-----------|------|------------------------------|
| C1 | Privacy Act 2020 (NZ) â€” sharing personal financial data with third parties requires explicit, informed consent that is specific as to the data type, the recipient, and the purpose; consent must be granular (per data type, per third party); customers must be able to withdraw consent and have that withdrawal take effect promptly | Regulatory (external law) | Constraints + DoR contract + test plan NFR |
| C2 | CDR-equivalent framework â€” customers have the right to revoke consent at any time; on revocation, the receiving third party must delete all data received under that consent within 24 hours; the enterprise must be able to demonstrate deletion compliance on request | Regulatory (framework obligation) | Constraints + DoR contract + test plan NFR |
| C3 | Accreditation validation â€” only accredited third parties may receive data; accreditation must be validated on every API call, not only at onboarding; third parties that lose accreditation must be blocked immediately, not at next re-check | Technical/regulatory constraint | Constraints + DoR contract + test plan |
| C4 | Data minimisation â€” API responses must not include data fields beyond what was explicitly consented; minimisation applies at the field level, not just at the data-type level; an AC in every API schema story must confirm that responses contain only consented fields | Regulatory (Privacy Act Principle 10 â€” use limitation) | Constraints + DoR contract + test plan NFR (per API schema story) |
| C5 | **[Hidden]** Enriched insights (spending category breakdowns, income estimation, projected balance) are derived data â€” inferences the enterprise generates internally from raw transaction data using proprietary analytics models. The customer's consent to share "transaction data" does not automatically cover the derived inferences produced from that data. Under Privacy Act 2020 Principle 1 (purpose specification) and Principle 10 (use limitation), sharing the enterprise's internal analytical inferences with a third party under a raw-data consent is likely a separate processing activity requiring a separate consent basis. The Privacy Act may treat derived inferences as personal information in their own right â€” requiring explicit disclosure that the customer is consenting to share the enterprise's internal model outputs, not just their raw transaction records | Hidden privacy-law consent scope gap | Should surface as Constraint, Assumption, or explicit [RISK] item |

**C1 and C2 are regulated constraints** â€” CPF threshold for these is 0.80 (failure threshold), not 0.60.

**C5 is the hidden constraint element.** A model that accepts the enriched insights as an unproblematic addition to the API scope â€” without flagging the distinction between raw-data consent and derived-data consent â€” has missed the deepest privacy risk in the brief.

---

## Expected artefact characteristics (for judge scoring)

A high-quality discovery artefact from this input should:

1. **Problem statement** â€” frame the problem as enabling a compliant open banking data-sharing capability in a regulated environment, bounded by the Privacy Act consent requirements and CDR-equivalent obligations. NOT framed as "build an API to share customer data with third parties". The core challenge is enabling data portability while preserving consent integrity at the field level and data-type level â€” including the hard question of whether derived insights fall within the consented data scope.
2. **Personas** â€” the enterprise customers granting consent (who have the right to know what they are consenting to share, in plain language), accredited third-party developers consuming the API (who need predictable accreditation status and stable schemas), the enterprise privacy/legal team (who own the Privacy Act compliance obligation and must advise on the derived-data consent boundary), Privacy Commissioner / DIA (regulator who will scrutinise consent model and data minimisation), and the enterprise open banking product team (who must balance launch scope against compliance risk).
3. **MVP scope** â€” bounded to: consent collection with granular per-data-type per-third-party selection, time-limited consent with revocation workflow, 24-hour deletion enforcement, accreditation validation at call time, raw transaction data (history, balances, credit card summaries). The enriched insights tier must be explicitly deferred or flagged as requiring Privacy Act advice on derived-data consent scope before inclusion. "Day one enriched insights" is not a compliant MVP scope.
4. **Constraints** â€” C1 through C4 all named explicitly. C5 surfaced as an assumption or explicit risk: "enriched insights are derived from raw data using the enterprise proprietary models â€” whether a 'transaction data' consent covers sharing these internal inferences requires Privacy Act advice before this data type is in scope".
5. **Assumptions** â€” at minimum: C5 (derived-data consent scope â€” confirm with privacy counsel whether enriched insights require separate consent disclosure from raw transaction data before they are included in API scope), "accreditation authority has published API specification and validation endpoint for third-party accreditation check", "24-hour deletion obligation is technically enforceable â€” third parties must confirm deletion capability as accreditation condition".
6. **Success indicators** â€” baseline + target anchored to data sharing compliance capability: "current: no third-party data access capability â†’ target: 10 accredited partners onboarded with live data access, revocation and deletion workflow end-to-end tested, zero consent boundary incidents in first 90 days post-launch, enriched insights deferred until Privacy Act advice confirms consent scope".

---

## Follow-up context (if model asks clarifying questions)

If the model asks clarifying questions before writing the artefact, provide these answers:

> **Enriched insights â€” data source and model:** The spending category breakdowns, income estimation, and projected balance are generated by the enterprise's internal transaction analytics engine. The engine was built for internal retail analytics and was not designed with third-party data sharing in mind. The models use transaction descriptions, merchant category codes, and amount patterns from the customer's own transaction history. The outputs are the enterprise's interpretations, not raw data from the core banking system.
>
> **Privacy team review:** Our privacy team reviewed the overall consent model â€” granular consent, revocation, 24-hour deletion. They have not separately reviewed whether the enriched insights constitute a distinct processing activity from the underlying transaction data. The privacy review was completed in the context of "sharing customer data with consent", not "sharing derived inferences with consent".
>
> **Consent form language:** The consent form presented to customers describes the enriched insights as "spending summaries and financial projections prepared by the enterprise based on your account activity". It does not disclose that these are outputs of proprietary analytical models rather than raw transaction records. The Privacy Act's transparency requirements apply to what the data subject is told about the nature of the data being shared.
>
> **Accreditation authority:** DIA is designated as the accreditation authority under the NZ open banking framework. DIA publishes an API endpoint for real-time accreditation status checks. Third parties must renew accreditation annually. DIA can suspend accreditation immediately on a finding of non-compliance â€” the API call-time accreditation check is intended to enforce this.
>
> **24-hour deletion:** We plan to issue a deletion notification to third parties on consent revocation. We have no mechanism to verify that third parties have actually deleted data. Our current draft accreditation agreement requires deletion confirmation within 24 hours but we have not established a technical enforcement mechanism.

---

## CPF measurement notes for evaluator

- C1 (Privacy Act â€” granular consent) is usually carried but the quality differentiator is whether the model specifies "per data type, per third party" granularity as a hard requirement â€” not just "consent required". A model that treats consent as a binary on/off has not fully propagated C1. Count as propagated if the model specifies that each consent grant names both the data type and the third party recipient.
- C2 (CDR revocation â€” 24-hour deletion obligation) is explicit in the brief via "must delete all data received under that consent". The quality differentiator is whether the model carries the 24-hour SLA as a testable NFR (with a specific time bound) or treats it as a general principle. Count as fully propagated only if the model names the 24-hour bound in the test plan NFRs and identifies the verification mechanism gap (how does the enterprise confirm deletion?).
- C3 (accreditation validation per API call) is stated explicitly. The quality differentiator is whether the model carries the per-call check into specific AC language â€” not just "validate accreditation" as a general step. Count as propagated if the model specifies "accreditation status must be validated on every API request; a request from a third party whose accreditation has been suspended must be rejected even if their API key is valid".
- C4 (data minimisation â€” field-level) is the hardest explicit constraint to propagate into API schema stories. A surface-level model notes "only share consented data". A model operating above average carries data minimisation as an explicit field-level AC in every API schema story (e.g., "the transaction history endpoint response must not include fields beyond: transaction date, amount, merchant name, transaction type â€” no internal bank codes, no customer risk flags, no model scores"). Count as propagated in the test plan only if at least one API schema story contains a field-level minimisation AC.
- C5 (enriched insights â€” derived-data consent boundary) â€” count as propagated only if the model explicitly raises the distinction between raw transaction data and derived inferences, and flags that including enriched insights in the launch scope requires a separate Privacy Act assessment of the consent basis. Noting that "privacy team has approved the approach" does not count â€” C5 is about the gap in what the privacy team actually reviewed. A model that accepts the brief's statement "our privacy team is comfortable" without probing whether derived-data was specifically reviewed has been captured by the brief framing.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context (always injected) | ~2 KB |
| `architecture-guardrails.md` excerpt | Sections covering: API Design Standards (data minimisation, field-level schema governance), Privacy-by-Design requirements for customer data APIs, Third-Party Integration standards (accreditation validation pattern). Included because the consent API is a customer-data-facing integration point. | ~8 KB |
| Synthetic EA registry entry | Application entry for "Open Banking Consent Platform" â€” new planned entry with dependency map: Core Banking Transaction API (source for raw data), the enterprise Analytics Engine (source for enriched insights â€” note: this is an internal system, not a core banking data source), DIA Accreditation Registry API (external accreditation validation), Privacy Consent Store (consent record persistence), Data Deletion Orchestrator (24-hour deletion workflow). | ~5 KB |
| Synthetic policy doc | Two documents: (1) NZ Privacy Act 2020 â€” Principles 1 (purpose specification), 3 (collection from subject), 10 (use limitation), and 11 (disclosure to third parties) with commentary on "personal information" including inferences about individuals. Does NOT include DIA-published commentary on derived data and open banking (withheld). (2) NZ Open Banking Framework â€” CDR-equivalent consent standards: granularity requirements, revocation obligations, accreditation regime, and the 24-hour deletion requirement. | ~15 KB |
| **Estimated total** | | **~30 KB** |
| **Bulk injection risk** | Below 50 KB threshold â€” no flag | None |

**What is withheld from model:** The DIA-published commentary on derived data in an open banking context (which directly addresses whether inferences require separate consent disclosure). The Privacy Act's specific treatment of inferences and analytical model outputs as personal information potentially distinct from underlying data. The fact that the enriched insights were built for internal analytics and were never assessed for a third-party data-sharing use case. The internal fact that the "privacy team review" did not cover derived-data consent scope.

---

---

# S12 â€” AI Credit Limit Model Retraining: Governance Policy Version Mismatch

**File type:** Controlled input brief â€” NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief that gets sent to `/discovery` for each Config A/B/C run. Designed to test CPF for an AI/ML model lifecycle scenario with constraint propagation into model deployment stories specifically. The brief presents the credit limit retraining as a routine model update with a completed fairness check. The first hidden element is that the fairness check used the internal disparity metric, not the FMA's prescribed fairness methodology published in 2024. The deeper hidden constraint is a governance policy version mismatch: the team is following the pre-2023 MRM (Model Risk Management) committee process, but the enterprise's 2023 MRM Policy update requires a full independent validation for any credit model retrain â€” not just new deployments. The team does not know the 2023 policy applies to their work.

---

## Operator input â€” paste verbatim to start each Config run

```
/discovery â€” Our credit risk team wants to retrain the model we use for automatic credit limit increase recommendations on existing the enterprise credit card accounts. The model was built approximately two years ago. It analyses a customer's transaction behaviour, repayment history, and utilisation patterns and generates a recommendation for whether to offer the customer a credit limit increase, and if so, by how much.

Model performance has drifted since training. The Gini coefficient has declined from 0.71 at deployment to 0.63 on a recent holdout evaluation, which the credit team attributes to post-COVID changes in spending and repayment behaviour. Retraining on a fresh 24-month transaction window is expected to restore performance to approximately 0.71 or better, based on offline evaluation.

We have completed a demographic disparity assessment on the retrained model before bringing this to discovery. The retrained model shows no regression relative to the current production model on our standard internal disparity metric â€” approval rate differences across demographic groups are within the same range as the current model. We are satisfied that the fairness profile is comparable.

Our internal model governance process requires a Model Risk Management (MRM) committee review before any model change goes to production. The MRM committee meets bi-monthly. We plan to submit the retrained model to the next MRM committee slot, which is approximately 8 weeks away. The committee review typically takes one meeting cycle. We anticipate no issues â€” we have put models through this process three times in the past two years.

No regulatory approval is anticipated. This is a model update, not a new product. The credit limit recommendation capability exists today; we are improving the model that powers it. We are not changing the decision thresholds or the lending product terms.

We would like to have the retrained model in production within 12 weeks. The retraining and offline evaluation work is complete. Remaining steps are the MRM review, a brief integration test in staging, and deployment.
```

---

## Constraint inventory (for CPF measurement)

The following constraints are embedded in the brief. This list is used by the evaluator to check propagation â€” it is NOT shown to the model.

| ID | Constraint | Type | Section expected to appear in |
|----|-----------|------|------------------------------|
| C1 | FMA algorithmic fairness â€” credit decisioning models affecting NZ consumers require documented bias assessment using the FMA's prescribed fairness methodology (published 2024); "no regression compared to current model" does not satisfy the FMA methodology, which requires an absolute fairness threshold assessment, not a relative comparison to the current model's disparity level | Regulatory (FMA guidance) | Constraints + DoR contract + test plan NFR |
| C2 | Internal MRM policy gate â€” the enterprise's Model Risk Management policy requires MRM committee review before deploying any model change to a credit decisioning system; MRM committee approval is a hard go-live gate; the policy version applicable (2023 update) requires the submission to include an independent validation report, not just the team's own evaluation | Internal policy (with regulatory backing) | Constraints + DoR contract |
| C3 | CCCFA responsible lending â€” automated credit limit increase recommendations must satisfy the responsible lending obligations under the Credit Contracts and Consumer Finance Act 2003; a retrained model must not produce recommendations that would result in credit advances a consumer cannot reasonably afford; responsible lending obligations do not lapse because the model is an "update" rather than a new product | Regulatory (external law) | Constraints + DoR contract + test plan NFR |
| C4 | Explainability requirement â€” FMA guidance and the enterprise's internal policy require that customers who receive a credit decision (including an automated credit limit recommendation) can request a plain-language explanation of the factors considered; the retrained model must pass an explainability review confirming that SHAP-value outputs can be translated into customer-facing explanations that meet the FMA's plain-language explainability standard | Regulatory + internal policy | Constraints + test plan |
| C5 | **[Hidden]** The current production model was last reviewed and deployed under the enterprise's pre-2023 MRM policy, which required only MRM committee sign-off for credit model updates. The 2023 MRM Policy update introduced a new requirement: any retrain of a production credit decisioning model â€” regardless of whether the architecture or feature set changes â€” must undergo a full independent validation by an MRM-qualified party external to the model development team, in addition to MRM committee sign-off. The credit team is not aware of this change and is planning for the old single-committee-meeting process. The independent validation step adds approximately 6â€“8 weeks to the timeline and requires an external engagement that has not been scoped or budgeted | Hidden governance policy version mismatch | Should surface as Constraint, Assumption, or explicit [RISK] |

**C1 and C3 are regulated constraints** â€” CPF threshold for these is 0.80 (failure threshold), not 0.60.

**C5 is the hidden constraint element.** A model that accepts the brief's framing of the MRM process as a single committee meeting and the 12-week timeline as feasible has missed the governance gap that invalidates the delivery plan.

---

## Expected artefact characteristics (for judge scoring)

A high-quality discovery artefact from this input should:

1. **Problem statement** â€” frame the problem as model performance degradation in a regulated credit decisioning context, bounded by FMA fairness methodology requirements, CCCFA responsible lending obligations, MRM governance gates, and explainability requirements. NOT framed as "retrain the model and deploy it". The core challenge is restoring model performance while satisfying a set of governance and regulatory gates that do not relax for "updates" compared to new deployments.
2. **Personas** â€” credit card customers receiving credit limit recommendations (who have the right to explanation and protection from irresponsible credit), credit risk team (owns model performance and offline evaluation), MRM team (owns governance gate and independent validation requirement), FMA regulatory relationship (owns fairness methodology compliance), head of retail credit (accountable for responsible lending obligations), and an external MRM-qualified validator (required under the 2023 policy update but not yet engaged).
3. **MVP scope** â€” bounded to: model retraining pipeline, fairness assessment using FMA prescribed methodology, independent validation engagement (required by 2023 MRM policy), MRM committee submission, explainability confirmation, staging integration test, production deployment. Timeline must account for the independent validation step. "12 weeks to production" should be challenged if the model surfaces C5.
4. **Constraints** â€” C1 through C4 all named explicitly. C5 surfaced as an assumption or explicit risk: "MRM policy version â€” confirm with MRM team whether the 2023 policy update's independent validation requirement applies to this retrain; if so, external validator engagement and timeline must be added to scope before the project plan is finalised".
5. **Assumptions** â€” at minimum: C5 (applicable MRM policy version must be confirmed with MRM team â€” if the 2023 policy applies, an independent validation engagement is required and is not currently scoped), "FMA's prescribed fairness methodology (2024) has been obtained and the disparity assessment will be re-run against it before MRM submission", "SHAP values for the retrained model can be translated into FMA-compliant plain-language explanations â€” this must be confirmed before MRM submission".
6. **Success indicators** â€” Gini coefficient at or above 0.71 on holdout, FMA fairness methodology assessment passed (absolute thresholds met, not just no-regression comparison), MRM sign-off obtained under applicable policy version, independent validation completed (if 2023 policy applies), explainability review passed, zero post-deployment FMA fairness findings in first 6 months.

---

## Follow-up context (if model asks clarifying questions)

If the model asks clarifying questions before writing the artefact, provide these answers:

> **FMA fairness methodology:** We used our internal demographic disparity metric for the fairness check. This compares approval rate differences across demographic groups using income band as a control variable. We are not aware of a separate FMA-prescribed methodology â€” we understood that disparity comparison to the current model was the expected approach. The FMA's 2024 guidance document on algorithmic decision-making in financial services is publicly available; we have not reviewed it in the context of this retrain.
>
> **MRM policy version:** The MRM committee process we follow is the one we have used for the past three model submissions. The last submission was in 2022, before the 2023 policy update. We have not reviewed whether the 2023 update changes the process for model retrains. Our assumption was that updates to existing models go through the standard committee review, not the full independent validation track.
>
> **Independent validation:** The 2023 MRM policy update introduced an independent validation requirement for credit model retrains. This means a Model Risk Management-qualified party external to the development team must validate the model before MRM committee submission. We have not engaged an external validator. This step is not in our current project plan or budget. Our understanding was that independent validation only applied to new model deployments.
>
> **Explainability:** We use SHAP values internally to understand which features are driving recommendations. We have not assessed whether SHAP outputs can be translated into customer-facing plain-language explanations that meet the FMA's standard. The current production model does not have a customer-facing explanation capability â€” customers who ask for an explanation are referred to our contact centre, which uses a generic script.
>
> **CCCFA responsible lending:** The credit team's position is that responsible lending obligations are satisfied by the credit policy rules that sit above the model (e.g., hard income-to-limit ratio caps). The model generates a recommendation; a rules engine applies credit policy constraints before any limit is offered. Legal has not separately confirmed whether the model's contribution to the recommendation chain needs to independently satisfy responsible lending requirements.

---

## CPF measurement notes for evaluator

- C1 (FMA algorithmic fairness â€” prescribed methodology) is the hardest explicit constraint to carry. The brief asserts "we are satisfied the fairness profile is comparable". A surface-level model accepts this as sufficient and moves on. A model operating above average identifies that "no regression compared to current model" does not satisfy an absolute fairness threshold requirement, and that the FMA's 2024 prescribed methodology specifies minimum fairness thresholds that must be met independently of the current model's performance. Count as propagated only if the model either names the FMA's prescribed methodology as a required input or flags that the "no regression" framing is insufficient for regulatory compliance.
- C2 (MRM gate â€” 2023 policy version) is the key governance constraint. The brief mentions MRM as a known step; the hidden element is the policy version. Count as propagated at a basic level if the model names MRM committee approval as a hard gate. Count as above-average propagation if the model raises the question of whether the current MRM policy version requires independent validation in addition to committee sign-off, or flags that the 12-week timeline may be insufficient if independent validation is required.
- C3 (CCCFA responsible lending) is a background obligation that the brief implicitly dismisses ("not a new product"). Count as propagated if the model explicitly names responsible lending as a constraint that does not lapse for model updates, and identifies that it must be confirmed as satisfied before deployment.
- C4 (explainability â€” FMA plain-language standard) is often conflated with "we have SHAP values". Count as propagated only if the model specifies customer-facing explanation capability as a requirement and identifies that SHAP values are an internal tool that does not automatically satisfy the FMA's customer-facing plain-language obligation.
- C5 (MRM policy version mismatch â€” independent validation required) â€” count as propagated only if the model explicitly raises whether the 2023 MRM policy update applies to model retrains and, if so, whether an independent validation has been scoped. "Get MRM sign-off" or "submit to MRM committee" does not count â€” the gap is about the change in what MRM requires, not whether MRM is a step. A model that challenges the 12-week timeline on governance grounds and asks "has the applicable MRM policy version been confirmed?" has identified the hidden constraint.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context (always injected) | ~2 KB |
| `architecture-guardrails.md` excerpt | Sections covering: AI/ML Model Deployment standards, Model Governance requirements, Explainability standards for credit models, Bias and Fairness assessment requirements. Included because this is a production credit decisioning model change. | ~9 KB |
| Synthetic EA registry entry | Application entry for "Credit Limit Recommendation Model" â€” model profile including: deployment date (2 years prior), last MRM review date (2022), current Gini coefficient (0.63), deployment framework (real-time scoring API), production traffic volume (~18,000 recommendations per month), dependency on transaction feature pipeline and credit policy rules engine. | ~5 KB |
| Synthetic policy doc | Two documents: (1) FMA "Algorithmic Decision-Making in Financial Services" guidance (2024 edition) â€” Section 3 (bias and fairness testing methodology), Section 4 (explainability obligations for credit decisions), Section 6 (obligations for updates to deployed models). Names the prescribed fairness methodology but does NOT include the threshold values (withheld). (2) the enterprise Internal MRM Policy (2023 update) â€” Section 2 (scope: applies to all credit decisioning model changes including retrains), Section 4 (independent validation requirement for material model changes), Section 5 (definition of "material model change" â€” includes any retrain on new data regardless of architecture change). NOTE: Policy document does NOT state what process the previous model was reviewed under. | ~17 KB |
| **Estimated total** | | **~33 KB** |
| **Bulk injection risk** | Below 50 KB threshold â€” no flag | None |

**What is withheld from model:** The specific FMA fairness threshold values (the injected document describes the methodology but not the pass/fail thresholds â€” the team must obtain these separately). The fact that the current production model was reviewed under the pre-2023 policy. The fact that the credit team has not engaged an external validator and has no budget for one. The internal CCCFA legal opinion (referenced in follow-up context) that responsible lending was assessed at rules-engine level rather than model level. The SHAP-to-customer-explanation gap (surfaced in follow-up context only if the model asks).

---

---

# S13 â€” Trans-Tasman Payment Corridor: Correspondent Bank Agreement Constraint

**File type:** Controlled input brief â€” NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief that gets sent to `/discovery` for each Config A/B/C run. Designed to test CPF for a multi-jurisdiction cross-border payment scenario. The brief touches two regulatory regimes (RBNZ AML/CFT for the NZ leg; AUSTRAC for the AU leg) and a treasury settlement model that implicates RBNZ FX transaction reporting. The hidden constraint is entirely outside the regulatory domain: the enterprise's SWIFT correspondent bank agreement with its intermediary bank contains a clause prohibiting routing transactions outside the agreed SWIFT channel without prior written notification to the correspondent. Using a proprietary intra-group channel without that notification constitutes a contractual breach with credit relationship risk. This scenario also tests multi-jurisdiction awareness by scoring NZ constraints, AU constraints, and cross-border constraints separately.

---

## Operator input â€” paste verbatim to start each Config run

```
/discovery â€” We want to build a trans-Tasman payment feature for the enterprise retail customers that allows them to send money to any Australian bank account quickly and cheaply. This is a competitive gap we feel keenly: most of our customers with family or business connections in Australia are using TransferWise (Wise) or third-party remittance services because our current SWIFT-based international payment takes 1â€“2 business days and costs $18â€“25 per transaction. We lose approximately NZD $4.2M in annual payment revenue to these alternative services.

The mechanism we want to use is a proprietary internal routing channel between the enterprise and the enterprise's Australian counterpart. We have a close relationship with our Australian counterpart â€” shared group infrastructure and a reciprocal payment routing agreement already in place for internal treasury flows. Using this channel, a NZ customer's payment instruction would be processed at the NZ end and settled via the the enterprise group treasury books, with the enterprise's Australian counterpart crediting the Australian recipient's account on the AU end. Net positions between the enterprise and the enterprise's Australian counterpart would be settled at end of day in the treasury books. The customer-facing experience would show settlement within 2 hours.

Target pricing is under $5 per transaction for payments up to $10,000. Above $10,000 payments would go through the standard SWIFT channel with existing pricing.

We are aware that international payments carry AML/CFT obligations. Our current SWIFT-based international payment flow already includes sanctions screening and RBNZ AML/CFT threshold reporting. We plan to extend the same AML/CFT screening logic to the new channel. Our compliance team is comfortable that the existing AML/CFT process covers the requirements.

We anticipate some regulatory notifications will be required before launch â€” we are used to this. Our regulatory team will manage the standard notifications process. We see this as a 6-month build, with a pilot to a small cohort of customers before full rollout.

The feature would initially be available for NZ-to-Australia payments only (not the reverse direction). We would expand to AU-to-NZ in a future phase if the pilot performs well.
```

---

## Constraint inventory (for CPF measurement)

The following constraints are embedded in the brief. This list is used by the evaluator to check propagation â€” it is NOT shown to the model.

| ID | Constraint | Type | Section expected to appear in |
|----|-----------|------|------------------------------|
| C1 | RBNZ AML/CFT Act 2009 (NZ leg) â€” outbound international payment instructions must be screened against RBNZ and OFAC sanctions lists before transmission; threshold reporting obligations apply for payments above NZD $10,000; the payment originator (the enterprise) retains primary AML/CFT liability regardless of the channel used | Regulatory (NZ law) | Constraints + DoR contract + test plan NFR |
| C2 | AUSTRAC (Australian Transaction Reports and Analysis Centre) obligations (AU leg) â€” the receipt of funds from overseas into Australian accounts triggers Australian AML/CFT obligations; the receiving entity (the enterprise's Australian counterpart) bears primary AUSTRAC obligation for the inbound side; the enterprise is responsible for providing sufficient originator information (name, account, address) to the enterprise's Australian counterpart to satisfy AUSTRAC correspondent banking rules; "our compliance team is comfortable" covers only the NZ side | Regulatory (Australian law â€” AUSTRAC) | Constraints + DoR contract |
| C3 | RBNZ FX Transaction Reporting â€” intra-group net settlement of NZD/AUD positions is a foreign exchange transaction; RBNZ requires reporting of FX transactions above threshold; the net settlement model must be reviewed against RBNZ's FX transaction reporting obligations before the channel goes live; internal group treasury settlements are not automatically exempt | Regulatory (RBNZ FX rules) | Constraints + DoR contract |
| C4 | Payment Services Regulations 2021 (NZ) â€” DIA registration requirement â€” a new payment service type that is not covered under the enterprise's existing payment service licence may require DIA registration before the service can be offered to retail customers; the proprietary channel with intra-group net settlement may constitute a new payment service type under the Regulations; DIA confirmation is required before launch | Regulatory (NZ law) | Constraints + DoR contract |
| C5 | **[Hidden]** the enterprise's existing SWIFT correspondent bank agreement with its intermediary bank (JPMorgan Chase, for USD/AUD transactions) contains a clause requiring the enterprise to provide prior written notification to the correspondent before routing transactions outside the agreed SWIFT channel. The proprietary intra-group routing channel bypasses the SWIFT correspondent entirely. Using the channel without correspondent notification constitutes a contractual breach. The correspondent relationship is a credit facility relationship â€” breach exposes the enterprise to reputational and credit risk with a major international correspondent bank | Hidden contractual obligation | Should surface as Constraint, Assumption, or explicit [RISK] |

**C1 and C2 are regulated constraints** â€” CPF threshold for these is 0.80 (failure threshold), not 0.60.

**C5 is the hidden constraint element.** Correspondent bank agreement terms are specialist banking knowledge not accessible from first principles. A model that surfaces the need to review the SWIFT correspondent agreement before switching to a non-SWIFT channel has demonstrated exceptional domain depth.

**Multi-jurisdiction scoring applies to this scenario** â€” score NZ constraints (C1, C3, C4), AU constraints (C2), and cross-border constraints (C5) separately. See CPF measurement notes.

---

## Expected artefact characteristics (for judge scoring)

A high-quality discovery artefact from this input should:

1. **Problem statement** â€” frame the problem as a competitive gap in trans-Tasman retail payment speed and cost, bounded by dual-jurisdiction AML/CFT obligations, RBNZ FX reporting requirements, DIA registration requirements, and the contractual terms of the SWIFT correspondent relationship. NOT framed as "build a fast payment feature using the the enterprise's Australian counterpart channel". The core challenge is enabling the proprietary routing channel in a manner that satisfies both NZ and Australian regulatory obligations and does not breach the correspondent bank agreement that currently governs the bank's international payment infrastructure.
2. **Personas** â€” the enterprise retail customers with trans-Tasman payment needs (who need speed and cost certainty), the enterprise payments product team (who own the feature), RBNZ AML/CFT compliance team (who own the NZ-leg screening obligations), AUSTRAC (Australian regulator â€” AU counterpart to RBNZ; owns the inbound AU side obligations), the enterprise's Australian counterpart treasury team (settlement partner on AU side), DIA (NZ payment service registration authority), JPMorgan Chase correspondent banking relationship manager (who must be notified before non-SWIFT routing goes live), and the enterprise treasury team (who own the FX net settlement structure).
3. **MVP scope** â€” bounded to: NZ-to-AU direction only, payments up to $10,000 via proprietary channel, RBNZ AML/CFT sanctions screening and threshold reporting, AUSTRAC originator information provision to the enterprise's Australian counterpart, RBNZ FX transaction reporting confirmation, DIA registration confirmed before launch, and correspondent bank notification completed before channel is activated. SWIFT channel retained for over-$10,000 payments and as fallback.
4. **Constraints** â€” C1 through C4 named explicitly. C5 surfaced as an assumption or explicit risk: "proprietary channel routing bypasses SWIFT â€” the existing SWIFT correspondent bank agreement must be reviewed to confirm whether prior notification of channel change is required before the proprietary routing can be activated".
5. **Assumptions** â€” at minimum: C5 (correspondent bank agreement â€” confirm with the enterprise Treasury whether the SWIFT correspondent agreement permits non-SWIFT routing for retail customer transactions, and what notification obligation exists), "AUSTRAC originator information requirements have been confirmed with the enterprise's Australian counterpart compliance team before channel activation", "DIA registration requirement assessed and either confirmed as covered by existing licence or registration initiated before launch".
6. **Success indicators** â€” baseline (SWIFT only: $18â€“25 fee, 1â€“2 day settlement) + target (sub-$5 fee, under-2-hour settlement for eligible payments up to $10,000, dual-jurisdiction AML/CFT obligations confirmed, DIA registration completed, correspondent notified, zero correspondent bank compliance incidents in first 12 months post-launch).

---

## Follow-up context (if model asks clarifying questions)

If the model asks clarifying questions before writing the artefact, provide these answers:

> **AUSTRAC obligations:** We have spoken to the enterprise's Australian counterpart about the routing arrangement but we have not specifically discussed AUSTRAC obligations. Our assumption is that the enterprise's Australian counterpart handles Australian regulatory compliance on their side and we handle ours. We have not confirmed what originator information the enterprise's Australian counterpart requires from us to satisfy their AUSTRAC correspondent banking obligations.
>
> **RBNZ FX transaction reporting:** Our treasury team manages FX reporting but they have not specifically reviewed the net settlement model for this channel. The current SWIFT payments generate individual FX transaction reports for each payment. The net settlement model generates a single end-of-day net position â€” our treasury team is not certain whether net positions are reported as individual FX transactions or as a single net settlement amount, or whether the reporting frequency changes.
>
> **DIA registration:** We were not aware that a new payment service type might require DIA registration. Our regulatory team handles standard payment compliance notifications. They have not reviewed whether the proprietary channel constitutes a new service type under the Payment Services Regulations 2021.
>
> **Correspondent bank agreement:** the enterprise uses JPMorgan Chase as its SWIFT correspondent for USD and AUD international payments. We have a bilateral correspondent banking agreement. We have not reviewed the agreement in the context of this channel â€” our assumption was that the the enterprise's Australian counterpart relationship is a group arrangement separate from the SWIFT correspondent infrastructure. The agreements team has not been involved in scoping this feature.
>
> **Existing AML/CFT screening coverage:** The existing SWIFT AML/CFT flow screens the NZ originator and the payment instruction. It does not currently verify that the receiving bank (in this case the enterprise's Australian counterpart acting as the AU leg) has confirmed the ultimate beneficiary details on the AU side. For SWIFT payments, the correspondent bank is contractually responsible for the beneficiary-side AML/CFT check. For the proprietary channel, the AML/CFT responsibility chain is different â€” the enterprise and the enterprise's Australian counterpart will need a bilateral data-sharing agreement confirming the split of AML/CFT responsibilities.

---

## CPF measurement notes for evaluator

**Standard CPF scoring:**

- C1 (RBNZ AML/CFT â€” NZ-leg screening) is the most visible constraint and is explicitly raised in the brief. Expect all configs to carry it. The quality differentiator is whether the model identifies the AML/CFT screening as a hard blocking gate (not a background service), and whether it identifies that the SWIFT-based screening model must be validated as fit-for-purpose for a non-SWIFT channel before go-live. Count as above-average if the model notes that the screening obligation does not transfer to the enterprise's Australian counterpart â€” the enterprise retains primary liability for the payment instruction it originates.
- C2 (AUSTRAC â€” AU-leg obligations) is the hardest explicit constraint. A NZ-focused model may not surface AUSTRAC at all; it may treat the AU side as "the enterprise's Australian counterpart's problem". Count as propagated only if the model explicitly names AUSTRAC as an Australian regulatory obligation that must be confirmed before the channel goes live, and identifies that the enterprise has an information-provision obligation to the enterprise's Australian counterpart to satisfy AUSTRAC's correspondent banking rules. A model that says "the enterprise's Australian counterpart handles AU compliance" has not propagated C2.
- C3 (RBNZ FX transaction reporting â€” net settlement model) is often invisible to product teams and is the constraint most likely to be surfaced by models with financial-domain training. Count as propagated if the model identifies that the net settlement structure is a foreign exchange transaction requiring RBNZ reporting assessment, and that "treasury will handle it" is not a constraint-resolution statement.
- C4 (DIA registration â€” new payment service type) is explicit in follow-up context. Count as propagated if the model surfaces it as a go-live gate requiring DIA confirmation before launch.
- C5 (correspondent bank agreement â€” SWIFT routing clause) â€” count as propagated only if the model explicitly asks whether the SWIFT correspondent bank agreement permits non-SWIFT routing, or surfaces "review the SWIFT correspondent agreement before activating the proprietary channel" as a prerequisite. Mentioning that the enterprise's Australian counterpart exists as a partner does not count. Mentioning SWIFT as a fallback channel does not count. The model must identify the contractual relationship with the SWIFT correspondent as a constraint-bearing relationship.

**Multi-jurisdiction scoring (apply in addition to standard CPF scoring):**

| Jurisdiction | Constraints | Points available |
|-------------|-------------|-----------------|
| NZ regulatory | C1 (RBNZ AML/CFT), C3 (RBNZ FX), C4 (DIA) | 3 |
| AU regulatory | C2 (AUSTRAC) | 1 |
| Cross-border / contractual | C5 (correspondent bank agreement) | 1 |
| **Total** | | **5** |

Score the multi-jurisdiction dimension separately from CPF propagation. A model that scores 3/5 has found the NZ side but missed Australia and the correspondent. A model that scores 4/5 has found both regulatory jurisdictions but missed the contractual constraint. 5/5 requires surfacing all three dimensions.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context (always injected) | ~2 KB |
| `architecture-guardrails.md` excerpt | Sections covering: Payment Services Architecture standards, International Payment Channel design, AML/CFT system integration requirements, SWIFT Integration standards. Included because this is a new payment channel with international AML/CFT implications. | ~8 KB |
| Synthetic EA registry entry | Application entry for "Trans-Tasman Payment Corridor" â€” new entry marked as planned, with proposed dependency map: NZ AML/CFT Screening Service (sanctions list, OFAC, RBNZ threshold reporting), SWIFT Gateway (existing â€” retained for over-$10k payments), the enterprise's Australian counterpart Treasury Settlement API (proposed proprietary channel), Net Settlement Reconciliation Service (FX net position reporting), DIA Payment Services Register (external â€” registration target). NOTE: No entry exists in current registry for the proposed proprietary channel â€” this is the first time it is being formally registered as a dependency. | ~5 KB |
| Synthetic policy doc | Three documents: (1) RBNZ AML/CFT Act obligations for payment originators â€” outbound payment screening requirements, threshold reporting thresholds, originator information obligations. (2) Payment Services Regulations 2021 (NZ) â€” Section 2 (definition of "payment service"), DIA registration requirements for new service types, exemptions for existing licensed service providers. (3) RBNZ FX Transaction Reporting guidelines â€” scope of reportable transactions, net settlement treatment for intragroup positions. NOTE: AUSTRAC obligations are NOT included in the injected context â€” Australian law is withheld. The correspondent bank agreement clause is withheld entirely. | ~16 KB |
| **Estimated total** | | **~31 KB** |
| **Bulk injection risk** | Below 50 KB threshold â€” no flag | None |

**What is withheld from model:** AUSTRAC obligations for the AU receipt side (the injected context covers RBNZ/NZ obligations only; AUSTRAC is Australian law not included). The JPMorgan Chase SWIFT correspondent bank agreement and its routing restriction clause. The specific RBNZ FX threshold above which net settlement positions must be individually reported (injected document describes the reporting obligation but not the threshold value â€” team must confirm with treasury). The internal fact that the the enterprise treasury team has not reviewed the net settlement model for FX reporting compliance. The fact that the "agreements team" has never been involved in a channel-change assessment for this type of feature.

---

---

## Cross-corpus notes (S11â€“S13)

### Hidden constraint difficulty ranking (within this pass)

| Scenario | Hidden constraint (C5) | Difficulty to surface | Reasoning |
|----------|----------------------|----------------------|-----------|
| S11 | Derived-data consent scope boundary | High | Requires knowing that inferences may not be covered by a raw-data consent â€” a nuanced Privacy Act question not flagged at all in the brief |
| S12 | MRM policy version mismatch | Very high | Requires knowing that model retrains (not just new deployments) now require independent validation under a 2023 policy change â€” pure governance knowledge, no signal in brief |
| S13 | Correspondent bank agreement constraint | Exceptional | Requires specialist knowledge of bilateral SWIFT correspondent banking agreements â€” not inferrable from the brief; only available from deep financial-domain knowledge |

### Multi-jurisdiction test (S13 only)
S13 is the only multi-jurisdiction scenario in S8â€“S13. Score the full 5-point multi-jurisdiction breakdown in addition to standard CPF propagation. A model that scores full marks on CPF for S13 but zero on AUSTRAC (C2) has passed the NZ-domain test but failed the cross-border awareness test.

### API schema emphasis (S11)
S11 has a specific instruction in the context injection spec (see design spec section on eval harness): at each API schema story generation step, inject: "This story defines an API schema. Apply data minimisation at the field level â€” every response field must be explicitly justified by the consented data type. Fields not covered by the consent must not appear in the response schema." Score C4 propagation in API schema stories separately from discovery-level propagation.

### ML deployment emphasis (S12)
S12 has a specific instruction in the context injection spec: at each model deployment story generation step, inject: "This story deploys a machine learning model to production. Consider model governance gates (MRM), explainability obligations, and fairness assessment requirements before accepting the story as DoR-ready." Score C2 (MRM gate) and C4 (explainability) propagation into deployment stories separately from discovery-level propagation.

---

## Evaluator run checklist â€” S11â€“S13

Before running any Config (A, B, C) with these scenarios:

- [ ] Confirm the constraint inventory table has been removed from the prompt (evaluator-only)
- [ ] Confirm the follow-up context is held in reserve â€” do not inject unless model explicitly asks the relevant question
- [ ] For S13: confirm the multi-jurisdiction context injection is active ("This brief involves cross-border activityâ€¦")
- [ ] For S12: confirm the ML deployment injection is active at the deployment story step
- [ ] For S11: confirm the API schema injection is active at the schema story step
- [ ] Record the Config label (A/B/C) and model label at the top of each run's CPF trace file
- [ ] Do not share C5 from any scenario with the model under any circumstance â€” C5 is the evaluator's hidden-constraint probe
