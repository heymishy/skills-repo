# Discovery Summary: Automated Regulatory Reporting Pipeline

## 1) Problem statement

The finance operations team currently prepares **monthly RBNZ prudential returns** and **quarterly FMA regulatory reports** manually.

### Current process
- Three senior analysts extract data from:
  - core banking
  - treasury
  - card platforms
- They reconcile the figures in Excel
- They upload completed returns via:
  - RBNZ Reporting Portal
  - FMA online submission gateway
- The process takes **6–8 business days per monthly cycle**
- Internal sign-off deadlines are missed about **once per quarter**
- Analysts spend about **40% of their time** on extraction and reconciliation

### Desired future state
Build an **automated regulatory reporting pipeline** that:
- Connects to the three source systems via **read-only APIs**
- Extracts required data fields
- Runs reconciliation logic automatically
- Produces a **pre-populated return file**
- Supports **human review and approval** before submission
- Does **not** submit directly to regulators without analyst sign-off

---

## 2) Key business drivers

1. **Reduce manual effort**
   - Free analysts from repetitive extraction and reconciliation
   - Reduce cycle time from 6–8 days

2. **Improve deadline reliability**
   - Reduce missed internal sign-off deadlines
   - Avoid extension requests and compliance pressure

3. **Improve data quality**
   - Eliminate manual correction errors
   - Standardise reconciliation logic

4. **Strengthen auditability**
   - Maintain traceability from source data to submitted figures
   - Explain all adjustments made

---

## 3) Important regulatory and compliance requirements

### Human approval required
- Analysts must retain **sign-off authority**
- The system must **not auto-submit** to regulators

### Audit trail required
- Must produce a **complete audit trail of every transformation**
- Must trace submitted figures back to:
  - source data
  - transformation logic
  - any adjustment applied

### Deadline sensitivity
- **RBNZ prudential returns** must be submitted by the **20th of each month** for the prior month
- Missing the deadline can cause:
  - formal notice from RBNZ
  - unscheduled supervisory review

### Normalisation logic
- A manual normalisation step currently corrects:
  - rounding differences
  - timing mismatches from 2019 system migration
- This normalisation is to become a **permanent transformation layer**
- It must be documented, repeatable, and auditable

---

## 4) Scope of the proposed pipeline

### In scope
- Read-only extraction from:
  - core banking
  - treasury
  - card systems
- Automated reconciliation
- Normalisation/transformation layer
- Generation of pre-populated regulatory return files
- Analyst review and approval workflow
- Full lineage and audit logging

### Out of scope
- Direct regulator submission without human approval
- Changing source systems themselves
- Removing sign-off controls

---

## 5) Assumptions to validate

1. The three source systems expose stable **read-only APIs**
2. Required regulatory data fields can be mapped from those APIs
3. Normalisation rules can be codified deterministically
4. Return templates for RBNZ and FMA are known and machine-populatable
5. Analysts will continue to approve final submissions
6. Audit evidence requirements are sufficiently defined by compliance
7. Submission gateway integration is not required for initial phase, only file generation/prep

---

## 6) Likely non-functional requirements

- **Auditability**: immutable logs, traceability, transformation history
- **Security**: read-only access, least privilege, secure credential management
- **Accuracy**: deterministic transformation and reconciliation
- **Availability**: reliable monthly/quarterly operation around reporting deadlines
- **Performance**: complete extraction/reconciliation within reporting window
- **Change control**: versioning of logic and mapping rules
- **Explainability**: support compliance review of adjustments

---

## 7) Key risks

- **Incorrect normalisation logic** could produce regulatory errors
- **Incomplete audit trail** could fail compliance expectations
- **API instability** in source systems could delay reporting
- **Mapping errors** between source fields and regulatory fields
- **Over-automation risk** if approvals or exception handling are unclear
- **Deadline risk** if run schedules are not aligned to the 20th cutoff

---

## 8) Suggested discovery outputs next

To move into solution design, the next discovery questions should focus on:

1. **Source data**
   - What fields are needed from each system?
   - What are the current API capabilities and limitations?

2. **Reporting rules**
   - What exact RBNZ/FMA forms are in scope?
   - What are the transformation and validation rules?

3. **Normalisation**
   - What are the specific legacy artefacts?
   - Can each rule be explicitly defined and tested?

4. **Workflow**
   - Who reviews, who approves, and what are the SLAs?
   - What happens on exceptions or failed reconciliations?

5. **Audit and evidence**
   - What level of lineage detail is required?
   - How long must records be retained?

6. **Operational timing**
   - When should the pipeline run relative to month-end close?
   - What contingency exists if source feeds are late?

If you want, I can turn this into a **structured discovery document**, **requirements list**, or **solution architecture outline**.