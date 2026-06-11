# Discovery Report: Automated Regulatory Reporting Pipeline

**Domain:** Banking / Prudential & Financial Markets Regulation (NZ)
**Regulators in scope:** RBNZ (monthly prudential returns), FMA (quarterly reports)
**Discovery status:** Initial pass — open questions below require stakeholder input before solution design.

---

## 1. Problem Statement

Monthly RBNZ prudential returns and quarterly FMA reports are produced manually by three senior analysts who extract data from three source systems (core banking, treasury, cards), reconcile in Excel, and submit via regulator portals. The process takes 6–8 business days per monthly cycle, misses internal sign-off deadlines roughly once per quarter, and has twice required informal extension requests to RBNZ. An estimated 40% of senior analyst time goes to extraction and reconciliation work believed to be automatable.

## 2. Proposed Solution (as described)

An automated pipeline that:

1. Connects to three source systems via **read-only APIs**
2. Extracts required data fields
3. Runs reconciliation logic automatically
4. Applies a **normalisation layer** codifying current manual corrections for 2019 migration artefacts (rounding differences, timing mismatches)
5. Produces a **pre-populated return file** for analyst review and approval
6. Maintains a **complete audit trail** of every transformation
7. **Does not submit autonomously** — analysts retain sign-off authority; submission remains manual via RBNZ Reporting Portal and FMA gateway

## 3. Functional Requirements (extracted)

| ID | Requirement | Source |
|----|-------------|--------|
| FR-1 | Read-only API integration with core banking, treasury, and card platforms | Stated |
| FR-2 | Automated extraction of all data fields required by RBNZ prudential return templates and FMA report formats | Stated |
| FR-3 | Automated cross-system reconciliation replicating current analyst reconciliation logic | Stated |
| FR-4 | Normalisation/transformation layer correcting legacy migration artefacts | Stated |
| FR-5 | Generation of pre-populated return files in regulator-accepted formats | Stated |
| FR-6 | Analyst review and approval workflow gating release of the return file | Stated |
| FR-7 | Full transformation audit trail: any submitted figure traceable to source data with all adjustments explained | Stated — flagged non-negotiable by compliance |
| FR-8 | Reconciliation exception surfacing — items that fail reconciliation must be flagged for analyst attention, not silently passed through | Implied |
| FR-9 | Manual override capability with mandatory justification capture (analysts will sometimes need to adjust pipeline output) | Implied |

## 4. Non-Functional Requirements

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR-1 | **Deadline reliability:** pipeline output available with sufficient buffer before the 20th of each month | Missed submission = formal RBNZ notice, possible unscheduled supervisory review |
| NFR-2 | **Fallback path:** documented manual process must remain executable if the pipeline fails mid-cycle | Implied by NFR-1 severity |
| NFR-3 | **Audit trail durability:** immutable, retained per regulatory record-keeping obligations, queryable for supervisory review | Implied by FR-7 |
| NFR-4 | **Transformation logic versioning:** every normalisation/reconciliation rule version-controlled; audit trail records which rule version produced which figure | Implied — "explain any adjustment" requires knowing the rule as it existed at submission time |
| NFR-5 | Read-only access enforced at the API/credential level — pipeline must be provably incapable of writing to source systems | Implied |
| NFR-6 | Access controls and segregation of duties: rule authors ≠ approvers; analysts approving returns cannot silently alter pipeline logic | Implied by regulated context |

## 5. Key Risks and Findings

### 🔴 FINDING 1 (Critical): The normalisation layer codifies *corrections to known data defects* as a permanent transformation

This is the highest-risk element of the proposal and needs deliberate handling:

