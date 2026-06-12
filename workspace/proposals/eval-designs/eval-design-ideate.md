# Proposed EVAL.md — /ideate skill
**Skill:** `/ideate`
**Status:** NOT STARTED — no EVAL.md, no corpus
**Purpose:** This document proposes the evaluation design for the first sweep. The /ideate skill requires a bespoke comparative evaluation rubric — standard artefact-quality dimensions (D1-D7 from /discovery) do not apply because ideation output is comparative and generative, not fact-checkable against a fixed standard.
**Generated:** 2026-06-12

---

## 1. Pipeline context

**Upstream input:** Any of: raw problem statement (blank slate), partially-formed discovery artefact, reference materials, or pipeline state with existing artefacts. /ideate has no entry condition — it is safe to run at any stage.
**What this skill does:** Produces structured opportunity maps (Lens A), assumption inventories (Lens B), market scan research questions (Lens C), product strategy assessments (Lens D), or JTBD job stories (Lens E). The output feeds /discovery, /benefit-metric, or /definition. In the pipeline, /ideate most commonly runs before /discovery (blank slate) or alongside approved discovery (assumption validation).
**Downstream consumer:** /discovery (as enriched context), /benefit-metric (market sizing signals), /definition (scope validation). Ideation artefacts are inputs to, not outputs of, the formal pipeline.
**What constitutes complete valid output:** A structured artefact conforming to `.github/templates/ideation.md`, containing at least one completed lens output with lens-specific components (e.g., Lens A requires an opportunity tree with desired outcome, opportunity clusters, and at least one prioritised opportunity; Lens B requires an assumption inventory with type classification and risk/knowness ratings; Lens D requires answers to all 10 Cagan questions and a PROCEED/REDESIGN/DEFER recommendation).

---

## 2. Structural gate checklist

Binary pre-score checks. If any fail, the run is non-compliant.

- [ ] **At least one lens is completed** — the output must contain a lens section (A–E) with all required sub-components for that lens. A partial lens output (stopping after E1 without E2/E3/E4) fails this gate.
- [ ] **Assumption card markers present for all named assumptions** (Lens B or any lens that names assumptions explicitly) — each assumption must have a machine-readable `---ASSUMPTION-JSON:` marker in the format defined in SKILL.md (ADR-018). If assumptions are named without markers, this gate fails.
- [ ] **Output is grounded in provided input** — the output must reference context from the provided input (scenario description, artefacts loaded). A generic ideation output that ignores the specific scenario details fails this gate.
- [ ] **PROCEED/REDESIGN/DEFER recommendation present** (Lens D only) — if Lens D is run, the output must include a recommendation and rationale. Missing this gate fails.

---

## 3. Scoring dimensions

**Design note:** /ideate evaluation uses comparative judging, not absolute rubric scoring. Each corpus case includes a "better" and "worse" reference output designed by a human expert. The judge assesses whether the model output is closer to the better or worse reference on each dimension. This is because ideation quality is inherently comparative: a weak opportunity map (generic, unsupported) vs. a strong one (scenario-specific, evidence-grounded, actionable) is the signal — not whether a specific fact was captured.

### I1 — Constraint inheritance and scenario groundedness
**Weight:** 0.25
**What it measures:** Does the ideation output incorporate the specific regulatory, technical, and business constraints present in the scenario? A generic opportunity map that could apply to any banking product has not inherited the scenario's constraints. This dimension tests whether the model uses the input context to shape the ideation output — not whether it surfaces facts (that is /discovery's job), but whether constraints visible in the input are reflected in the opportunity framing, assumption classification, or strategy assessment.

| Score | Meaning |
|-------|---------|
| 1.0 | Scenario-specific constraints appear in the relevant lens output: regulatory constraints shape assumption risk ratings (Lens B), constraint-bounded opportunities are marked in the opportunity tree (Lens A), Lens D Q9 names the specific regulatory risk factors from the scenario |
| 0.7 | Constraints present but generic — names a constraint category ("regulatory risk") without the specific constraint from the scenario |
| 0.4 | Constraint omitted from lens output; output could apply to a different scenario in the same domain |
| 0.0 | Output is entirely generic; no scenario-specific constraint appears anywhere |

