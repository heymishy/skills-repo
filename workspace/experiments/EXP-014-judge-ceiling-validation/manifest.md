# EXP-014 — Judge Ceiling Validation (S12/S13, Fable 5 as Judge)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-014-judge-ceiling-validation |
| experiment_type | judge-ceiling-validation |
| created | 2026-06-12 |
| operator | Hamish King |
| status | planned |
| prerequisite_experiments | EXP-010-fable5-model-sweep (source data — S12/S13 Fable 5 generation outputs) |

## Background and motivation

EXP-010 Section 9 ("Limitations") flagged a judge ceiling risk:

> "The judge model is claude-sonnet-4-6, which is less capable than Fable 5. For Fable 5 outputs with deep NZ regulatory reasoning, the judge may not recognise excellence it cannot reproduce. Fable 5 scores may be understated, particularly on S9–S13. A peer judge (claude-fable-5 judging Fable 5 outputs) would provide a more reliable upper bound. This limitation applies most strongly to the high-difficulty hypothesis test — the hypothesis rejection should be treated as 'not confirmed' rather than 'definitively false.'"

EXP-010's HOLD verdict was based on S12 (Fable 5 avg 0.582) and S13 (Fable 5 avg 0.543) judged by Sonnet 4.6. S12 judge note: "critically misses the NZ-specific regulatory framing (FMA prescribed methodology, CCCFA, MRM 2023 policy with independent validation requirement)." S13 judge note: "omits the critical SWIFT correspondent bank agreement constraint (C5)."

Both notes attribute failure to missing NZ-specific regulatory content. If Sonnet cannot recognise when Fable 5 correctly identified NZ regulatory depth (because Sonnet itself cannot reproduce that reasoning), the judge score is an underestimate. This experiment tests that directly: re-score the same four Fable 5 outputs with Fable 5 as the judge, using the identical D1-D7 rubric.

**Why S12 and S13 specifically?**

These are the two cases with:
1. Documented NZ regulatory depth requirements (MRM 2023, FMA prescribed fairness methodology for S12; SWIFT correspondent bank clause, AUSTRAC/DIA separation for S13)
2. Fable 5 outputs that the judge noted were analytically strong but judged as weak on constraint completeness
3. Both below the 0.70 pass threshold under Sonnet judging — so a >0.10 delta would shift them from failing to borderline or passing

---

## Hypothesis

**H1 — Judge ceiling confirmed**

Fable 5 as judge scores Fable 5's S12 and S13 outputs ≥ 0.10 higher (avg) than Sonnet 4.6 as judge on the same outputs. This indicates EXP-010 understated Fable 5 quality on S-hard cases, and the hypothesis rejection from EXP-010 should be treated as "not confirmed at Sonnet-judge ceiling" rather than "definitively false."

**H2 — Judge ceiling absent**

Fable 5 as judge scores are within 0.10 of Sonnet 4.6 scores. The HOLD verdict holds even under the most favourable judge. Fable 5's S12/S13 weakness is real and not a scoring artefact.

---

## Source data

No new generation runs. This experiment re-judges existing EXP-010 Fable 5 generation outputs verbatim.

| Source run file | EXP-010 Sonnet judge score | Pass |
|-----------------|---------------------------|------|
| `workspace/experiments/EXP-010-fable5-model-sweep/runs/discovery-S12-claude-fable-5-trial-1.md` | 0.537 | false |
| `workspace/experiments/EXP-010-fable5-model-sweep/runs/discovery-S12-claude-fable-5-trial-2.md` | 0.627 | false |
| `workspace/experiments/EXP-010-fable5-model-sweep/runs/discovery-S13-claude-fable-5-trial-1.md` | 0.520 | false |
| `workspace/experiments/EXP-010-fable5-model-sweep/runs/discovery-S13-claude-fable-5-trial-2.md` | 0.566 | false |

EXP-010 Fable 5 averages: **S12 = 0.582, S13 = 0.543**
Threshold for pass: 0.70 weighted score.

---

## Run procedure

### Step 1 — Prepare experiment directory

