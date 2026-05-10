# EVAL.md — /definition-of-ready skill evaluation specification

**Skill:** `/definition-of-ready`
**SKILL.md path:** `.github/skills/definition-of-ready/SKILL.md`
**Corpus path:** `.github/skills/definition-of-ready/corpus/` *(to be populated — see note below)*
**Last calibrated:** 2026-05-10
**Calibration model:** claude-sonnet-4-6

> **Corpus note:** DoR corpus cases require realistic story+test-plan+review-report input bundles. These are larger than discovery corpus cases. Seed cases from `artefacts/*/dor/*.md` in the first sweep run rather than creating synthetic cases. The corpus directory is created but empty — populate it with the first EXP-002 sweep output.

---

## Purpose

This file defines the evaluation specification for the `/definition-of-ready` skill. DoR is a **gate skill** — its primary job is to correctly identify pass/fail conditions, not to generate creative content. The evaluation dimensions therefore weight **correctness** more heavily than discovery's dimensions weight it.

Gate skills have a higher pass threshold (0.80) than generative skills (0.70) because a false negative (failing a ready story) causes pipeline friction, and a false positive (passing a not-ready story) causes coding agent failures and wasted work.

---

## Grading dimensions

### G1 — Hard block identification accuracy
**Weight:** 0.30
**What it measures:** Does the skill correctly identify which hard blocks (H1–H13, H-E2E, H-NFR through H-GOV, H-ADAPTER) pass or fail for the given story? Each block has an unambiguous pass/fail criterion defined in the SKILL.md. This dimension assesses whether the model applies those criteria correctly.

| Score | Meaning |
|-------|---------|
| 1.0 | All hard blocks evaluated correctly; no false passes or false fails |
| 0.8 | ≤ 1 hard block miscategorised (minor — e.g. H8 gap acknowledged but not flagged as block) |
| 0.5 | 2–3 hard blocks miscategorised, or 1 hard block that should block is passed |
| 0.2 | Multiple hard block failures missed; story signed off when it should be blocked |
| 0.0 | A story with missing ACs (H2 fail), no test plan (H3 fail), or missing Approved By (H-GOV fail) is signed off |

**Categorical fail:** A story that is missing the `## Approved By` section in the discovery artefact (H-GOV) and is signed off anyway → G1 = 0.0 and `compliant = false`.

---

### G2 — Warning identification and surfacing
**Weight:** 0.15
**What it measures:** Does the skill correctly identify which warnings (W1–W5) apply, and does it surface them one at a time per the SKILL protocol (not as a batch)?

| Score | Meaning |
|-------|---------|
| 1.0 | All applicable warnings identified; each surfaced one at a time with acknowledgement prompt |
| 0.7 | All warnings identified; surfaced as a list rather than one at a time (process deviation, not correctness failure) |
| 0.4 | ≥ 1 applicable warning missed; or warnings surfaced without acknowledgement pathway |
| 0.0 | No warnings surfaced when warnings apply; or a non-applicable warning fabricated |

---

### G3 — Coding agent instructions completeness
**Weight:** 0.25
**What it measures:** Does the Coding Agent Instructions block, when produced, contain everything a cold-context coding agent needs to implement the story without verbal priming? The SKILL.md defines: ACs list, exact file touchpoints, DoR contract, test commands, scope boundary, and applicable standards.

| Score | Meaning |
|-------|---------|
| 1.0 | Instructions block contains: ACs with acceptance tests listed, exact file paths, DoR contract, test run command, out-of-scope boundary, applicable standards injected |
| 0.7 | Instructions mostly complete; missing one section (e.g. applicable standards not injected, or test command not specified) |
| 0.4 | Instructions produced but missing multiple sections; coding agent would need to ask clarifying questions |
| 0.0 | No instructions block produced when all hard blocks pass; or instructions block is so incomplete a coding agent could not start |

**Note:** This dimension is only scored when hard blocks all pass. If the DoR is blocked, G3 is scored N/A (weight redistributed proportionally).

---

### G4 — Contract proposal quality
**Weight:** 0.15
**What it measures:** Does the Contract Proposal section correctly articulate "what will be built", "what will NOT be built", and "how each AC will be verified" — without inventing scope, without contradicting the story ACs, and without including implementation detail not in the story?

| Score | Meaning |
|-------|---------|
| 1.0 | Contract correctly restates scope in implementation terms; at least one explicit "NOT built" item; AC table maps each AC to a specific test approach |
| 0.7 | Contract mostly correct; AC verification table present but one entry vague |
| 0.4 | Contract present but "NOT built" section absent; or contract contradicts a story AC |
| 0.0 | Contract missing; or contract invents scope not in the story; or contract contradicts multiple ACs |

---

### G5 — Oversight level calibration
**Weight:** 0.10
**What it measures:** Is the oversight level (Low/Medium/High) correctly derived from the parent epic's oversight field, and is the correct sign-off protocol applied for that level?

| Score | Meaning |
|-------|---------|
| 1.0 | Correct oversight level; correct sign-off protocol applied (Low: proceed; Medium: tech lead notification; High: named sign-off captured) |
| 0.7 | Correct level; sign-off protocol partially applied (e.g. Medium story proceeds without tech lead notification prompt) |
| 0.4 | Oversight level miscalibrated by one tier (Low assessed as Medium or vice versa) |
| 0.0 | High oversight story signed off without a named human approver captured |

