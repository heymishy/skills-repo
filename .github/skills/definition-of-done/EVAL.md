# EVAL.md — /definition-of-done skill evaluation specification

**Skill:** `/definition-of-done`
**SKILL.md path:** `.github/skills/definition-of-done/SKILL.md`
**Corpus path:** `.github/skills/definition-of-done/corpus/`
**Last calibrated:** 2026-05-15
**Calibration model:** claude-sonnet-4-6

---

## Purpose

This file defines the evaluation specification for the `/definition-of-done` skill. DoD is a **gate skill** — its primary job is to correctly determine whether a merged PR satisfies the story's ACs, did not implement out-of-scope items, addresses all NFRs, and records metric signal. Like DoR, it is a correctness gate: a false positive (signing off a story as COMPLETE when an AC was not evidenced) is a governance failure.

Gate skills pass at a higher threshold (0.80) than generative skills (0.70). The most dangerous failure mode is a false positive: calling a story COMPLETE when at least one AC has no evidence in the PR.

---

## Grading dimensions

### D1 — AC coverage accuracy
**Weight:** 0.30
**What it measures:** Does the model correctly assess each AC as satisfied (✅), partially satisfied (⚠️), or not satisfied (❌)? An AC is only satisfied if the PR description, test names, or observable behaviour provides direct evidence. Absence of evidence is not evidence of absence — if the PR description says nothing about an AC, the model must flag it as unverified, not assumed-passing.

| Score | Meaning |
|-------|---------|
| 1.0 | Every AC correctly assessed; no AC marked ✅ without evidence; all gaps explicitly named |
| 0.8 | ≤1 AC over-assessed (marked ✅ with thin evidence where a ⚠️ would be more appropriate); no outright false positive |
| 0.5 | 1 AC marked ✅ with no supporting evidence; or 2+ ACs under-assessed (gaps missed) |
| 0.2 | Multiple ACs marked ✅ with no evidence; significant coverage gaps missed |
| 0.0 | An AC with zero evidence in the PR description is marked ✅ and the story is called COMPLETE |

**Categorical fail:** An AC with zero evidence in the PR description (nothing in PR body, no test name, no observable behaviour cited) is marked as satisfied AND the final verdict is COMPLETE or COMPLETE WITH DEVIATIONS (not INCOMPLETE). D1 = 0.0 and `compliant = false`.

---

### D2 — Deviation detection
**Weight:** 0.20
**What it measures:** Does the model correctly surface (a) out-of-scope implementations and (b) test plan gaps? Both are deviations — things that differ from what the story specified. Out-of-scope additions and missing test coverage must be explicitly named.

| Score | Meaning |
|-------|---------|
| 1.0 | All out-of-scope deviations named with the specific feature/behaviour; all test gaps surfaced |
| 0.7 | Out-of-scope item noted but not linked to the story's specific out-of-scope section; or test gap surfaced but without the specific test name |
| 0.4 | Out-of-scope deviation missed; or test gap present in test plan but not surfaced by model |
| 0.0 | Out-of-scope implementation in the PR not mentioned; test coverage gap that creates AC risk not surfaced |

---

### D3 — NFR verification quality
**Weight:** 0.20
**What it measures:** Does the model correctly check each NFR defined in the story or NFR profile, and correctly assess whether evidence exists? An NFR is only verified if the PR description or test output explicitly shows the requirement was tested or confirmed. Absence of evidence must be flagged, not assumed compliant.

| Score | Meaning |
|-------|---------|
| 1.0 | All NFRs checked; each correctly assessed (evidenced → verified; no evidence → gap flagged); compliance NFRs named |
| 0.7 | All NFRs assessed but one gap accepted without prompting operator for evidence |
| 0.4 | NFR section run but one compliance-linked NFR missed or assumed compliant without evidence |
| 0.0 | NFR section skipped; or a compliance NFR (named regulatory clause) has no evidence and model calls it verified anyway |

**Note:** If the story has no NFRs defined and none in the NFR profile, D3 = 1.0 (model correctly confirms not applicable). D3 is scored N/A only when the corpus case explicitly marks "no NFRs" — the model must still confirm this.