```powershell
# Create runs/ and results/ directories
New-Item -ItemType Directory -Path "workspace\experiments\EXP-014-judge-ceiling-validation\runs" -Force
New-Item -ItemType Directory -Path "workspace\experiments\EXP-014-judge-ceiling-validation\results" -Force

# Copy Fable 5 S12/S13 run files from EXP-010 to EXP-014
Copy-Item "workspace\experiments\EXP-010-fable5-model-sweep\runs\discovery-S12-claude-fable-5-trial-1.md" `
          "workspace\experiments\EXP-014-judge-ceiling-validation\runs\"
Copy-Item "workspace\experiments\EXP-010-fable5-model-sweep\runs\discovery-S12-claude-fable-5-trial-2.md" `
          "workspace\experiments\EXP-014-judge-ceiling-validation\runs\"
Copy-Item "workspace\experiments\EXP-010-fable5-model-sweep\runs\discovery-S13-claude-fable-5-trial-1.md" `
          "workspace\experiments\EXP-014-judge-ceiling-validation\runs\"
Copy-Item "workspace\experiments\EXP-010-fable5-model-sweep\runs\discovery-S13-claude-fable-5-trial-2.md" `
          "workspace\experiments\EXP-014-judge-ceiling-validation\runs\"
```

### Step 1.5 — Same-day Sonnet baseline (required before Step 2)

Judge variance between sessions is real. EXP-010 ran on 2026-06-11; if the Sonnet judge produces different scores today for the same outputs, the delta calculation is confounded. Run a same-day Sonnet baseline on the 4 Fable 5 run files before switching to Fable 5 as judge. This is 4 calls (~$0.01) and provides a clean, date-matched reference point.

```powershell
# Step 1.5a — create same-day baseline results dir
New-Item -ItemType Directory -Path "workspace\experiments\EXP-014-judge-ceiling-validation\results-sonnet-baseline" -Force

# Step 1.5b — create stubs in the baseline dir, run --judge-only pointing at it
# (Rename runs/ temporarily or use a separate experiment slug — see note below)
```

**Simplest execution:** Create a sibling experiment `EXP-014a-sonnet-baseline` that points at the same 4 run files with the default Sonnet judge. Compare EXP-014a scores to EXP-010 scores first — if they agree within 0.02, use EXP-010 as the reference. If they diverge (> 0.02 on any cell), use EXP-014a as the reference baseline for the delta calculation rather than EXP-010.

---

### Step 2 — Create stub result files

The `--judge-only` mode rescores result files that contain `{"error": ...}` (no valid weighted_score). Create stubs to trigger rescoring:

```powershell
$stub = '{"error": "pending-fable5-judge-rescore"}'
$stub | Set-Content "workspace\experiments\EXP-014-judge-ceiling-validation\results\discovery-S12-claude-fable-5-trial-1.json"
$stub | Set-Content "workspace\experiments\EXP-014-judge-ceiling-validation\results\discovery-S12-claude-fable-5-trial-2.json"
$stub | Set-Content "workspace\experiments\EXP-014-judge-ceiling-validation\results\discovery-S13-claude-fable-5-trial-1.json"
$stub | Set-Content "workspace\experiments\EXP-014-judge-ceiling-validation\results\discovery-S13-claude-fable-5-trial-2.json"
```

### Step 3 — Override judge model in .github/context.yml

The script reads `judge_model` from the `evaluation:` block in `.github/context.yml`. Temporarily set to Fable 5:

```yaml
# .github/context.yml — evaluation block (TEMPORARY CHANGE — EXP-014 only)
evaluation:
  mode: true
  judge_model: claude-fable-5   # TEMP EXP-014: restore to claude-sonnet-4-6 after run
  output_path: workspace/eval-run-result.json
```

⚠️ **Mandatory post-run restore:** Set `judge_model: claude-sonnet-4-6` immediately after EXP-014 judging completes. Leaving Fable 5 as judge would invalidate any subsequent experiment that uses `--judge-only` and assumes the canonical Sonnet judge.

### Step 4 — Run --judge-only

```powershell
! ANTHROPIC_API_KEY="sk-ant-..." node scripts/run-model-sweep.js --experiment EXP-014-judge-ceiling-validation --judge-only
```

