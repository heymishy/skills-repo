

# Discovery Report: Automated Regulatory Reporting Pipeline

## 1. Current State Assessment

### Process Overview

The finance operations team manually produces two categories of regulatory returns:

- **RBNZ prudential returns** — monthly, due by the 20th of each month for the prior period
- **FMA regulatory reports** — quarterly

Three senior analysts perform this work across a cycle that consumes **6–8 business days per monthly iteration**. The process follows a sequential workflow: extract data from three source systems (core banking, treasury, card platforms), reconcile figures in Excel, and upload completed returns via the RBNZ Reporting Portal and the FMA's online submission gateway.

### Source Systems

| System | Role | Current Extraction Method |
|---|---|---|
| Core Banking | Primary prudential data | Manual extraction |
| Treasury | Treasury and funding data | Manual extraction |
| Card Platforms | Card portfolio data | Manual extraction |

### Pain Points

- **Timeline pressure**: The 6–8 day cycle frequently collides with internal sign-off deadlines. The team misses its internal deadline approximately once per quarter.
- **Regulatory risk exposure**: Two instances of requesting informal extensions from the RBNZ relationship manager. While these have been accommodated to date, a missed submission deadline attracts a formal notice and can trigger an unscheduled supervisory review.
- **Analyst capacity**: Senior analysts estimate 40% of their time is consumed by extraction and reconciliation steps they assess as automatable. This represents significant misallocation of senior analytical capacity toward repetitive mechanical work.
- **Manual error surface**: Reconciliation performed in Excel across three source systems with legacy data artefacts creates a broad surface for human error in every cycle.

### Legacy Normalisation Issue

The three source systems carry artefacts from a 2019 migration — specifically rounding differences and timing mismatches. Analysts currently apply manual corrections to normalise these before populating returns. This step is undocumented or informally documented, performed from analyst knowledge, and represents both a key-person risk and an error risk.

---

## 2. Proposed Future State

An automated regulatory reporting pipeline that:

1. **Connects** to the three source systems via read-only APIs
2. **Extracts** the required data fields on a scheduled or triggered basis
3. **Applies normalisation logic** as a permanent data transformation layer to correct known legacy artefacts (rounding differences, timing mismatches from 2019 migration)
4. **Runs reconciliation logic** automatically across the three data sets
5. **Produces a pre-populated return file** in the format required by each regulator
6. **Generates a complete audit trail** of every transformation applied to source data
7. **Presents the return to analysts for review and sign-off** before submission
8. **Analysts retain sign-off authority** — the pipeline does not submit to regulators without human approval

---

## 3. Key Decisions and Assumptions to Validate

### 3.1 Scope Boundaries

**What is in scope:**
- Automated extraction from core banking, treasury, and card platforms via read-only APIs
- Formalised normalisation logic (legacy artefact correction) as a permanent transformation layer
- Automated reconciliation logic
- Pre-populated return file generation
- Full audit trail of all transformations
- Human review and approval workflow before submission

**What is out of scope (confirm):**
- Automated submission to RBNZ Reporting Portal or FMA submission gateway. The pipeline stops at producing the return file and obtaining analyst sign-off. Analysts perform the upload manually. *This needs to be confirmed — does the team want to automate the upload step as well, with the human gate being approval rather than upload? Or is manual upload the deliberate design choice?*
- Changes to the source systems themselves
- Remediation of the underlying legacy artefacts in source systems (the normalisation layer compensates for them rather than fixing them at source)

### 3.2 API Availability

**Critical assumption:** The three source systems expose read-only APIs with access to the required data fields. This needs validation:

- Do all three systems currently have APIs available, or do any require API development or enablement?
- Are the APIs real-time, batch, or event-driven?
- What authentication and authorisation models do the APIs use?
- Are there rate limits, availability windows, or known reliability issues?
- Do the APIs expose all fields currently extracted manually, or are some fields only accessible through the application UI or direct database queries?

*If any system lacks a suitable API, the project scope and timeline will be materially affected. This is a gating question.*

### 3.3 Normalisation Logic

The proposal to formalise the normalisation logic as a permanent transformation layer raises several questions that need to be resolved:

