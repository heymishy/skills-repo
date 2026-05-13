# Local Model Capability Tiers

**Purpose:** Defines the three tier levels used to classify local models for use in the eval programme. Tiers are determined by evaluation results — not by model parameter count or marketing claims. A model is assigned a tier only after running the relevant test cases from the discovery corpus and recording results in a local model experiment manifest (EXP-LOCAL-001 or subsequent).

---

## Tier summary

| Tier | Minimum qualification criteria | Suitable for |
|------|-------------------------------|--------------|
| L1 | Passes T2 + T4 categorical | Structured gate application only (DoR, DoD, benefit-metric) |
| L2 | T1 weighted ≥ 0.70 | DoR, DoD, benefit-metric + review + test-plan |
| L3 | T3 weighted ≥ 0.70 AND D7 ≥ 0.60 | Generative skills on non-regulated inputs (discovery, definition) |
| Untiered | Not yet evaluated | Do not use in any production pipeline run |

---

## Tier L1 — Categorical pass (structured task minimum)

### Qualification criteria

A model meets L1 if it achieves categorical PASS on BOTH:
- **T2** — structured skill application (categorical scoring — does the skill apply the template correctly?)
- **T4** — gate skill application (categorical scoring — does the gate skill correctly identify pass/fail conditions?)

T2 and T4 are the template-application and gate-application tests from the discovery corpus. They do not require reasoning depth — they require that the model follows structure and applies criteria from the SKILL.md correctly.

### What L1 is sufficient for

- `/definition-of-ready` (DoR) hard block gate application
- `/definition-of-done` (DoD) AC coverage check
- `/benefit-metric` template population
- Any skill that is primarily checklist application with binary outputs

### What L1 is NOT sufficient for

- `/discovery` — requires T1 (problem framing) capability
- `/definition` — requires T3 (story decomposition + constraint propagation) capability
- `/review` — requires reasoning about constraint completeness and scope
- `/test-plan` — requires T3-equivalent constraint propagation

---

## Tier L2 — Problem framing capable

### Qualification criteria

A model meets L2 if:
- It meets all L1 criteria, AND
- **T1 weighted score ≥ 0.70** (D1 problem framing, D2 persona specificity, D3 MVP bounding, D4 OOS discipline — weighted as per EVAL.md)

### What L2 is sufficient for

Everything L1 covers, PLUS:
- `/discovery` on well-defined, non-regulated inputs where the operator provides complete context
- `/review` where the spec is clear and the checklist categories are unambiguous
- `/test-plan` where ACs are precise and NFRs are fully specified

### What L2 is NOT sufficient for

- `/discovery` on inputs with hidden or buried constraints (T5-pattern inputs)
- `/definition` with complex constraint decomposition requirements
- Any skill where T3 depth is required (architectural decomposition, ambiguity resolution)
- Regulated-input stories (see regulated input routing below)

---

## Tier L3 — Generative depth capable

### Qualification criteria

A model meets L3 if:
- It meets all L2 criteria, AND
- **T3 weighted score ≥ 0.70**, AND
- **T3 D7 (constraint completeness) ≥ 0.60**

D7 is explicitly included in the threshold because it is the constraint propagation dimension — the one that matters most for regulated and complex inputs. A model that scores ≥ 0.70 overall on T3 but achieves D7 < 0.60 passes the general threshold but fails the constraint propagation test. Such a model is NOT L3.

### What L3 is sufficient for

Everything L1 and L2 cover, PLUS:
- `/discovery` on complex, multi-constraint inputs (non-regulated)
- `/definition` with full story decomposition
- Full pipeline routing for non-regulated stories

### What L3 is NOT sufficient for

- Regulated-input stories (see regulated input routing below)
- T5-pattern inputs with hidden constraints — only cloud Opus equivalent passes T5 reliably (EXP-001 evidence: both Sonnet and Opus scored 0.49 on T5 in Scenario 1)

---

## Regulated input routing — non-negotiable constraint

**Regardless of tier, a local model may NEVER be used as the primary model for the following input types:**

- Inputs involving AML/CFT obligations (transaction record retention, suspicious activity reporting)
- Inputs involving PCI DSS (payment card data, QSA-assessed systems)
- Inputs involving prudential banking regulation (capital requirements, operational risk obligations)
- Inputs involving data residency requirements under any applicable privacy or banking regulation

**For regulated inputs, the required model is cloud Opus or an equivalent cloud model with demonstrated T3 D7 ≥ 0.80.**

This is not a performance claim about local models — it is a governance decision. Regulated constraint propagation fidelity (CPF) is an external audit evidence item. Until EXP-003 or equivalent establishes that a specific local model achieves CPF ≥ 0.80 on regulated constraints, that model may not be used for regulated inputs. Even then, a measurement_backed routing policy update is required before production use — see `proposals/routing-policy-framework.md`.

---

## Tier assignment process

1. Run the model through the standard discovery corpus (T1–T5) using the local model eval manifest template
2. Score each case using the standard EVAL.md scoring rubric
3. Assign tier based on criteria above
4. Record in the model registry (see below)
5. Tier assignment is valid for 6 months or until a major version change to either the model or the EVAL.md — whichever comes first

---

## Model registry format

Add entries to `workspace/experiments/local-model-scaffolding/model-registry.md` after evaluation:

```markdown
| Model ID | Tier | T1 | T2 | T3 | T3 D7 | T4 | T5 | Experiment | Evaluated | Notes |
|----------|------|----|----|----|----|----|----|------------|-----------|-------|
| local-llama3-8b | L2 | 0.74 | PASS | 0.63 | 0.55 | PASS | FAIL | EXP-LOCAL-001 | 2026-05-xx | T3 D7 < 0.60 — not L3 |
```

---

## Why tiers are defined by eval results, not model size

Parameter count and benchmark scores do not predict EVAL.md performance on the skills platform corpus. Two reasons:

1. The EVAL.md dimensions (D1–D7) are specific to this pipeline's artefact quality standards — they are not standard NLP benchmarks
2. The corpus cases (T1–T5) are specific to the pipeline's domain (regulated software delivery) — general coding or instruction-following benchmarks are not predictive

A 7B model fine-tuned for structured document output may outperform a 70B general model on T2 and T4. A 14B model with strong constraint reasoning may match Sonnet on T3 for non-regulated inputs. Tier assignment must be evidence-backed.
