# Review Report: Payment Authorisation Service Secondary-Site Failover

**Status:** PASS with MEDIUM findings
**Run:** 1 (initial review)
**Reviewed:** 2026-05-16
**Stories reviewed:** 7 (S1.1, S1.2, S1.3, S2.1, S2.2, S3.1, S3.2)
**Verdict:** PASS — Review passed; findings are non-blocking (no HIGH findings)

---

## Findings

### 1-M1: Scope Stability field missing from story artefacts

**Severity:** MEDIUM  
**Category:** Completeness (D)  
**Affected stories:** All 7 stories (S1.1, S1.2, S1.3, S2.1, S2.2, S3.1, S3.2)

**Issue:**  
The SKILL.md completeness criteria requires "Scope stability declared" for each story. The artefacts include Priority (Critical/High) and Complexity (1–3) fields, but do not explicitly declare Scope Stability as either "Stable" (well-understood, scope is fixed) or "Unstable" (unknowns present, scope may shift).

**Evidence:**  
None of the 7 stories contain a field labeled "Scope Stability: [Stable|Unstable]".

**Recommended action:**  
Add a "Scope Stability" field to each story artefact, declaring either:
- `Scope Stability: Stable` — scope is well-defined, no unknowns (e.g. S3.1 Documentation story)
- `Scope Stability: Unstable` — scope depends on external unknowns (e.g. S1.1 evaluation, S1.2 replication architecture choice)

**Scope Stability recommendations by story:**
- S1.1: Unstable (depends on latency measurement results and Hamilton capacity confirmation)
- S1.2: Unstable (depends on S1.1 evaluation findings; replication architecture choice unknown)
- S1.3: Stable (scope is well-defined: verify and close audit finding)
- S2.1: Stable (established failure detection patterns; known dependencies)
- S2.2: Unstable (depends on S1.2 completion and S2.1 output; depends on failover drill results)
- S3.1: Stable (documentation; scope fixed)
- S3.2: Unstable (depends on S1.2, S1.3, S2.1, S2.2 completion; depends on DR drill outcomes)

---

## Scores

| Criterion | Score | Status | Notes |
|-----------|-------|--------|-------|
| **A — Traceability** | 5 | ✅ PASS | All stories reference parent epic, benefit metrics, and discovery scope. "So that..." clauses connect to named metrics (M1–M5). All metrics present in coverage matrix. |
| **B — Scope discipline** | 5 | ✅ PASS | All 7 stories stay within discovery MVP scope. Out-of-scope sections are genuine (not "N/A"). No scope additions requiring notes. Scope ratio 1.17 — clean mapping. |
| **C — AC quality** | 5 | ✅ PASS | All stories have ≥3 ACs. All ACs use Given/When/Then format. All describe observable behaviour ("confirms", "displays", "produces", etc. — not "should"). All independently testable. |
| **D — Completeness** | 4 | ⚠️ PASS | All template fields populated with real content. User stories named personas, complexity/priority rated. **Minor issue:** Scope Stability field missing from all stories (see 1-M1). No blocker — addressable pre-/test-plan. |
| **E — Architecture compliance** | N/A | SKIP | `.github/architecture-guardrails.md` not found. Architecture Constraints field is populated in implementation stories (S1.1, S1.2, S1.3, S2.1, S2.2) with C2 and C3 regulatory constraints explicitly named. Documentation stories (S3.1, S3.2) correctly declare "None". |

---

## Verdict: PASS ✅

**All primary criteria scored 3 or above.** One MEDIUM finding (Scope Stability field missing) is non-blocking and does not prevent progression to /test-plan. The finding is addressable by adding a single field to each story artefact without rework.

**Regulated constraint visibility:**
- C2 (PCI DSS) present in: S1.1, S1.2, S2.1, S2.2 — ✅ Complete propagation to all triggering stories
- C3 (AML/CFT) present in: S1.1, S1.2, S1.3 — ✅ Complete propagation to all triggering stories
- C1 (RTO/RPO) visible in: S1.1, S1.2, S2.1, S2.2, S3.2 — ✅ Sufficient coverage
- C4 (single Auckland DC) visible in: S1.1, S1.2 — ✅ Direct response to constraint
- C5 (AML replication assumption) implicit in: S1.1, S1.2, S1.3 — ✅ Addressed via S1.3 verification story

**Recommendation:** Proceed to /test-plan. Resolve 1-M1 by adding Scope Stability field to all 7 stories before DoR sign-off (non-urgent; can be addressed in parallel with test-plan authoring).

---

## Per-Story Summary

### S1.1 — Evaluate Replication Mechanism and Auckland–Hamilton Latency

