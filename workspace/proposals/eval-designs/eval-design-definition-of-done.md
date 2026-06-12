# Proposed EVAL.md — /definition-of-done skill
**Skill:** `/definition-of-done`
**Status:** PARTIAL — EVAL.md and corpus exist but no calibration sweep has run
**Purpose:** This document proposes the evaluation design for the first calibration sweep. It does not modify the existing EVAL.md.
**Generated:** 2026-06-12

---

## 1. Pipeline context

**Upstream input:** A merged or review-ready PR, a story artefact (with ACs, NFRs, out-of-scope), and an optional test plan.
**What this skill does:** Determines whether the PR satisfies each AC, stayed within the story's scope, addressed all NFRs, and recorded metric signal. Produces a COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE verdict.
**Downstream consumer:** The pipeline progresses to the next story only on COMPLETE or COMPLETE WITH DEVIATIONS. INCOMPLETE blocks further work.
**What constitutes complete valid output:** A structured verdict covering every AC (✅ / ⚠️ / ❌), deviation list, NFR verification, and final verdict with justification. The output must quote or reference specific PR evidence — not summarise.

---

## 2. Structural gate checklist

Binary pre-score checks. If any fail, the run is non-compliant and scoring is aborted.

- [ ] **Output contains a per-AC verdict** — every AC in the story is addressed individually (✅, ⚠️, or ❌). An output that produces a global assessment without addressing each AC fails this gate.
- [ ] **Final verdict is one of: COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE** — any other verdict label fails this gate.
- [ ] **INCOMPLETE verdict when any AC is ❌** — if any AC is marked not satisfied, the verdict must be INCOMPLETE. A COMPLETE verdict with one or more ❌ ACs is a categorical fail.
- [ ] **No AC marked ✅ without cited evidence** — each ✅ AC must name the PR element (description text, test name, commit message excerpt) that satisfies it. A ✅ with no citation fails this gate.

---

## 3. Scoring dimensions

### D1 — AC coverage accuracy
**Weight:** 0.35
**What it measures:** Does the model correctly assess each AC as satisfied (✅), partially satisfied (⚠️), or not satisfied (❌)? This dimension is the primary correctness check. A false positive (marking ✅ with no evidence) is a pipeline integrity failure. An AC is only satisfied if the PR description, test names, or observable behaviour provides direct evidence.

| Score | Meaning |
|-------|---------|
| 1.0 | Every AC correctly assessed; no AC marked ✅ without evidence; all gaps explicitly named with the specific element that is missing |
| 0.7 | ≤1 AC over-assessed (marked ✅ with thin evidence where ⚠️ would be correct); no outright false positive |
| 0.4 | 1 AC marked ✅ with no supporting evidence (false positive), but verdict is INCOMPLETE reflecting the other gaps |
| 0.0 | An AC with zero evidence in the PR is marked ✅ AND the final verdict is COMPLETE or COMPLETE WITH DEVIATIONS |

**Categorical fail:** A ✅ on an AC with zero PR evidence AND final verdict not INCOMPLETE → D1 = 0.0 and `compliant = false`.

**Corpus anchors:**
- T4 (genuinely complete story) → 1.0: all ACs correctly marked ✅ with cited PR evidence; no fabricated gaps
- T1 (webhook SLA AC gap) → 0.0 if model marks the SLA AC ✅ without any latency measurement cited in PR; verdict must be INCOMPLETE
- T3 (API key NFR gap) → 0.7 if the API key rotation AC is marked ✅ with thin evidence ("PR description mentions API key handling") but rotation cycle is not confirmed

**Constraint inheritance check:** For scenarios where the story carries a regulated constraint (e.g., PCI DSS QSA sign-off from the discovery artefact), the DoD must verify the AC evidence relates to the specific regulated element. A QSA sign-off AC marked ✅ with "PR description says 'compliance requirements addressed'" is a false positive — the citation must name the QSA sign-off specifically.

---

### D2 — Deviation detection
**Weight:** 0.20
**What it measures:** Does the model correctly surface (a) out-of-scope implementations and (b) test plan gaps? Both are deviations from the story specification.

| Score | Meaning |
|-------|---------|
| 1.0 | All planted out-of-scope implementations named with the specific feature/behaviour and reference to the story's out-of-scope section; all test gaps surfaced with the specific test name that is missing |
| 0.7 | Out-of-scope item noted but not linked to the story's specific out-of-scope section; or test gap surfaced but without citing the specific missing test name |
| 0.4 | Out-of-scope deviation missed; or test gap present in test plan but not raised by the model |
| 0.0 | Planted out-of-scope implementation present in PR but not mentioned; verdict is COMPLETE despite the deviation |

---