The script will:
1. Find the 4 result stubs (error field present, no weighted_score)
2. Load the corresponding run .md files from EXP-014/runs/
3. Call `claude-fable-5` as judge using the D1-D7 rubric from `.github/skills/discovery/EVAL.md`
4. Write scored result JSON files to EXP-014/results/
5. Generate `workspace/experiments/EXP-014-judge-ceiling-validation/scorecard.md`

### Step 5 — Restore judge model

```yaml
# Restore immediately after Step 4 completes:
evaluation:
  mode: true
  judge_model: claude-sonnet-4-6
  output_path: workspace/eval-run-result.json
```

---

## Token and cost estimate

*Judge calls use the full D1-D7 rubric (~3000 tokens system prompt) + the model output (~2000 tokens) per call.*
*Fable 5 pricing: $3/$15 per million input/output tokens (same as Sonnet 4.6).*

*Input token estimate per call: ~3000 rubric (system prompt) + ~500 case context + ~2000 model output = ~5500 tokens. Note: Fable 5 pricing is $10/$50 per million — not $3/$15, which is Sonnet 4.6.*

| Component | Model | Calls | Est. input tokens | Est. output tokens | Est. cost |
|-----------|-------|-------|------------------|--------------------|-----------|
| Same-day Sonnet baseline (Step 1.5) | claude-sonnet-4-6 | 4 | ~22,000 | ~1,156 | **~$0.083** |
| Fable 5 judge calls (Step 4) | claude-fable-5 | 4 | ~22,000 | ~1,156 | **~$0.278** |
| **Total** | | | | | **~$0.36** |

*Cost ceiling: $5 USD. Well within ceiling.*

---

## Scoring methodology

### Primary comparison: delta per cell

For each of the 4 cells, compute:

```
delta_i = fable5_judge_score_i - sonnet_judge_score_i
```

Where `sonnet_judge_score_i` comes from EXP-010 results (read-only reference) and `fable5_judge_score_i` comes from EXP-014 results.

### Per-dimension analysis

For each cell, compare D1-D7 dimension scores individually between EXP-010 (Sonnet judge) and EXP-014 (Fable 5 judge). This reveals whether the judge ceiling is:
- **Domain-specific** (D7 constraint completeness — where NZ regulatory depth matters most, expected to show largest delta if H1 holds)
- **Artefact-structure-related** (D2/D3/D4 — persona, MVP, out-of-scope; less likely to be affected by judge capability gap)
- **Uniformly distributed** (all dimensions shift, suggesting systemic judge leniency rather than domain-specific recognition)

**D7 weight anomaly — important interpretation note:**

D7 (constraint completeness) is weighted 0.05 — the lowest dimension in the rubric. The judge ceiling hypothesis is specifically about NZ regulatory constraint recognition, which maps primarily onto D7. However, even a perfect D7 delta (+1.0 from 0.0 to 1.0) only contributes +0.05 to the weighted total. H1 confirmation (delta ≥ 0.10) therefore almost certainly requires the judge ceiling to affect **multiple dimensions** — D5 (assumption quality) and D1 (problem framing) would need to shift as well. D5 is plausible: recognising whether an assumption is "genuine uncertainty" vs "stated fact" for NZ regulatory risk may require the same depth the judge-ceiling hypothesis invokes. D1 is less likely.

If D7 shows the largest dimension delta but the overall weighted delta is < 0.10, this is itself a meaningful finding: the rubric architecture may under-weight constraint completeness for high-difficulty NZ regulatory cases. The 0.05 weight reflects the proportion of production value attributable to constraint completeness — it was calibrated on T-series and S-medium cases where constraint scoping is less central. For S-hard cases (S9-S13), where NZ regulatory constraints are the primary difficulty, a case could be made for temporarily re-weighting D7 to 0.15 and D1 to 0.12 in a subsequent experiment. Flag in findings if this pattern appears.

### Average delta calculation

```
delta_S12 = mean(fable5_judge_S12_t1, fable5_judge_S12_t2) - 0.582
delta_S13 = mean(fable5_judge_S13_t1, fable5_judge_S13_t2) - 0.543
delta_overall = (delta_S12 + delta_S13) / 2
```

---

## Scorecard summary (to be populated)

