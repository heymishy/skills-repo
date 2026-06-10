# Discovery Report: Automated Regulatory Reporting Pipeline

---

## 1. Executive Summary

Your finance operations team is spending 6–8 business days per monthly cycle on a largely manual process to produce RBNZ and FMA regulatory returns. The core problem is not analyst capability �� it is that three capable senior analysts are functioning primarily as human data plumbing, with automation handling none of the extraction, transformation, or reconciliation steps. The consequence is predictable: deadline pressure, occasional compliance exposure, and significant opportunity cost on senior headcount.

The proposed pipeline is well-scoped and technically achievable. The critical design constraints — human approval before submission, a complete audit trail for every transformation, and formalised normalisation logic — are all buildable requirements, and they are the right constraints to have. This report maps what needs to be true for the pipeline to succeed, where the risks sit, and what decisions need to be made before build begins.

---

## 2. Problem Definition

### 2.1 What Is Actually Happening Today

Three senior analysts run a six-to-eight business day cycle each month. The work breaks into roughly three phases:

**Extraction.** Each analyst pulls data manually from one of three source systems — core banking, treasury, and card platforms. The extraction method is not described, but the fact that read-only APIs are available and not currently used suggests this is likely a combination of report exports, screen scraping, or scheduled data dumps that are then manipulated in Excel. This phase is where the 40% time estimate is largely concentrated.

**Reconciliation and normalisation.** Extracted data is reconciled across the three systems in Excel. A known normalisation step corrects legacy artefacts — rounding differences and timing mismatches — that were introduced during a 2019 system migration and have never been resolved at source. This step is performed manually every cycle, meaning it is performed from memory or from undocumented institutional knowledge, introducing analyst-dependent variation.

**Population and submission.** Completed returns are uploaded via the RBNZ Reporting Portal and the FMA's online submission gateway. This is currently a manual upload step.

### 2.2 The Actual Risk Profile

The team has framed this primarily as an efficiency problem, but the compliance exposure deserves equal weight. Two informal extension requests to the RBNZ relationship manager is not a minor operational footnote. RBNZ relationship managers do not have formal authority to grant extensions on prudential return deadlines — what has happened is that the relationship manager has exercised discretion to not immediately escalate. That discretion is finite. A third or fourth occurrence changes the conversation materially, and the formal consequence — a notice of non-compliance and potential unscheduled supervisory review — is a significant regulatory event for any prudentially supervised entity.

The normalisation step carried in analyst memory also represents a specific and underappreciated risk. If the two or three analysts who understand that logic leave, change roles, or are simultaneously absent during a cycle, the team either produces incorrect returns or cannot produce them on time. That is a key-person dependency on a compliance-critical process.

### 2.3 What Success Looks Like

A successful pipeline reduces the monthly cycle from 6–8 business days to a preparation and review window of 1–2 business days, eliminates analyst dependency on extraction and reconciliation steps, formalises the normalisation logic in code rather than memory, and produces a complete, regulator-readable audit trail for every figure in every return. Analysts retain meaningful sign-off authority rather than nominal sign-off authority over a black box.

---

## 3. Requirements Analysis

### 3.1 Functional Requirements

**Data extraction.** The pipeline must connect to all three source systems via their read-only APIs, extract the specific fields required for RBNZ and FMA returns on a scheduled basis aligned to the reporting calendar, and land that data in a controlled staging environment before any transformation occurs. The pre-transformation state must be preserved — this is an audit requirement, not just a design preference.

**Normalisation and transformation layer.** The existing manual normalisation step must be reverse-engineered, documented, and encoded as explicit, versioned transformation logic. This is one of the highest-priority workstreams in the build phase because it is currently undocumented. Every transformation rule in this layer must be individually identifiable, traceable to a documented rationale, and auditable. Rules must be version-controlled so that if a rule changes, prior returns produced under the prior rule remain explainable.

**Reconciliation logic.** The cross-system reconciliation checks currently performed in Excel must be codified. This requires extracting the reconciliation rules from the analysts — what tolerances are applied, what mismatches trigger a hold versus an adjustment, what the disposition logic is for edge cases. This is a discovery activity that must happen before build begins.

**Pre-populated return generation.** The pipeline output is a structured return file ready for analyst review. The format must match what the RBNZ Reporting Portal and FMA submission gateway accept. If either regulator requires specific file formats, schemas, or metadata, those must be confirmed during discovery with both regulators.

**Review and approval workflow.** Analysts must be able to review the pre-populated return, inspect any flagged items, trace any figure to its source data and transformation history, and approve or reject the return for submission. Rejection must trigger a defined resolution workflow, not a fallback to the entirely manual process. The pipeline should support annotation — analysts should be able to document the basis for any manual override or adjustment they make during review.