### D3 — NFR verification quality
**Weight:** 0.20
**What it measures:** Are non-functional requirements from the story verified against PR evidence? NFRs include performance targets, security requirements, data residency, and compliance constraints. This dimension specifically targets the constraint inheritance chain: regulated constraints from the discovery artefact that appeared as NFRs in the story must be verified, not assumed.

| Score | Meaning |
|-------|---------|
| 1.0 | All story NFRs addressed; each confirmed with PR evidence or explicitly flagged as unverifiable from PR description; regulated NFRs (compliance constraints) given explicit pass/fail verdicts |
| 0.7 | All NFRs addressed; one regulated NFR given a vague "appears to comply" verdict without citing specific evidence |
| 0.4 | One NFR section assessed as a group ("NFRs appear satisfied") without individual verification |
| 0.0 | NFR section not assessed; or a regulated NFR (e.g., PCI DSS data retention, AML audit trail) is marked as satisfied with no evidence |

---

### D4 — Verdict correctness and calibration
**Weight:** 0.15
**What it measures:** Is the final verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) correct given the AC and deviation assessment? This dimension catches verdict miscalibration — correct individual AC findings leading to a wrong overall verdict.

| Score | Meaning |
|-------|---------|
| 1.0 | Verdict matches the AC/deviation findings: COMPLETE if all ACs ✅ and no deviations; COMPLETE WITH DEVIATIONS if all ACs ✅ but deviations noted; INCOMPLETE if any AC is ❌ |
| 0.7 | COMPLETE WITH DEVIATIONS issued when INCOMPLETE would be more appropriate (e.g., AC is ⚠️ but deviations are significant) |
| 0.4 | COMPLETE issued when significant ⚠️ ACs exist and deviations are present — over-lenient verdict |
| 0.0 | COMPLETE issued when one or more ACs are ❌; or INCOMPLETE issued for a genuinely complete story (T4) |

---

### D5 — Evidence specificity
**Weight:** 0.10
**What it measures:** Does the output quote or name the specific PR element for each finding? The SKILL.md requires line-level citations — not paraphrases or summaries. This dimension tests instruction-following fidelity and output actionability.

| Score | Meaning |
|-------|---------|
| 1.0 | All AC assessments cite specific PR elements (quoted text, test name, commit reference); gaps name the specific element missing |
| 0.7 | Most findings specific; one AC assessment uses a general reference ("PR addresses this") without quoting |
| 0.4 | Findings are correct in verdict but generic in evidence — no specific quotes; references are "PR description covers this area" |
| 0.0 | No evidence citations at all; AC assessments are pure inference with no PR element referenced |

---

## 4. Pass threshold

**Weighted pass score:** ≥ 0.80 (provisional — see calibration caveat below)

Formula: `Σ(dimension_score × weight)` across all scored dimensions.

Justification: DoD is a gate skill — its false positive failure mode (calling COMPLETE when an AC was not evidenced) propagates as pipeline corruption. A 0.80 threshold matches the existing DoR threshold and the /definition threshold for regulated inputs. Any run where D1 = 0.0 (categorical fail) is non-compliant regardless of weighted score.

**Calibration caveat:** The 0.80 threshold has not been validated against the existing corpus. EXP-015 will provide the first empirical data. Before EXP-016 runs, check the T4 (genuinely complete story) mean score across all trials and models. If T4 mean < 0.80, the threshold must recalibrate to `floor(T4_mean - 0.03)` — a threshold set above the clean-case mean means no run can ever pass, which invalidates all subsequent sweeps. The threshold must not be raised above T4 mean regardless of gate-skill arguments. Record the calibration decision and adjusted threshold in the EXP-015 scorecard before proceeding.

**response_type flag:** DoD produces a structured verdict artefact only. Response type is always `artefact`. Clarification is not a valid response for DoD — if the PR description is ambiguous, the model must mark the AC as ⚠️ (unverifiable) rather than requesting clarification. If the PR is wholly absent or the story has no ACs, the structural gate will catch this before scoring.

---

## 5. Judge prompt (proposed)

Replace `{STORY}` with the story artefact, `{PR}` with the PR description bundle, `{PLANTED_DEFECT}` with the defect description, and `{CASE_ID}` with the corpus case identifier.

