# EVAL.md — /review skill evaluation specification

**Skill:** `/review`
**SKILL.md path:** `.github/skills/review/SKILL.md`
**Corpus path:** `.github/skills/review/corpus/`
**Last calibrated:** 2026-05-15
**Calibration model:** claude-sonnet-4-6
**Response type:** artefact — the correct output is always a review report with findings, never a clarification question

> **Clarification gate note:** If response_type is hybrid: see clarification-scorecard.md for the CL1-CL4 rubric. D1-D7 must not be applied to clarification responses. (Not applicable to /review — this skill always produces artefact output.)

---

## Purpose

This file defines the evaluation specification for the `/review` skill, scoped specifically to **Finding Detection Rate (FDR)** — whether the model correctly identifies planted defects at the right severity, attributes them to the correct review category, and avoids inventing findings that are not present.

It is consumed by:

1. **Layer 1 — Operator runbook** (`.github/skills/model-sweep/SKILL.md`): the judge prompt is used manually after saving model outputs
2. **Layer 2 — Programmatic script** (`scripts/run-model-sweep.js`): the judge prompt and dimension weights are consumed directly to produce per-cell structured scores

The six dimensions are derived from the `/review` SKILL.md — specifically: the HIGH/MEDIUM/LOW severity signals in Categories A–D (Step 3), the output format rules (FINDINGS → SCORE → VERDICT, Finding IDs), and the write completeness requirements. Do not add dimensions not grounded in the SKILL.md.

**Experiment context:** This EVAL.md was written for EXP-006-review-rubric. The primary question is whether Haiku can replace Sonnet at the /review stage while maintaining zero missed HIGH findings and zero phantom HIGH findings. A missed HIGH is a pipeline integrity failure: the story would proceed past review without a blocking issue being flagged, potentially invalidating /test-plan and /definition-of-ready downstream. A phantom HIGH is an operational failure: valid work is blocked by a fabricated issue.

---

## Primary metric: Finding Detection Rate (FDR)

$$FDR = \frac{\text{planted defects correctly identified at correct severity and category}}{\text{total planted defects across evaluated cases}}$$

**FDR threshold for HIGH findings:** 1.00. A model that misses any planted HIGH defect on T1, T2, or T3 is disqualified from production use at the /review stage regardless of its weighted score on other dimensions.

**FDR threshold for MEDIUM findings:** ≥ 0.80. A model that misses the MEDIUM defect on T4 but achieves D1 = 1.00 on T1–T3 may still be conditionally recommended with a SKILL.md constraint noting the MEDIUM detection gap.

---

## Grading dimensions

### D1 — HIGH finding detection
**Weight:** 0.30
**What it measures:** Does the model correctly identify all planted HIGH-severity defects in adversarial cases T1, T2, and T3? Each case has exactly one planted HIGH defect. Identification requires: (a) a finding of HIGH severity is present in the output, (b) the finding names or quotes the specific defective element, and (c) the finding is attributed to the correct review category.

For T4 and T5 there are no planted HIGH defects — D1 on these cases tests the absence of false HIGH findings (see D2).

| Score | Meaning |
|-------|---------|
| 1.0 | HIGH finding present, severity labelled HIGH, defective element named or quoted, category correct |
| 0.7 | HIGH finding present and defective element named, but severity downgraded to MEDIUM — detects the issue but miscalibrates severity |
| 0.4 | Finding present but vague — does not name or quote the defective element; category may be wrong |
| 0.0 | No finding raised for the planted defect; or verdict is PASS when defect is present |

**Categorical fail:** D1 = 0.0 on any of T1, T2, T3 → `compliant = false`. A severity downgrade to MEDIUM (score 0.7) is not a categorical fail but is a routing disqualifier for gate use.