**Submission.** The pipeline does not submit directly. Once an analyst approves, submission remains a manual step via the existing portals. This is the correct design choice for now. Automated submission to regulators is a future-state question that should only be revisited after the pipeline has run reliably for a sustained period and after explicit regulatory engagement.

**Audit trail.** Every submitted figure must be traceable back to its source record, with the full chain of transformations applied documented and timestamped. This must be queryable — compliance and audit teams need to be able to reconstruct the provenance of any figure on demand, not just in principle.

### 3.2 Non-Functional Requirements

**Availability and timing.** The pipeline must reliably complete its extraction and transformation run with enough lead time for analyst review before the 20th of each month. Given the current 6–8 day cycle, targeting pipeline completion by the 12th of each month would give analysts a 6–8 day review window — approximately equivalent to the current total cycle time — while allowing the deadline to be met comfortably. As confidence in the pipeline grows, the review window can be compressed.

**Data integrity.** The pipeline must not modify source data. All transformations must occur in a separate layer operating on copies of source data, with the original extracted values preserved immutably.

**Access control.** Read-only API access to source systems must be scoped to exactly the fields required. Credentials must be managed through a secrets management system, not stored in pipeline configuration files. Analyst access to approve and submit must be role-controlled and logged.

**Failure handling.** The pipeline must handle API failures, partial extractions, and unexpected data gracefully. Failure modes must alert the team immediately and with enough lead time that a manual fallback is still possible before the submission deadline. Silent failures — where the pipeline appears to have run but has not — are the most dangerous failure mode and must be explicitly designed against.

**Change management for source systems.** If any of the three source systems changes its API schema, the pipeline will break. There must be a mechanism to detect schema drift and alert the team before it causes a missed extraction. Vendor change notification processes for all three systems should be confirmed and formalised.

### 3.3 Regulatory and Compliance Requirements

**Audit trail specifics.** Both RBNZ and FMA require traceability from submitted figures to source data with explanation of adjustments. The audit trail must therefore capture: the raw source value, the transformation rule applied, the rule version, the output value, the timestamp, and the identity of any analyst who made a manual adjustment during review. This should be producible as a structured report, not just available in system logs.

**Normalisation permanence.** Formalising the normalisation logic as a permanent transformation layer is sound, but it carries a specific regulatory consideration. If an RBNZ or FMA examiner reviews a return and asks why a submitted figure differs from the raw source system value, the answer must be documented and defensible. The transformation layer needs to carry not just the logic but the documented rationale for each rule — specifically, that these are corrections for known, dated legacy migration artefacts, not discretionary adjustments.

**Regulator notification.** There is an open question about whether either regulator should be notified of the change in how returns are produced. This does not mean seeking approval for internal process changes. It means considering whether the RBNZ prudential supervision team or FMA compliance contacts would expect to be informed that a material process change has occurred in how returns are generated. This is a compliance team decision, but it should be explicitly made rather than assumed either way.

---

## 4. Scope and Boundaries

### 4.1 What Is In Scope

- Read-only API integration with core banking, treasury, and card platforms
- Extraction, normalisation, and reconciliation pipeline
- Pre-populated return generation for both RBNZ and FMA returns
- Analyst review and approval workflow
- Audit trail for all transformations
- Operational monitoring and alerting

### 4.2 What Is Explicitly Out of Scope

**Automated regulatory submission.** The pipeline does not submit to regulators. This boundary is correct and should be held firmly in the initial build.

**Remediation of source system artefacts.** The normalisation layer corrects for the 2019 migration artefacts at reporting time. It does not fix them at source. Whether those artefacts should eventually be corrected in the source systems is a separate question — one worth raising with the system owners, since it would eventually make the normalisation layer unnecessary — but it is not part of this project.

**FMA and RBNZ portal integration.** The pipeline produces return files. It does not integrate with the submission portals directly.

**Other regulatory reporting.** The scope is the specific RBNZ prudential returns and FMA quarterly reports currently produced by this team. Other regulatory or statutory reporting obligations are out of scope.

### 4.3 Boundaries That Need Clarification

**What exactly are the return formats?** The pipeline must produce files that match portal requirements exactly. The specific schemas, field definitions, and validation rules for both the RBNZ portal and FMA gateway should be obtained and documented before design begins.

**What are the exact reconciliation rules?** The current reconciliation process lives partly in analyst heads. Extracting, documenting, and validating those rules with the analysts is a discovery activity in its own right. It cannot be assumed that the rules are simple or fully consistent across analysts.

**What do the three APIs actually expose?** Read-only API access is described as available, but the specific capabilities — field coverage, query parameters, pagination behaviour, rate limits, historical data access — need to be confirmed for each system. There may be gaps between what the returns require and what the APIs expose.

---