| Case | Trial | EXP-010 Sonnet score | EXP-014 Fable 5 score | Delta |
|------|-------|---------------------|----------------------|-------|
| S12 | 1 | 0.537 | — | — |
| S12 | 2 | 0.627 | — | — |
| S13 | 1 | 0.520 | — | — |
| S13 | 2 | 0.566 | — | — |
| **S12 avg** | | **0.582** | — | — |
| **S13 avg** | | **0.543** | — | — |
| **Overall avg** | | **0.563** | — | — |

### Per-dimension delta table (to be populated)

| Dimension | Weight | S12 Sonnet avg | S12 Fable5 avg | S13 Sonnet avg | S13 Fable5 avg |
|-----------|--------|---------------|---------------|---------------|---------------|
| D1 problem framing | 0.22 | — | — | — | — |
| D2 persona specificity | 0.15 | — | — | — | — |
| D3 MVP bounding | 0.22 | — | — | — | — |
| D4 out-of-scope discipline | 0.15 | — | — | — | — |
| D5 assumption quality | 0.13 | — | — | — | — |
| D6 success observability | 0.08 | — | — | — | — |
| D7 constraint completeness | 0.05 | — | — | — | — |

*If H1 holds, expect D7 and D5 to show the largest positive delta (NZ regulatory constraint recognition).*

---

## Pass criteria and routing implications

**H1 confirmed:** delta_S12 ≥ 0.10 AND delta_S13 ≥ 0.10 (both averages increase by ≥ 0.10)

→ EXP-010 HOLD verdict is provisionally weakened. Recommended action: run **EXP-014b** — a full S9–S13 re-judge sweep covering **all three models** (Fable 5, Sonnet 4.6, Opus 4.6) with Fable 5 as judge. Scoping EXP-014b to Fable 5 only is insufficient: if the judge ceiling affects how Fable 5 scores Sonnet and Opus S-hard outputs too (in either direction), the relative model ranking could shift even if Fable 5's absolute scores improve. The routing decision depends on relative quality, not absolute scores in isolation. **Does NOT automatically change routing** — the T3 quality gap (0.807 Fable 5 vs 0.938 Sonnet) and 5.8× cost premium remain valid regardless of judge model and are the stronger signals. T3 is not a judge-ceiling-affected case (T3 is CCCFA-regulated but does not require the same deep NZ-specific constraint vocabulary as S12/S13).

**H1 partially confirmed:** One of delta_S12 or delta_S13 ≥ 0.10, the other < 0.10.

→ Judge ceiling applies selectively. The case with the larger delta should be investigated for which dimensions drove the change. Consider targeted EXP-014b on the affected case across all three models (not just Fable 5) to determine whether the issue is judge-model capability or case-specific regulatory depth.

**H2 confirmed:** Both delta_S12 < 0.10 AND delta_S13 < 0.10.

→ EXP-010 HOLD verdict stands. Fable 5's S-hard weakness is real and not a scoring artefact. The hypothesis rejection from EXP-010 is robust across judge model configurations. Routing: discovery → claude-sonnet-4-6 confirmed. No further S-hard investigation required on judge-ceiling grounds.

---

## Findings

*Populated after analysis.*

## Deviations from template

- **No generation runs**: All generation outputs sourced from EXP-010. This experiment is judge-only.
- **Fable 5 as judge**: Temporary deviation from the canonical `JUDGE_MODEL = 'claude-sonnet-4-6'` constant. Requires context.yml override. Scoped to this experiment only — restore immediately after run.
- **4 cells only**: Targeted at the 4 Fable 5 S-hard outputs most susceptible to judge ceiling. Not a full 16-case sweep.
- **Same-day Sonnet baseline (Step 1.5) is required**: EXP-010 Sonnet scores are the reference, but judge output variance across sessions is real. Step 1.5 mandates a same-day Sonnet re-judge on the same 4 outputs before switching to Fable 5. If Step 1.5 and EXP-010 agree within 0.02 per cell, use EXP-010 as reference; otherwise use Step 1.5 results.
- **S13 trial 2 reference score**: Read from `workspace/experiments/EXP-010-fable5-model-sweep/results/discovery-S13-claude-fable-5-trial-2.json` — weighted_score = 0.566.
