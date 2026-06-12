# EXP-020 — Context Injection: Regulated Framework Effect on S-Hard Discovery (Close 2)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-020-context-injection |
| experiment_type | model-sweep (context-injection variant) |
| created | 2026-06-13 |
| operator | Hamish King |
| status | pending |
| motivation | Close 2 — test whether injecting explicit NZ financial regulatory context raises D1/CPF scores on S-hard cases and whether Haiku becomes competitive with Sonnet under regulated context injection |

## Hypothesis

Injecting explicit NZ financial regulatory framework context (`.github/context-regulated.yml`) raises D1 and CPF scores for all models on S10 and S13 relative to the no-context baseline (EXP-010 Sonnet scores: S10 0.628, S13 0.617). Relative model ordering (Sonnet ahead of Haiku) is preserved.

**Falsification condition**: If Haiku 4.5 achieves scores within 0.05 of Sonnet 4.6 on both S10 and S13 under regulated context injection, the routing recommendation changes — regulated context is sufficient to close the model gap, and Haiku becomes a viable lower-cost alternative for regulated-context discovery workloads.

## Motivation

S10 (RBNZ BS11 notification, CCCFA) and S13 (SWIFT correspondent agreement, dual-jurisdiction AML/CFT) are the two hardest corpus cases in EXP-010 by regulated constraint difficulty. No model passed both trials on either case in EXP-010. The gap may partly be attributable to models lacking explicit regulatory framework knowledge in the system prompt rather than genuine model capability limits.

This experiment tests whether the constraint-detection floor can be raised at zero model-switching cost by injecting regulatory context. If yes, the pipeline can use cheaper models on regulated workloads when appropriate context is provided. If no (Sonnet still leads by >0.05 under the same context), then model capability — not context — is the binding constraint for S-hard cases.

**No-context baseline:**
- Sonnet S10 avg: 0.628 / 0-2 pass (EXP-010 Phase 2)
- Sonnet S13 avg: 0.617 / 0-2 pass (EXP-010 Phase 2)
- Haiku S10 avg: NOT ESTABLISHED (no Haiku discovery sweep exists)
- Haiku S13 avg: NOT ESTABLISHED

Note: Absence of a Haiku no-context baseline means this experiment cannot isolate "how much context helps Haiku specifically." It can answer the routing question directly: is Haiku+context competitive with Sonnet+context?

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | Close 2 from EXP-010 findings + EXP-019 pipeline fidelity |
| skills_swept | discovery |
| models_compared | claude-sonnet-4-6, claude-haiku-4-5 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | S10, S13 |
| context_files | .github/context-regulated.yml |
| max_tokens | 8192 (avoids truncation confound — see EXP-010 scorecard Section 9 Limitation 6) |
| batch_mode | true |

Total cells: 2 cases × 2 models × 2 trials = **8 generation runs + 8 judge calls = 16 API calls**

## Run command

```bash
node scripts/run-model-sweep.js \
  --experiment EXP-020-context-injection \
  --skills discovery \
  --models claude-sonnet-4-6,claude-haiku-4-5 \
  --cases S10,S13 \
  --trials 2 \
  --batch \
  --context-files .github/context-regulated.yml \
  --max-tokens 8192
```

## Cost estimate

*Input token estimate: ~6,000 tokens per run (context-regulated.yml ~2,920 tokens + SKILL.md ~1,800 tokens + corpus case ~600 tokens + overhead).*
*Output token estimate: ~2,500 tokens per run (discovery artefact; budget set to 8,192 but expected output is 1,500–3,000 tokens).*

| Component | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------|------------------|--------------------|-----------|
| Sonnet 4.6 generation × 4 cells | 4 | ~24,000 | ~10,000 | ~$0.222 |
| Haiku 4.5 generation × 4 cells | 4 | ~24,000 | ~10,000 | ~$0.018 |
| Judge calls: Sonnet × 8 | 8 | ~24,000 | ~4,000 | ~$0.132 |
| **Total** | | | | **~$0.372** |

*Cost ceiling: $2 USD. Estimate $0.37 — well within ceiling.*

## Matrix definition

| Skill | Case | Model | Context | Trials |
|-------|------|-------|---------|--------|
| discovery | S10 | claude-sonnet-4-6 | context-regulated.yml | 2 |
| discovery | S10 | claude-haiku-4-5 | context-regulated.yml | 2 |
| discovery | S13 | claude-sonnet-4-6 | context-regulated.yml | 2 |
| discovery | S13 | claude-haiku-4-5 | context-regulated.yml | 2 |

## Scorecard comparison plan

After scoring, compare:

| Dimension | Sonnet+ctx (EXP-020) | Haiku+ctx (EXP-020) | Sonnet-no-ctx (EXP-010) | Delta: Sonnet ctx vs no-ctx | Delta: Sonnet ctx vs Haiku ctx |
|-----------|---------------------|--------------------|-----------------------|-----------------------------|-------------------------------|
| S10 avg score | TBD | TBD | 0.628 | TBD | TBD |
| S13 avg score | TBD | TBD | 0.617 | TBD | TBD |
| S10 pass rate | TBD | TBD | 0/2 | TBD | TBD |
| S13 pass rate | TBD | TBD | 0/2 | TBD | TBD |

**Routing change trigger**: Haiku+ctx within 0.05 of Sonnet+ctx on both S10 and S13 → routing recommendation changes.

## Runs log

*Populated during batch run execution.*

| Run | Case | Model | Trial | Date | Run file | Weighted score | Pass |
|-----|------|-------|-------|------|----------|----------------|------|
| — | — | — | — | _pending_ | — | — | — |

## Scorecard summary

*Populated after all runs complete. Full scorecard in `scorecard.md`.*

| Model | Context | S10 avg | S13 avg | S-hard avg | Pass rate | Routing implication |
|-------|---------|---------|---------|------------|-----------|---------------------|
| claude-sonnet-4-6 | regulated | TBD | TBD | TBD | TBD | TBD |
| claude-haiku-4-5 | regulated | TBD | TBD | TBD | TBD | TBD |

## Findings

*Populated after analysis.*

## Next actions

- [ ] Verify context-regulated.yml passes data classification check (no internal system names, no customer data)
- [ ] Execute batch run and populate runs log
- [ ] Score runs and write scorecard.md
- [ ] Compare against EXP-010 Sonnet no-context baseline
- [ ] Update status and populate Scorecard summary table
- [ ] If Haiku within 0.05 of Sonnet: update routing-policy-framework.md with context-injection routing note

## Deviations from template

- **No Haiku no-context baseline**: EXP-020 cannot isolate the context-injection effect for Haiku specifically. If the routing comparison is ambiguous, a 4-cell follow-up (Haiku × S10/S13 × 2 trials, no context) can establish the baseline. This is a known gap — accepted given the 8-cell scope.
- **S10/S13 only**: EXP-010 showed these two cases as the most sensitive to regulated constraint detection. Including S9/S11/S12 would double the cost without adding to the routing question. If context injection produces large score improvements, a broader S-hard re-run can be scheduled.
- **max-tokens 8192**: Departs from the sweep script default (4096). Required to avoid the truncation confound documented in EXP-010 scorecard Section 9 Limitation 6. Fable 5 S13 trial-1 hit 4096 at 34 lines; Sonnet may hit it on S10 at high output density under regulated context. Budget set to 8,192 across all runs.