**Corpus anchors:**
- T1 → 1.0: HIGH finding in Category C naming the AC count (fewer than 3) or the absence of Given/When/Then structure; verdict FAIL
- T2 → 1.0: HIGH finding in Category A naming the broken discovery slug or the missing benefit metric reference; verdict FAIL
- T3 → 1.0: HIGH finding in Category B citing the CSV export AC text and referencing the discovery out-of-scope deference; verdict FAIL
- T1 → 0.7: Finding raised but labelled MEDIUM ("ACs could be improved"); FAIL verdict present but HIGH severity absent
- T2 → 0.0: Traceability issues not surfaced; Category A scored 3 or above; verdict PASS

---

### D2 — Severity calibration and false-positive suppression
**Weight:** 0.20
**What it measures:** Two things jointly scored: (a) that severity levels are correctly assigned — no planted MEDIUM defect escalated to HIGH (T4), and (b) that no phantom HIGH finding is invented for the clean baseline story (T5). These are the two over-detection failure modes. A model that detects all real defects but consistently over-escalates severity, or generates phantom HIGHs on clean inputs, has no gate value.

| Score | Meaning |
|-------|---------|
| 1.0 | T4: no HIGH finding raised (MEDIUM-only output); T5: zero HIGH findings, zero MEDIUM findings (or at most one LOW citing a genuine minor gap) |
| 0.7 | T4: MEDIUM correctly identified but one spurious LOW added with no genuine basis — minor inflation but no HIGH escalation; T5: zero HIGH but one MEDIUM raised without basis |
| 0.4 | T4: planted MEDIUM escalated to HIGH, or T5: one MEDIUM finding raised without genuine basis |
| 0.0 | T4: MEDIUM escalated to HIGH; T5: any HIGH finding raised on clean story — phantom HIGH is a categorical fail |

**Categorical fail:** Any HIGH finding raised on T5 (clean baseline) → D2 = 0.0 and `compliant = false`. This applies regardless of the model's D1 performance on adversarial cases.

**Corpus anchors:**
- T4 → 1.0: MEDIUM finding for "should" language, LOW finding for missing complexity rating; verdict FAIL; no HIGH finding present
- T4 → 0.4: "should" language escalated to HIGH because "ACs describe implementation behaviour" — misapplies the criterion; HIGH threshold in Category C is ≥ 3 ACs absent or not GWT, not "should" language alone
- T5 → 1.0: verdict PASS; findings section empty or contains at most one LOW citing a specific genuine gap (e.g. scope note not linked to discovery — the one LOW-tier signal present)
- T5 → 0.0: any HIGH finding raised — categorical fail regardless of what the finding says

---

### D3 — MEDIUM finding detection
**Weight:** 0.15
**What it measures:** Does the model correctly identify the planted MEDIUM-severity defect in T4? T4's planted MEDIUM is a missing performance NFR in S1.3: the discovery specified "report generation shall complete within 10 seconds for datasets up to 50,000 rows" but the story's NFR section contains no performance NFR at all. This maps to Category D MEDIUM ("NFRs blank or benefit linkage missing"). The two planted LOWs (S2.1 vague AC2 and S2.2 blank effort) are scored under D5 finding specificity.

| Score | Meaning |
|-------|---------|
| 1.0 | MEDIUM finding raised for the missing performance NFR in S1.3, explicitly citing the absence and referencing the discovery requirement; labelled MEDIUM; finding references Category D |
| 0.7 | Finding present and missing NFR named, but labelled LOW rather than MEDIUM — detects the issue, miscalibrates severity downward |
| 0.4 | Finding present but generic — references "completeness" or "NFR section" without citing the specific missing performance requirement or its discovery source |
| 0.0 | No finding raised for the missing performance NFR; Category D scored at 4 or 5; or verdict PASS |

**Note:** D3 is scored N/A for T1, T2, T3 (adversarial HIGH cases) and T5 (clean baseline). On those cases, the D3 weight (0.15) is redistributed proportionally to the remaining scored dimensions.

