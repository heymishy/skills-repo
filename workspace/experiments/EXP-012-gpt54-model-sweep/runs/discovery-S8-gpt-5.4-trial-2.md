Below is the completed **/discovery pipeline skill output** for the scenario provided.

---

# /discovery

## 1) Opportunity Summary
The finance operations team currently prepares **monthly RBNZ prudential returns** and **quarterly FMA regulatory reports** through a largely manual process. Three senior analysts extract data from **core banking, treasury, and card platforms**, reconcile results in Excel, apply a recurring **normalisation correction** for known legacy artefacts, and then upload completed returns to regulator portals.

This process takes **6–8 business days per monthly cycle**, consumes substantial senior analyst capacity, and creates a recurring risk of missing internal and regulatory deadlines. Internal sign-off is missed **about once per quarter**, and there have already been **two informal extension requests** to the RBNZ relationship manager. Analysts estimate **~40% of their time** is spent on extraction and reconciliation tasks that could be automated.

The proposed solution is an **automated regulatory reporting pipeline** that:
- connects to the three source systems using **read-only APIs**
- extracts required data fields
- applies automated reconciliation logic
- formalises the current manual **normalisation process** as a permanent transformation layer
- generates a **pre-populated return file** for analyst review and approval
- preserves **human sign-off authority**
- creates a **complete audit trail** of source-to-output transformations

This is a strong candidate for automation because the process is repetitive, rules-based, deadline-driven, and already partially standardised, with clear compliance and auditability requirements.

---

## 2) Problem Statement
The current manual reporting process is inefficient, fragile, and exposes the organisation to compliance risk.

### Operational pain
- Monthly cycle duration of **6–8 business days**
- Heavy dependence on **three senior analysts**
- Significant manual extraction, reconciliation, spreadsheet manipulation, and portal preparation
- Rework created by manual normalisation and reconciliation steps

### Compliance and deadline risk
- Internal sign-off deadline missed **approximately once per quarter**
- Past need for **informal extensions from RBNZ**
- Missing the external RBNZ deadline can lead to:
  - a **formal notice**
  - possible **unscheduled supervisory review**

### Control and traceability gap
- A key recurring adjustment step — normalisation for migration-era artefacts — is currently manual
- Manual spreadsheet-based corrections increase the risk of:
  - inconsistency
  - undocumented changes
  - analyst error
- Compliance requires full traceability for every submitted figure, including explanation of adjustments

---

## 3) Desired Business Outcomes
### Primary outcomes
- Reduce end-to-end reporting cycle time for monthly and quarterly regulatory returns
- Lower risk of missed internal sign-off and regulatory submission deadlines
- Improve consistency and quality of reconciliation and normalisation logic
- Establish robust **auditability and traceability** for all submitted figures
- Reduce manual effort for senior analysts so time can be reallocated to review, exceptions, and higher-value analysis

### Secondary outcomes
- Reduce dependency on specific individuals
- Improve control environment around regulatory reporting
- Create a reusable reporting data pipeline pattern for future regulatory obligations

---

## 4) In-Scope Process
The proposed pipeline would likely cover:

1. **Data extraction**
   - Pull required data from:
     - core banking system
     - treasury platform
     - card platform
   - Use **read-only APIs**

2. **Data transformation**
   - Map source fields to regulatory reporting structures
   - Apply standardisation and formatting rules
   - Apply permanent **normalisation logic** to correct known migration-related artefacts such as:
     - rounding differences
     - timing mismatches

3. **Reconciliation**
   - Perform automated checks across source systems
   - Flag variances and exceptions for analyst review

4. **Return preparation**
   - Generate **pre-populated return file(s)** for:
     - monthly RBNZ prudential returns
     - quarterly FMA reports

5. **Review and approval support**
   - Present outputs for analyst review
   - Preserve human review/sign-off before submission

6. **Audit trail generation**
   - Record:
     - source data used
     - transformations applied
     - reconciliation results
     - normalisation adjustments
     - final output values

---

## 5) Out of Scope / Not Intended
Based on the description, the following appear out of scope unless clarified otherwise:

- **Automated direct submission to regulators without human approval**
- Replacement of the source systems themselves
- Broader finance transformation beyond the reporting pipeline
- Changing regulatory return definitions or reporting obligations
- Use of discretionary or probabilistic logic in place of deterministic reporting rules

