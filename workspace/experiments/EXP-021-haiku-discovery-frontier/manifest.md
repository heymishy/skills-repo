# EXP-021 — Haiku Discovery Frontier (S-Series Full Sweep)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-021-haiku-discovery-frontier |
| experiment_type | model-sweep |
| created | 2026-06-13 |
| operator | Hamish King |
| status | pending |
| motivation | Close the critical frontier gap: claude-haiku-4-5 has never been tested on the S-series discovery corpus. At ~6× cheaper than Sonnet per run (Layer 2), Haiku may be the cost frontier for easy/medium discovery cases. |

## Background

The cost-performance frontier analysis (`workspace/proposals/cost-performance-frontier.md`) identifies Haiku as the largest unknown in the discovery routing programme. EXP-002a established Haiku on T1/T3 corpus only (avg 0.759, 5/6 pass, approved for T1-class non-regulated discovery). The S-series corpus (S1-S13), introduced for EXP-010, tests a wider range of realistic scenarios including S-hard regulated cases (S9-S13). Haiku has never been run against these cases.

The routing question: can Haiku serve as the discovery default for easy/medium cases (S1-S8 difficulty class), creating a difficulty-tiered routing configuration at ~42% lower Layer 2 cost?

**Comparison baseline:** EXP-010-fable5-model-sweep provides Sonnet 4.6 scores across all 13 S-series cases at max-tokens 4096. EXP-021 runs at max-tokens 8192. When comparing EXP-021 Haiku scores to EXP-010 Sonnet scores, note the token ceiling difference — Sonnet outputs at 4096 may also have been truncated on S-hard cases (though less severely than Fable 5; see EXP-010 scorecard Section 9 Limitation 6). This is a known caveat; a clean apples-to-apples comparison requires running Sonnet at 8192 in a follow-up if the comparison is marginal.

---

## Hypotheses

**H1 — Haiku passes S1-S8 (easy/medium cases)**

Haiku achieves weighted score ≥ 0.70 (pass threshold) on both trials for ≥ 6 of 8 easy/medium cases (S1-S8). This would confirm Haiku as viable for the easy/medium discovery tier and enable tiered routing.

*Falsification: If Haiku passes fewer than 5 of 8 S1-S8 cases, tiered routing is not viable and Sonnet remains the discovery default across all difficulty tiers.*

**H2 — Haiku fails S9-S13 (S-hard cases)**

Haiku achieves weighted score < 0.70 on both trials for ≥ 3 of 5 S-hard cases (S9-S13). This would confirm that S-hard cases require Sonnet — consistent with EXP-020 S13 Haiku NON-COMPLIANT finding.

*Falsification: If Haiku passes ≥ 3 of 5 S-hard cases, routing does not need to tier by difficulty — Haiku becomes a viable discovery default across all tiers, and the current Sonnet routing should be reviewed.*

**H3 — Haiku cost/passing trial < Sonnet on S1-S8**

If H1 holds, Haiku cost/passing trial on S1-S8 is lower than Sonnet's ~$0.059 estimated (EXP-010). Expected: 8 cases × 2 trials × ~$0.013/run = $0.208, divided by expected ≥12 passing trials = ~$0.017/passing trial. This would place Haiku as the Layer 2 cost frontier for easy/medium discovery.

---

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | Cost-performance frontier analysis — EXP-021 closes Haiku S-series gap |
| skills_swept | discovery |
| models_compared | claude-haiku-4-5 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | S2, S3, S4, S5, S7, S8, S9, S10, S11, S12, S13 |
| context_files | none |
| max_tokens | 8192 |
| batch_mode | true |

Total cells: 11 cases × 1 model × 2 trials = **22 generation runs + 22 judge calls = 44 API calls**

**Note:** S1 and S6 are absent from the discovery corpus — confirmed 2026-06-13. S1 never existed; S6 (behavioural clarification scenarios) was excluded as not scoreable by D1-D7 dimensions. Safe case list: S2–S13 excluding S1 and S6.

**Two-pass note:** Phase 2 (Haiku + regulated context on S10/S13) is already addressed by EXP-020. EXP-021 focuses exclusively on the no-context baseline, which is the missing data for frontier positioning. Cross-reference EXP-020 results after this experiment completes to compute the context injection delta for Haiku.

---

## Run command

```bash
node scripts/run-model-sweep.js \
  --experiment EXP-021-haiku-discovery-frontier \
  --skills discovery \
  --models claude-haiku-4-5 \
  --cases S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 \
  --trials 2 \
  --batch \
  --max-tokens 8192
```

---

## Cost estimate

*Input token estimate: ~3,500 tokens per run (SKILL.md ~1,800 tokens + corpus case ~600 tokens + system overhead ~1,100 tokens).*
*Output token estimate: ~2,000 tokens per run (expected discovery artefact; 8192 budget, typical output 1,500–2,500 tokens).*

| Component | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------|------------------|--------------------|-----------|
| Haiku 4.5 generation × 22 cells | 22 | ~77,000 | ~44,000 | **~$0.297** |
| Judge (Sonnet) × 22 cells | 22 | ~110,000 | ~11,000 | **~$0.495** |
| **Total** | | | | **~$0.79** |