**Corpus anchors:**
- S2 (Lending origination) Lens B → 1.0: CCCFA reasonable inquiry obligation appears as a Viability assumption ("assumption that automated transaction analysis satisfies CCCFA s.9C inquiry obligation") with risk=high and knowness=unknown-unknown; FMA demographic disparity disclosure appears as an Ethical assumption with risk=high
- S9 (KiwiSaver) Lens D → 1.0: Q9 (critical risk factors) names FMA SEN 30-day notification period and hardship fee waiver statutory obligation specifically
- Any scenario Lens A → 0.4: opportunity map lists "regulatory compliance" as an opportunity without naming the specific regulation

---

### I2 — Opportunity or assumption originality (lens A/B)
**Weight:** 0.25
**What it measures:** Does the opportunity map (Lens A) or assumption inventory (Lens B) surface non-obvious insights beyond what an operator would list themselves? Generic outputs (opportunities: "reduce friction", "improve UX"; assumptions: "customers will use the product") have no signal value. The highest-quality outputs surface insights the operator likely did not have — an opportunity the existing system creates that could be exploited, an assumption buried in the business model, a job story that reframes the competitive landscape.

| Score | Meaning |
|-------|---------|
| 1.0 | At least one non-obvious insight: an opportunity not mentioned in the input; an assumption the operator would not have listed; a competitive reframe in Lens E |
| 0.7 | All opportunities/assumptions are plausible and relevant; none are generic; no clearly non-obvious insight but solid coverage |
| 0.4 | Mostly generic opportunities/assumptions; matches the input's explicit framing without adding new dimension |
| 0.0 | Entirely generic output; each opportunity or assumption is restated from the input with no synthesis |

**Note:** This dimension is scored by comparative reference. The "worse" reference for each case deliberately includes only generic opportunities. The "better" reference includes one or two specific, non-obvious insights surfaced from the scenario context.

---

### I3 — Assumption risk calibration (lens B)
**Weight:** 0.20
**What it measures:** Are assumptions correctly classified by type (desirability/viability/feasibility/ethical) and risk level? This dimension is not applied to Lenses A, C, D, or E directly — it applies whenever assumptions are named, including in Lens D (Q9) and Lens E (E3 anxiety/habit forces). Miscalibrated risk ratings (marking a statutory obligation violation as "low risk") are a concrete failure mode.

| Score | Meaning |
|-------|---------|
| 1.0 | All assumption types correctly classified; risk ratings reflect the actual consequence if wrong (a statutory obligation assumption rated high; a pricing preference assumption rated low); knowness distinction (known-unknown vs unknown-unknown) applied correctly |
| 0.7 | Types correctly classified; one risk rating miscalibrated (statutory risk marked medium instead of high) |
| 0.4 | Types present but one structural misclassification (a viability assumption filed as feasibility); risk ratings roughly directional but not calibrated |
| 0.0 | No type classification; or risk ratings systematically miscalibrated (all marked medium regardless of actual risk) |

