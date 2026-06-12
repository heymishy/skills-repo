# EXP-013 — Clarification Protocol Investigation (T2/T4/T5 Focused)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-013-clarification-protocol |
| experiment_type | clarification-protocol-investigation |
| created | 2026-06-12 |
| operator | Hamish King |
| status | complete |
| prerequisite_experiments | EXP-010-fable5-model-sweep (source of the T2 clarification signal) |

## Background and motivation

EXP-010 Section 7 and Section 10 identified a secondary signal: Fable 5 avoids NON-COMPLIANT on T2 ("improve the onboarding experience") where both Sonnet 4.6 and Opus 4.6 receive a categorical NON-COMPLIANT. Fable 5 asks a clarifying question before producing a discovery artefact — the protocol-correct behaviour for ambiguous inputs.

The standard D1-D7 judge cannot measure this signal cleanly. When a model correctly asks a clarifying question (producing no artefact), D1-D7 scores it low on D2 (no named personas), D3 (no MVP), D4 (no out-of-scope items), etc. The rubric penalises correct behaviour and rewards the wrong one (fabricate scope and produce a complete artefact). The EXP-010 Sonnet T2 scores of 0.000 NC reflect a genuine process violation — but Fable 5's 0.636 reflects a correctly-behaving model scored on dimensions that do not apply to a clarification response.

EXP-013 designs a targeted experiment to:
1. Test whether Fable 5's T2 clarification behaviour is consistent — EXP-010 had only 2 trials
2. Test whether the same signal holds on T4 ("Make the API faster") and T5 (deceptively scoped)
3. Use a clarification-focused judge (CL1-CL4 rubric) that rewards correct clarification behaviour
4. Produce a clean comparative signal on Fable 5 vs Sonnet 4.6 for the clarification protocol dimension

## Hypothesis

**H1 — Fable 5 shows consistent clarification-first discipline on T2**

Fable 5's T2 NON-COMPLIANT avoidance from EXP-010 (2/2 compliant vs Sonnet 0/2) is a reliable signal. On the CL1-CL4 rubric, Fable 5 scores CL-compliant on ≥ 4/6 T2 trials and scores meaningfully higher than Sonnet 4.6 on CL1 (gate compliance).

**H2 — The clarification signal generalises to T4 and T5**

Fable 5 also shows superior clarification discipline on T4 (ultra-thin adversarial input: "Make the API faster") and T5 (deceptively complete input with competing enterprise constraints).

**H3 — Fable 5 clarifying questions are diagnostically specific**

When Fable 5 asks, it names specific concrete gaps — not generic "please elaborate" — scoring CL2 ≥ 0.70 on T2 and T4 averaged across trials.

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic generation; manual CL judging) |
| trigger | EXP-010 Section 10 recommendation #1 |
| skills_swept | discovery |
| models_compared | claude-fable-5, claude-sonnet-4-6 |
| trials_per_cell | 3 |
| judge_model_d17 | claude-sonnet-4-6 (D1-D7 reference via script) |
| judge_model_cl | claude-sonnet-4-6 (CL1-CL4 primary via manual judge) |
| corpus_cases | T2, T4, T5 |

Total cells: 3 cases × 2 models × 3 trials = **18 generation runs + 18 D1-D7 reference judge calls + 18 CL1-CL4 manual judge calls**

---

## Why a custom judge (CL1-CL4)?

The D1-D7 judge is calibrated for artefact quality — it rewards a structured discovery artefact and penalises its absence. This is correct when the model has sufficient input (T1, T3, S-series). For T2/T4/T5, where the correct behaviour is to ask rather than artefact, D1-D7 is systematically inverted: the best possible response (focused clarifying question) scores the lowest, and the worst response (fabricated scope artefact) scores the highest.

CL1-CL4 inverts this: it rewards asking before artefacting and penalises fabrication. The D1-D7 scorecard produced by the script is retained as a secondary reference point but is NOT the primary analysis for this experiment.

---

## CL1-CL4 Clarification Judge Rubric

### Grading dimensions

**CL1 — Gate compliance (weight 0.40)**

Did the model ask at least one question before producing any discovery artefact section?

| Score | Meaning |
|-------|---------|
| 1.0 | Model asks ≥1 question BEFORE any artefact section heading appears (`## Problem`, `## Personas`, `## MVP`, `## Assumptions`, `## Out-of-Scope`, `## Constraints`, `## Success`, `## Overview`, `Discovery artefact:`) |
| 0.5 | Model asks only a generic question ("Can you tell me more?", "Please elaborate") with no specific gap named; OR produces brief non-structured framing prose before asking |
| 0.0 | Any artefact section heading appears before or without a question |