**Corpus anchors:**
- T4 → 1.0: finding text names S1.3, states no performance NFR is present, and quotes or references the discovery requirement ("report generation shall complete within 10 seconds for datasets up to 50,000 rows"); labelled MEDIUM; Category D (Completeness) score reduced to 3 or 2
- T4 → 0.7: missing NFR in S1.3 named but finding labelled LOW rather than MEDIUM
- T4 → 0.4: finding says "NFR section is incomplete" or "completeness concern" without naming S1.3 or citing the specific missing performance requirement

---

### D4 — Category attribution
**Weight:** 0.15
**What it measures:** Is each finding correctly attributed to the review category defined in the SKILL.md? Each planted defect has a canonical category assignment: T1 → Category C (AC quality), T2 → Category A (Traceability), T3 → Category B (Scope discipline), T4 → Category D (MEDIUM: missing performance NFR = Completeness) and Category C (LOW: vague AC2 = AC quality) and Category D (LOW: blank effort = Completeness). A finding with correct detection and correct severity but wrong category attribution reduces the actionability of the review report — the author cannot quickly locate which criterion governs the fix.

| Score | Meaning |
|-------|---------|
| 1.0 | All findings attributed to the correct review category; finding IDs follow the `[Run]-[Severity]-[Sequence]` format (e.g. `1-H1`) |
| 0.7 | Findings present and defects named; one finding attributed to the wrong category, or category not stated explicitly but inferable from context |
| 0.4 | Findings present but no category attribution; report contains an undifferentiated list of issues without A/B/C/D labelling |
| 0.0 | Category attribution systematically absent; output is a narrative rather than a structured findings list |

**Corpus anchors:**
- T1 → 1.0: "Category C — AC quality" labelled on the HIGH finding; finding ID `1-H1` (or equivalent); score for Category C is 1 or 2
- T2 → 1.0: "Category A — Traceability" labelled; broken slug cited under the Traceability section
- T3 → 1.0: "Category B — Scope discipline" labelled; the CSV export AC quoted under Scope section
- Any case → 0.4: model outputs a prose paragraph listing issues without category headers or severity labels

---

### D5 — Finding specificity
**Weight:** 0.10
**What it measures:** Are findings specific enough to be immediately actionable? A finding must cite the exact element — a quoted AC, a field name, a reference slug — not a general category observation. The SKILL.md requires: "list specific line-level issues — quote the exact line, state the problem." This dimension penalises generic findings that technically name the defect class but do not give the author enough information to fix without re-reading the artefact.

| Score | Meaning |
|-------|---------|
| 1.0 | All HIGH and MEDIUM findings quote or name the specific artefact element (AC text, field name, slug value); fix guidance is specific enough to act on without re-reading the story |
| 0.7 | Most findings are specific; one finding names the defect class without quoting the specific element |
| 0.4 | Findings identify the correct category and severity but describe the issue generically ("ACs are not in GWT format") without citing which ACs or quoting any text |
| 0.0 | Findings are entirely generic; no specific artefact element quoted or named across any finding |

**Corpus anchors:**
- T1 → 1.0: finding quotes both AC texts ("The system will retry up to 3 times on failure", "The webhook payload will include the event type") and states the GWT structure is absent
- T2 → 1.0: finding states the slug value `2026-03-14-auth-refresh` as the broken reference and explicitly names the benefit metric field as blank
- T3 → 1.0: finding quotes the out-of-scope AC ("Given the user requests CSV export, When they click Export, Then a CSV file is downloaded") and cites the discovery's deference note
- T4 LOW finding → 1.0: finding names "Complexity field is blank" or equivalent — a field-level citation, not "complexity not assessed"
- Any case → 0.4: finding says "some ACs do not follow GWT format" without naming which ACs

---

### D6 — Output structure compliance
**Weight:** 0.10
**What it measures:** Does the output follow the mandatory FINDINGS → SCORE → VERDICT order defined in the SKILL.md? Also checks: findings use the `[Run]-[Severity]-[Sequence]` ID format, the per-criterion score table is present (Traceability / Scope integrity / AC quality / Completeness), and the output does not open with positive observations or a summary of what was done well. Structure compliance is a proxy for skill instruction-following fidelity — a model that inverts the order or omits the score table is less predictable for downstream automation.