**Corpus anchors:**
- S2 Lens B → 1.0: the CCCFA s.9C assumption is classified as `viability` (the business model depends on legal clarity) and `risk=high` (a finding that automated analysis fails the inquiry test would block the entire product); `knowness=unknown-unknown` (team does not know what they do not know about the FMA's position)
- S12 Lens B → 1.0: the MRM policy version assumption is classified as `feasibility` (the delivery timeline depends on the policy version being the old one) and `risk=high`; `knowness=known-unknown` (team knows there is a governance process but does not know the current version applies)

---

### I4 — Lens D completeness and recommendation quality (lens D only)
**Weight:** 0.15
**What it measures:** When Lens D is run, does the output answer all 10 Cagan questions with scenario-specific reasoning, and does the final PROCEED/REDESIGN/DEFER recommendation reflect the signal balance? This dimension applies only when Lens D is evaluated. For other lenses, weight redistributes proportionally.

| Score | Meaning |
|-------|---------|
| 1.0 | All 10 questions answered with scenario-specific content; recommendation is consistent with the signal balance (e.g., REDESIGN when regulatory risk is unresolved); rationale names the specific evidence |
| 0.7 | All 10 answered; one question has a generic answer ("strong differentiation" without naming the specific advantage); recommendation consistent |
| 0.4 | 2–3 questions answered generically; or recommendation inconsistent with signal balance (PROCEED when regulatory risk is unresolved) |
| 0.0 | Fewer than 8 questions answered; or no recommendation produced |

---

### I5 — Output structure and machine-readability compliance
**Weight:** 0.15
**What it measures:** Does the output conform to the SKILL.md structural requirements? Specifically: assumption card markers (ADR-018) are present and correctly formatted for all named assumptions; the output conforms to the lens-specific structure (opportunity tree format, assumption table, 10-question format); the PROCEED/REDESIGN/DEFER recommendation block is present if Lens D was run.

| Score | Meaning |
|-------|---------|
| 1.0 | All structural requirements met: assumption markers present+parseable for every named assumption; lens-specific format followed; state update fields present |
| 0.7 | Assumption markers present but one is malformed (wrong field name, missing comma) — parseable with error tolerance |
| 0.4 | Assumptions named in prose but markers absent for ≥1 assumption; ADR-018 compliance fails |
| 0.0 | No assumption markers at all despite assumptions being named; or lens structure not followed |

---

## 4. Pass threshold

**Weighted pass score:** ≥ 0.70

Justification: /ideate is a generative skill (not a gate skill). The 0.70 threshold matches /discovery. The lower threshold versus gate skills (0.80) reflects that a partial ideation output still has value — a good opportunity map is useful even if one assumption marker is malformed. The structural gate checklist catches the worst failures before scoring.

**response_type flag:** `/ideate` can produce:
- `artefact` — a complete lens output (most runs)
- `clarification` — when the input is insufficient to run the requested lens (e.g., "run Lens D" with no product context at all, making Q1 impossible to answer)
- `hybrid` — partial lens output + targeted question to complete missing context

**Clarification trigger conditions:** A model should produce `clarification` when: (1) Lens D is requested with no product context and no discovery/benefit-metric artefacts loaded; (2) Lens A is requested but no desired outcome can be inferred from the input (no discovery artefact and no metrics); (3) Lens E is requested but no customer or product type is specified. A model that attempts to run a lens with insufficient context and produces a generic output should be penalised under I1 (constraint groundedness = 0.0), not given credit for "trying."

---

## 5. Loop 1 corpus design

**Cases:** Use S2 and S9 as first two corpus cases.
- **IDE-S2** (Lens B): Input is the S2 scenario brief (lending origination). Evaluate whether the assumption inventory correctly classifies and risk-rates the CCCFA, FMA, and demographic disparity constraints.
- **IDE-S9** (Lens D): Input is the S9 scenario brief (KiwiSaver). Evaluate whether the strategy assessment names the FMA SEN 30-day period as a critical risk and produces REDESIGN or PROCEED-WITH-CAVEAT rather than unconditional PROCEED.
- **IDE-S7** (Lens A): Input is the S7 scenario brief (event registration). This is the low-regulation calibration case — output should be a clean opportunity map without fabricated regulatory risk clusters.
- **IDE-S12** (Lens B): Input is the S12 scenario brief (AI credit model). Evaluate whether the assumption inventory surfaces the MRM policy version gap as a high-risk unknown.

**Golden output direction:** Each case should have a human-authored "better" and "worse" reference. The "better" reference demonstrates scenario-specific constraint inheritance and non-obvious insight. The "worse" reference is generic.

---

## 6. Loop 2 corpus design

**Purpose:** Test gap surfacing and clarification discipline.
- **IDE-THIN**: Input is a single-sentence idea ("we should build a savings goal feature") with no context. Evaluate whether the model correctly issues a `clarification` response (asking for target user, desired outcome, and platform context) before attempting Lens A.
- **IDE-CONFLICT**: Input contains a directly contradictory assumption ("we can guarantee same-day onboarding" — impossible given a stated 3-day identity verification process). Evaluate whether Lens B surfaces the contradiction as a high-risk assumption rather than accepting both statements.

---

## 7. Comparative judging design

Unlike /discovery and /definition where the judge compares against a ground-truth corpus anchor, /ideate judging uses a reference pair:

- **Reference A** (better): Human-authored output demonstrating scenario-specific constraint inheritance, non-obvious insight, and correct assumption risk calibration.
- **Reference B** (worse): Generic output with correct structure but no scenario-specific content.

The judge prompt for /ideate includes both references and asks: "Is the model output (a) closer to Reference A, (b) between A and B, or (c) closer to Reference B?" Each dimension is then scored on this comparative scale rather than an absolute 0.0–1.0 rubric. This prevents the judge from rewarding generic-but-well-structured output.
