Understood. Here’s a concrete blueprint for the automated **/discovery** outcome: an architecture and set of pipeline capabilities that formalise your normalisation logic, automate extraction + reconciliation, and—crucially—produce a **complete, regulator-grade audit trail** while keeping **human sign-off** in place.

---

## 1) Target operating model (what the pipeline must do)
**Inputs**
- Read-only API access to:
  - Core banking system
  - Treasury system
  - Card platform
- “Return templates” (RBNZ prudential monthly return + FMA quarterly report) and/or mapping definitions
- Approved normalisation rules (initially derived from the current Excel logic)

**Processing**
1. Extract required fields from each system for the reporting period
2. Apply a **normalisation/data transformation layer** that corrects:
   - rounding differences
   - timing mismatches (from 2019 migrations)
3. Run reconciliation logic (cross-system checks, tolerances, variance flags)
4. Populate the return artifacts (pre-populated return files/workpapers)

**Outputs**
- Pre-populated return files for analyst review
- An **audit trail** that can trace every populated figure back to:
  - source system(s)
  - raw extracted values (and timestamps/IDs)
  - transformation steps + rule versions
  - reconciliation decisions (including tolerances/threshold outcomes)
- A human-review workflow where analysts can:
  - approve
  - request changes
  - see transformation explanations
- Final submission remains human-driven (no direct regulator submission by the pipeline)

**Deadline control**
- Pipeline runs on a schedule designed to finish well before the 20th deadline, and produces alerts if any step fails or reconciliation uncertainty is too high.

---

## 2) Key design requirement: “audit trail for every transformation”
To meet RBNZ/FMA expectations, treat the pipeline as producing a **provenance graph** for each final value.

### Audit trail elements to capture (per reporting period + per field)
- **Source provenance**
  - system name (core/treasury/cards)
  - entity/account/portfolio identifiers
  - raw field name
  - raw value + unit + currency (if relevant)
  - extraction timestamp
  - source record timestamp (if available)
  - API request identifier / correlation ID
  - source system environment/version (if available)
- **Transformation provenance**
  - transformation layer name (e.g., `Normalization.v1`)
  - rule identifier
  - rule version
  - parameters used (e.g., rounding mode, rate mappings, cutoff dates)
  - input values used by the rule (including before/after)
  - justification text for why the rule exists (legacy artefact class)
- **Reconciliation provenance**
  - which systems were compared
  - tolerance applied and threshold outcome
  - variance calculation method
  - final selection logic (e.g., “prefer core banking unless delta > X then override/flag”)
- **Final mapping provenance**
  - target return form line item/field code
  - mapping rule ID + version
  - final computed value + formatting (sign, scale, rounding)

### Implementation recommendation
Model this audit trail as immutable data:
- Store transformation events in an **append-only store** (e.g., event tables)
- Store snapshots of inputs used for each run (at least the raw fields needed)
- Persist a **run manifest** containing:
  - pipeline version
  - normalisation rule versions
  - config version
  - extraction IDs
  - template versions

This makes “traceability” defensible even if upstream systems change later.

---

## 3) Normalisation layer: formalise Excel logic as versioned rules
You want to eliminate the manual normalisation step by turning it into a persistent transformation layer.

### What to capture from Excel (first discovery deliverable)
For each normalisation correction currently applied in Excel, define:
- A **rule name**
- Trigger condition(s) (which fields, which legacy artefact symptom)
- Inputs (which source fields feed the correction)
- Transformation logic (rounding method, time-window shifting, cutover logic)
- Output mapping (exact target field(s) it affects)
- Expected output behavior and edge cases
- Tolerance behavior (if applicable)
- Example cases (before/after)

### Typical rule classes (based on your description)
1. **Rounding normalisation**
   - e.g., align scale to return template precision
   - rule: “round half up vs bankers rounding”
   - ensure currency/units are consistent