**Findings:** None  
**Traceability:** ✅ Metric M2 (RPO ≤15min) — mechanism sentence: "confirm technical feasibility before committing"  
**Scope:** ✅ Stays in scope; genuine out-of-scope (implementation deferred to S1.2)  
**ACs:** ✅ 4 Given/When/Then blocks (latency baseline, feasibility assessment, QSA scoping)  
**Completeness:** ✅ All fields populated; **1-M1 applies** (Scope Stability missing)  
**Architecture:** Constraints properly set (C2, C3 noted as evaluation dependencies)

**Verdict:** PASS

---

### S1.2 — Implement Continuous Data Replication (RPO ≤ 15 min)

**Findings:** None  
**Traceability:** ✅ Metric M2 (RPO ≤15min) — mechanism: "upgrade replication to continuous streaming"  
**Scope:** ✅ Stays in scope; genuine out-of-scope (full PCI DSS remediation deferred; change control outside scope)  
**ACs:** ✅ 4 Given/When/Then blocks (monitoring dashboard, QSA scoping, gap identification, risk logging)  
**Completeness:** ✅ All fields; **1-M1 applies** (Scope Stability missing)  
**Architecture:** ✅ **Critical constraint propagation verified** — C2 and C3 explicitly in Architecture Constraints field with regulatory gate rationale

**Verdict:** PASS

---

### S1.3 — Verify and Close AML/CFT Transaction Record Retention Audit Finding

**Findings:** None  
**Traceability:** ✅ Metric M3 (AML/CFT audit finding closed) — mechanism: "verify replication within 5-year window"  
**Scope:** ✅ Stays in scope; genuine out-of-scope (retention policy not negotiable; external regulatory comm separate)  
**ACs:** ✅ 4 Given/When/Then blocks (sample verification, reconciliation, internal audit sign-off, external compliance)  
**Completeness:** ✅ All fields; **1-M1 applies** (Scope Stability missing)  
**Architecture:** ✅ **C3 (AML/CFT) explicitly in Architecture Constraints** with audit gate context

**Verdict:** PASS

---

### S2.1 — Implement Failure Detection

**Findings:** None  
**Traceability:** ✅ Metric M1 (RTO ≤2h) — mechanism: "detect outage within 30 seconds" + M4 (QSA assessment)  
**Scope:** ✅ Stays in scope; genuine out-of-scope (automatic failover without operator confirmation deferred)  
**ACs:** ✅ 3 Given/When/Then blocks (outage detection, alert delivery, operator failover command)  
**Completeness:** ✅ All fields; **1-M1 applies**  
**Architecture:** ✅ **C2 (PCI DSS) in Architecture Constraints** — notes failure detection agent is part of cardholder data environment

**Verdict:** PASS

---

### S2.2 — Implement Automated Failover Execution

**Findings:** None  
**Traceability:** ✅ Metrics M1 (RTO ≤2h), M4 (QSA assessment) — mechanism: "automate failover execution within 2-hour window"  
**Scope:** ✅ Stays in scope; genuine out-of-scope (failback procedures deferred; DNS/routing infrastructure assumed to exist)  
**ACs:** ✅ 4 Given/When/Then blocks (6-step failover sequence with zero transaction loss, RTO measurement, failover drill, QSA sign-off)  
**Completeness:** ✅ All fields; **1-M1 applies**  
**Architecture:** ✅ **Critical constraint propagation verified** — C2 (PCI DSS) explicitly in Architecture Constraints with compliance gate context

**Verdict:** PASS

---

### S3.1 — Document Failover Runbook

**Findings:** None  
**Traceability:** ✅ Metric M5 (operational runbook executable) — mechanism: "documented, step-by-step procedure"  
**Scope:** ✅ Stays in scope; genuine out-of-scope (automated execution, training delivery separate)  
**ACs:** ✅ 3 Given/When/Then blocks (runbook content, peer review, versioning)  
**Completeness:** ✅ All fields; **1-M1 applies**  
**Architecture:** None required (documentation-only; correctly stated as "None")

**Verdict:** PASS

---

### S3.2 — Execute DR Drills and Validate Failover Capability

**Findings:** None  
**Traceability:** ✅ Metrics M1 (RTO), M2 (RPO), M3 (AML/CFT), M4 (QSA), M5 (runbook) — mechanism: "empirical evidence via 2 controlled drills"  
**Scope:** ✅ Stays in scope; genuine out-of-scope (production failover, ongoing monitoring separate)  
**ACs:** ✅ 4 Given/When/Then blocks (drill 1 execution and measurement, drill 2 with runbook updates, QSA sign-off, Board approval)  
**Completeness:** ✅ All fields; **1-M1 applies**  
**Architecture:** None required (validation-only; correctly stated as "None")

