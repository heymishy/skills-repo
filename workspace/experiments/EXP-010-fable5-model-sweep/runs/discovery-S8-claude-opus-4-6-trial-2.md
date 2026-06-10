

# Discovery Document

## Automated Regulatory Reporting Pipeline

### 1. Overview & Context

The finance operations team produces monthly RBNZ prudential returns and quarterly FMA regulatory reports. The current process is entirely manual: three senior analysts extract data from three separate source systems (core banking, treasury, and card platforms), reconcile figures in Excel workbooks, and upload completed returns via the RBNZ Reporting Portal and FMA's online submission gateway.

The proposed initiative builds an automated pipeline that connects to the three source systems via read-only APIs, extracts required data fields, runs reconciliation and normalisation logic automatically, and produces pre-populated return files for analyst review and approval before submission. Analysts retain sign-off authority — the pipeline does not submit directly to regulators.

### 2. Current State

**Process flow.** Each monthly cycle follows the same pattern: analysts manually log in to core banking, treasury, and card platforms, extract data into spreadsheets, reconcile cross-system figures, apply manual normalisation corrections for known legacy artefacts, populate the return templates, obtain internal sign-off, and upload via the RBNZ Reporting Portal and FMA submission gateway.

**Cycle time.** The process consumes 6–8 business days per monthly cycle.

**Deadline performance.** The team misses its internal sign-off deadline approximately once per quarter. This creates downstream pressure on the compliance team and has twice required informal extension requests to the RBNZ relationship manager. The regulatory hard deadline is the 20th of each month for the prior month's RBNZ prudential return.

**Effort allocation.** Senior analysts estimate roughly 40% of their time on extraction and reconciliation steps they believe could be automated.

**Normalisation.** A manual correction step addresses legacy artefacts — rounding differences and timing mismatches introduced during a 2019 system migration. Analysts apply these corrections in Excel before populating return templates.

**Audit posture.** Both RBNZ and FMA require the ability to trace any submitted figure back to source data and explain any adjustments. The current process relies on spreadsheet-based working papers and analyst knowledge to satisfy this requirement.

### 3. Proposed Future State

An automated pipeline that:

- Connects to core banking, treasury, and card platforms via read-only APIs to extract required data fields.
- Runs reconciliation logic automatically across the three data sources.
- Applies a formalised normalisation layer that corrects known legacy artefacts (rounding differences, timing mismatches from the 2019 migration) as a permanent data transformation step.
- Produces pre-populated return files in the format required by RBNZ and FMA.
- Presents return files to analysts for review and approval before submission.
- Produces a complete audit trail of every transformation applied to source data before the return is generated.

Analysts retain sign-off authority. The pipeline does not submit to regulators without human review and approval.

### 4. Identified Risks & Concerns

#### 4.1 Normalisation Layer Governance

The proposal formalises legacy normalisation corrections as a permanent data transformation layer in the pipeline. This is the area that warrants the most careful treatment.

**The core concern.** When normalisation logic is embedded in an automated pipeline, it becomes infrastructure rather than a visible analyst judgement. The corrections it applies will run silently on every cycle. If the underlying source system behaviour changes — because a platform is upgraded, a migration artefact is corrected at source, or a new artefact is introduced — the normalisation layer may apply corrections that are no longer appropriate, or fail to apply corrections that are now needed, and nobody will notice until a return contains a material error or an auditor asks a question the team cannot answer.

**What this means practically:**

- The normalisation rules need to be explicitly documented: what each rule corrects, why it exists, what source system behaviour it compensates for, and under what conditions it should be reviewed or retired.
- There must be a defined ownership and review cycle for normalisation rules. Someone must be accountable for periodically confirming that each rule is still necessary and still correct. This is not a technical problem — it is a governance problem.
- The audit trail must distinguish between raw source data and normalised data, and must record exactly which normalisation rules were applied to which fields on each run. The RBNZ and FMA traceability requirement demands this, but it is also essential for internal confidence in the pipeline's output.
- The team should consider whether any normalisation rules should have expiry dates or trigger conditions that force a human review — for example, if a rule corrects a known rounding difference of ±$500 and the observed difference on a given run is ±$50,000, the pipeline should flag this rather than silently applying the correction.

**The deeper question the team should consider.** The 2019 migration artefacts are now five years old. Has the organisation investigated whether these artefacts can be corrected at source in the core banking, treasury, or card platforms? If so, the normalisation layer could be a transitional measure rather than a permanent one, and the long-term target state would be clean source data that does not require downstream correction. If not, the team should understand why — because a permanent normalisation layer is a permanent dependency on institutional knowledge about source system behaviour, and that knowledge will erode over time as people move on. The pipeline makes the corrections automatic, but it does not make the underlying problem go away.

#### 4.2 Reconciliation Logic Correctness

The pipeline automates reconciliation logic that currently lives in analyst expertise and Excel workbooks. Encoding this logic in software means it will execute consistently, but it also means errors in the encoded logic will execute consistently. The team should plan for:

- A parallel-run period where the pipeline runs alongside the manual process and outputs are compared. The length of this period should be long enough to cover at least one quarterly FMA cycle and several monthly RBNZ cycles.
- A defined process for updating reconciliation logic when regulatory requirements change. RBNZ and FMA periodically update return specifications. The pipeline must be maintainable by people who understand the regulatory requirements, not only by the engineers who built it.