---

## 6) Users and Stakeholders
### Primary users
- **Senior analysts** in finance operations who currently perform extraction, reconciliation, correction, and return preparation
- **Compliance team** who rely on timely, accurate, traceable reporting

### Key stakeholders
- Head of Finance Operations
- Compliance leadership
- Regulatory relationship owners
- Technology / data engineering teams
- Risk and internal audit
- Possibly CFO / financial controller due to regulatory exposure

### External stakeholders
- **RBNZ**
- **FMA**

---

## 7) Trigger, Frequency, and Volume
### Trigger
- Scheduled recurring reporting cycle based on monthly and quarterly regulatory calendar

### Frequency
- **Monthly** for RBNZ prudential returns
- **Quarterly** for FMA reports

### Timing constraint
- RBNZ returns due by the **20th of each month** for the prior month

### Current duration
- **6–8 business days** per monthly cycle

### Volume
Not explicitly stated. Needs discovery on:
- number of data records pulled from each source system per cycle
- number of return templates / schedules
- number of reconciliation rules
- number of adjustment types in normalisation logic

---

## 8) Current-State Risks
### Delivery risk
- Deadline slippage due to manual processing time and dependence on key personnel

### Compliance risk
- Failure to submit by required date may trigger regulator escalation
- Limited confidence if adjustments are not consistently documented

### Operational risk
- Spreadsheet error risk
- Version control issues
- Knowledge concentrated in senior analysts

### Data quality risk
- Legacy artefacts from 2019 migration require recurring correction
- Timing mismatches and rounding differences may produce inconsistent outputs if handled manually

---

## 9) Automation Suitability Assessment
This is a **high-suitability automation opportunity**.

### Why it suits pipeline automation
- Process is **repeatable**
- Inputs come from **known systems**
- Logic appears largely **rules-based**
- There is a clear human-in-the-loop approval point
- Audit trail is both required and feasible
- Existing manual normalisation logic can be codified as deterministic transformations

### Suitability rating
**High**

### Constraints to account for
- Regulatory reporting is sensitive and control-heavy
- Transformation logic must be explainable and versioned
- Data lineage must be complete and defensible
- Exception handling must be robust

---

## 10) Functional Requirements
### Core functional requirements
1. Connect to core banking, treasury, and card systems via **read-only APIs**
2. Extract required reporting data fields on schedule or on demand
3. Apply deterministic transformation and mapping logic
4. Apply codified **normalisation rules** for known legacy artefacts
5. Run reconciliation logic automatically across the three sources
6. Flag exceptions, mismatches, and unresolved variances for review
7. Generate regulator-ready or pre-populated return files
8. Support analyst review and approval workflow prior to submission
9. Maintain full **data lineage** from source to reported figure
10. Produce an **audit log** of every transformation and adjustment
11. Support monthly and quarterly reporting cycles
12. Allow controlled updates to logic as regulations or source systems change

### Likely supporting requirements
- Versioning of business rules and transformation logic
- Role-based access controls
- Re-runs with preserved history
- Reconciliation reports and variance summaries
- Ability to reproduce historical submissions exactly

---

## 11) Non-Functional Requirements
### Critical non-functional requirements
- **Auditability:** non-negotiable; every figure traceable to source
- **Explainability:** every adjustment must be explainable to compliance and regulators
- **Reliability:** pipeline must consistently complete within reporting window
- **Accuracy:** must match approved reporting rules and reconciliation outcomes
- **Security:** sensitive financial/regulatory data handled securely
- **Access control:** only authorised users can review, approve, or alter rules
- **Change control:** transformation logic must be governed and versioned
- **Resilience:** failures should be detectable, recoverable, and logged

### Likely quality expectations
- Strong logging and monitoring
- Deterministic outputs
- High reproducibility for audits and regulator queries

---

## 12) Compliance / Risk Considerations
This use case has **material regulatory and operational risk implications**.

### Regulatory considerations
- RBNZ prudential returns have a hard submission deadline
- FMA reporting also requires accuracy and traceability
- Failure to submit or inability to explain figures may create supervisory concern

### Control considerations
- Human approval must remain in place before submission
- Complete lineage and adjustment history are mandatory
- Normalisation logic must be formally approved because it modifies extracted data before reporting output