**Verdict:** PASS

---

## Constraint Visibility Matrix

### Discovery Constraints → Story Propagation

| Constraint | Type | Discovery Section | S1.1 | S1.2 | S1.3 | S2.1 | S2.2 | S3.1 | S3.2 | Coverage |
|-----------|------|-------------------|------|------|------|------|------|------|------|----------|
| **C1: RTO ≤2h, RPO ≤15min** | Policy | Constraints | ✅ | ✅ | — | ✅ | ✅ | — | ✅ | 5/7 |
| **C2: PCI DSS QSA assessment** | Regulatory | Constraints | ✅ | ✅* | — | ✅ | ✅* | — | — | 4/7 (*Architecture Constraints) |
| **C3: AML/CFT 5-year retention** | Regulatory | Constraints | ✅ | ✅* | ✅* | — | — | — | — | 3/7 (*Architecture Constraints) |
| **C4: Single Auckland DC** | Technical | Constraints | ✅ | ✅ | — | — | — | — | — | 2/7 |
| **C5: AML replication gap assumption** | Hidden/Regulatory | Assumptions | ✅ | ✅ | ✅ | — | — | — | — | 3/7 (implicit) |

### Coverage Assessment

- ✅ **C2 (PCI DSS) — CRITICAL:** Present in Story Architecture Constraints for S1.2 and S2.2 (the two implementation stories that trigger the constraint). **Full propagation confirmed.**
- ✅ **C3 (AML/CFT) — CRITICAL:** Present in Story Architecture Constraints for S1.2 and S1.3 (the two implementation stories that trigger the constraint). **Full propagation confirmed.**
- ✅ **C1 (RTO/RPO):** Present in 5 stories covering detection, replication, failover, and validation.
- ✅ **C4 (single DC):** Present in evaluation and implementation stories that directly address secondary site.
- ✅ **C5 (hidden assumption):** Implicitly addressed by S1.3 verification story; no Architecture Constraint needed (assumption is validation target, not gate).

---

<!-- CPF-TRACE
stage: review
model: claude-haiku-4-5
review-categories: A (Traceability), B (Scope discipline), C (AC quality), D (Completeness), E (Architecture compliance - skipped: no guardrails.md)
step-4a-propagation-verified: YES | C2 present in S1.2 Architecture Constraints and S2.2 Architecture Constraints | C3 present in S1.2 and S1.3 Architecture Constraints | All triggering stories have explicit regulatory constraint naming
C1-coverage: 5/7 stories (0.71) — RTO/RPO visible in all critical paths (latency evaluation, replication, failover, validation)
C2-coverage: 2/2 triggering stories (1.00) — **100% propagation** — S1.2 and S2.2 have C2 in Architecture Constraints with gate context
C3-coverage: 2/2 triggering stories (1.00) — **100% propagation** — S1.2 and S1.3 have C3 in Architecture Constraints with statutory gate context
C4-coverage: 2/7 stories (0.29) — Single DC constraint captured in evaluation and implementation stories; not needed in failover/validation stories
C5-coverage: 3/7 stories (0.43) — Implicit in S1.1, S1.2, S1.3; assumption is validation target, not gate
traceability-score: 5 | all stories linked to parent epic, benefit metrics, discovery scope
scope-integrity-score: 5 | all stories within MVP scope; genuine out-of-scope sections; no drift
ac-quality-score: 5 | all stories ≥3 ACs; all Given/When/Then; all observable; all testable
completeness-score: 4 | all template fields populated; missing Scope Stability field (MEDIUM finding 1-M1)
architecture-compliance-score: N/A | guardrails.md not found; Architecture Constraints properly populated in implementation stories with regulatory constraints
overall-verdict: PASS | all criteria ≥3; one MEDIUM finding (non-blocking); ready for /test-plan
-->

---

**Review report saved to:** `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-3/review.md`

**Recommendation for Stage 3:** Proceed to /test-plan. Resolve MEDIUM finding 1-M1 (Scope Stability field) during test-plan authoring or before /definition-of-ready sign-off.

---

## Completion Status

✅ **Review PASSED** — Run 1 (initial)

**Findings summary:**
- HIGH findings: 0
- MEDIUM findings: 1 (1-M1 — Scope Stability field missing, non-blocking)
- LOW findings: 0

**Regulated constraint propagation confirmed:**
- C2 (PCI DSS): Present in 2/2 triggering stories (S1.2, S2.2) ✅
- C3 (AML/CFT): Present in 2/2 triggering stories (S1.2, S1.3) ✅

**Ready for /test-plan?** ✅ YES — All review criteria passed. No HIGH findings blocking progression.