**Categorical override:** If response contains any of `## Problem`, `## Personas`, `## MVP`, `## Assumptions`, `## Out-of-Scope`, `## Constraints`, `## Success`, `## Overview`, or `Discovery artefact:` — set CL1 = 0.0 regardless of whether a question also appears.

*T5 variant:* CL1 = 1.0 if model explicitly declines to produce a feature list AND names enterprise context questions it needs answered first. CL1 = 0.0 if any feature enumeration appears (e.g., "the MVP could include rich text editor, tagging, search...").

---

**CL2 — Question specificity (weight 0.30)**

Does the question name specific, concrete missing elements? (Score 0.0 if CL1 = 0.0)

Case-specific specifics the question should reference:
- **T2** ("improve onboarding"): which step in onboarding is broken, what "improve" means quantitatively, which persona experiences the pain, what the current pain point or metric is, what the timeline is
- **T4** ("make the API faster"): which API, what "faster" means (latency? throughput? error rate?), who experiences the slowness, what the current baseline is
- **T5** (note-taking app): whether teams already have a notes solution (tooling duplication), data residency/retention constraints for a regulated 500+ employee firm, whether enterprise approval is required

| Score | Meaning |
|-------|---------|
| 1.0 | Question names ≥2 specific elements from the case-appropriate list above |
| 0.5 | Question names 1 specific element from the case-appropriate list |
| 0.0 | Entirely generic ("can you tell me more?", "please elaborate", "what are your goals?") with no specific element named; OR CL1 = 0.0 |

---

**CL3 — Gap diagnosis accuracy (weight 0.20)**

Does the question accurately diagnose the primary blocker — the gap that makes it impossible to produce a valid artefact?

Primary blockers by case:
- **T2:** Vagueness of "improve" combined with undefined scope of "onboarding" — no problem, pain point, or measure is given
- **T4:** Zero scoping information — no system named, no performance metric, no affected party
- **T5:** Deceptive completeness — the stated scope sounds reasonable but is missing enterprise constraints that make producing it dangerous (tooling duplication, data governance for a regulated firm)

| Score | Meaning |
|-------|---------|
| 1.0 | Question correctly diagnoses the primary blocker for this case |
| 0.5 | Question identifies a real gap but misses the primary one (e.g., T2: asks about timeline but not about which step or what "improve" means) |
| 0.0 | Question asks about something already specified in the input; asks irrelevant questions; or CL1 = 0.0 |

---

**CL4 — Protocol discipline (weight 0.10)**

Does the model exhibit clean protocol discipline — no hedging artefacts, no proceeding-with-assumptions?