---

### D4 — Metric signal recording
**Weight:** 0.15
**What it measures:** Does the model correctly assess metric signal for metrics whose `contributingStories` includes this story? If a metric is defined, the model must ask for (or confirm) the signal value and record it. If no metric applies, the model must confirm this. Silent omission (no mention of metrics at all when one applies) is a gap.

| Score | Meaning |
|-------|---------|
| 1.0 | For each applicable metric: signal status assessed (on-track / at-risk / off-track / not-yet-measured), evidence stated, lastMeasured confirmed; or correctly confirms no applicable metric |
| 0.7 | Metric assessed but signal status not categorised per the defined enum; or evidence vague |
| 0.4 | Metric exists and contributes to this story but model omits the metric signal step entirely |
| 0.0 | Applicable metric completely ignored; or incorrect signal (on-track) asserted without evidence |

**Note:** For corpus cases with no applicable metric, the model should confirm "no applicable metric" — D4 = 1.0 for that case if confirmed; 0.7 if the step is skipped silently.

---

### D5 — Completion verdict accuracy
**Weight:** 0.10
**What it measures:** Is the final verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) correct, and is it justified by the evidence in the assessment? A correct verdict on an adversarial case requires both the right classification AND the specific gap named.

| Score | Meaning |
|-------|---------|
| 1.0 | Correct verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) with the specific gap or confirmation explicitly named |
| 0.7 | Correct verdict but gap described vaguely without naming the specific AC, NFR, or scope deviation |
| 0.4 | Verdict is one tier off (e.g. INCOMPLETE when COMPLETE WITH DEVIATIONS was correct) |
| 0.0 | Verdict is wrong (COMPLETE for a case where evidence is missing or scope deviation occurred) |

---

### D6 — Process compliance
**Weight:** 0.05
**What it measures:** Does the model follow the DoD process order: AC coverage → out-of-scope check → test plan coverage → NFR check → metric signal → verdict? Out-of-order processing risks ACs being assessed without full context.

| Score | Meaning |
|-------|---------|
| 1.0 | Full process followed in defined order; all steps present |
| 0.7 | Minor deviation (e.g. NFR check before test plan coverage) |
| 0.4 | One phase skipped (e.g. out-of-scope check omitted) |
| 0.0 | Verdict produced without running AC coverage check; or AC check and verdict merged into a single step with no discrete out-of-scope or NFR review |

---

## Pass threshold

**Weighted pass score:** ≥ 0.80

Formula: `Σ(dimension_score × weight)` across all 6 dimensions, treating N/A as excluded from denominator (weight redistributed proportionally).

**Categorical fails** (score 0.0, `compliant = false`, regardless of weighted total):
- AC with zero evidence marked satisfied AND verdict is COMPLETE or COMPLETE WITH DEVIATIONS (not INCOMPLETE) → D1 = 0.0, `compliant = false`, `categorical_fail: "ac_false_positive"`
- NFR with named regulatory clause (PCI DSS, AML/CFT, GDPR, etc.) and no evidence → called verified → D3 = 0.0, `compliant = false`, `categorical_fail: "compliance_nfr_false_positive"`

---

## Gate fidelity (GF) — primary metric

$$GF = \frac{\text{correct verdicts}}{4 \text{ cases}}$$

A correct verdict for DoD requires:
1. Correct COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE outcome
2. For T1 (INCOMPLETE): the specific unverified AC must be explicitly named
3. For T2 (COMPLETE WITH DEVIATIONS — scope creep): the specific out-of-scope feature must be explicitly named
4. For T3 (COMPLETE WITH DEVIATIONS — NFR gap): the specific NFR and its regulatory clause must be named
5. For T4 (COMPLETE): COMPLETE verdict with no false deviations added

**GF threshold:** 1.00 (all 4 cases) for any model to be recommended for production gate use.

---

## Judge prompt

Use this prompt verbatim when scoring a model output against a DoD input bundle. Replace placeholders with actual content.

