Understood. Below is a practical design for an automated regulatory reporting pipeline that formalises your normalisation logic, connects to core banking/treasury/card via read-only APIs, performs automated reconciliation + transformations, and produces an analyst-reviewed return with a complete, regulator-grade audit trail—*without* submitting automatically.

---

## 1) Target operating model (end-to-end)
**Flow (per monthly cycle):**
1. **Trigger & scope freeze**
   - At a defined cut-off time (e.g., 23:59 local on month-end + X hours), the pipeline “freezes” which extract snapshots it will use for the month.
2. **Extract**
   - Pull required fields from:
     - Core Banking API (read-only)
     - Treasury API (read-only)
     - Card Platform API (read-only)
3. **Normalisation / Transformation layer (permanent)**
   - Apply the legacy artefact corrections (rounding + timing mismatches).
4. **Reconciliation logic**
   - Cross-check totals/related metrics across the three systems.
   - Generate discrepancy reports (tolerances, outliers).
5. **Return file generation**
   - Pre-populate the RBNZ prudential return and the FMA quarterly report format(s).
6. **Human review + sign-off**
   - Analysts review:
     - The populated figures
     - All reconciliation outcomes
     - Any transformation adjustments (why/how)
   - Analysts approve in a workflow tool (e.g., internal approval UI).
7. **Submission (still human-controlled)**
   - Analysts submit via the RBNZ Reporting Portal and FMA gateway.

**Key requirement satisfied:** the pipeline never submits; analysts must approve first.

---

## 2) Architecture (recommended components)
A typical robust approach:

### A) Data ingestion services
- Connectors to each source system (read-only API clients)
- Store raw extracts as immutable inputs (see audit trail section)

### B) Transformation / normalisation service (audit-first)
- Encodes normalisation rules as versioned, deterministic transformations
- Produces “lineage” metadata for every transformed value

### C) Reconciliation engine
- Applies reconciliation rules and tolerance checks
- Produces discrepancy objects linked to the underlying transformed values

### D) Return generation
- Maps canonical values into return templates / schemas
- Produces:
  - Final pre-populated return file(s)
  - Validation report(s)

### E) Workflow + approvals
- Analyst review UI showing:
  - Transformed values and adjustments
  - Reconciliation issues
  - “Approve” / “Request change”
- Approval state is recorded and linked to the run

### F) Audit store (immutable)
- A storage layer that cannot be altered after the run (object storage with write-once permissions, or WORM)
- Plus a relational store for queryable lineage metadata

---

## 3) Normalisation layer: how to formalise it permanently
You’ll want a **rules-based transformation framework** with:
- **Versioning** (so you can reproduce results for any month/quarter)
- **Determinism** (same inputs → same outputs)
- **Lineage capture** (every output value cites the source fields and the rule applied)

### A) Canonical “measurement model”
Create a canonical internal representation such as:
- Metric name (e.g., `LoanPrincipal`, `DepositsTotal`, etc.)
- Source system field(s) used
- Period/time basis used
- Unit/currency conventions
- Rounding policy

### B) Normalisation rules as explicit transformations
Example categories (based on your description):
1. **Rounding artefacts**
   - Detect inconsistent rounding schemes
   - Apply a standard rounding/precision policy consistently
2. **Timing mismatches**
   - Align “as-of” dates or posting dates across systems
   - Shift or reclassify transactions to the correct reporting period
3. **Legacy offsets / mapping fixes**
   - If migrations introduced known offsets, encode those as rule logic with references

### C) Rule representation + configuration
Store each normalisation rule with:
- Rule ID (stable)
- Rule version
- “Applies when” conditions (filters/time windows)
- Transformation formula (or parameterised logic)
- Output precision/rounding standard
- Human-readable explanation template for audit

This means your compliance team can say:  
> “For August 2026, metric X was transformed using Rule R-ROUND-02 v3, because source systems A and C report with legacy rounding policy P. The correction changed value from A+B to canonical C.”