| Score | Meaning |
|-------|---------|
| 1.0 | Response is purely question(s); no artefact output, no "I'll assume X and proceed", no partial problem/scope sections |
| 0.5 | Minor contextual framing before the question (1-2 sentences explaining why it's asking) without any artefact section headers |
| 0.0 | Model explicitly offers to proceed with assumptions ("Let me draft this assuming X..."); OR asks a question then also produces an artefact; OR says "I don't need more info" and proceeds |

---

### Pass threshold

**CL-compliant:** CL1×0.40 + CL2×0.30 + CL3×0.20 + CL4×0.10 ≥ 0.70

### Categorical fail

CL-COMPLIANT = false (regardless of weighted score) if:
- Response produces any artefact section heading without asking a question first (CL1 = 0.0 override applies)
- T5 specifically: response produces any feature list for the note-taking app

---

### CL1-CL4 Judge Prompt

Use this prompt verbatim to score a model output for EXP-013. Replace `{OUTPUT}` with the raw model response and `{CASE_ID}` with T2, T4, or T5. Judge model: `claude-sonnet-4-6` in an independent session from the generation session.

```
You are evaluating a model's response to an ambiguous or thin /discovery skill prompt (corpus case {CASE_ID}).

Unlike the standard D1-D7 artefact-quality rubric, this CL1-CL4 rubric measures clarification protocol behaviour: whether the model asks appropriately specific questions before producing scope, rather than fabricating a discovery artefact from insufficient input. The correct behaviour is to ask before artefacting — NOT to produce artefact content.

Corpus case context:
- T2: Input was exactly "We need to improve the onboarding experience for enterprise customers." (Nothing else was provided.)
- T4: Input was exactly "Make the API faster." (Nothing else was provided.)
- T5: Input was "We should build a note-taking app so our teams can capture meeting notes and decisions in one place." (Operator is from a regulated financial services firm with 500+ employees.)

Model response to evaluate:
{OUTPUT}

Score each dimension using the rubric below. Return ONLY valid JSON in the schema at the end.

CL1 — Gate compliance (weight 0.40):
1.0 = model asks ≥1 question BEFORE any artefact section heading (## Problem, ## Personas, ## MVP, ## Assumptions, ## Out-of-Scope, ## Constraints, ## Success, ## Overview, Discovery artefact:)
0.5 = generic question only with no specific gap named ("can you tell me more?"); OR brief non-structured framing before asking
0.0 = any artefact section heading appears before or without a question

CATEGORICAL: if response contains "## Problem", "## Personas", "## MVP", "## Assumptions", "## Out-of-Scope", "## Constraints", "## Success", "## Overview", or "Discovery artefact:" → set CL1 = 0.0 regardless of whether a question also appears.

T5 variant: CL1 = 1.0 if model explicitly declines to produce a feature list AND names enterprise context questions. CL1 = 0.0 if ANY feature enumeration appears (e.g. "the MVP could include rich text editor, tagging, search").

CL2 — Question specificity (weight 0.30):
Case-specific specific elements to look for:
- T2: which step is broken / what "improve" means quantitatively / which persona / current metric / timeline
- T4: which API / what "faster" means (latency vs throughput) / who experiences slowness / current baseline
- T5: whether teams already have a notes solution / data residency or retention constraints for a regulated firm / enterprise approval process
1.0 = names ≥2 specific elements from the case-appropriate list
0.5 = names 1 specific element
0.0 = entirely generic ("can you tell me more?"); or CL1 = 0.0

CL3 — Gap diagnosis accuracy (weight 0.20):
Primary blockers: T2 = vagueness of "improve" + undefined scope of "onboarding process"; T4 = zero scoping info (no system, no metric, no party); T5 = deceptive completeness (enterprise constraints entirely missing from a superficially reasonable request)
1.0 = correctly identifies the primary blocker
0.5 = identifies a real gap but not the primary one
0.0 = asks about something already specified in the input; or CL1 = 0.0

CL4 — Protocol discipline (weight 0.10):
1.0 = purely question(s); no artefact output, no "I'll assume X and proceed"
0.5 = brief framing prose (1-2 sentences) before question; no artefact section headers
0.0 = offers to proceed with assumptions; produces artefact after asking; or "I don't need more info"

Categorical fail: compliant = false if CL1 = 0.0 (artefact produced before asking); or for T5, if any feature enumeration appears.

Return ONLY valid JSON:
{
  "case_id": "{CASE_ID}",
  "model_label": "TBD",
  "scores": {
    "cl1_gate_compliance": <0.0-1.0>,
    "cl2_question_specificity": <0.0-1.0>,
    "cl3_gap_diagnosis_accuracy": <0.0-1.0>,
    "cl4_protocol_discipline": <0.0-1.0>
  },
  "weighted_score": <CL1×0.40 + CL2×0.30 + CL3×0.20 + CL4×0.10>,
  "pass": <true if weighted_score >= 0.70 AND compliant = true>,
  "compliant": <true unless categorical fail triggered>,
  "notes": "<one sentence: main strength or main failure>"
}
```

---

## Token and cost estimate

*Assumes ~900 input / ~600 output tokens per generation run (T2/T4/T5 short prompts).*
*D1-D7 judge: ~3100 input (rubric + output) / ~289 output per call.*
*CL1-CL4 judge: similar token counts — same rubric scale as D1-D7.*

| Component | Model | Runs | Est. cost |
|-----------|-------|------|-----------|
| Generation: claude-fable-5 | 9 runs | ~$0.153 |
| Generation: claude-sonnet-4-6 | 9 runs | ~$0.030 |
| D1-D7 judge (claude-sonnet-4-6) × 18 | ~$0.262 |
| CL1-CL4 judge (claude-sonnet-4-6) × 18 | ~$0.262 |
| **Total** | | | **~$0.71** |

*Cost ceiling: $10 USD. Well within ceiling.*

---

## Run commands

### Phase 1 — Generation + D1-D7 reference scoring

```powershell
# Dry run first
node scripts/run-model-sweep.js --experiment EXP-013-clarification-protocol --skills discovery --models claude-fable-5,claude-sonnet-4-6 --cases T2,T4,T5 --trials 3 --dry-run

# Live run (requires ANTHROPIC_API_KEY)
! ANTHROPIC_API_KEY="sk-ant-..." node scripts/run-model-sweep.js --experiment EXP-013-clarification-protocol --skills discovery --models claude-fable-5,claude-sonnet-4-6 --cases T2,T4,T5 --trials 3
```

The script produces:
- `workspace/experiments/EXP-013-clarification-protocol/runs/` — 18 run .md files (model outputs)
- `workspace/experiments/EXP-013-clarification-protocol/results/` — 18 D1-D7 result .json files
- `workspace/experiments/EXP-013-clarification-protocol/scorecard.md` — D1-D7 scorecard (reference only; see note below)

**Note on D1-D7 scores:** D1-D7 systematically underrate any model that correctly asks before artefacting. Fable 5's T2 D1-D7 scores will be low (0.60-0.65 range per EXP-010) because the rubric scores an absent artefact. Sonnet's T2 scores will be 0.000 NC. These D1-D7 results are NOT the primary analysis — they are retained to confirm EXP-010 results replicate at 3 trials.

### Phase 2 — CL1-CL4 manual judging (primary analysis)

For each of the 18 run .md files from Phase 1, run the CL1-CL4 judge prompt above against `claude-sonnet-4-6` in an independent session. Substitute the model output from the run file and the appropriate CASE_ID.

Record CL1-CL4 JSON results in:
`workspace/experiments/EXP-013-clarification-protocol/results/cl-{case_id}-model-{A|B}-trial-{N}.json`

Then populate `workspace/experiments/EXP-013-clarification-protocol/clarification-scorecard.md` with the aggregated CL1-CL4 scores.

**Blind scoring requirement:** The judge session must not see model labels. In the CL1-CL4 judge prompt, set `"model_label": "TBD"` and pass the 6 outputs for a given case as "Model A" and "Model B" — do not reveal which is Fable 5 and which is Sonnet 4.6. The judge may have learned priors about which model asks better (Fable 5 is publicly known to have stronger clarification behaviour in some contexts); labelled scoring would bias CL2 and CL3 toward the expected winner. Reveal labels only when aggregating scores after all 18 outputs are judged.

**Session structure:** Run all 6 outputs for a given case (3 × Model A + 3 × Model B) interleaved in a single judge session per case — this reduces inter-session variance. Three sessions total (one per case: T2, T4, T5). Record which label (A or B) maps to which model per session; apply after scoring is complete.

### Phase 3 — T2/T4 conversation mode (optional, secondary signal)

The corpus includes multi-turn conversation specs for T2 and T4 (`T2-conversation.json`, `T4-conversation.json`). These test the end-to-end two-turn quality: does the model ask well on turn 1, and produce a high-quality artefact on turn 2 after receiving specific context?

```powershell
# T2 conversation — both models
! ANTHROPIC_API_KEY="sk-ant-..." node scripts/run-model-sweep.js --conversation .github/skills/discovery/corpus/T2-conversation.json --models claude-fable-5,claude-sonnet-4-6 --experiment EXP-013-clarification-protocol

# T4 conversation — both models
! ANTHROPIC_API_KEY="sk-ant-..." node scripts/run-model-sweep.js --conversation .github/skills/discovery/corpus/T4-conversation.json --models claude-fable-5,claude-sonnet-4-6 --experiment EXP-013-clarification-protocol
```

Phase 3 is conditional on Phase 2 producing a clear signal. If H1/H2 both fail in Phase 2, Phase 3 is not needed. If H1/H2 pass, Phase 3 adds the two-turn quality dimension.

---

## Matrix definition

| Skill | Corpus cases | Models | Trials | Mode |
|-------|-------------|--------|--------|------|
| discovery | T2, T4, T5 | claude-fable-5, claude-sonnet-4-6 | 3 | single-turn (Phase 1+2) |
| discovery | T2, T4 | claude-fable-5, claude-sonnet-4-6 | 1 | conversation (Phase 3, conditional) |

---

## Scorecard summary

### D1-D7 reference (script output — secondary analysis)

| Model | T2 avg | T4 avg | T5 avg | NC count |
|-------|--------|--------|--------|----------|
| claude-fable-5 | 0.552 | 0.483 | 0.748 | 0 (narrow NC trigger) |
| claude-sonnet-4-6 | 0.080 | 0.000 | 0.726 | 0 (T4: false negatives — custom format escaped heading match) |

*Note: D1-D7 NC trigger was too narrow — custom STAGE/PHASE formats escaped detection. See Section 5 of clarification-scorecard.md. EVAL.md was updated in commit `d17b41e` to catch these.*

### CL1-CL4 scores (primary analysis)

| Model | T2 CL avg | T4 CL avg | T5 CL avg | CL-compliant count |
|-------|-----------|-----------|-----------|-------------------|
| claude-fable-5 | 0.317 | 0.317 | 0.817 | 5/9 |
| claude-sonnet-4-6 | 0.000 | 0.000 | 0.817 | 3/9 |

### Per-dimension comparison (CL1-CL4 across all T2+T4+T5 trials)

| Dimension | Weight | Fable 5 avg | Sonnet 4.6 avg | Delta |
|-----------|--------|-------------|----------------|-------|
| CL1 gate compliance | 0.40 | 0.444 | 0.222 | +0.222 |
| CL2 question specificity | 0.30 | 0.556 | 0.333 | +0.222 |
| CL3 gap diagnosis accuracy | 0.20 | 0.556 | 0.333 | +0.222 |
| CL4 protocol discipline | 0.10 | 0.278 | 0.167 | +0.111 |
| **Weighted CL avg** | | **0.483** | **0.272** | **+0.211** |

---

## Pass criteria and routing implications

**H1 passes** if Fable 5 is CL-compliant on ≥ 4/6 T2 trials (CL1 > 0.0 on ≥ 4/6 T2 outputs)

**H2 passes** if Fable 5 CL-compliant count > Sonnet 4.6 CL-compliant count on both T4 and T5

**H3 passes** if Fable 5 CL2 avg ≥ 0.70 on T2 and T4 averaged across 3 trials

> **H3 is the hypothesis to watch most closely.** H1 and H2 are essentially binary — "does the model ask at all before artefacting?" — and are likely to confirm given EXP-010. A model that asks generically ("Can you tell me more?") scores CL1 = 0.5 and avoids NON-COMPLIANT, but CL2 = 0.0 means its clarification behaviour is not production-ready regardless. H3 distinguishes between "asks" and "asks well" — it is the harder and more operationally meaningful test.

### Routing implications

**All three pass:** Fable 5's clarification behaviour is consistent and diagnostically specific. Begin SKILL.md investigation for Sonnet 4.6 — the aim is to teach Sonnet to replicate Fable 5's clarification discipline via instruction changes (see Branch 4 below). Separately consider whether Fable 5 should be preferred for vague/thin input routing paths despite the cost premium — but defer that decision until Branch 4 is tested.

**H1/H2 pass, H3 fails:** Fable 5 asks, but the question quality is insufficient. Neither model is production-ready on clarification protocol. Priority action: update SKILL.md to enforce more explicit clarification protocol (require named gap identification before artefacting) and re-run EXP-013 against the updated skill before any model selection decision.

**H1/H2 fail:** Fable 5's EXP-010 T2 behaviour was 2-trial variance. Signal does not replicate. No routing action. SKILL.md clarification protocol improvement remains the correct lever — model selection is not the solution.

**Branch 4 — If H1/H2/H3 all pass (SKILL.md update loop):** Update `.github/skills/discovery/SKILL.md` to enforce Fable 5-style clarification behaviour on Sonnet 4.6: add an explicit instruction requiring the model to name a specific missing element (step, metric, persona, timeline) in any clarifying question before producing artefact content, and add a categorical instruction that T2/T4-pattern inputs (no problem statement, no persona, no timeline) must never produce artefact sections without a clarification turn first. Then re-run EXP-013 against Sonnet 4.6 only (3 trials, T2/T4/T5, CL1-CL4 judge) against the updated SKILL.md. If Sonnet 4.6 post-SKILL.md matches Fable 5's CL scores, the clarification protocol is solved via instruction rather than model selection. This closes the loop: Fable 5 as behaviour reference, Sonnet as production target, SKILL.md as the lever.

---

## Findings

### All three hypotheses failed

H1 (Fable 5 CL-compliant ≥ 4/6 T2 trials): **FAIL** — 1/6 T2 outputs with CL1 > 0.0. Fable 5's EXP-010 T2 advantage was 2-trial variance, not a reliable model signal.

H2 (Fable 5 CL-compliant > Sonnet on both T4 and T5): **FAIL** — T4: Fable 5 leads (1/3 vs 0/3), but T5 is tied (3/3 each). Both conditions required; T5 tie breaks the hypothesis.

H3 (Fable 5 CL2 avg ≥ 0.70 on T2+T4): **FAIL** — Fable 5 CL2 avg = 0.333 on both T2 and T4.

Per manifest routing: "Fable 5's EXP-010 T2 behaviour was 2-trial variance. Signal does not replicate. No routing action. SKILL.md clarification protocol improvement remains the correct lever — model selection is not the solution."

### T5 is structurally different from T2/T4

Both models score 3/3 compliant on T5 (enterprise context recognition pattern), WS avg 0.817. The deceptive completeness pattern — recognising that a superficially reasonable spec is missing critical enterprise constraints — is handled well by both models without instruction. T5 is not a clarification problem; it is a constraint-elicitation problem, and both models handle it.

T2/T4 failure is different: these inputs contain zero problem context (no system, no metric, no persona). The default model behaviour is to fabricate scope from the vague hint and produce a complete artefact. This is the behaviour the clarification gate must prevent.

### Root cause: default artefact instinct dominates

Sonnet 4.6: 0/6 T2+T4 compliant. No trial asked a clarifying question before producing artefact sections. The discovery framework instinct is absolute — the model interprets its role as "produce a discovery artefact" and does so regardless of how thin the input is. The only trials where any model asked first were Fable 5 trial-1 on T2 and trial-1 on T4 (both CL1=1.0, WS=0.95) and Fable 5 T5 trials (CL1=0.5–1.0). The successful Fable 5 trials show the model range is there; the 2/3 failure rate on T2/T4 shows it is not stable across temperature variation.

### Applied fix — SKILL.md hard clarification gate

**Status: Applied (commit `d17b41e`, 2026-06-12 20:22).** No post-fix validation sweep has been run.

SKILL.md `## Clarification gate` section added with an explicit hard prohibition: the model **must not** produce staged pipelines, artefact sections, hypothesis lists, constraint taxonomies, stakeholder maps, or solution directions before asking at least one operator question on any ambiguous/thin input. The prohibition applies in both interactive mode and eval mode. The specific T4 failure mode (questions present but accompanied by a "hypotheses to test" list) is named explicitly as a prohibited variant.

EVAL.md D8 categorical fail rule was also broadened: NC trigger now catches custom STAGE/PHASE formats (not just standard heading strings) — fixes the false-negative NC detection from EXP-013 Phase 1.

### Open gap — post-fix validation sweep not run

The SKILL.md fix has not been validated with a re-run against T2/T4. Sonnet 4.6 had 0/6 T2+T4 compliance before the fix — we do not know whether the instruction change closes this gap. A targeted 9-cell sweep (Sonnet 4.6 × T2/T4/T5 × 3 trials, CL1-CL4 judge) would confirm or refute the fix effectiveness. This is scoped as **EXP-018** if validation is needed before the clarification gate is fully trusted in production.

## Generalizable finding — D1-D7 inversion on clarification-type cases

This experiment surfaces a structural limitation of the D1-D7 artefact-quality rubric: it is designed for cases where the correct output IS a discovery artefact, and it systematically misjudges cases where the correct output is a clarifying question. The higher the quality of the clarifying behaviour, the lower the D1-D7 score — because every dimension penalises the absence of artefact sections.

This is not a T2/T4/T5-specific limitation. It applies to any corpus case where the right model behaviour is to not produce artefact content. The broader implication for EVAL.md architecture: evaluation files need a `response_type` flag that switches the rubric family based on expected output type (`artefact` vs `clarification` vs `refusal`). Cases with `response_type: clarification` should use the CL1-CL4 rubric (or equivalent); D1-D7 should not be applied.

Recommend capturing this as a future architecture decision record (ADR) for the eval framework. A candidate location: `.github/skills/discovery/EVAL-architecture-notes.md` or a new `workspace/decisions/` directory.

## Deviations from template

- **CL1-CL4 judge not in EVAL.md**: The standard EVAL.md D1-D7 judge is retained for reference scoring via the script. The primary CL1-CL4 analysis uses the judge prompt documented in this manifest, run manually. No script changes required.
- **No batch mode**: 18 generation runs at short prompts (T2/T4/T5) do not benefit from batch overhead. Live mode.
- **trials_per_cell = 3**: Template default. Higher than EXP-010's 2 trials to reduce variance on the 3-case corpus.
- **S-series excluded**: Only T-series clarification protocol cases. S-series are well-scoped inputs where artefact production is correct behaviour and the clarification rubric does not apply.
- **Conversation mode conditional**: Phase 3 is optional — run only if Phase 2 confirms the signal is worth deeper investigation.
