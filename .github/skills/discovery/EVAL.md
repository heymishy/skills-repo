# EVAL.md — /discovery skill evaluation specification

**Skill:** `/discovery`
**SKILL.md path:** `.github/skills/discovery/SKILL.md`
**Corpus path:** `.github/skills/discovery/corpus/`
**Last calibrated:** 2026-05-10
**Calibration model:** claude-sonnet-4-6

---

## Purpose

This file defines the evaluation specification for the `/discovery` skill. It is consumed by:

1. **Layer 1 — Operator runbook** (`.github/skills/model-sweep/SKILL.md`): the judge prompt is used manually after saving model outputs
2. **Layer 2 — Programmatic script** (`scripts/run-model-sweep.js`): the judge prompt and dimension weights are consumed directly to produce per-cell structured scores

The dimensions below are derived from the `/discovery` SKILL.md content — specifically the output requirements section and the artefact quality checks the skill implicitly enforces. Do not add dimensions not grounded in the SKILL.md.

---

## Grading dimensions

### D1 — Problem framing
**Weight:** 0.22
**What it measures:** Does the output describe the problem (the gap, cost, and affected party) rather than a solution or feature? The `/discovery` SKILL explicitly instructs: "surface the underlying problem, not the proposed solution."

| Score | Meaning |
|-------|---------|
| 1.0 | Problem statement describes a real gap or cost experienced by a named party. No solution framing. |
| 0.7 | Problem is identifiable but partially solution-framed ("we need X so that Y happens") |
| 0.4 | Problem statement is primarily a solution description with a thin rationale appended |
| 0.0 | Problem statement IS the solution ("We will build X") or is a restatement of the MVP scope |

**Corpus anchors:**
- T1 → 1.0 (clear problem: manual triage cost + merchant uncertainty; payment operations team named with frequency and cost)
- T4 → 0.0 if model produces any problem statement from "Make the API faster" — categorical fabrication
- T5 → 0.0 if model frames "teams don't have a place for notes" as the problem without questioning tooling duplication

---

### D2 — Persona specificity
**Weight:** 0.15
**What it measures:** Are affected parties described as named, role-specific personas with context (what they do, when the problem occurs, what it costs them) rather than generic "users" or "engineers"?

| Score | Meaning |
|-------|---------|
| 1.0 | ≥ 2 named personas with role, when they encounter the problem, and cost/impact per persona |
| 0.7 | Named personas (e.g. "squad lead") with some context, missing cost/frequency dimension |
| 0.4 | Generic role names without context ("engineers", "team leads") |
| 0.0 | "Users", "stakeholders", or no persona section |

**Corpus anchors:**
- T1 → 1.0 (payment ops engineer, merchant, finance team — each with role, timing, and cost described)
- T2 → 0.0 if model fabricates "SME business owner" without asking (input gave no persona detail)
- T4 → 0.0 if model invents a persona ("mobile users", "API consumers") from "Make the API faster"

---

### D3 — MVP bounding
**Weight:** 0.22
**What it measures:** Is the MVP scope specific, bounded, and deliverable? Does it resist scope inflation from the operator's input? The SKILL.md requires MVP to be "the smallest testable thing that validates the core assumption."

| Score | Meaning |
|-------|---------|
| 1.0 | MVP is a named, bounded subset of the full opportunity. At least one capability is explicitly deferred. |
| 0.7 | MVP is mostly bounded; one ambiguous capability included without clear justification |
| 0.4 | MVP is large (covers most of the opportunity) with weak bounding rationale |
| 0.0 | MVP = "all of the above" or MVP scope is the full solution |

**Corpus anchors:**
- T5 → 0.0 if model produces a feature list (rich text editor, tagging, search) as MVP scope — categorical fail
- T1 → 1.0 (retry for retryable failure codes only; circuit breakers, fraud screening, dashboard explicitly deferred)
- T2 → 0.0 if model produces a bounded MVP from "improve the onboarding experience" without clarification

---

### D4 — Out-of-scope discipline
**Weight:** 0.15
**What it measures:** Are there ≥ 2 explicitly named out-of-scope items with brief reasons? Generic "future phases" or "TBD" do not count. The SKILL.md states: "name at least one behaviour that is out of scope for this story and why."

| Score | Meaning |
|-------|---------|
| 1.0 | ≥ 3 named out-of-scope items, each with a one-line reason or phase designation |
| 0.7 | 2 named items with reasons |
| 0.4 | 1 named item, or multiple items without reasons |
| 0.0 | "Nothing is out of scope", blank section, or "deferred to future phase" with no specifics |

