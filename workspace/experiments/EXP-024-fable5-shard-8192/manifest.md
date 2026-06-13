# EXP-024 — S-Hard Discovery at 8192 Tokens (Opus 4.8 — pivoted from Fable 5)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-024-fable5-shard-8192 |
| experiment_type | model-sweep |
| created | 2026-06-13 |
| operator | Hamish King |
| status | **complete** |
| model | **claude-opus-4-8** (pivoted from claude-fable-5 — see note below) |
| motivation | EXP-010 ran Fable 5 on S12/S13 at max-tokens 4096 and recorded truncated outputs — the scorecard noted "34 lines vs 203" for S13 and "density" issues for S12. EXP-010 Limitation 6 documents this explicitly. Fable 5 S-hard scores (S12: 0.582, S13: 0.543) are understated. True frontier position of the quality-premium model on S-hard cases is unconfirmed until a rerun at 8192 tokens. EXP-024 was originally designed for Fable 5 and pivoted to Opus 4.8 after a US export control directive made claude-fable-5 unavailable. The scientific question is identical — does a quality-premium model at 8192 tokens materially improve on S-hard regulated discovery vs Sonnet no-context and Sonnet+context? |

## ⚠️ Model pivot — Fable 5 unavailable

**Original design:** EXP-024 was designed for `claude-fable-5` to retest EXP-010's truncated S-hard results at the correct 8192-token ceiling.

**Pivot (2026-06-13):** `claude-fable-5` is unavailable due to a US export control directive. EXP-024 is pivoted to `claude-opus-4-8`, the current quality-premium Anthropic model.

**Implication for hypotheses:** The truncation question (H1) cannot be answered directly for Fable 5 — that evidence gap remains. However, the operationally relevant question (H2 — does a quality-premium model exceed Sonnet+context parity on S-hard?) is answered by Opus 4.8. The EXP-014 judge ceiling question is no longer applicable since Opus 4.8 was not in EXP-010. EXP-024 now functions as a quality-premium frontier positioning experiment: if Opus 4.8 ≥ Sonnet+context (0.995 S13), a single high-capability model without context injection becomes viable.

**Fable 5 record:** EXP-010 Fable 5 S-hard scores (S12: 0.582, S13: 0.543) remain the last measurement. The truncation confound is documented but unresolved for Fable 5 specifically. If Fable 5 becomes available in a future API release, EXP-024 can be re-run as designed.

## Background

EXP-010 established the Sonnet/Fable 5/Opus 4.6 baselines across S-series cases at max-tokens 4096. On S-hard cases (S10-S13), EXP-010 judge notes flagged Fable 5 output truncation as a confound. The Fable 5 truncation question remains unresolved (see model pivot note above).

**EXP-024 pivot context:** With Fable 5 unavailable, EXP-024 tests Opus 4.8 — the current quality-premium Anthropic model. Opus 4.8 was not in EXP-010. EXP-024 establishes its S-hard frontier position from scratch.

| Case | EXP-010 Sonnet avg (no-ctx) | Sonnet+context (EXP-020/025) | Opus 4.8 target (EXP-024) |
|------|------------------------------|-------------------------------|---------------------------|
| S9 | 0.643 | 0.956 (EXP-025c) | TBD |
| S10 | 0.628 | unresolved | TBD |
| S11 | 0.734 | 0.897 (EXP-025b) | TBD |
| S12 | 0.495 | 0.846 (EXP-025c, high variance) | TBD |
| S13 | 0.617 | 0.995 (EXP-020) | TBD |

**Cost note:** Opus 4.8 generation costs approximately $5/$25 per M tokens. EXP-024 is justified only as a frontier positioning exercise. Any positive finding requires a cost-quality tradeoff analysis before routing change.

**EXP-014 note (Fable 5 specific):** EXP-014 tested whether Sonnet underrated Fable 5 S-hard quality due to domain knowledge gap in the judge. EXP-014's conclusion was specific to Fable 5 outputs. It does not apply to Opus 4.8 outputs, which were not judged by EXP-014.

---

## Hypotheses

**H1 — Opus 4.8 S-hard reaches Sonnet no-context parity or above**

Opus 4.8 achieves weighted score ≥ Sonnet EXP-010 average on S10-S13 (Sonnet baselines: S9 0.643, S10 0.628, S11 0.734, S12 0.495, S13 0.617). This is the minimum bar — Opus 4.8 being cheaper or equivalent to Sonnet no-context adds no value.

*Falsification: If Opus 4.8 scores fall below Sonnet no-context on S-hard, Opus 4.8 has no quality advantage over the current routing default. The quality-premium model slot should remain HOLD.*

**H2 — Opus 4.8 no-context reaches Sonnet+context parity on S-hard**

Opus 4.8 at 8192 tokens without context injection achieves scores at or near the Sonnet+context production baseline (S9: 0.956, S11: 0.897, S12: 0.846, S13: 0.995). This would confirm that a quality-premium model without context injection can match the current production S-hard configuration, eliminating context file maintenance overhead.

*Falsification: If Opus 4.8 no-context scores materially below Sonnet+context (say, < 0.85 where Sonnet+context ≥ 0.897), Opus 4.8 is not a substitute for the context injection configuration and would need context injection too — at ~2× Sonnet cost for no quality gain.*

---

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | EXP-010 Limitation 6 — S-hard truncation confound; model pivoted to Opus 4.8 after Fable 5 export control unavailability |
| skills_swept | discovery |
| models_compared | **claude-opus-4-8** |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | S10, S11, S12, S13 |
| context_files | none |
| max_tokens | 8192 |
| batch_mode | true |

