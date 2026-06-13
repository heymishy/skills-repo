# /discovery Output: Automated Regulatory Reporting Pipeline

## Strategic Fit Assessment

**Alignment with Regulatory Obligation**
This is a **high-control, audit-dependent automation** scenario. The core value is not speed-to-submission (though that's a benefit), but **elimination of manual reconciliation error and formalization of correction logic** under permanent audit visibility. This directly reduces compliance risk, which is your primary constraint.

**Why This Matters for Build Priorities**
The audit trail requirement isn't a feature—it's a hard gate. If your pipeline cannot prove the lineage of every number to regulators, you cannot deploy it. Design the audit trail *first*, then build extraction and reconciliation around it. Everything else is secondary.

---

## Discovery Findings

### 1. **Current-State Pain Points**

| Step | Current Duration | Risk Level | Automation Potential |
|------|------------------|------------|----------------------|
| Data extraction (3 systems) | 2–3 days | Medium | High – APIs exist |
| Manual reconciliation & normalisation | 2–3 days | **High** | High – rules can be codified |
| Excel review & sense-checking | 1–2 days | Medium | Medium – exception reporting helps |
| Portal submission | 0.5 days | Low | Low – manual approval step justified |

**Root Cause of Missed Deadlines**
- Normalisation step often reveals discrepancies requiring rework
- No clear ownership of which correction applies to which field
- Timing mismatches between month-end close dates across systems (e.g., treasury system closes T+1, core banking closes same-day)
- Version control in Excel creates re-work loops

**Analyst Time Allocation**
- 40% on extraction/reconciliation = ~16 hours/week of senior analyst capacity
- If pipeline reduces this to 8 hours/week (review + exception handling), you free ~2 FTE-weeks per quarter for higher-value analysis or compliance projects

---

### 2. **Audit Trail as a Design Constraint**

**Current State (Compliance Risk)**
- Normalisation adjustments documented in cell comments or separate tabs
- No systematic record of *why* adjustments were made or *which source field* triggered the correction
- If audited post-submission, you cannot confidently explain the adjustment genealogy
- RBNZ or FMA challenge → scramble to reconstruct logic from analyst notes

**Pipeline Requirement**
Every data transformation must record:
1. **Source field reference** (system, field name, exact value extracted)
2. **Transformation rule applied** (normalisation rule ID, threshold, logic)
3. **Rationale** (e.g., "2019 migration legacy rounding, applies to treasury FX fields")
4. **Resulting value** (post-transformation)
5. **Timestamp & actor** (pipeline run ID, approval by analyst name)
6. **Metadata** (reporting period, submission cycle)

This log becomes a **regulatory submission artifact** alongside the return itself.

---

### 3. **Normalisation Logic Inventory**

**Before Build, You Must Formalise:**

**Interview Questions for Finance Team**
- What are the *specific legacy artefacts*? (List every normalisation rule in use)
  - Example: "Treasury system rounds interest accrual to 2 decimals; core banking rounds to 4 decimals. We reconcile by rounding all to 2 decimals."
  - Example: "Card platform records T+2 activity; regulatory return requires T month-end cutoff. We shift all dates back by 1 day."
- How do you *decide which correction to apply* when multiple systems conflict?
  - Is there a hierarchy? (e.g., core banking is source of truth for customer balances)
  - Are there thresholds? (e.g., only correct if variance > $x or > y basis points)
- Are normalisation rules *stable* or do they change seasonally or by return type?
- Have there been *instances* where normalisation logic was applied incorrectly? What were the outcomes?

**Deliverable Before Technical Design**
A normalisation rules registry:
```
Rule ID | Source System(s) | Field(s) | Condition | Adjustment | Effective Date | Owner | Rationale
NRM-001 | Treasury | FX Accrual | All records | Round to 2 decimals | 2019-05-01 | [Owner] | Migration legacy
NRM-002 | Card Platform | Transaction Date | Month > reported month | Shift date -1 day | 2019-05-01 | [Owner] | T+2 settlement lag
NRM-003 | Core Banking + Treasury | Credit Limit | Variance > 0.5% | Use Core Banking | Ad-hoc | [Owner] | Reconciliation protocol
```

This registry becomes part of the audit trail and is versioned with each return submission.

---

### 4. **Technical Architecture** (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│ Source Systems (Read-Only APIs)                                 │
│ • Core Banking (ledger, customer data)                          │
│ • Treasury (rates, FX, liquidity)                               │
│ • Card Platform (transaction volumes, balances)                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Extraction Layer                                                │
│ • Query each system for required data fields                    │
│ • Record source system metadata (extract timestamp, row count)  │
│ • Persist raw extract in immutable data store (e.g., S3, blob)  │
└─────��──────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Audit Trail Layer (Core Design Element)                        │
│ • Log every field: {source_value, rule_applied, output_value}  │
│ • Store normalisation rules registry version snapshot           │
│ • Record any field flagged as requiring analyst review          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Normalisation & Reconciliation Engine                           │
│ • Apply NRM-00X rules in priority order                         │
│ • Auto-reconcile within tolerance thresholds                    │
│ • Flag variance > threshold for analyst review                  │
│ • Generate exception report (high-touch items)                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Return Assembly                                                 │
│ • Populate RBNZ/FMA return templates with validated data        │
│ • Cross-check mandatory fields and format compliance            │
│ • Generate pre-submission validation report                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Review & Approval Interface (Human Gate)                        │
│ • Analysts review exception report and reconciliation variance  │
│ • Approve or reject transformations                             │
│ • Sign off return before submission (audit trail captures this) │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Submission & Archive                                            │
│ • Submit return via RBNZ Portal / FMA Gateway                   │
│ • Archive: return file + full audit trail + normalisation rules │
│ • Maintain 7-year regulatory record retention                   │
└─────────────────────────────────────────────────────────────────┘
```

**Critical Design Points**

1. **Immutable Raw Extract Storage**
   - Every pipeline run persists the unmodified data extracted from source systems
   - Stored separately from transformations (enables re-audit if rules change)
   - Keyed by: {reporting_period, source_system, extract_timestamp}

2. **Audit Trail as First-Class Data**
   - Not a log file; a queryable database or structured log
   - Indexed by field name, rule ID, transformation type
   - Exportable in format regulators expect (CSV, JSON, or structured report)

3. **Reconciliation Variance Reporting**
   - Automatically flag when inter-system variance exceeds tolerance
   - Distinguish between "normalisation applied" (expected) and "true discrepancy" (requires investigation)
   - Example: "Treasury FX Accrual vs. Core Banking: $1,200 variance. Applied NRM-001 (rounding). Residual variance: $0.03. Status: Within tolerance."

4. **Analyst Review Scope (Post-Automation)**
   - Exception report (only items exceeding thresholds, not every transformation)
   - Sense-checks: Do totals pass regulatory validation rules? Are there unusual spikes?
   - Sign-off gateway: Analyst must affirmatively approve before submission (audit trail records name, timestamp, sign-off comment)

---

### 5. **Build Roadmap** (Phased Delivery)

| Phase | Duration | Scope | Regulatory Risk | Dependency |
|-------|----------|-------|-----------------|------------|
| **Phase 1: Discovery & Rules Formalisation** | 2–3 weeks | Document all normalisation rules; build registry; design audit trail schema | None – no automation yet | Finance team buy-in |
| **Phase 2: Extraction & Audit Infrastructure** | 4–6 weeks | Build APIs to extract data; set up immutable storage; implement audit logging | Low – outputs still manually reviewed | IT access to 3 systems |
| **Phase 3: Normalisation Engine** | 3–4 weeks | Code normalisation rules; integrate with audit trail; test against historical returns | Medium – logic must match current manual process | Phase 1 rules registry |
| **Phase 4: Reconciliation & Exception Reporting** | 3–4 weeks | Auto-reconciliation logic; exception flagging; analyst dashboard | Medium – requires threshold calibration | Phase 3 + historical variance data |
| **Phase 5: Return Assembly & Validation** | 2–3 weeks | Template population; format validation; pre-submission checks | Low – existing validation rules | Phase 4 |
| **Phase 6: Review Interface & Submission** | 2–3 weeks | Analyst approval UI; submission workflow; audit trail export | Low – human gate remains | Phase 5 + legal review |
| **Phase 7: UAT & Regulatory Approval** | 4–6 weeks | Test end-to-end on 2 full monthly cycles; RBNZ/FMA notification of automation | **High** – regulators may request process documentation | All prior phases |
| **Phase 8: Cutover & Runbook** | 1–2 weeks | Deploy to production; document procedures; train analysts | Low – phased-in adoption | Phase 7 approval |

**Total Timeline: 4–5 months (parallel work possible)**

---

### 6. **Key Questions Before Build Kickoff**

**Risk & Compliance**

1. Have you notified RBNZ and FMA that you are automating this process? Do they require advance approval or notification?
   - *Implication*: Phase 7 UAT may need regulator observation or sign-off
2. What does your internal audit function require to approve automation of a regulatory submission process?
3. Are there any SLAs or performance standards tied to submission punctuality that the pipeline must meet? (e.g., must submit by noon on the 20th to allow for any regulator clarification calls that day?)

**Technical & Data**

4. What read-only APIs do the three systems expose? Are they documented? Do they support bulk queries for a full reporting period?
   - *Implication*: If APIs are limited, extraction may require batch uploads or database dumps instead
5. How stable are the source system field names and structures? Have there been schema changes in the past 2 years?
6. Can you provide 12 months of historical extract data so the pipeline can be back-tested against actual normalisation decisions?

**Operational**

7. If the pipeline encounters an error during extraction (e.g., a system is down on month-end cutoff), what is the fallback? Does the pipeline have a retry strategy, or do analysts revert to manual extraction?
8. Who owns maintaining the normalisation rules registry? How will changes (e.g., a new system integration, a rule amendment) be version-controlled and deployed to production?
9. What is the approval workflow for changing a normalisation rule? Does it require compliance or finance director sign-off?

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| **Audit Trail Completeness** | 100% of transformed figures traceable to source + rule applied; auditable by RBNZ/FMA in <4 hours |
| **Time Reduction** | Monthly cycle time reduced from 6–8 days to ≤4 days; 40% of analyst extraction/reconciliation time freed |
| **Accuracy** | Normalisation logic matches historical manual decisions in 100% of test cases; zero unexplained variances in UAT |
| **Deadline Compliance** | Return submitted by day 18 of submission month (buffer before day 20 deadline); zero extension requests |
| **Regulatory Acceptance** | RBNZ/FMA confirm pipeline-generated returns meet submission requirements; no compliance queries post-submission |

---

## Recommended Next Step

**Conduct a 2-week Rules Formalisation Workshop**
- Gather the three senior analysts + finance manager + compliance lead
- Document every normalisation rule in use, including edge cases and exceptions
- Assign rule ownership and define change control process
- Build normalisation registry (the source of truth for pipeline logic)
- This unblocks all downstream technical design work

**Parallel: Early Regulator Engagement**
- Send an informal brief to your RBNZ relationship manager outlining the automation scope and audit trail approach
- Ask whether they require notification or advance approval before cutover
- This prevents Phase 7 surprises

Would you like me to detail the audit trail schema, provide a normalisation rules template, or dive into any specific technical component?