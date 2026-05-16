# AQ Judge Prompt — EXP-008 Artefact Quality Scoring

## What this file is

This is the operator runbook and prompt template for producing AQ (Artefact Quality) scores in EXP-008. AQ is a secondary metric alongside CPF. CPF measures whether regulated constraints propagated through the pipeline. AQ measures whether the artefacts produced are executable by a coding agent without rework.

**Scoring posture:** Model-first, human-override. The judge proposes all five dimension scores with one-sentence justifications. The operator confirms or overrides. Override rate across runs is itself a signal — see the calibration note at the end of this file.

---

## When to run

After a pipeline run has completed all five stages (/discovery → /definition → /review → /test-plan → /definition-of-ready). One judge call per story per config. Do not run before /definition-of-ready produces a signed DoR contract.

---

## Input artefacts

Inject the following four artefact sets as context before sending the prompt. Paste or attach each into the judge session in order.

| # | Artefact | Source path | What to include |
|---|----------|-------------|-----------------|
| 1 | **Discovery** | `artefacts/[feature-slug]/discovery.md` | Full discovery artefact including personas, success indicators, constraints, and assumptions sections |
| 2 | **Definition — stories** | `artefacts/[feature-slug]/stories/[story-slug].md` | The specific story being evaluated. If the run included sibling stories that set shared constraints, include those too. |
| 3 | **Test plan** | `artefacts/[feature-slug]/test-plans/[story-slug]-test-plan.md` | The full test plan produced for this story during the run |
| 4 | **DoR artefacts** | `artefacts/[feature-slug]/dor/[story-slug]-dor.md` and `[story-slug]-dor-contract.md` | Both the DoR sign-off document and the DoR scope contract |

**Token budget:** Typical artefact set is 8,000–15,000 tokens. Open a fresh judge session per run — do not reuse a session that has prior run artefacts in context.

**Model:** claude-sonnet-4-6 (locked for EXP-008 — do not substitute).

---

## Prompt template

_Copy the block below exactly. Replace `[STORY_ID]` and `[CONFIG]` (e.g. `S2`, `Config A`). Do not modify the rubric or output format instructions._

---

```
You are a delivery quality assessor evaluating artefacts produced by a software delivery pipeline for a regulated financial services context (New Zealand banking and financial services — applicable regulatory regimes include RBNZ, FMA, Privacy Act 2020, PCI DSS, and AML/CFT Act where relevant to the scenario).

I have provided the complete pipeline output for [STORY_ID] — [CONFIG]:
- Discovery artefact
- Definition story/stories
- Test plan
- DoR sign-off and contract

Score the five AQ dimensions below. For each dimension provide:
1. A score of 0, 1, or 2 using the rubric exactly — do not interpolate fractional scores
2. One sentence of justification citing specific observable artefact content (name the section or AC or NFR you are referencing)

---

RUBRIC

1. Problem framing (0–2)
Score 2: Discovery explicitly names a regulatory gap AND a competitive or business gap. Personas are named with scoped roles (not "users" or "customers"). Success indicators include at least one specific, measurable condition (a threshold, a date, a count, or a named standard met).
Score 1: One element is missing or weak — gap framing present but one-sided (regulatory only or business only); personas named but roles not scoped; or success indicators directional ("faster", "more compliant") without a measurable condition.
Score 0: Discovery reads as a solution description ("we will build X") rather than a problem framing. Gap not articulated. OR: a single regulatory constraint is restated as a delivery task with no business context.

2. Scope discipline (0–2)
Score 2: MVP scope is explicitly bounded in the discovery or definition. At least two items are explicitly named as out-of-scope or deferred to a later phase. Story count is proportionate to the stated MVP scope (no stories that obviously belong to a different feature or future phase).
Score 1: MVP scope stated but exclusions are implicit or inferred rather than explicitly named. Or: one story is clearly out-of-scope for the stated MVP but is labelled as in-scope without justification.
Score 0: No MVP boundary stated. OR: scope creep present — stories include future-phase work without explicit labelling, or the story set is significantly larger than the discovery MVP warrants.

3. Story testability (0–2)
Score 2: All ACs across all stories in the run have unambiguous pass/fail conditions. No AC requires human judgement to verify. Each AC could be verified by a coding agent or automated test without clarification from the operator.
Score 1: Most ACs are testable but one or more contains vague language ("should be clear", "appropriate", "where applicable", "user-friendly", "adequate") that requires interpretation to verify.
Score 0: Multiple ACs cannot be verified without human review. OR: ACs are stated as design constraints or system properties rather than observable testable conditions.

4. NFR specificity (0–2)
Score 2: All NFRs in the test plan name a specific threshold, standard, or measurable condition. Examples of acceptable specificity: "P95 latency < 500ms under 100 concurrent users", "CCCFA s.9C audit trail must include decision timestamp and model version", "PCI DSS Req 3.5.1 at-rest encryption confirmed via Terraform plan output". No NFR reads as a generic statement alone.
Score 1: Most NFRs are specific but one or more is generic — a regulated constraint appears as a label reference only ("must comply with CCCFA", "must be PCI compliant") without naming the specific clause, obligation, or measurable verification condition.
Score 0: NFRs are predominantly generic. Regulated constraints appear in the NFR section as label references only, with no specific obligations, no named clauses, and no measurable verification conditions.

5. DoR gate quality (0–2)
Score 2: DoR contract gates all regulated constraints named in the discovery (minimum: C1 and C2 where present). Each gate has a named responsible party and a specific sign-off condition (not "compliance confirmed" but "FMA responsible lending sign-off obtained from [role] before go-live"). At least one adversarial case — a failure mode, an edge case, or a regulatory breach scenario — is covered in the test plan, not just the happy path.
Score 1: DoR contract gates most regulated constraints but one is absent or stated vaguely ("compliance confirmed" without specifying which obligation or responsible party). OR: adversarial cases are absent from the test plan.
Score 0: DoR contract does not gate the primary regulated constraint identified in the discovery. OR: all gates are stated as general quality checks ("reviewed", "tested", "approved") rather than specific regulatory conditions with named responsible parties.

---

OUTPUT FORMAT — use this structure exactly, no additions:

## AQ Score — [STORY_ID] — [CONFIG]

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Problem framing | [0/1/2] | [One sentence citing specific artefact content] |
| Scope discipline | [0/1/2] | [One sentence citing specific artefact content] |
| Story testability | [0/1/2] | [One sentence citing specific artefact content] |
| NFR specificity | [0/1/2] | [One sentence citing specific artefact content] |
| DoR gate quality | [0/1/2] | [One sentence citing specific artefact content] |

**AQ raw: [sum]/10 = [0.0–1.0]**
**Proposed AQ: [0.0–1.0]** — pending operator review

### Scoring notes

[2–4 sentences maximum. Flag any dimension where the score was a close call between adjacent values, any dimension where the artefact content was ambiguous, or any AC/NFR/gate that you nearly scored differently. This paragraph is the primary human review target — the operator re-reads the flagged sections before confirming.]

Do not produce any other commentary. Produce the score table, then the scoring notes paragraph, then stop.
```