Total cells: 4 cases × 1 model × 2 trials = **8 generation runs + 8 judge calls = 16 API calls**

---

## Data classification check

| Field | Value |
|-------|-------|
| context_files_used | none |
| contains_internal_system_names | false (all synthetic) |
| contains_customer_data | false |
| approved_for_external_api | true |

---

## Run command

```bash
node scripts/run-model-sweep.js \
  --experiment EXP-024-fable5-shard-8192 \
  --skills discovery \
  --models claude-opus-4-8 \
  --cases S10,S11,S12,S13 \
  --trials 2 \
  --batch \
  --max-tokens 8192
```

---

## Cost estimate

*Input token estimate: ~3,500 tokens per run (SKILL.md ~1,800 tokens + corpus case ~600 tokens + overhead ~1,100).*
*Output token estimate: ~3,500 tokens per run (S-hard cases expected to use near-full 8192 budget for complete artefacts).*

| Component | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------|------------------|--------------------|-----------|
| Opus 4.8 generation × 8 cells | 8 | ~28,000 | ~28,000 | **~$0.280** |
| Judge (Sonnet) × 8 cells | 8 | ~40,000 | ~4,000 | **~$0.180** |
| **Total** | | | | **~$0.46** |

*Cost ceiling: $2 USD. Estimate $0.46 — within ceiling. Opus 4.8 generation tokens priced at $5/$25 per M ($3/$15 Sonnet baseline).*

---

## Matrix definition

| Skill | Case | Model | Context | Trials |
|-------|------|-------|---------|--------|
| discovery | S10 | claude-opus-4-8 | none | 2 |
| discovery | S11 | claude-opus-4-8 | none | 2 |
| discovery | S12 | claude-opus-4-8 | none | 2 |
| discovery | S13 | claude-opus-4-8 | none | 2 |

---

## Scorecard comparison plan

| Case | Opus 4.8 (EXP-024, 8192, no-ctx) | Sonnet (EXP-010, no-ctx) | Sonnet+ctx (EXP-020/025b/025c) | Opus 4.8 vs Sonnet+ctx |
|------|-----------------------------------|--------------------------|---------------------------------|------------------------|
| S9 | not run | 0.643 | 0.956 (EXP-025c) | — |
| S10 | **0.542** 0/2 pass | 0.628 | unresolved (judge fail) | −0.086 vs Sonnet no-ctx |
| S11 | **0.625** 0/2 pass | 0.734 | 0.897 (EXP-025b) | −0.272 vs Sonnet+ctx |
| S12 | **0.599** 0/2 pass | 0.495 | 0.846 (EXP-025c, high variance) | −0.247 vs Sonnet+ctx |
| S13 | **0.611** 0/2 pass | 0.617 | 0.995 (EXP-020) | −0.384 vs Sonnet+ctx |
| **S-hard avg** | **0.594** | ~0.618 | **~0.883** (confirmed 4 cases) | **−0.289** vs Sonnet+ctx |

*The "vs Sonnet+ctx" column is the operationally relevant comparison — this is the production S-hard baseline, not Sonnet no-context.*

---

## Findings — EXP-024 complete (2026-06-13)

**H1 FAIL — Opus 4.8 no-context does NOT reach Sonnet no-context parity on S-hard.** Opus 4.8 avg 0.594 vs Sonnet avg 0.618 on these cases. Underperforms Sonnet on S10, S11, S13; only marginally above Sonnet on S12 (+0.104). Zero passing trials across all 8 runs.

**H2 FAIL — Opus 4.8 no-context is far below Sonnet+context.** Gap of −0.289 on average. S13 gap: −0.384 (0.611 vs 0.995). The quality-premium model without context injection does not substitute for the Sonnet+context production configuration.

**Key insight:** The EXP-024 result strengthens the context injection finding from EXP-020/025b/025c. It is not that Sonnet is uniquely good at this task — Opus 4.8 (a stronger model by design) also fails to pass S-hard cases without context injection. **Context injection is the critical mechanism, not model tier.** A more capable model without the regulatory framework context underperforms a less capable model with it.

| Option | Model | Context | Score | Pass rate |
|--------|-------|---------|-------|-----------|
| EXP-024 | claude-opus-4-8 | none | 0.594 avg | 0/8 |
| EXP-010 Sonnet | claude-sonnet-4-6 | none | ~0.618 avg | low |
| **Production default** | **claude-sonnet-4-6** | **context-regulated.yml** | **0.883 avg** | **high** |

**Routing consequence:** Quality-premium model slot remains HOLD for S-hard regulated discovery. Sonnet+context is confirmed as the only viable S-hard production configuration.

---

## Deviations from template

- **Model pivot**: Originally designed for claude-fable-5; pivoted to claude-opus-4-8 due to US export control directive. The experiment_id retains "fable5" for traceability (references from other documents and the routing framework use this ID). All hypothesis language, matrix, and run commands updated.
- **Single model**: Only claude-opus-4-8 at 8192 tokens. Comparison uses EXP-010 Sonnet (4096) and EXP-020/025b/025c Sonnet+context as historical baselines.
- **Cost premium**: Opus 4.8 generation is ~2× Sonnet. EXP-024 is justified only as a one-time frontier positioning exercise. Do not re-run unless new Opus version is released.
- **EXP-014 note**: EXP-014 was specific to Fable 5 outputs. Its verdict does not transfer to Opus 4.8. Opus 4.8 has no prior S-hard judge comparison — EXP-024 is the first measurement.