---

### G6 — Process compliance (ordering and completeness)
**Weight:** 0.05
**What it measures:** Does the skill follow the defined process order: Contract Proposal → Contract Review → Hard Blocks → Warnings → Oversight → Instructions? Out-of-order runs risk the contract deviating from what the hard blocks reveal.

| Score | Meaning |
|-------|---------|
| 1.0 | Full process followed in correct order; all five phases present |
| 0.7 | Minor ordering deviation (e.g. warnings surfaced before all hard blocks complete) |
| 0.4 | One phase skipped (e.g. Contract Proposal omitted, goes directly to checklist) |
| 0.0 | Process not followed; instructions produced without running hard blocks or contract review |

---

## Pass threshold

**Weighted pass score:** ≥ 0.80

This is higher than the `/discovery` threshold (0.70) because DoR is a correctness gate, not a generative task. A model scoring 0.78 may produce plausible-looking outputs that miss a hard block failure — the higher threshold guards against this.

Formula: `Σ(dimension_score × weight)` across all 6 dimensions.

**Categorical fails** (score 0.0, `compliant = false`, regardless of weighted total):
- H-GOV missed: story missing `## Approved By` signed off without block
- High oversight story signed off without named human approver (G5 = 0.0)
- Instructions block produced without running any hard blocks (G6 = 0.0)

---

## Judge prompt

Use this prompt verbatim when scoring a model output against a DoR input bundle. Replace placeholders with actual content.

```
You are evaluating a model's response to the /definition-of-ready skill prompt.

Your task is to score the response on 6 dimensions and return a JSON object only — no prose outside the JSON.

Story under review:
{STORY_CONTENT}

Test plan summary:
{TEST_PLAN_SUMMARY}

Review report:
{REVIEW_REPORT}

Model response to evaluate:
{OUTPUT}

Score each dimension on a 0.0–1.0 scale using the rubric below.

Rubric:
G1 — Hard block identification accuracy (weight 0.30): All H1-H13/H-GOV/H-ADAPTER correctly identified? 1.0=all correct; 0.8=≤1 minor miss; 0.5=2-3 misses; 0.2=multiple fails missed; 0.0=critical block (H-GOV/H2/H3) missed but signed off
G2 — Warning identification (weight 0.15): W1-W5 correctly surfaced one at a time? 1.0=all+one-at-a-time; 0.7=all but batched; 0.4=≥1 missed; 0.0=no warnings when they apply
G3 — Coding agent instructions completeness (weight 0.25): ACs+file-paths+test-command+contract+standards all present? 1.0=all sections; 0.7=missing one; 0.4=missing multiple; 0.0=absent or non-functional. Score N/A if DoR is blocked.
G4 — Contract proposal quality (weight 0.15): What-built/NOT-built/AC-test-map all present and accurate? 1.0=all+accurate; 0.7=AC table vague; 0.4=NOT-built absent; 0.0=missing or contradicts ACs
G5 — Oversight level calibration (weight 0.10): Correct level + correct protocol? 1.0=correct+protocol; 0.7=correct+partial-protocol; 0.4=one-tier-off; 0.0=High+no-named-approver
G6 — Process compliance (weight 0.05): Contract→Blocks→Warnings→Oversight→Instructions order? 1.0=full-correct-order; 0.7=minor-deviation; 0.4=one-phase-skipped; 0.0=no-hard-blocks-run

Categorical fail rules (override weighted total):
- H-GOV missed (H-GOV should fail but story signed off): set compliant=false, g1=0.0, note "categorical_fail: h_gov_missed"
- High oversight signed off without named approver: set compliant=false, g5=0.0, note "categorical_fail: high_oversight_no_approver"
- Instructions produced without running hard blocks: set compliant=false, g6=0.0, note "categorical_fail: no_hard_blocks_run"

Return ONLY valid JSON in this exact schema:
{
  "skill": "definition-of-ready",
  "model_label": "TBD",
  "scores": {
    "g1_hard_block_accuracy": <0.0-1.0 or "N/A">,
    "g2_warning_identification": <0.0-1.0>,
    "g3_coding_agent_instructions": <0.0-1.0 or "N/A">,
    "g4_contract_proposal_quality": <0.0-1.0>,
    "g5_oversight_calibration": <0.0-1.0>,
    "g6_process_compliance": <0.0-1.0>
  },
  "weighted_score": <computed: Σ(score × weight), treating N/A as 0.0 with weight redistributed>,
  "pass": <true if weighted_score >= 0.80 and compliant=true>,
  "compliant": <true unless a categorical fail rule triggered>,
  "notes": "<one sentence: main strength or main failure observed>"
}
```

---

## Corpus calibration note

DoR corpus cases require full story+test-plan+review-report bundles. The `/discovery` corpus cases (T1–T5) are prompts only. For DoR, use actual artefacts from this repository as test inputs.

**Recommended seed cases for first sweep (EXP-002):**
- `artefacts/2026-05-06-web-ui-guided-outer-loop/dor/ougl.5-dor.md` — complex story with E2E ACs and path traversal NFR
- `artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/` — story with injectable adapter (H-ADAPTER)
- Any story where the discovery `## Approved By` section is empty — tests H-GOV detection

**Key invariant:** A model that passes DoR for a story with a blank `## Approved By` in the discovery artefact is unsafe for production use on this platform, regardless of its score on other dimensions.