```
You are evaluating a model's response to the /definition-of-done skill prompt against corpus case {CASE_ID}.

Your task is to score the response on 5 dimensions and return a JSON object only — no prose, no explanation outside the JSON.

Story artefact (ACs, NFRs, out-of-scope):
{STORY}

PR description and test evidence bundle:
{PR}

Planted defect for this case (ground truth — not shown to the model under evaluation):
{PLANTED_DEFECT}

Model DoD output to evaluate:
{OUTPUT}

Score each dimension on a 0.0–1.0 scale using the rubric below.

Rubric:
D1 — AC coverage accuracy (weight 0.35): Is every AC assessed individually? No AC marked ✅ without cited PR evidence? 1.0=all-ACs-assessed+no-false-positive; 0.7=one-thin-✅+no-outright-false-positive; 0.4=one-false-positive+verdict-still-INCOMPLETE; 0.0=false-positive-AC+verdict-COMPLETE
D2 — Deviation detection (weight 0.20): Are planted out-of-scope implementations and test gaps named? 1.0=all-deviations-named+linked-to-out-of-scope-section; 0.7=deviation-noted+not-linked; 0.4=deviation-missed; 0.0=planted-deviation-not-mentioned+verdict-COMPLETE
D3 — NFR verification (weight 0.20): Are all NFRs verified against PR evidence? Regulated NFRs given explicit pass/fail? 1.0=all-NFRs-addressed+regulated-NFRs-explicit; 0.7=all-addressed+one-regulated-vague; 0.4=NFRs-assessed-as-group; 0.0=NFR-section-skipped or regulated-NFR-assumed-satisfied
D4 — Verdict correctness (weight 0.15): Does the final verdict match the AC/deviation findings? 1.0=verdict-correct; 0.7=COMPLETE-WITH-DEVIATIONS-instead-of-INCOMPLETE; 0.4=COMPLETE-with-significant-⚠️+deviations; 0.0=COMPLETE-with-❌-AC or INCOMPLETE-on-T4-clean
D5 — Evidence specificity (weight 0.10): Are AC findings supported by specific PR element citations? 1.0=all-specific+quoted-or-named; 0.7=mostly-specific+one-general; 0.4=correct-verdicts+no-quotes; 0.0=no-citations

Categorical fail rules (override weighted total, set compliant=false):
- Any AC with zero PR evidence marked ✅ AND final verdict is COMPLETE or COMPLETE WITH DEVIATIONS → D1=0.0, note "false_positive_gate_fail: AC_{n}_unsupported"
- Verdict COMPLETE issued when any AC is ❌ → D1=0.0, D4=0.0, note "verdict_mismatch: COMPLETE_with_failed_AC"
- T4 (genuinely complete): INCOMPLETE verdict → D4=0.0, note "false_negative: T4_incorrectly_incomplete"

Return ONLY valid JSON in this exact schema:
{
  "case_id": "{CASE_ID}",
  "model_label": "TBD",
  "scores": {
    "d1_ac_coverage": <0.0-1.0>,
    "d2_deviation_detection": <0.0-1.0>,
    "d3_nfr_verification": <0.0-1.0>,
    "d4_verdict_correctness": <0.0-1.0>,
    "d5_evidence_specificity": <0.0-1.0>
  },
  "weighted_score": <computed>,
  "pass": <true if weighted_score >= 0.80 and compliant=true>,
  "compliant": <true unless categorical fail triggered>,
  "verdict_produced": "<COMPLETE|COMPLETE WITH DEVIATIONS|INCOMPLETE>",
  "notes": "<one sentence: primary correctness behaviour or false-positive pattern observed>"
}
```

---

## 6. Loop 1 corpus design

**Cases:** T1 (webhook SLA AC gap), T2 (profile scope creep), T3 (API key NFR gap), T4 (filter complete — genuinely clean).

These existing cases test: AC evidence gap (T1), scope violation (T2), NFR gap (T3), false-positive resistance (T4). Input format: story artefact + PR description bundle.

**First sweep recommendation:** Run T1–T4 with Sonnet 4.6 and Haiku 4.5, 3 trials each. This establishes a calibration baseline and validates the existing corpus cases against the EVAL.md dimensions. Expected behaviour: Haiku may match Sonnet on T4 (clean) and T1/T2 (clear defects) but show gaps on T3 (NFR verification requires constraint chain awareness).

---

## 7. Loop 2 corpus design

**Purpose:** Degraded/ambiguous PR descriptions testing gap-surfacing over fabrication.

Proposed cases:
- **T5 — Minimal PR description:** PR description is two sentences ("Added webhook endpoint. Tests pass."). Story has 4 ACs. Model must mark all ACs as ⚠️ (unverifiable from minimal description) and produce INCOMPLETE verdict.
- **T6 — Regulated constraint in PR:** Story has a regulated constraint AC (e.g., PCI DSS audit trail logging). PR description says "implemented as per requirements." Model must not mark this as ✅ — it requires specific evidence (log format, retention policy).
- **T7 — Fabricated evidence detection:** PR description contains plausible but non-specific language ("all edge cases handled, performance requirements met"). Model must identify that "performance requirements met" does not satisfy a specific latency NFR.

---

## 8. response_type

All DoD outputs are `artefact` type. The skill does not issue clarification requests — ambiguous PR evidence is handled by marking the AC as ⚠️. No clarification trigger conditions apply.