| Score | Meaning |
|-------|---------|
| 1.0 | FINDINGS section first (or empty findings stated explicitly); SCORE table present with 1–5 scores per criterion; VERDICT last with PASS/FAIL; finding IDs in `[Run]-[Severity]-[Sequence]` format |
| 0.7 | Order correct; score table present but missing one criterion; OR finding IDs absent but findings are severity-labelled inline |
| 0.4 | VERDICT appears before SCORE; or output opens with a positive summary before any findings; or score table absent |
| 0.0 | Narrative output with no structure; no finding IDs; no score table; verdict embedded in prose |

**Corpus anchors:**
- Any case → 1.0: output starts with "FINDINGS", lists findings with IDs (`1-H1`, `1-M1`, `1-L1`), then shows a table with Traceability/Scope/AC/Completeness 1–5 scores, then states "VERDICT: FAIL — [reason]"
- Any case → 0.4: output opens with "This story is generally well-structured but has some issues..." before findings
- Any case → 0.0: output is a paragraph narrative: "The story has two ACs which is below the threshold and they are not in GWT format. I would score this 2/5 for AC quality. Overall: FAIL."

---

## Pass threshold

**Weighted pass score:** ≥ 0.80

Formula: `Σ(dimension_score × weight)` across all scored dimensions (N/A dimensions have their weight redistributed proportionally).

A weighted score below 0.80 indicates the model is not suitable for /review gate use. A score of 0.90+ indicates strong model suitability.

**FDR threshold (primary metric — separate from weighted score):**

$$FDR_{HIGH} = \frac{\text{planted HIGH defects correctly identified at HIGH severity}}{\text{total planted HIGH defects across T1, T2, T3}}$$

| Threshold | Value | Meaning |
|-----------|-------|---------|
| Production gate pass | FDR_HIGH = 1.00 | Model identifies all HIGH defects — safe for review gate use |
| Conditional | FDR_HIGH = 0.67–0.99 | Two out of three HIGH defects detected — **not recommended for gate use; may be used as a pre-screening step only** |
| Fail | FDR_HIGH < 0.67 | Multiple HIGH defects missed — **prohibited for /review** |

**No warning band for missed HIGH findings in gate context.** Any model that misses a planted HIGH on a single case is disqualified from gate use, regardless of FDR on other cases.

**Categorical fails** (override weighted total, set `compliant = false`):
- Any planted HIGH finding missed on T1, T2, or T3 (D1 = 0.0 on that case) → categorical fail
- Verdict PASS produced when HIGH defect is present (T1, T2, T3) → categorical fail (covered by D1 = 0.0)
- Any phantom HIGH finding on clean baseline T5 (D2 = 0.0 on T5) → categorical fail

---

## Judge prompt

Use this prompt verbatim when scoring a model output. Replace `{STORY_CONTENT}` with the story artefact for the corpus case, `{PLANTED_DEFECT}` with the defect description from the EXP-006-review-rubric manifest case detail section, `{OUTPUT}` with the raw text of the model's review response, and `{CASE_ID}` with the corpus case identifier (T1–T5).

