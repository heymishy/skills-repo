# Outcomes Grading: RBNZ Regulatory Framing

**Status:** Design — not implemented
**Date:** 2026-05-12
**Author:** Session 3 design phase

---

## The core distinction

Existing pipeline validation checks whether an artefact **exists**. A discovery artefact is present or absent. A test plan is present or absent. These are binary existence gates.

Outcomes grading checks whether an artefact **meets a quality threshold**. An artefact can exist and still fail — it may name the problem but omit regulatory constraints, or bound a scope that is not testable, or list assumptions without validation owners. Existence without quality is a compliance artefact, not a delivery input.

In a regulated financial services context, this distinction has direct supervisory significance. A discovery document that says "we will build an AML monitoring capability" without surfacing data-residency, retention-period, and regulatory-classification constraints before the delivery pipeline begins is not a compliant discovery document — it is a planning gap that will be discovered during implementation, either as a scope change or as a control deficiency finding.

---

## Mapping to RBNZ CPG 220 (BS11)

The Reserve Bank of New Zealand's Outsourcing Policy (BS11) and supporting guidance (CPG 220 — model risk management equivalent) require that:

1. **The scope of model use is documented before deployment** — discovery artefacts that proceed to delivery without regulatory classification satisfy the governance intent of this requirement; artefacts that skip classification do not.

2. **Model outputs are subject to independent validation** — the judge-model grading pattern implements a form of independent validation: the model that produced the candidate artefact is not the model that evaluates it.

3. **Audit trails are maintained** — `eval-run-result.json` provides per-case traceability: which model, which artefact path, which rubric version, what score, when.

4. **Human review is required for high-consequence model outputs** — the `humanReviewRequired: true` flag when a graded artefact fails maps directly to this requirement. A failing artefact cannot advance through the pipeline without human sign-off.

The grader does not replace human review. It is a quality signal that flags artefacts requiring human attention before they proceed to definition.

---

## Empirical threshold: 0.70

The pass threshold of 0.70 is not an arbitrary number. It is derived from EXP-001 run-3 scoring results:

- T1 (payment retry, straightforward): weighted score ≈ 0.72 (Sonnet), 0.74 (Opus) — borderline pass
- T2 (onboarding ambiguity, well-bounded): weighted score ≈ 0.81–0.85 — clear pass
- T3 (AML monitoring, enterprise constraints required): weighted score ≈ 0.65–0.68 — fail (constraint completeness gap)
- T4 (thin adversarial input): weighted score ≈ 0.55 — clear fail
- T5 (note-taking, deceptively complex enterprise probe): weighted score ≈ 0.49 — fail (enterprise constraints absent)

Setting the threshold at 0.70:
- Passes T1 and T2 (the cases a competent operator should pass)
- Fails T3 (AML without constraint surfacing — a correct regulatory fail)
- Fails T4 and T5 (thin or enterprise-unaware inputs — correct fails)

The threshold is calibrated to the corpus, not derived from theory. As new corpus cases are added, the threshold may be revised — but any revision requires operator review and a rubric version increment.

---

## "Artefact quality" vs "delivery readiness"

The grader scores artefact quality, not delivery readiness. These are related but not identical:

| Signal | Who determines it | Gate |
|---|---|---|
| Artefact exists | validate-trace.sh | CI gate (automated) |
| Artefact quality ≥ 0.70 | Outcomes grader (judge model) | Eval gate (automated, advisory in v1) |
| Delivery readiness | Human operator | DoR sign-off (human gate) |

In v1 of the grader, the eval gate is **advisory**: a failing score produces a `humanReviewRequired: true` signal and blocks the improvement agent from auto-accepting proposals that reference a failing artefact, but it does not block the CI pipeline or the DoR sign-off. The human operator retains authority.

The rationale for advisory-only in v1: the grader rubric is not yet validated against a broad enough artefact population to be used as a hard gate. A hard gate requires calibration across at least 3 experiments and 30+ scored cases before it can reliably distinguish quality gaps from rubric mis-calibration. The 0.70 threshold will move to a blocking gate when that calibration is complete.

---

## What the grader does not assess

- **Feasibility:** Whether the proposed solution is technically feasible is a definition-phase concern, not a discovery-phase one. The rubric does not score feasibility.
- **Compliance completeness:** The grader surfaces whether regulatory constraints were acknowledged, not whether they were correctly resolved. Resolution is a human expert function.
- **Story AC quality:** The grader scores discovery artefacts. A separate rubric (not yet designed) would be needed for story acceptance criteria.
- **Code quality:** Out of scope. The grader operates on skill artefacts (markdown documents), not source code.