- **Root cause vs. symptom.** The rounding and timing artefacts are *source data quality defects* from the 2019 migration. Embedding permanent corrections in the pipeline institutionalises the defects rather than remediating them. Regulators may ask why source systems have carried known inaccuracies for 5+ years. Discovery should include an assessment of whether source-side remediation is feasible — even if the pipeline corrects in the interim.
- **Codification risk.** Manual normalisation may currently involve analyst judgment (e.g., deciding *which* timing mismatch applies in edge cases). If the rules are not fully deterministic and documented today, codifying them risks either (a) freezing in errors, or (b) losing judgment the automation can't replicate. **The normalisation rules must be formally documented, validated against historical returns, and signed off by compliance before being built.**
- **Regulatory perception.** An analyst making a documented adjustment and an automated system silently transforming data are treated differently in supervisory review. Every normalised figure must carry pre/post values, the rule applied, the rule's documented rationale, and its approval lineage. Consider proactively socialising the approach with the RBNZ relationship manager — the team already has informal contact history.
- **Drift risk.** Migration artefacts may not be static (e.g., timing mismatches affecting a shrinking population of legacy accounts). Rules need periodic recertification, not set-and-forget.

### 🟠 FINDING 2: Deadline criticality demands a parallel-run validation period

Given that a missed submission triggers a formal RBNZ notice, the pipeline must not become the single path to producing a return until proven. Recommend **2–3 full monthly cycles of parallel running** (pipeline output reconciled against the manual process) before decommissioning manual steps, plus a maintained manual fallback runbook thereafter.

### 🟠 FINDING 3: Unverified API availability

The proposal assumes read-only APIs exist on all three platforms. Core banking and card platforms (especially legacy ones) frequently lack suitable APIs; alternatives (database replicas, batch extracts, file drops) materially change architecture, cost, and audit-trail design. This is a **gating discovery item**.

### 🟡 FINDING 4: Reconciliation logic lives in analysts' heads and spreadsheets

The current Excel-based reconciliation is undocumented institutional knowledge held by three people. Discovery must include a knowledge-capture exercise; this also mitigates existing key-person risk independent of the automation outcome.

### 🟡 FINDING 5: Approval workflow design affects accountability

"Analysts review and approve" needs definition: does review mean checking exceptions only, or re-verifying figures? A pipeline that's right 99% of the time invites automation complacency. The review UI should surface *what changed, what was normalised, and what failed reconciliation* — not just present a finished return for rubber-stamping.

## 6. Open Questions for Stakeholders

**Source systems & data**
1. Do all three platforms expose read-only APIs today? What protocols, rate limits, data freshness?
2. Are the required return fields fully available via API, or do analysts currently use screen-scraped/report-derived data anywhere?
3. Is there an existing data warehouse/lake these systems already feed?

**Normalisation**
4. Are the current normalisation rules documented anywhere, or purely tacit?
5. Are they fully deterministic, or do analysts exercise judgment case-by-case?
6. What's the materiality of the adjustments (basis points on key prudential ratios)?
7. Has source-system remediation of the 2019 artefacts ever been scoped? Why was it not done?
8. Has the normalisation practice ever been disclosed to or discussed with RBNZ/FMA?

**Regulatory & compliance**
9. Exact return types in scope (e.g., which RBNZ prudential survey series; which FMA reports)? Required file formats for each portal?
10. What are the formal record-retention requirements compliance expects the audit trail to meet (duration, immutability standard)?
11. Does internal audit or the external auditor need to review the pipeline before go-live?
12. Does the bank's BS11 / outsourcing or material-change policy require board or RBNZ notification for this system?

**Operations**
13. Where in the 6–8 days does time actually go (extraction vs. reconciliation vs. drafting vs. review)? This determines realistic time savings.
14. What is the acceptable internal buffer before the 20th, and what failure-recovery window does that imply?
15. Who owns the pipeline post-delivery — finance ops, a data team, IT?

## 7. Assumptions (to validate)

- Return formats are stable enough to template (regulator template changes will need a change-management process)
- The three analysts are available for knowledge-capture during build
- Manual submission via regulator portals remains acceptable long-term (no direct-submission ambition in scope)
- Quarterly FMA reporting reuses substantially the same extracted data (if not, scope grows)

## 8. Out of Scope (confirmed by request)

- Autonomous submission to R