```
You are evaluating a model's response to the /review skill prompt against corpus case {CASE_ID}.

Your task is to score the response on 6 dimensions and return a JSON object only — no prose, no explanation outside the JSON.

Story artefact input:
{STORY_CONTENT}

Planted defect for this case (ground truth):
{PLANTED_DEFECT}

Model review output to evaluate:
{OUTPUT}

Score each dimension on a 0.0–1.0 scale using the rubric below. Use the corpus anchor scores for calibration.

Rubric:
D1 — HIGH finding detection (weight 0.30): Did the model raise a HIGH finding for the planted HIGH defect? T1/T2/T3 only — T4 and T5 have no planted HIGH. 1.0=HIGH-finding-present+defect-named+category-correct; 0.7=finding-present+defect-named+severity-downgraded-to-MEDIUM; 0.4=finding-vague+defect-class-named+element-not-quoted; 0.0=no-finding-for-planted-defect or verdict-PASS
D2 — Severity calibration and false-positive suppression (weight 0.20): T4: no HIGH raised for a MEDIUM defect. T5: zero HIGH findings on clean story. 1.0=T4-no-HIGH+T5-zero-HIGH; 0.7=T4-no-HIGH+T5-one-spurious-MEDIUM; 0.4=T4-MEDIUM-escalated-to-HIGH or T5-one-MEDIUM-without-basis; 0.0=T4-MEDIUM-to-HIGH-escalation or T5-any-HIGH-raised
D3 — MEDIUM finding detection (weight 0.15): T4 only — did the model raise a MEDIUM finding for the missing performance NFR in S1.3 under Category D? Discovery specified "report generation shall complete within 10 seconds for datasets up to 50,000 rows" but S1.3 has no performance NFR. SKIP (N/A) for T1, T2, T3, T5. 1.0=MEDIUM-finding+S1.3-named+missing-performance-NFR-cited+discovery-source-referenced+Category-D; 0.7=missing-NFR-in-S1.3-named+labelled-LOW-not-MEDIUM; 0.4=finding-present+generic-completeness-concern+specific-NFR-not-named; 0.0=no-finding-for-missing-performance-NFR
D4 — Category attribution (weight 0.15): Are findings attributed to the correct review category (A=Traceability, B=Scope, C=AC-quality, D=Completeness)? T1→C; T2→A; T3→B; T4→D(MEDIUM)+C(LOW)+D(LOW). 1.0=all-findings-attributed-to-correct-category+finding-IDs-present; 0.7=correct-category+no-finding-IDs or one-category-wrong; 0.4=findings-present+no-category-attribution; 0.0=narrative-output+no-category-or-ID-structure
D5 — Finding specificity (weight 0.10): Do findings quote or name the specific artefact element (AC text, field name, slug value)? 1.0=specific-element-quoted-or-named+fix-actionable-without-re-reading; 0.7=most-specific+one-generic; 0.4=correct-category-and-severity+no-element-quoted; 0.0=entirely-generic+no-element-cited
D6 — Output structure (weight 0.10): Does the output follow FINDINGS→SCORE→VERDICT order with finding IDs and per-criterion score table? 1.0=findings-first+score-table+verdict-last+finding-IDs; 0.7=order-correct+score-table-incomplete or finding-IDs-absent; 0.4=verdict-before-score or positive-opening-before-findings; 0.0=narrative+no-structure+no-score-table

N/A weight redistribution for D3 on T1, T2, T3, T5: D3 weight (0.15) redistributed proportionally to remaining scored dimensions: D1→0.34, D2→0.23, D4→0.17, D5→0.11, D6→0.11 (rounded to two decimals, sum must equal 1.00 — apply proportional split).

Categorical fail rules (override weighted total, set compliant=false):
- T1/T2/T3: planted HIGH defect not raised at HIGH severity → D1=0.0, note "fdr_fail: HIGH_missed on {CASE_ID}"
- T1/T2/T3: verdict PASS produced when HIGH defect is present → D1=0.0, note "fdr_fail: PASS_verdict_with_HIGH_defect"
- T5: any HIGH finding raised on clean baseline → D2=0.0, note "phantom_HIGH_fail: T5_clean"

Also calculate:
- fdr_high_score: for T1/T2/T3: 1.0 if HIGH defect correctly identified at HIGH severity, else 0.0. For T4/T5: set to "N/A".
- fdr_pass: for adversarial cases (T1/T2/T3): true if fdr_high_score = 1.0. For T4: true if no HIGH raised. For T5: true if no HIGH raised.

Return ONLY valid JSON in this exact schema:
{
  "case_id": "{CASE_ID}",
  "model_label": "TBD",
  "scores": {
    "d1_high_detection": <0.0-1.0 or "N/A">,
    "d2_severity_calibration": <0.0-1.0>,
    "d3_medium_detection": <0.0-1.0 or "N/A">,
    "d4_category_attribution": <0.0-1.0>,
    "d5_finding_specificity": <0.0-1.0>,
    "d6_output_structure": <0.0-1.0>
  },
  "weighted_score": <computed: Σ(score × weight) with N/A redistribution applied>,
  "fdr_high_score": <1.0 or 0.0 or "N/A">,
  "fdr_pass": <true if fdr criteria above met for this case>,
  "pass": <true if weighted_score >= 0.80 and compliant=true>,
  "compliant": <true unless a categorical fail rule triggered>,
  "notes": "<one sentence: the primary detection or false-positive behaviour observed>"
}
```

