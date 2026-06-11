# Discovery Document — Automated Regulatory Reporting Pipeline

**Status:** Draft for stakeholder review
**Pipeline stage:** Discovery
**Domain:** Regulated financial reporting (RBNZ prudential returns, FMA quarterly reports)

---

## 1. Problem Statement

Monthly RBNZ prudential returns and quarterly FMA reports are produced manually by three senior analysts who extract data from three source systems (core banking, treasury, card platform), reconcile in Excel, and upload via the RBNZ Reporting Portal and FMA submission gateway.

**Quantified pain:**

| Indicator | Current state |
|---|---|
| Cycle time | 6–8 business days per monthly cycle |
| Deadline misses | Internal sign-off missed ~1× per quarter |
| Regulator impact | 2 informal extension requests to RBNZ relationship manager |
| Analyst capacity | ~40% of senior analyst time on extraction/reconciliation |
| Regulatory exposure | Missed submission → formal RBNZ notice; possible unscheduled supervisory review |

The cost is not just labour — it's regulatory standing. Repeated informal extensions erode supervisory goodwill, and a missed statutory deadline carries escalating consequences.

---

## 2. Proposed Solution (as stated)

An automated pipeline that:

1. Connects to the three source systems via **read-only APIs**
2. Extracts the required data fields per return template
3. Runs **reconciliation logic** automatically
4. Applies a **normalisation/transformation layer** correcting legacy 2019 migration artefacts (rounding differences, timing mismatches)
5. Produces a **pre-populated return file** for analyst review
6. Preserves **human sign-off authority** — no direct submission to regulators without analyst approval
7. Generates a **complete audit trail** of every transformation from source data to submitted figure

---

## 3. Scope

### In scope
- Automated extraction from core banking, treasury, and card platforms (read-only)
- Automated reconciliation between sources
- Codified normalisation/transformation layer with full lineage
- Pre-populated RBNZ monthly return and FMA quarterly report generation
- Review/approve workflow for analysts
- Transformation audit trail meeting RBNZ and FMA traceability requirements

### Explicitly out of scope
- Automated submission to regulator portals (analyst uploads after sign-off) — *confirm whether portal upload automation is a future phase or permanently excluded*
- Remediation of source system data quality at origin — *but see Risk R1; this exclusion needs deliberate sign-off, not default*
- Changes to the regulatory templates themselves

---

## 4. Stakeholders

| Stakeholder | Role | Interest |
|---|---|---|
| Senior analysts (×3) | Primary users, sign-off authority | Workload reduction, trust in pre-populated figures, retained accountability |
| Compliance team | Requirement owner | Audit trail, traceability, defensibility of adjustments to regulators |
| Finance operations leadership | Sponsor | Cycle time, deadline reliability |
| RBNZ relationship manager / supervisor | External | Timeliness, explainability of any figure |
| FMA | External | Same, quarterly cadence |
| Source system owners (core banking, treasury, cards) | Dependency | API access, change notification, data dictionary |
| Internal audit | Assurance | Pipeline controls, change management on transformation logic |
| IT security / risk | Gatekeeper | Read-only access controls, data residency, BS11 outsourcing compliance if any vendor/cloud component |

---

## 5. Requirements

### Functional
- **F1** — Extract defined field sets from all three source systems via read-only APIs on a scheduled and on-demand basis
- **F2** — Execute reconciliation rules across sources; surface breaks/exceptions to analysts rather than silently resolving them
- **F3** — Apply versioned normalisation rules (migration artefact corrections); every rule application logged per record/field
- **F4** — Generate pre-populated return files in RBNZ and FMA submission formats
- **F5** — Analyst review workflow: view source value → transformed value → return cell, with diff/exception highlighting
- **F6** — Explicit approval gate; no return file is releasable without recorded analyst sign-off (who, when, what version)
- **F7** — Drill-back from any figure in the return to its source records and the complete chain of transformations applied

### Non-functional / compliance
- **N1** — **Audit trail is non-negotiable**: immutable, timestamped log of every extraction, transformation, reconciliation decision, override, and approval. Must satisfy RBNZ/FMA traceability on demand.
- **N2** — Read-only access enforced at credential level; pipeline can never write to source systems
- **N3** — Transformation rules under formal change control — versioned, approved by compliance before deployment, with effective-date history (an auditor must be able to ask "what rules were live for the March return?")
- **N4** — Pipeline reliability sufficient to support the 20th-of-month statutory deadline, with a documented manual fallback procedure
- **N5** — Data residency and any third-party/cloud components assessed against RBNZ outsourcing expectations (BS11 if applicable)
- **N6** — Retention of audit trail and return artefacts per regulatory record-keeping obligations (confirm period — likely 7 years)