---

## Human review workflow

**Target review time: 3–5 minutes per run.**

1. **Read the five justifications.** One sentence each — 30 seconds maximum per justification.
2. **Read the Scoring notes paragraph.** The judge flags close calls here. If a dimension is flagged, open the artefact and re-read the specific section before confirming.
3. **Override if obviously wrong.** A score is "obviously wrong" if the justification contradicts observable artefact content, or if the cited section does not exist. Change the score and record your reason.
4. **Record the final score.** Add to the EXP-008 runs log (see Run record format below). If any score was overridden, note it in `aq_overrides`.

### What counts as an override

Override = you change the proposed score for a dimension. Partial override is acceptable (change one dimension, keep others).

Do not override because you personally would have written the artefact differently. Override only when the justification is factually wrong about what the artefact contains.

---

## Run record format

After completing CPF scoring and AQ scoring for a run, add one entry to the EXP-008 manifest Runs log section:

```yaml
- story: S2          # Story ID from corpus
  config: A          # A / B / C / D
  date: 2026-05-17
  model_discovery: claude-sonnet-4-6
  model_definition: claude-sonnet-4-6
  model_review: claude-sonnet-4-6
  model_test_plan: claude-sonnet-4-6
  model_dor: claude-sonnet-4-6
  cpf_general: 1.00   # propagated / total constraints
  cpf_regulated: 1.00 # regulated constraints only
  c5_surfaced: true
  aq: 0.80            # final AQ after any operator overrides
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 1
    story_testability: 2
    nfr_specificity: 2
    dor_gate_quality: 1
  aq_overrides: []    # list dimension names overridden, e.g. ["scope_discipline"]
  aq_override_notes: ""  # free text explaining any override
  notes: ""           # any other run notes
```

---

## Calibration signal — override rate

If you are overriding more than 2 dimensions per run consistently, the rubric needs tightening. Log that as a capture entry in `workspace/capture-log.md` with signal-type: `assumption-invalidated` and propose the rubric adjustment. The rubric should not require operator re-reading on more than one dimension per run — if it does, the scoring criteria are under-specified.

Target override rate: ≤ 1 dimension per 5 runs.

---

## AQ threshold reference (from EXP-008 manifest)

| AQ score | Assessment |
|----------|-----------|
| ≥ 0.80 | High quality — artefacts suitable for coding agent handoff without rework |
| 0.60–0.79 | Acceptable — minor rework expected before coding agent handoff |
| < 0.60 | Insufficient — significant rework required; not recommended for regulated production delivery |