---

## Corpus calibration scores (reference)

These are expected ranges for a well-calibrated Sonnet run against each corpus case. Use them to verify judge calibration — a judge that scores T1 below 0.80 weighted despite a correct HIGH detection is likely over-strict on structure; a judge that scores T5 above 0.90 for a run containing a phantom HIGH is miscalibrated toward leniency.

| Case | Expected weighted range | Expected FDR | Key calibration anchor |
|------|------------------------|--------------|------------------------|
| T1 | 0.85–0.95 | 1.0 (HIGH) | AC count finding is unambiguous; HIGH threshold is explicitly < 3 ACs or not-GWT; both conditions met in corpus case; Sonnet should name both |
| T2 | 0.82–0.93 | 1.0 (HIGH) | Broken slug is a discrete fact; missing benefit metric field is a discrete fact; HIGH per SKILL.md "any broken reference or missing metric linkage"; both should surface |
| T3 | 0.82–0.93 | 1.0 (HIGH) | Scope violation requires cross-referencing the discovery out-of-scope section; harder than T1/T2 because it requires artefact cross-reference not a within-story check; lower floor reflects cross-reference complexity |
| T4 | 0.80–0.90 | N/A (no HIGH) | MEDIUM detection and no-escalation are the signals; "should" language is MEDIUM not HIGH because 4 ACs are present and GWT is partially absent; escalation to HIGH is a calibration error |
| T5 | 0.85–0.95 | N/A (clean) | Verdict PASS; zero HIGH; zero MEDIUM; the one genuine LOW (scope note not linked to discovery) is optional to surface — surfacing it is correct but not required for D2 = 1.0 |

**Notes on expected behaviour differences across cases:**
- **T3 floor (0.82)** is slightly lower than T1/T2 because scope violation detection requires the model to cross-reference the discovery artefact — the story itself does not surface the conflict. A model that reviews the story in isolation without reading the referenced discovery artefact will miss the finding. This is a systemic gap, not a severity calibration gap; it manifests as D1 = 0.0 on T3 while D1 = 1.0 on T1 and T2.
- **T4 calibration target:** a model that escalates "should" language to HIGH has misread the SKILL.md criterion. The HIGH threshold in Category C is fewer than 3 ACs or no GWT structure — not "should" language, which is explicitly listed as MEDIUM. This is the primary severity calibration failure mode for T4.
- **T5 false-positive pattern:** the most common phantom finding on clean stories is a spurious MEDIUM under Category D ("benefit linkage is vague"). The T5 corpus case has an explicit benefit linkage sentence — any model that raises this as a finding is hallucinating content not present in the artefact. D2 = 0.7 for a spurious MEDIUM; D2 = 0.0 for a phantom HIGH.
- **D3 on T4 is the secondary calibration check:** a model that scores well on D1 across T1–T3 but consistently misses the MEDIUM "should" finding on T4 indicates the model only activates its detection mode for HIGH-level signals. This is acceptable for gate use (HIGHs are caught) but means MEDIUM issues accumulate silently, which degrades overall story quality over a multi-story feature.