**Corpus anchors:**
- T1 → 1.0 (circuit breakers, fraud screening, merchant dashboard each named with reasons)
- T3 → 1.0 if SAR filing automation, upstream screening changes, and threshold rule changes are named with reasons
- T5 → 0.0 if model lists features as out-of-scope without naming what the MVP actually contains

---

### D5 — Assumption quality
**Weight:** 0.13
**What it measures:** Are assumptions genuine uncertainties (things the team does not know and needs to validate) rather than facts, scope statements, or restatements of requirements? The SKILL requires assumptions to be "things that must be true for this to work, that we haven't verified."

| Score | Meaning |
|-------|---------|
| 1.0 | ≥ 2 assumptions that are genuine uncertainties with stated risk if wrong |
| 0.7 | Assumptions present but some are facts or low-uncertainty statements |
| 0.4 | Assumptions section contains requirements ("the API must be available") or scope statements |
| 0.0 | No assumptions section, or all assumptions are facts/certainties |

**Corpus anchors:**
- T1 → 1.0 if model flags idempotency (retrying must not double-charge) as an assumption to validate
- T3 → 0.0 if model treats £10,000 threshold as a fixed fact without noting structuring risk
- T5 → 1.0 if model surfaces "we're assuming teams don't already have a notes solution" as an assumption rather than proceeding

---

### D6 — Success observability
**Weight:** 0.08
**What it measures:** Are success indicators observable and measurable? Can a human verify them without subjective judgment? The SKILL requires "observable indicators" — not aspirational statements.

| Score | Meaning |
|-------|---------|
| 1.0 | ≥ 1 indicator is anchored to a baseline measurement and a target (e.g. "8/12 skip → < 2/30 after 30 days") |
| 0.7 | Indicators are specific and directional but lack baseline anchoring |
| 0.4 | Indicators are observable but vague ("teams adopt the skill", "adoption improves") |
| 0.0 | No indicators, or indicators are unmeasurable aspirations ("everyone will love it") |

**Corpus anchors:**
- T1 → 1.0 ("triage time < 30 min/day" — anchored to "2-3 hours/day" baseline from operator input)
- T3 → 1.0 ("detection < 15 minutes" — anchored to "18+ hours" baseline from operator input)
- T2 → 0.0 if model writes "onboarding improves" without defining a baseline or target

---

### D7 — Constraint completeness
**Weight:** 0.05
**What it measures:** Are hard constraints (technical, regulatory, human, budget) captured — not invented, not fabricated, but drawn from the operator's input and the `product/constraints.md` file?

| Score | Meaning |
|-------|---------|
| 1.0 | Constraints section populated with items sourced from operator input and/or product context files |
| 0.7 | Constraints present but missing one obvious hard constraint from the input |
| 0.4 | Constraint section is thin (1 item) or contains soft constraints stated as hard |
| 0.0 | No constraints section, or constraints are fabricated (not sourced from input or product context) |

**Corpus anchors:**
- T3 → 0.0 if model fails to surface FCA regulatory obligation and audit trail requirement
- T1 → 1.0 (PCI-DSS compliance scope, idempotency requirement — both sourced from payment processing context)
- T5 → 0.0 if model fails to surface data residency and retention policy as hard constraints

---

## Pass threshold

**Weighted pass score:** ≥ 0.70

Formula: `Σ(dimension_score × weight)` across all 7 dimensions.

A weighted score below 0.70 indicates the skill run should not be used as the basis for downstream pipeline artefacts. A score of 0.85+ indicates strong model suitability for this skill.

**Categorical fails** (score 0.0 regardless of weighted total):
- A full discovery artefact produced from T2 (ambiguous cross-cutting input) or T4 (thin adversarial input) without a clarifying question first
- Problem statement that IS the solution (D1 = 0.0 and overall run flags as non-compliant)
- A feature list produced from T5 (deceptively complex input) — D3 = 0.0 and non-compliant regardless of weighted score

---

## Judge prompt

Use this prompt verbatim when scoring a model output. Replace `{OUTPUT}` with the raw text of the model's response, and `{CASE_ID}` with the corpus case identifier (T1–T5).