---

## 6. Key Risks and Concerns

**R1 — The normalisation layer institutionalises a data quality problem (highest-priority discovery question).**
The 2019 migration artefacts are *source data defects*. Codifying corrections as a "permanent transformation layer" makes the workaround permanent infrastructure. Concerns:
- Regulators may view systematic, automated adjustment of source figures differently from documented analyst corrections. The adjustments must be characterised, documented, and ideally pre-socialised with RBNZ/FMA — not discovered during a review.
- Permanent transformation removes the recurring friction that would otherwise motivate fixing the data at source. The artefact population may also drift over time (new records, system changes), silently invalidating the rules.
- **Recommendation:** Discovery must evaluate fixing artefacts at source as an alternative or parallel workstream. If transformation-in-pipeline is the chosen path, it needs: a documented rationale, compliance sign-off on each rule, periodic revalidation, and monitoring that detects when actual data diverges from the rule's assumptions.

**R2 — Silent automation erodes the value of human sign-off.** If analysts receive a clean pre-populated return, review may become rubber-stamping. The workflow must surface exceptions, material movements, and applied adjustments prominently so sign-off remains substantive. Consider requiring explicit acknowledgement of flagged items.

**R3 — Single point of failure against a statutory deadline.** Pipeline outage near the 20th converts an efficiency project into a regulatory incident. Manual fallback capability must be retained and periodically exercised — which has staffing/skills implications as analyst familiarity with the manual process atrophies.

**R4 — Source system change risk.** API/schema changes in any of the three platforms can silently corrupt extractions. Requires change-notification agreements with system owners and automated validation (record counts, control totals, schema checks) at extraction.

**R5 — Loss of tacit knowledge during codification.** The analysts' "normalisation" likely includes judgement calls not written down anywhere. Codification must be done with the analysts, with parallel-run validation (see §8).

**R6 — Return template changes.** RBNZ/FMA periodically revise return formats. The pipeline needs a maintainable mapping layer and an owner for keeping it current.

---

## 7. Open Questions

1. What exactly are the normalisation rules today? Are they documented, or held in analyst heads/Excel formulas? (Blocking — required before build.)
2. Is fixing the 2019 artefacts at source feasible? What's the cost/owner? Has this been formally assessed and rejected, or just assumed too hard?
3. Have RBNZ/FMA been told about these adjustments today? How are they currently explained in the audit context?
4. Do all three source systems actually expose read-only APIs today, or is API enablement part of the project?
5. What is the materiality of the artefacts — basis points on a single field, or pervasive across the return?
6. Who owns transformation rule change control — compliance, finance ops, or a joint committee?
7. Is automated portal submission a future ambition (affects architecture), or permanently out of scope?
8. Any vendor/cloud hosting intended? Triggers BS11/outsourcing assessment.
9. Required retention period for audit artefacts?
10. What does "reconciled" mean operationally — tolerance thresholds, who adjudicates breaks?

---

## 8. Validation Approach (recommended)

- **Parallel run:** Minimum 3 monthly cycles where the pipeline runs alongside the existing manual process; outputs compared field-by-field before cutover. Quarterly FMA report requires at least one parallel quarter.
- **Rule extraction workshops:** Sit with each analyst to capture and formalise current normalisation/reconciliation logic; compliance reviews and approves each codified rule.
- **Audit trail dry run:** Compliance (and ideally internal audit) performs a mock "trace this figure to source" exercise against pipeline output before go-live.
- **Regulator engagement:** Brief the RBNZ relationship manager on the automation and the formalised adjustment layer before first automated-assisted submission.

---

## 9. Success Metrics

| Metric | Baseline | Target |
|---|---|---|
| Cycle time | 6–8 business days | ≤ 2–3 business days (to be validated) |
| Internal sign-off deadline misses | ~1/quarter | 0 |
| Extension requests to RBNZ | 2 to date | 0 |
| Analyst time on extraction/reconciliation | ~40% | ≤ 10%, redirected to review/analysis |
| Parallel-run variance vs manual process | n/a | 100% explained variances before cutover |
| Audit trace request fulfilment | manual, hours/days | Any figure traceable to source on demand |

---

## 10. Recommended Next Steps

1.