## 5. Risks and Open Questions

### 5.1 High Priority Risks

**Undocumented normalisation logic.** The normalisation rules exist in analyst practice, not in documentation. If the rules are partially inconsistent across analysts, or if any analyst has adapted them over time without others knowing, the formalisation process may surface disagreements about what the correct logic actually is. This needs to be treated as a formal knowledge-extraction exercise with structured analyst interviews and validation, not a quick specification session.

**API coverage gaps.** If any of the three source system APIs does not expose all required fields, the pipeline cannot be fully automated for that system. This is a foundational dependency that must be verified before build begins. A partial gap — where most fields are available via API but a small number require a different extraction method — is manageable but must be identified and designed for explicitly.

**Timing of source data availability.** The pipeline schedule must account for when source system data is actually available and complete for the prior month. If the core banking system does not finalise month-end positions until several days after month-end, the pipeline cannot extract complete data before that point. The timing dependencies across all three systems need to be mapped.

**Change control for the transformation layer.** Once the normalisation rules are formalised in code, they must not be changed casually. A change to a transformation rule that affects a submitted return creates a traceability problem if the change is not versioned and documented. A formal change control process for the transformation layer needs to be defined before go-live.

### 5.2 Medium Priority Risks

**Analyst trust in pipeline output.** Analysts who have run this process manually for an extended period will have a well-developed intuition for what the numbers should look like. A pipeline that produces correct output but looks different from what analysts expect — because the normalisation is now consistent rather than variable — may generate unnecessary review cycles or rejection of correct outputs. Change management and analyst involvement in testing are important here.

**Submission portal format changes.** If RBNZ or FMA changes their submission portal schema or file format requirements, the pipeline's output generation will break. There should be a monitoring process for regulatory portal change notifications.

**Dependency on three separate API integrations.** Each API integration is an independent dependency. If any one of the three source systems is unavailable during the extraction window, the pipeline cannot complete a full run. Partial-run handling and the fallback process for API unavailability need to be designed.

### 5.3 Open Questions Requiring Decisions

1. **Who owns the transformation layer rules?** Once formalised, who has authority to propose, approve, and implement changes to normalisation logic? This is likely a joint finance operations and compliance decision, but it needs a named owner.

2. **What is the fallback process?** If the pipeline fails with insufficient time to resolve the issue before the submission deadline, what happens? The manual process must remain executable as a fallback, at least until the pipeline has demonstrated sufficient reliability.

3. **Should regulators be informed?** The compliance team should make an explicit decision about whether to proactively inform RBNZ and/or FMA of the process change.

4. **What is the approval workflow for multi-analyst review?** Currently three senior analysts are involved. Does the pipeline require all three to approve, or a single designated approver, or a quorum? What happens if an approver is unavailable?

5. **How long must audit records be retained, and in what form?** Both regulators will have document retention requirements. The audit trail storage design must comply with those requirements.

---

## 6. Recommended Next Steps

The discovery phase has established sufficient understanding to move to design, contingent on resolving the open questions and conducting three specific pre-design activities that are currently blockers.

**Pre-design activities (recommended before architectural design begins):**

First, conduct structured knowledge-extraction sessions with all three analysts to document the full normalisation and reconciliation logic. This should produce a written specification that all three analysts validate and sign off on. Discrepancies in analyst understanding should be resolved during this process, not discovered during build.

Second, engage the owners or vendors of all three source systems to confirm API field coverage against the full list of fields required for both the RBNZ and FMA returns. Document any gaps and determine how they will be addressed.

Third, obtain the current file format specifications, field definitions, and validation rules for both the RBNZ Reporting Portal and the FMA submission gateway. Confirm whether either portal has planned schema changes in the near term.

**Compliance decision:**

The compliance team should make and document the decision on regulator notification before build begins, so that if notification is appropriate, it happens before the pipeline goes live rather than after.

**Design phase:**

With the above inputs in hand, the design phase can produce a pipeline architecture, transformation layer specification, audit trail schema, review and approval workflow design, and operational monitoring plan. The design should be validated with the analysts before build begins.

---

## 7. Summary Assessment

This is a well-defined problem with a buildable solution. The efficiency case is clear, but the stronger argument for this project is risk reduction: formalising undocumented normalisation logic, eliminating key-person dependency on a compliance-critical process, and creating a reliable, traceable path to on-time regulatory submission.

The design constraints the team has established — human approval before submission, complete audit trail, formalised transformation logic — are the right ones. They reflect a sound understanding of what regulators will scrutinise and what can go wrong. The project should be designed to those constraints without compromise.

The primary work before build begins is knowledge extraction, not technical scoping. The normalisation logic and reconciliation rules that currently exist in analyst practice need to be made explicit and validated before they can be encoded. That work is the critical path.