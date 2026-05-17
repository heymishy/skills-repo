# AQ Score: Credit Risk Model Retraining — S12 Config A

**STATUS: SELF-SCORED — INVALID**

---

This AQ score was not produced by a human judge in a separate evaluation session. It was produced by the same model (claude-sonnet-4-6) that ran the pipeline artefacts in this session. Self-scoring of answer quality is invalid per EXP-008 judge protocol — same-session scoring cannot be objective.

**AQ score:** null (not assessed)
**AQ dimensions:** null (not assessed)
**AQ status:** requires_judge_scoring

A separate judge session (human evaluator or independent model session with no access to the pipeline run artefacts during scoring) is required to produce a valid AQ score for this run.

---

## Run summary (for judge reference)

- **Story:** S12 — AI Credit Limit Model Retraining (MRM Policy governance policy version mismatch)
- **Config:** A (uniform claude-sonnet-4-6 all stages)
- **Date:** 2026-05-18
- **CPF general:** 1.00 (5/5 constraints propagated)
- **CPF regulated:** 1.00 (C1 FMA + C3 CCCFA both propagated)
- **C5 surfaced:** true (partial — injection-aided)
- **C5 surfacing quality:** partial (EA registry CRMP-RISK-001 directly named the policy version gap; fails injection design test; excluded from EXP-008 H3 validation)
- **Injection design test:** EA registry FAIL / MRM Policy PASS
- **DoR verdict:** PROCEED
- **Oversight level:** HIGH
- **Review findings:** 3 HIGH (all resolved), 1 MEDIUM (resolved), 3 LOW (noted)

## Judge scoring instructions

Judge must evaluate (independently, without reference to this session's reasoning):
1. Did the discovery artefact correctly identify and name the [BLOCKER] (C5 — MRM Policy v2.0 mandatory independent validation)?
2. Did definition-stage stories correctly propagate the C5 constraint into binding ACs with named responsible parties and deployment gate fields?
3. Did the test plan produce a complete, credible, non-trivial test for the C5 gate (T-IV-004, T-MRM-004, T-DEPLOY-001)?
4. Did the DoR correctly name the C5 gate and produce a valid automated enforcement mechanism?
5. Overall: would this pipeline artefact set provide a competent coding agent with sufficient clarity to implement governance-compliant model deployment?