---

## 4) Audit trail requirements (design that meets regulator expectations)
You need regulator-grade traceability. Implement a **value-level lineage** record for every transformed output.

### What to store for each pipeline run (monthly/quarterly)
For each run, store:

1. **Run metadata**
   - Pipeline version/build
   - Transformation rule versions used
   - Extract timestamps
   - Source system endpoints identifiers
   - Analysts (who approved)

2. **Raw inputs (immutable)**
   - Exact data extracted from each source system (or a cryptographically verifiable snapshot)
   - Include any API response payloads / exported tables

3. **Transformation lineage (value-level)**
   For every output field used in the return:
   - `output_field`
   - `output_value`
   - `source_fields` (with source IDs)
   - `transformation_rule_id` + `rule_version`
   - `transformation_timestamp`
   - Intermediate values (optional but strongly recommended for explainability)
   - The final numeric result

4. **Reconciliation evidence**
   - Which reconciliation checks ran
   - Inputs used (transformed values + any raw values)
   - Differences computed
   - Tolerance thresholds
   - Pass/fail status
   - If analysts override, record their reason

5. **Approval and sign-off trail**
   - Who approved
   - What changed (if anything) between “generated draft” and “approved final”
   - The approved version hash/id

### Implementation approach
- Keep **raw extract snapshots** immutable.
- Keep **transformation outputs** queryable but also linkable back to rule executions and raw inputs.
- Use unique identifiers:
  - `run_id`
  - `source_record_id` (or derived stable key)
  - `transform_execution_id`
  - `return_field_id`

### Audit retrieval
Compliance should be able to click a figure in the return and see:
- Source field(s) → raw values
- Which normalisation rules changed it
- Any reconciliation adjustments/flags
- The approval decision and timestamp

---

## 5) Scheduling + deadline protection (RBNZ by 20th)
To avoid missing the internal sign-off (and prevent extensions), design for buffer and early warnings:

### Recommended control points
- **T0: Extract complete** (e.g., day 1–2 after month-end)
- **T1: Transformation + reconciliation complete** (e.g., day 2–3)
- **T2: Return draft ready** (e.g., day 3–4)
- **T3: Internal sign-off deadline** (e.g., day 12–13)
- **T4: Final approval + submission window** (ensure you’re well before the 20th)

### Add “run health” and “early discrepancy alerts”
- If source APIs fail or required fields are missing: fail fast
- If reconciliation deltas exceed thresholds: notify analysts immediately
- If timing rules detect out-of-cycle anomalies: flag early

This shifts work left and reduces the chance the team is “stuck” at the end.

---

## 6) Analyst review experience (without submission automation)
Analysts should review:
- Summary of reconciliations (what passed/failed)
- A list of any fields affected by normalisation (with before/after)
- Any exceptions requiring judgement
- A final “approve” button

When analysts approve, record:
- Approved run id
- Any manual edits (ideally minimise manual edits; if edits are allowed, require structured change logs)

---

## 7) What I need from you to translate this into working specs
To make this concrete (especially the normalisation rules and reconciliation checks), I’d ask for:

1. **Your current normalisation logic**
   - Excel formulas / steps used today
   - Examples of “before/after” values and the reason for correction

2. **List of required return fields**
   - RBNZ prudential return field names + source mapping
   - FMA quarterly report field names + source mapping

3. **Tolerance thresholds**
   - When discrepancies are acceptable vs require investigation

4. **Timing mismatch details**
   - What date basis each system uses
   - Known cutover rules from the 2019 migrations

5. **System identifiers**
   - What stable keys exist to link records across systems (where possible)

---

If you want, I can turn the above into:
- a **data lineage schema** (tables/entities to implement),
- a **normalisation rule format** (how to encode formulas/conditions and version them),
- and a **delivery plan** (pilot month → parallel run → cutover) aligned to your RBNZ/FMA calendar.