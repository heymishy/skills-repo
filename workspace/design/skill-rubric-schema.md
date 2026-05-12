# Skill Rubric Schema

**Status:** Design — not implemented
**Date:** 2026-05-12
**Author:** Session 3 design phase

---

## Purpose

A skill rubric is a machine-readable quality specification that tells the grader what to look for in a candidate artefact and how to score it. Each skill that participates in evaluation has one rubric file. The rubric is separate from EVAL.md — EVAL.md is the operator-facing specification; the rubric YAML is the grader input.

---

## Schema

```yaml
# .github/skills/<skill-name>/rubric.yml
# Skill rubric — consumed by the outcomes grader

skill: <skill-name>                  # e.g. discovery
version: "1.0"
pass_threshold: 0.70                 # minimum weighted score for a PASS verdict
judge_model: claude-sonnet-4-6      # always fixed — never the model under evaluation

dimensions:
  - id: D1
    name: problem_framing
    label: "Problem framing"
    weight: 0.20                     # weights across all dimensions must sum to 1.0
    description: >
      Does the artefact frame the problem in terms of observable outcomes and
      user impact rather than solution shape or feature list?
    scoring_anchors:
      - score: 0.0
        condition: >
          Artefact states "we will build X" or "the solution is X" without first
          characterising the problem. Solution-first framing = 0.0.
      - score: 0.5
        condition: >
          Problem named but no observable outcome or user impact described.
          Partial framing.
      - score: 1.0
        condition: >
          Problem described in terms of observable impact (time lost, error rate,
          regulatory risk) with a named user or system affected. No solution
          prescribed.
    categorical_fail: false

  - id: D2
    name: persona_specificity
    label: "Persona specificity"
    weight: 0.10
    description: >
      Are the affected users named with role, context, and stated need — not
      generic ("users", "customers")?
    scoring_anchors:
      - score: 0.0
        condition: "No personas named. Generic 'users' only."
      - score: 0.5
        condition: "Personas named by role but no context or frequency dimension."
      - score: 1.0
        condition: >
          At least two personas named with role, context, frequency or cost
          dimension, and stated need.
    categorical_fail: false

  - id: D3
    name: mvp_bounding
    label: "MVP scope bounding"
    weight: 0.20
    description: >
      Does the artefact bound the MVP to a narrow, testable hypothesis rather
      than a feature list?
    scoring_anchors:
      - score: 0.0
        condition: >
          A feature list appears in the MVP scope section. This applies regardless
          of framing (assumption caveats, square brackets, "subject to confirmation"
          language do not exempt a feature list from this categorical fail).
      - score: 0.5
        condition: >
          MVP described as a capability or outcome but still contains more than
          one deliverable item without a dependency rationale.
      - score: 1.0
        condition: >
          MVP scoped to a single, testable hypothesis or a minimal capability
          with a stated rationale for why it is the minimum.
    categorical_fail: true           # D3 = 0.0 is a categorical FAIL regardless of other scores

  - id: D4
    name: out_of_scope_discipline
    label: "Out-of-scope discipline"
    weight: 0.10
    description: >
      Does the artefact name at least three explicit out-of-scope items with a
      one-line rationale for each?
    scoring_anchors:
      - score: 0.0
        condition: "No out-of-scope section or fewer than two items."
      - score: 0.5
        condition: "Out-of-scope items listed but no rationale."
      - score: 1.0
        condition: >
          At least three out-of-scope items, each with a one-line rationale that
          refers to the MVP boundary or delivery constraint.
    categorical_fail: false

  - id: D5
    name: assumption_quality
    label: "Assumption quality"
    weight: 0.15
    description: >
      Are assumptions stated as falsifiable hypotheses with a named owner or
      validation mechanism?
    scoring_anchors:
      - score: 0.0
        condition: >
          No assumptions section, or assumptions section present but all items
          are statements of fact rather than falsifiable hypotheses.
      - score: 0.5
        condition: >
          Assumptions named as uncertainties but no validation mechanism or
          owner identified.
      - score: 1.0
        condition: >
          At least three assumptions stated as falsifiable hypotheses with a
          named validation trigger (e.g. "confirmed at definition phase",
          "operator to verify before story authoring").
    categorical_fail: false

  - id: D6
    name: success_observability
    label: "Success observability"
    weight: 0.10
    description: >
      Are success indicators specific, directional, and tied to the problem
      statement rather than vanity metrics?
    scoring_anchors:
      - score: 0.0
        condition: >
          No success indicators, or indicators are purely output-based
          ("we delivered the feature") rather than outcome-based.
      - score: 0.5
        condition: >
          Outcome indicators present but not directional (no threshold or
          direction stated).
      - score: 1.0
        condition: >
          At least two outcome indicators, each with a direction (reduce / increase /
          eliminate) and a threshold or baseline reference.
    categorical_fail: false

  - id: D7
    name: constraint_completeness
    label: "Constraint completeness"
    weight: 0.15
    description: >
      For artefacts produced in an enterprise or regulated context, does the
      discovery surface data-residency, retention policy, and regulatory
      classification as hard constraints before proceeding?
    scoring_anchors:
      - score: 0.0
        condition: >
          Artefact produced for an enterprise case without surfacing data residency
          and retention policy as hard constraints. This is a 0.0 regardless of
          other quality signals.
      - score: 0.5
        condition: >
          Data residency or retention policy mentioned as a risk or assumption but
          not flagged as a hard constraint requiring resolution before delivery.
      - score: 1.0
        condition: >
          Data residency, retention policy, and regulatory classification (e.g.
          FCA, RBNZ, APRA applicability) all explicitly surfaced as constraints
          with a stated resolution path.
    categorical_fail: true           # D7 = 0.0 on enterprise cases is a categorical FAIL

corpus_calibration:
  # Known scored examples — used for judge consistency checks
  # Format: case_id: expected_score (approximate; within ±0.10 is acceptable)
  T1: 0.72    # Payment retry — straightforward regulated case
  T2: 0.81    # Onboarding ambiguity — well-bounded MVP
  T3: 0.68    # AML monitoring — enterprise constraints required
  T4: 0.55    # Thin adversarial input — scope refusal expected
  T5: 0.49    # Deceptively complex note-taking — enterprise probe required
```

---

## Weight constraint

All dimension weights must sum to exactly 1.0. The schema validator (not yet implemented) will reject a rubric where `sum(weights) != 1.0`.

Current D1–D7 weights for `/discovery`:
```
D1: 0.20 + D2: 0.10 + D3: 0.20 + D4: 0.10 + D5: 0.15 + D6: 0.10 + D7: 0.15 = 1.00 ✓
```

---

## Categorical fail semantics

A dimension with `categorical_fail: true` means: if that dimension scores 0.0, the overall verdict is `fail` regardless of weighted score. This is enforced by the grader after computing the weighted total — the pass/fail decision is:

```
pass = (weighted_score >= pass_threshold) AND (no categorical_fail dimension scored 0.0)
```

Currently categorical fail applies to D3 (MVP bounding — feature list = fail) and D7 (constraint completeness on enterprise cases — absent data-residency/retention = fail).

---

## Rubric versioning

The `version` field is a string (not semver). When a rubric changes in a way that would invalidate prior scored runs, the version must be incremented. The scorecard records which rubric version was active at the time of scoring. This allows future `/improve` runs to detect when historical scores were produced under a different rubric and flag them as requiring re-scoring.