#### 4.3 Source System API Reliability

The pipeline depends on read-only API connections to three source systems. Questions the team should address:

- Do all three systems currently have production-grade APIs suitable for this purpose, or do any of them require API development or enablement? If APIs need to be built, this is a dependency with its own timeline and risk profile.
- What happens if one or more APIs are unavailable during a reporting cycle? The pipeline needs a defined failure mode — does it wait and retry, does it alert the team to fall back to manual extraction, or does it use cached data? Given the hard regulatory deadline on the 20th, an API outage on the 17th is a scenario that needs a plan.
- What access controls and authentication mechanisms govern the APIs? Read-only access is a good baseline, but the credentials and access paths need to be managed in line with the organisation's security and access management policies.

#### 4.4 Audit Trail Requirements

The compliance team has flagged the audit trail as non-negotiable. The team should clarify:

- What specific format and retention period the RBNZ and FMA expect for audit records. If regulators have published guidance on this, the audit trail design should be validated against that guidance before build.
- Whether the audit trail needs to be accessible to regulators directly (e.g., via a portal or export) or only available on request during examinations.
- How long audit records must be retained and where they will be stored. Regulatory record-keeping requirements may specify minimum retention periods.

#### 4.5 Submission Process

The proposal states that analysts retain sign-off authority and the pipeline does not submit to regulators without human review and approval. The team should define clearly:

- What the review and approval step looks like operationally. Is it a dashboard where an analyst reviews the pre-populated return, compares it to the audit trail, and clicks "approve"? Is there a dual-approval requirement?
- Whether the actual upload to the RBNZ Reporting Portal and FMA submission gateway will be automated (triggered by analyst approval) or remain manual (analyst downloads the file and uploads it). If automated submission is in scope, this introduces additional integration requirements and a different risk profile — an accidental approval could trigger a submission.

#### 4.6 Operational Dependency & Continuity

The current process depends on analyst expertise. The proposed process will depend on the pipeline. The team should consider:

- What happens if the pipeline fails during a reporting cycle. Is the manual process preserved as a fallback, at least during the initial period? If the team plans to retire the manual process, at what point is that safe to do?
- Who maintains the pipeline operationally? If it is handed to a technology support team, that team needs to understand the regulatory context, not just the technical components. If it stays with the finance operations team, they need the technical capability to operate and troubleshoot it.

### 5. Assumptions to Validate

The following assumptions are present in the brief and should be confirmed before proceeding:

1. All three source systems (core banking, treasury, card platforms) have or will have read-only APIs capable of delivering the required data fields in a timely and reliable manner.
2. The reconciliation logic currently applied by analysts in Excel can be fully and accurately codified — there are no reconciliation steps that rely on undocumented analyst judgement or ad-hoc investigation.
3. The normalisation corrections for 2019 migration artefacts are well-understood, stable, and finite — the team can enumerate every correction rule and its rationale.
4. The RBNZ Reporting Portal and FMA submission gateway accept return files in formats that the pipeline can generate programmatically.
5. The compliance team's definition of "complete audit trail" has been validated against RBNZ and FMA expectations, not only internal standards.
6. The 6–8 business day cycle time is primarily consumed by extraction and reconciliation (the steps being automated), meaning the pipeline will meaningfully compress the cycle. If significant time is spent on review, investigation of anomalies, or internal approvals, the pipeline may compress less of the cycle than expected.

### 6. Questions for the Team

1. **On normalisation:** Can the team produce a complete inventory of every normalisation rule currently applied, including the source system, the affected fields, the nature of the artefact, and the correction applied? Has this inventory been reviewed recently to confirm all rules are still necessary?

2. **On source system remediation:** Has the organisation evaluated whether the 2019 migration artefacts can be corrected at source in the upstream systems? Is there a reason this has not been done, and is it worth pursuing in parallel with the pipeline build?

3. **On reconciliation edge cases:** How often do analysts encounter reconciliation exceptions that require investigation or judgement beyond the standard reconciliation steps? What happens to these exceptions in the proposed pipeline — does the pipeline flag them for manual resolution, or is the expectation that all reconciliation logic can be fully automated?

4. **On API readiness:** What is the current state of API availability for each of the three source systems? Are there any known limitations, rate limits, or data freshness issues?

5. **On the regulatory submission step:** Is the intent for the pipeline to automate the actual upload to the RBNZ and FMA portals (triggered by analyst approval), or will analysts continue to upload manually after reviewing the pipeline's output?

6. **On parallel running:** Is the team prepared to run the pipeline in parallel with the manual process for a defined period? What would the acceptance criteria be for retiring the manual process?

7. **On the FMA quarterly cycle:** The brief focuses primarily on the monthly RBNZ return. Does the quarterly FMA report use the same source data and reconciliation logic, or does it introduce additional data sources, transformations, or complexity?

8. **On compliance validation:** Has the compliance team reviewed the proposed audit trail approach with RBNZ or FMA, or is the audit trail design based on internal interpretation of regulatory requirements?

---

*This document captures the current understanding of the initiative based on the information provided. It is intended to support the next stage of planning and decision-making, not to prescribe a solution. The risks and questions identified should be worked through with the team before commitments are made on scope, timeline, or architecture.*