- **Documentation status:** Is the current normalisation logic fully documented, or does it exist primarily as analyst knowledge? If the latter, a knowledge capture exercise is a prerequisite to building the transformation layer.
- **Stability of artefacts:** The rounding differences and timing mismatches originate from the 2019 migration. Are these artefacts stable and fully characterised, or do new artefacts still emerge? If the latter, the normalisation layer needs to be designed for maintainability and extension, not just current corrections.
- **Permanence assumption:** The team has described this as a "permanent" transformation layer. This implies no plan to remediate the underlying source data. Is this a deliberate decision, or has source remediation been considered and rejected? If the artefacts are well-characterised and stable, a permanent normalisation layer is reasonable, but it should be reviewed periodically to confirm the artefacts have not changed.
- **Regulatory defensibility:** The normalisation layer applies adjustments to source data before the return is populated. Both regulators require traceability from submitted figures back to source data with explanation of adjustments. The audit trail must therefore capture: the raw source value, the normalisation rule applied, the reason for the adjustment, and the resulting value. The compliance team should confirm that the proposed audit trail format meets their expectations for regulatory examination purposes.

### 3.4 Reconciliation Logic

- Is the current reconciliation logic fully specified, or does it involve analyst judgement at any step?
- Are there reconciliation breaks that currently require analyst investigation and resolution (i.e., cases where the correct treatment is not deterministic)? If so, these cannot simply be automated — the pipeline needs an exception-handling workflow.
- What are the current tolerance thresholds for reconciliation breaks, and who sets them?

### 3.5 Return File Format

- What format do the RBNZ Reporting Portal and FMA submission gateway accept? (XML, CSV, XBRL, proprietary template?)
- Are the format specifications stable, or do they change periodically? If they change, who monitors for changes and how quickly must the pipeline adapt?
- Are there validation rules the portals apply on upload that we should replicate in the pipeline to catch errors before the analyst review step?

### 3.6 Human Review and Approval Workflow

- What does the analyst review step look like in practice? Is it a line-by-line review, a review of exception reports, a comparison against prior period, or some combination?
- How many analysts need to approve? Is there a single sign-off or a maker-checker arrangement?
- What happens when an analyst identifies an issue during review? Does the pipeline need to support manual overrides with audit trail, or does the analyst send the return back for a corrected pipeline run?
- What is the target time for the review and approval step? If the pipeline reduces the extraction and reconciliation cycle from 6–8 days to (say) 1 day, but the review step still takes 3 days, the overall improvement is constrained.

---

## 4. Audit Trail Requirements — Deep Dive

The compliance team has flagged the audit trail as non-negotiable. This warrants detailed specification:

### What the audit trail must capture (minimum):

| Element | Detail |
|---|---|
| **Source identification** | Which system, which extraction timestamp, which data fields |
| **Raw source values** | The exact values as extracted from each system before any transformation |
| **Normalisation transformations** | Each normalisation rule applied, the raw input value, the rule logic, the output value, and the reason for the adjustment |
| **Reconciliation results** | The reconciliation checks performed, the values compared, the result (matched / break within tolerance / break outside tolerance), and the resolution |
| **Return population** | The mapping from reconciled and normalised values to each field in the return file |
| **Analyst review record** | Who reviewed, when, what they approved, and any observations or manual adjustments made during review |

### Questions for compliance:

- Does the audit trail need to be immutable (write-once), or is versioning with full history sufficient?
- What is the retention period for audit trail records?
- Does the audit trail need to be exportable in a specific format for regulatory examination?
- Should the audit trail be stored within the pipeline system, in a separate audit repository, or both?
- In the event of a manual override during analyst review, what level of documentation and approval is required for the override to be audit-defensible?

---

## 5. Risk Register

### 5.1 API Availability Risk

**Risk:** One or more source systems does not have a suitable API, or the API does not expose all required fields.
**Impact:** Project scope increases significantly; may require database-level integration or custom extraction tooling, which changes the security and architectural profile.
**Mitigation:** Validate API availability and field coverage for all three systems before committing to detailed design.

### 5.2 Normalisation Logic Capture Risk

**Risk:** The normalisation logic is not fully documented and exists primarily as tacit analyst knowledge. Knowledge capture is incomplete or incorrect.
**Impact:** The pipeline applies incorrect transformations, producing inaccurate returns. Depending on when this is detected — before or after submission — the impact ranges from rework to regulatory incident.
**Mitigation:** Structured knowledge capture sessions with all three analysts. Parallel-run the pipeline against manually produced returns for a minimum number of cycles before go-live.

### 5.3 Legacy Artefact Drift Risk

**Risk:** The 2019 migration artefacts are assumed to be stable, but new artefacts emerge or existing ones change due to system updates or data changes.
**Impact:** The normalisation layer silently produces incorrect adjustments.
**Mitigation:** Build monitoring into the normalisation layer that flags when adjustment magnitudes deviate from historical norms. Periodic review of normalisation rules (suggest quarterly, aligned with FMA reporting cycle).