2. **Timing mismatch normalisation**
   - e.g., shift recognition dates to reporting cutoffs
   - rule: “if transaction date falls in migration-affected window, map to corrected period”
   - requires a mapping table: “source booking date → reporting period date”
3. **Field harmonisation**
   - e.g., legacy codes → current codes
   - ensure consistent sign conventions (debit/credit)

### Critical: rule versioning
Normalisation must be **configuration-driven and versioned**:
- `NormalizationRuleset` table with version numbers and effective dates
- Each run stores which version was used

---

## 4) Reconciliation logic automation with analyst-friendly explainability
Automation should not be a black box. Analysts must be able to see:
- why a variance was flagged
- which rule or reconciliation step caused the chosen final figure

### Reconciliation output structure
For each return line item:
- `final_value`
- `value_basis` (e.g., “normalized core value after Rule N”)
- `supporting_sources` (IDs + extracted values)
- `reconciliation_checks` (pass/fail/warn)
- `variance_detail` (numbers and tolerance threshold)

---

## 5) Human review workflow (preserve sign-off authority)
The pipeline should stop at “pre-populated returns + audit trail”.

### Recommended workflow states
1. **Draft generated**
2. Analyst reviews:
   - can view transformations + justifications
   - can add comments
3. **Analyst approval**
4. (Optional) pipeline re-validates against approval state
5. Submission occurs via existing portals (analyst-controlled)

You can implement role-based access:
- pipeline-runner/service account
- analyst approvers
- compliance reviewer (optional)

---

## 6) Scheduling to protect the 20th-of-month deadline
Given your current 6–8 business days, design for safety margin.

### Suggested operational cadence
- Run extraction + transformations as early as day ~1–2 business days after period end (or as soon as APIs have complete data).
- Finish reconciliation within a fixed window (e.g., day 3–4).
- Leave at least 2–3 business days for analyst review + re-runs.

### Deadline guardrails
- Automated “run health checks”
- If reconciliation tolerances fail beyond “allowable warn”, alert compliance early
- Escalation policy if normalisation rules require manual exception handling

---

## 7) /discovery next steps (what I’d need from you to complete the design)
To turn this into a precise implementation plan, we should confirm:

1. **Data field inventory**
   - Which specific fields are extracted from each system?
   - Which exact return line items they map to (RBNZ + FMA)?

2. **Excel normalisation details**
   - Provide the Excel workbook(s) or a sanitized description:
     - list of correction steps
     - sample rows showing before/after
     - any hard-coded parameters (cutoff dates, rounding precision)

3. **Reconciliation rules**
   - tolerance thresholds (e.g., acceptable variance)
   - hierarchy/selection logic (which system “wins” when they disagree)

4. **Audit requirements interpretation**
   - Do you need:
     - per-field provenance only, or
     - also per-statement/document-level provenance?
   - retention requirements (how long must audit artifacts be kept?)

5. **API capabilities**
   - auth method, rate limits, data availability guarantees
   - whether source records provide “effective date” and “booking date”

6. **Submission artifacts**
   - what format the “return file” is (CSV/XLSX/XML)
   - whether there are schema validations

---

## 8) Proposed deliverables from this discovery
To make this actionable, the /discovery pipeline skill outcome should include:

1. **Target architecture diagram** (ETL + transformation + reconciliation + approval UI + audit store)
2. **Normalisation rules specification**
   - rule catalog with versioning model
   - before/after examples
3. **Provenance/audit trail data model**
   - tables/entities for runs, extractions, transformations, reconciliations, and final mappings
4. **Run schedule + control plan**
   - calendar-driven automation and exception/escalation workflow
5. **Validation & testing approach**
   - regression tests against historical Excel output
   - sign-off parity checks (“pipeline output equals Excel output” for prior cycles)

---

If you share (a) the Excel normalisation logic (or an excerpt) and (b) the list of return fields/line items involved, I can convert the normalisation step into a **rule-by-rule transformation specification** and define the exact audit trail structure needed for RBNZ/FMA traceability.