### Risk considerations
- If normalisation rules are implemented incorrectly, automated errors could scale quickly
- If audit trails are incomplete, the solution may not satisfy compliance requirements
- If source APIs are unstable or incomplete, the process may still require manual workarounds

---

## 13) Dependencies
### Technical dependencies
- Availability and reliability of **read-only APIs** from all three source systems
- Access to required data fields in each system
- Return file format specifications for RBNZ and FMA
- Infrastructure for orchestration, storage, logging, and audit trails

### Business dependencies
- Detailed documentation of current reconciliation logic
- Detailed documentation of manual normalisation rules
- SME input from senior analysts
- Compliance sign-off on control design
- Possibly internal audit / risk review before production use

---

## 14) Key Unknowns / Discovery Questions
The following need to be clarified before scoping or design:

### Process and rules
- What exact steps do analysts perform today, in what order?
- Which reconciliation rules are deterministic vs judgment-based?
- Are there any exceptions that require analyst discretion?
- How many normalisation rules exist today?
- Are normalisation rules stable, or do they evolve over time?

### Data and systems
- Do all three source systems expose the required data via APIs?
- Are there data latency constraints?
- Are historical snapshots available for reproducing prior returns?
- What data quality issues exist besides rounding and timing mismatches?

### Output and submission
- What exact file formats/templates are required by RBNZ and FMA?
- Is there any validation performed by regulator portals that should be replicated pre-submission?
- Does the team need one consolidated review interface, or are files sufficient?

### Controls and governance
- Who approves changes to transformation and normalisation logic?
- What level of audit detail is required to satisfy compliance and regulators?
- How long must lineage and audit records be retained?
- What evidence is needed for analyst sign-off?

### Performance and service levels
- By when must the pipeline complete to preserve internal sign-off buffer?
- What is the acceptable failure recovery time during reporting periods?

---

## 15) Benefits Hypothesis
### Quantitative benefit hypothesis
Potential benefits likely include:
- Reduction in monthly cycle time from **6–8 business days** to a materially shorter preparation window
- Recovery of a significant portion of the **~40% analyst time** currently spent on extraction and reconciliation
- Fewer missed internal sign-off deadlines
- Lower probability of needing regulator deadline extensions

### Qualitative benefit hypothesis
- Stronger control environment
- Lower spreadsheet dependence
- Better consistency in applying legacy normalisation adjustments
- Improved regulator readiness during audits, queries, or supervisory review

---

## 16) Indicative Success Metrics
Potential metrics for later validation:

### Efficiency metrics
- End-to-end reporting preparation time
- Analyst hours spent per reporting cycle
- Percentage of extraction/reconciliation steps automated

### Quality metrics
- Number of reconciliation exceptions per cycle
- Number of manual adjustments required after pipeline output
- Error rate in prepared returns
- Number of post-preparation rework cycles

### Compliance/control metrics
- On-time internal sign-off rate
- On-time external submission rate
- Ability to reproduce submitted figures from source data
- Audit trail completeness rate
- Number of regulator/compliance queries attributable to traceability gaps

---

## 17) Recommended Delivery Framing
This should be framed as a **controlled regulatory reporting automation initiative**, not just a cost-saving workflow improvement.

### Suggested framing
- Primary business case: **risk reduction + timeliness + control**
- Secondary business case: **efficiency and analyst capacity recovery**

### Suggested implementation posture
- Human-in-the-loop by design
- Deterministic rules only
- Strong governance over transformation logic
- Incremental rollout, likely starting with one return type or one monthly cycle in parallel run mode

---

## 18) Initial Recommendation
Proceed to a **process and controls discovery phase** focused on:
1. documenting end-to-end current-state workflow
2. cataloguing all source fields, mappings, reconciliation rules, and manual normalisation adjustments
3. confirming API feasibility across the three source systems
4. defining audit trail and lineage requirements with compliance
5. designing a human review / approval checkpoint
6. planning a **parallel run** against current manual returns before production cutover

This opportunity appears **valuable, feasible in principle, and high priority** due to explicit deadline and supervisory risk.

---

If you want, I can also turn this into the next /discovery artifacts, such as:
- **problem statement**
- **scope statement**
- **requirements backlog**
- **risks / assumptions / dependencies log**
- **business case draft**
- **current vs future state process map**