### 5.4 Reconciliation Exception Risk

**Risk:** Current reconciliation includes steps that require analyst judgement. Automating these steps without a proper exception-handling workflow produces silent errors or false confidence.
**Impact:** Incorrect return values pass through the automated pipeline and are only caught (if at all) at the analyst review step, which may become less rigorous over time if analysts develop trust in the automated output.
**Mitigation:** Map every reconciliation step and explicitly classify each as deterministic (automatable) or judgement-dependent (requires exception routing). Build exception queues for judgement-dependent items.

### 5.5 Automation Complacency Risk

**Risk:** As analysts move from producing returns manually to reviewing automated output, the rigour of the review step degrades over time. Analysts approve returns without thorough scrutiny because "the system produced it."
**Impact:** Errors in pipeline logic, source data issues, or normalisation drift are not caught at the human review gate.
**Mitigation:** Design the review step to require active engagement — for example, requiring analysts to confirm specific key figures, review exception reports, and sign off on a comparison against prior period and against analyst expectations. Consider periodic "challenge" exercises where known discrepancies are introduced to test review effectiveness.

### 5.6 Regulatory Format Change Risk

**Risk:** RBNZ or FMA change the return format, field definitions, or submission requirements.
**Impact:** The pipeline produces returns in the wrong format or with incorrect field mappings.
**Mitigation:** Monitoring process for regulatory change notices. Pipeline design should separate field mapping and formatting logic from extraction and reconciliation logic so that format changes can be implemented without re-engineering the pipeline.

### 5.7 Submission Deadline Risk During Transition

**Risk:** During the transition from manual to automated process, a pipeline failure or issue forces a fallback to manual production at a point in the cycle where there is insufficient time to complete the manual process.
**Impact:** Missed RBNZ submission deadline, formal notice, potential unscheduled supervisory review.
**Mitigation:** Run the pipeline in parallel with the manual process for a defined number of cycles. Maintain manual fallback capability until the pipeline has demonstrated reliability. Define a clear decision point in each cycle by which, if the pipeline has not produced a satisfactory output, the team reverts to manual production.

---

## 6. Open Questions Summary

These questions need answers before proceeding to design:

| # | Question | Owner / Audience |
|---|---|---|
| 1 | Do all three source systems have read-only APIs that expose the required data fields? What are the specifications? | IT / System owners |
| 2 | Is the normalisation logic fully documented? If not, what is the effort to capture it? | Senior analysts |
| 3 | Are the 2019 migration artefacts stable and fully characterised, or do new ones still appear? | Senior analysts / IT |
| 4 | Are there reconciliation steps that require analyst judgement (non-deterministic)? | Senior analysts |
| 5 | What is the exact format specification for RBNZ and FMA return files? | Finance operations / Compliance |
| 6 | Does the team want automated upload to regulator portals (with human approval gate), or manual upload? | Finance operations / Compliance |
| 7 | What is the required approval workflow — single sign-off or maker-checker? | Finance operations / Compliance |
| 8 | What are the compliance team's detailed requirements for audit trail format, immutability, retention, and exportability? | Compliance |
| 9 | What manual override capability is needed during analyst review, and what documentation is required for overrides? | Compliance / Finance operations |
| 10 | Is there an existing enterprise integration layer or API gateway, or will this pipeline be the first integration with these source systems? | IT / Architecture |
| 11 | What is the target environment — on-premises, cloud, hybrid? Are there data residency constraints given the regulatory nature of the data? | IT / Architecture / Compliance |
| 12 | Has the organisation considered remediating the source data artefacts rather than building a permanent normalisation layer? What was the assessment? | IT / Finance operations |

---

## 7. Recommended Next Steps

1. **Validate API availability** across all three source systems. This is the highest-priority gating item — the entire architecture depends on the answer.
2. **Conduct structured knowledge capture** of the normalisation logic with all three senior analysts. Document every rule, its rationale, and examples.
3. **Map reconciliation steps** end-to-end, classifying each as deterministic or judgement-dependent.
4. **Engage compliance** to specify audit trail requirements in detail — format, immutability, retention, exportability, override documentation standards.
5. **Obtain return file format specifications** from both RBNZ and FMA.
6. **Resolve the submission scope question** — automated upload with approval gate, or manual upload.
7. **Define the parallel-run plan** — how many cycles, what success criteria, what is the fallback decision point within each cycle.

Once these questions are resolved, the project can move to detailed design with a materially lower risk of discovering fundamental blockers mid-build.