*Cost ceiling: $2 USD. Estimate $0.79 — within ceiling. Reduced from ~$0.94 (26 cells) after removing absent S1 and S6 corpus cases.*

*Layer 1 cost: 26 runs × 0.33× AI Credit multiplier. Layer 2 cost is the $0.94 estimate above.*

---

## Matrix definition

| Skill | Case | Model | Context | Trials |
|-------|------|-------|---------|--------|
| discovery | S2 | claude-haiku-4-5 | none | 2 |
| discovery | S3 | claude-haiku-4-5 | none | 2 |
| discovery | S4 | claude-haiku-4-5 | none | 2 |
| discovery | S5 | claude-haiku-4-5 | none | 2 |
| discovery | S7 | claude-haiku-4-5 | none | 2 |
| discovery | S8 | claude-haiku-4-5 | none | 2 |
| discovery | S9 | claude-haiku-4-5 | none | 2 |
| discovery | S10 | claude-haiku-4-5 | none | 2 |
| discovery | S11 | claude-haiku-4-5 | none | 2 |
| discovery | S12 | claude-haiku-4-5 | none | 2 |
| discovery | S13 | claude-haiku-4-5 | none | 2 |

---

## Scorecard comparison plan

Primary comparison: EXP-021 Haiku vs EXP-010 Sonnet (both no-context; token ceiling differs — 8192 vs 4096).

| Case | Difficulty | Haiku avg (EXP-021) | Sonnet avg (EXP-010) | Gap | H1/H2 verdict |
|------|------------|---------------------|----------------------|-----|----------------|
| S2 | easy | TBD | — | TBD | — |
| S3 | easy | TBD | — | TBD | — |
| S4 | easy | TBD | — | TBD | — |
| S5 | medium | TBD | — | TBD | — |
| S7 | medium | TBD | — | TBD | — |
| S8 | medium | TBD | — | TBD | — |
| S9 | hard | TBD | — | TBD | — |
| S10 | hard | TBD | 0.628 | TBD | — |
| S11 | hard | TBD | — | TBD | — |
| S12 | hard | TBD | — | TBD | — |
| S13 | hard | TBD | 0.617 | TBD | — |
| **Easy/med avg (S2–S8)** | | TBD | — | TBD | — |
| **S-hard avg (S9–S13)** | | TBD | — | TBD | — |
| **Overall avg** | | TBD | — | TBD | — |

**Routing change triggers:**
- H1 confirmed (≥6/8 S1-S8 pass): update routing table to add Haiku for easy/medium discovery. Schedule EXP-026 (tiered routing validation).
- H2 falsified (Haiku passes ≥3 S-hard): review Sonnet routing default across all tiers. Compare with EXP-020 context injection to determine if Haiku+context is the S-hard default.

---

## Context injection cross-reference

After EXP-021 completes, cross-reference with EXP-020 (context injection) to compute Haiku context delta:

| Case | Haiku no-ctx (EXP-021) | Haiku+ctx (EXP-020) | Delta |
|------|------------------------|---------------------|-------|
| S10 | TBD | 0.018 NC | TBD |
| S13 | TBD | 0.306 NC | TBD |

If Haiku no-context baseline is similar to Haiku+context (EXP-020), context injection provides minimal benefit for Haiku. If baseline is lower, context injection is the relevant lever (but still not sufficient given NON-COMPLIANT verdicts in EXP-020).

---

## Pass criteria and routing implications

**H1 confirmed + H2 confirmed (expected outcome):**
- Haiku passes S1-S8, fails S9-S13
- Action: Update routing policy to add Haiku for easy/medium discovery tier. Schedule EXP-026 (tiered validation).
- Routing entry: `/discovery (easy/medium, S1-S8 class)` → `claude-haiku-4-5` (measurement_backed: true, experiment_id: EXP-021)

**H1 confirmed + H2 falsified (Haiku strong on S-hard):**
- Haiku passes both easy/medium and some S-hard cases
- Action: Do NOT immediately change S-hard routing — verify with EXP-023 (no-context baseline at S10/S13) before any S-hard routing change. The gap between Haiku+context (EXP-020 NON-COMPLIANT) and strong no-context S-hard scores would require explanation.

**H1 falsified (Haiku fails easy/medium):**
- Action: Haiku remains approved for T1-class discovery (EXP-002a) but not for S-series. No routing change. Revisit if SKILL.md simplification makes S-series easier.

---

## Deviations from template

- **Single model**: Only claude-haiku-4-5. Comparison to Sonnet uses EXP-010 results as external baseline, not a within-experiment control group.
- **max-tokens 8192**: Departs from EXP-010 default (4096). Required to avoid truncation confound. Introduces a caveat when comparing to EXP-010 Sonnet baseline — see Background section.
- **No regulated context**: Context injection is out of scope. EXP-020 addresses Haiku + regulated context on S10/S13 already. EXP-023 is the targeted no-context baseline for those two cases.
- **Clarification protocol cases**: S-series cases may include T4/T5-class inputs where the correct response is a clarifying question, not a discovery artefact. If judge reports clarification failures (CL1-CL4 pattern), consult EXP-013 scorecard for interpretation guidance. D1-D7 rubric is used for all cases; CL1-CL4 is not applied in this sweep.
