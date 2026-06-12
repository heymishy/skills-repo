# ADR-001 — Eval response_type flag and rubric family selection

**Status:** Accepted  
**Date:** 2026-06-12  
**Deciders:** Hamish King  
**Source experiment:** EXP-013-clarification-protocol  

---

## Context

The eval framework uses a single rubric family (D1-D7) applied uniformly across all discovery corpus cases. D1-D7 is calibrated for artefact quality — it rewards structured output across seven dimensions (problem definition, personas, MVP scope, out-of-scope, constraints, success indicators, process compliance) and penalises their absence.

This rubric is appropriate when the correct model output IS a discovery artefact. However, the corpus contains cases where the correct model output is a different type entirely:

- **Clarification cases (T2, T4-type):** Input is so thin or ambiguous that the model cannot produce a valid artefact without first asking operator questions. The correct output is a targeted clarifying question, not a structured deliverable. Under D1-D7, this correct behaviour scores 0.0–0.4 because all artefact dimensions are absent.

- **Refusal cases (potential):** Input asks for something outside the skill's scope. The correct output is a scope refusal, not an artefact. Under D1-D7, this would also score low because artefact sections are absent.

EXP-013 confirmed the inversion empirically:

| Trial | CL1-CL4 result | D1-D7 result | Interpretation |
|-------|---------------|--------------|----------------|
| T2-ModelA-trial-1 | WS=0.95 PASS (asked correctly) | avg ~0.55 FAIL (no artefact) | D1-D7 fails the correct response |
| T2-ModelA-trial-2 | WS=0.00 FAIL (full artefact produced) | recorded as passing (artefact present) | D1-D7 passes the wrong response |

The result: a model that correctly asks before artefacting scores worse under D1-D7 than a model that fabricates scope from a thin input. D1-D7 is not just uninformative for clarification cases — it is inverted: higher scores indicate worse protocol behaviour.

EXP-013 also revealed a secondary D1-D7 limitation: the NC (non-compliant) categorical fail trigger was pattern-matching against specific heading strings (`## STAGE 1`, `## PHASE 1`). Models using custom formats (`STAGE 1: Context Setup`, `PHASE 1 — Problem Decomposition`) escaped the trigger. A model that produced a 7-phase structured pipeline on a T4 input without asking a single question was recorded as "0 NC" under D1-D7. This was corrected in the EVAL.md update (`d17b41e`), but the underlying issue — that D1-D7 tries to detect clarification violations post-hoc rather than via a dedicated rubric family — remains architecturally fragile.

---

## Decision

All eval corpus cases must declare a `response_type` field in their corpus case metadata. The `response_type` determines which rubric family the judge applies.

### response_type values

| Value | Correct model output | Rubric family | Current cases |
|-------|---------------------|---------------|---------------|
| `artefact` | A structured discovery artefact with all required sections | D1-D7 | T1, T3, S-series |
| `clarification` | A targeted clarifying question before any artefact section | CL1-CL4 | T2, T4 |
| `conditional` | Either artefact or clarification depending on enterprise context present | D1-D7 + CL1-CL4 (both applied) | T5 |

### Rubric family responsibilities

**D1-D7:** Applied only to `artefact` and `conditional` cases. Scores artefact structural completeness, constraint accuracy, scope precision, success indicator quality, and process compliance. D1-D7 applied to a `clarification` case produces an inverted signal and must not be used as the primary score.

**CL1-CL4:** Applied only to `clarification` and `conditional` cases. Scores gate compliance (did the model ask before artefacting?), question specificity, gap diagnosis accuracy, and protocol discipline. CL1-CL4 applied to an `artefact` case would penalise correctly compliant artefact production.

### Corpus case metadata field

Add `response_type: artefact | clarification | conditional` to each corpus case file's frontmatter or header metadata block, adjacent to `case_id` and `expected_verdict`:

```markdown
<!-- case metadata
case_id: T2
response_type: clarification
expected_verdict: clarification-required
-->
```

### Script and judge behaviour

When `run-model-sweep.js` reads a corpus case with `response_type: clarification`, it must:
1. Use the CL1-CL4 judge prompt (not D1-D7) as the primary score
2. Still record D1-D7 output as a secondary reference (retained for cross-experiment comparability)
3. Set `compliant` based on CL1-CL4 result, not D1-D7
4. Log `rubric_family: "CL1-CL4"` in the result JSON

When `response_type: artefact` (default), behaviour is unchanged.

When `response_type: conditional`, both rubric families are applied; the primary score uses whichever family matches the actual model output (artefact → D1-D7, clarification → CL1-CL4).

---

## Consequences

### Positive

- Removes the D1-D7 inversion problem for T2/T4-class cases — correct clarification behaviour will now score correctly
- Prevents future experiments from producing misleading signals on clarification-type corpus cases
- Makes it possible to add new thin-input or refusal cases to any skill's corpus without contaminating the artefact-quality scorecard
- Forces explicit declaration of expected output type when authoring a new corpus case — surfaces assumptions rather than letting them default to "produce artefact"

### Negative

- New corpus cases require the `response_type` field — authors must know the field exists and set it correctly
- `conditional` cases require a two-rubric judging pass and result aggregation logic that is more complex to implement
- CL1-CL4 is currently a manually-applied rubric (judge prompt in EXP-013 manifest) — it must be integrated into `run-model-sweep.js` before `response_type: clarification` can be used in automated sweeps

### Open items

- Integrate CL1-CL4 rubric into `run-model-sweep.js` (EVAL.md update required for discovery; analogous rubrics may need to be defined for other skills with thin-input edge cases)
- Backfill `response_type` metadata on T1–T5 discovery corpus cases
- Define `response_type` field in the corpus case authoring template (`.github/templates/` or skill-specific EVAL.md documentation)
- EXP-018 (post-fix Sonnet validation on T2/T4): when this runs, the `response_type: clarification` flag should be used so CL1-CL4 is the primary judge

---

## Alternatives considered

**A — Apply CL1-CL4 manually per experiment (status quo)**
Risk: every new experiment on thin-input cases must rediscover the rubric, re-implement it manually, and document why D1-D7 scores are inverted. The EXP-013 inversion finding was labelled as "generalizable" in the manifest — it will be rediscovered by the next person adding a T2/T4-style case unless codified here.

**B — Add a separate D8 dimension to D1-D7 for clarification gate**
Attempted (D8 categorical fail was added to EVAL.md). This only detects gate violations post-hoc via pattern matching — it does not positively reward correct clarification behaviour or score question quality. It does not solve the core inversion issue.

**C — Remove T2/T4 from the corpus entirely**
Removes the measurement gap, but also removes the ability to track whether SKILL.md improvements to the clarification gate are working. The clarification gate affects production behavior on every ambiguous discovery input; corpus coverage is needed.