```
You are evaluating a model's response to the /discovery skill prompt against corpus case {CASE_ID}.

Your task is to score the response on 7 dimensions and return a JSON object only — no prose, no explanation outside the JSON.

Corpus case context:
{CASE_CONTEXT}

Model response to evaluate:
{OUTPUT}

Score each dimension on a 0.0–1.0 scale using the rubric below. Use the corpus anchor scores for calibration.

Rubric:
D1 — Problem framing (weight 0.22): Does the response describe a problem (gap/cost/affected party) rather than a solution? 1.0=clear problem; 0.7=partially solution-framed; 0.4=mostly solution; 0.0=problem IS the solution
D2 — Persona specificity (weight 0.15): Named personas with role, timing, cost? 1.0=≥2 named+context+cost; 0.7=named+partial; 0.4=generic role; 0.0=generic "users" or absent
D3 — MVP bounding (weight 0.22): Specific bounded MVP, not all-of-the-above? 1.0=bounded+explicit-deferral; 0.7=mostly bounded; 0.4=large scope+weak bounding; 0.0=unbounded or "all of it"
D4 — Out-of-scope discipline (weight 0.15): ≥2 named items with reasons? 1.0=≥3 with reasons; 0.7=2 with reasons; 0.4=1 or missing reasons; 0.0=absent/blank/TBD
D5 — Assumption quality (weight 0.13): Genuine uncertainties with risk-if-wrong? 1.0=≥2 real uncertainties+risk; 0.7=present+some facts; 0.4=requirements/facts only; 0.0=absent or all certainties
D6 — Success observability (weight 0.08): Measurable indicators with baseline anchor? 1.0=anchored+target; 0.7=specific+directional; 0.4=observable+vague; 0.0=unmeasurable/absent
D7 — Constraint completeness (weight 0.05): Hard constraints from operator input and product context? 1.0=sourced+complete; 0.7=mostly present; 0.4=thin/soft only; 0.0=fabricated/absent

Categorical fail rules (override weighted total):
- If response produces a full artefact without a clarifying question for case T2 or T4: set compliant=false, d1=0.0, note "process_violation: no_clarifying_question"
- If response produces a feature list for case T5: set compliant=false, d3=0.0, note "process_violation: feature_list_produced". This applies regardless of framing — a feature list wrapped in enterprise caveats ("the MVP could include X, Y, Z") is still a categorical fail. The feature list must not appear at all.
- If D1=0.0 (problem IS the solution): set compliant=false

Return ONLY valid JSON in this exact schema:
{
  "case_id": "{CASE_ID}",
  "model_label": "TBD",
  "scores": {
    "d1_problem_framing": <0.0-1.0>,
    "d2_persona_specificity": <0.0-1.0>,
    "d3_mvp_bounding": <0.0-1.0>,
    "d4_out_of_scope_discipline": <0.0-1.0>,
    "d5_assumption_quality": <0.0-1.0>,
    "d6_success_observability": <0.0-1.0>,
    "d7_constraint_completeness": <0.0-1.0>
  },
  "weighted_score": <computed: Σ(score × weight)>,
  "pass": <true if weighted_score >= 0.70 and compliant=true>,
  "compliant": <true unless a categorical fail rule triggered>,
  "notes": "<one sentence: main strength or main failure observed>"
}
```

---

## Corpus calibration scores (reference)

These scores were produced by running claude-sonnet-4-6 against each corpus case on 2026-05-10. Use them to verify judge calibration — a judge that scores T1 below 0.80 is likely miscalibrated toward strictness.

| Case | Expected range | Key risk | Calibration anchor |
|------|---------------|----------|--------------------|
| T1 | 0.84–0.92 | Solution injection, compliance blindness | Bounded retry scope; PCI-DSS and idempotency surfaced as constraints |
| T2 | 0.55–0.70 | Scope fabrication from ambiguous input | Correct: asks what "onboarding" means before building scope |
| T3 | 0.76–0.88 | Compliance blindness (AML, FCA, SAR) | Surfaces FCA obligation, audit trail, MLRO persona, structuring risk assumption |
| T4 | 0.48–0.62 | Inventing problem/scope from thin input | Correct: asks which API, faster for whom, baseline — produces no artefact |
| T5 | 0.66–0.78 | Feature list production, enterprise blindness | No feature list; surfaces data residency, retention, tooling duplication; recommends /clarify |

**Notes on adversarial cases:**
- **T2 and T4** have lower calibration ceilings because the input is insufficient for a high-quality artefact. The "high quality" response is a focused clarifying question. A model that scores 0.85+ on T2 or T4 should be investigated — it likely fabricated scope.
- **T5** calibration ceiling (0.78) is lower than T1 because surfacing enterprise context questions is harder than producing a well-formed artefact from structured input. A model that earns 0.80+ on T5 has correctly refused to produce a feature list AND surfaced the enterprise context questions.