```
You are evaluating a model's response to the /definition-of-done skill prompt.

Your task is to score the response on 6 dimensions and return a JSON object only — no prose outside the JSON.

Story under review:
{STORY_CONTENT}

Test plan summary:
{TEST_PLAN_SUMMARY}

PR description / merge summary:
{PR_DESCRIPTION}

Model response to evaluate:
{OUTPUT}

Score each dimension on a 0.0–1.0 scale using the rubric below.

Rubric:
D1 — AC coverage accuracy (weight 0.30): Each AC correctly assessed with evidence cited? 1.0=all correct; 0.8=one over-assessed with thin evidence; 0.5=one false positive AC; 0.2=multiple false positives; 0.0=AC with no PR evidence marked satisfied AND verdict is COMPLETE/COMPLETE-WITH-DEVIATIONS
D2 — Deviation detection (weight 0.20): Out-of-scope items and test gaps named? 1.0=all named specifically; 0.7=noted but vague; 0.4=deviation missed; 0.0=clear out-of-scope item in PR not mentioned
D3 — NFR verification (weight 0.20): NFRs correctly assessed with evidence? 1.0=all checked correctly; 0.7=assessed without prompting for evidence; 0.4=compliance NFR missed; 0.0=compliance NFR assumed verified without evidence. Score N/A if corpus case explicitly has no NFRs.
D4 — Metric signal recording (weight 0.15): Applicable metric assessed and recorded? 1.0=correct signal+evidence; 0.7=assessed but enum value vague; 0.4=metric step omitted; 0.0=metric ignored or incorrect on-track without evidence. If no applicable metric: 1.0 if confirmed, 0.7 if skipped silently.
D5 — Completion verdict accuracy (weight 0.10): Correct COMPLETE/COMPLETE-WITH-DEVIATIONS/INCOMPLETE with gap named? 1.0=correct+specific; 0.7=correct+vague; 0.4=one tier off; 0.0=wrong verdict
D6 — Process compliance (weight 0.05): AC→out-of-scope→tests→NFR→metric→verdict order? 1.0=full correct order; 0.7=minor deviation; 0.4=phase skipped; 0.0=verdict without AC check

Categorical fail rules (override weighted total):
- AC with no PR evidence marked satisfied AND verdict not INCOMPLETE: set compliant=false, d1=0.0, categorical_fail="ac_false_positive"
- Compliance NFR (named regulatory clause) assumed verified without evidence: set compliant=false, d3=0.0, categorical_fail="compliance_nfr_false_positive"

gate_fidelity_correct rules (evaluate against corpus case metadata):
- T1: correct = verdict INCOMPLETE AND the specific performance SLA AC explicitly named as unverified
- T2: correct = deviation recorded AND "avatar upload" or equivalent scope-creep feature explicitly named
- T3: correct = deviation recorded AND PCI DSS / log scrubbing NFR specifically named as unverified
- T4: correct = verdict COMPLETE AND no false deviations added

Return ONLY valid JSON in this exact schema:
{
  "skill": "definition-of-done",
  "model_label": "TBD",
  "case_id": "<T1|T2|T3|T4>",
  "scores": {
    "d1_ac_coverage_accuracy": <0.0-1.0>,
    "d2_deviation_detection": <0.0-1.0>,
    "d3_nfr_verification": <0.0-1.0 or "N/A">,
    "d4_metric_signal": <0.0-1.0>,
    "d5_completion_verdict": <0.0-1.0>,
    "d6_process_compliance": <0.0-1.0>
  },
  "weighted_score": <computed: Σ(score × weight), treating N/A as excluded with weight redistributed proportionally>,
  "pass": <true if weighted_score >= 0.80 and compliant=true>,
  "compliant": <true unless a categorical fail rule triggered>,
  "gate_fidelity_correct": <true if verdict is correct AND specific gap/confirmation named per rules above>,
  "categorical_fail": <null or string describing the fail>,
  "notes": "<one sentence: main strength or main failure observed>"
}
```
