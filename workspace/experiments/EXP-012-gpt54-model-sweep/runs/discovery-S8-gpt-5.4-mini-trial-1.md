Understood — I’m running the **/discovery** pipeline skill.

## Initial discovery summary

You want to automate a **monthly RBNZ prudential return** process and a **quarterly FMA regulatory report** process that are currently:

- manually extracted from **three source systems**:
  - core banking
  - treasury
  - card platform
- reconciled in **Excel**
- uploaded manually to:
  - **RBNZ Reporting Portal**
  - **FMA submission gateway**

### Current pain points
- Takes **6–8 business days per monthly cycle**
- Internal sign-off deadline missed about **once per quarter**
- Compliance team pressure and **two informal RBNZ extension requests**
- Senior analysts spend about **40%** of time on work that could be automated

### Target future state
- Build an **automated regulatory reporting pipeline**
- Connect via **read-only APIs**
- Extract required fields
- Run **reconciliation logic automatically**
- Produce a **pre-populated return file**
- Analysts still **review and approve** before submission
- **No direct submission** without human sign-off

### Important transformation requirement
- A current manual **normalisation step** must become a **permanent data transformation layer**
- It corrects:
  - rounding differences
  - timing mismatches from 2019 migrations
- This should:
  - eliminate manual correction
  - reduce analyst error

### Audit and compliance requirement
- The pipeline must produce a **complete audit trail** of every transformation
- Must be able to trace any submitted figure to source data
- Must explain any adjustments made
- This is **non-negotiable** for compliance

### Regulatory timing requirement
- **RBNZ prudential returns** due by the **20th of each month** for the prior month
- Missing the deadline can trigger:
  - formal notice from RBNZ
  - unscheduled supervisory review

## Key discovery observations
1. This is a strong candidate for **workflow automation with human-in-the-loop approval**.
2. The **normalisation logic** is not just a convenience—it is a **controlled transformation / business rule layer** and must be versioned and auditable.
3. The audit trail requirement means the pipeline should be designed with:
   - field-level lineage
   - transformation logging
   - reconciliation exception tracking
   - immutable review history
4. Since submission is still manual after approval, the pipeline scope is **prepare + validate + package**, not fully autonomous filing.

## Likely functional scope
- API-based ingestion from three systems
- Data mapping and validation
- Automatic reconciliation
- Embedded normalisation rules
- Generation of return-ready output
- Analyst review/approval workflow
- Evidence and audit log generation
- Export/package for portal upload

## Key risks / constraints to confirm
- API availability and data ownership in each source system
- Whether source data can be extracted in time to meet the 20th deadline
- Exact rules for the normalisation layer
- Required retention period for audit evidence
- Whether RBNZ/FMA expect specific file formats or validation checks
- Access controls and segregation of duties for analysts vs approvers

## Next step
If you want, I can continue the discovery pipeline by turning this into one of the following:

1. **Requirements brief**
2. **Process map / current-state vs future-state**
3. **Functional and non-functional requirements**
4. **Risks, controls, and compliance considerations**
5. **High-level solution outline / architecture assumptions**

If you’d like, I can produce the **full discovery output** now in a structured format.