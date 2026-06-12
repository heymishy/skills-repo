# EXP-016 — /definition-of-done C2 Constraint Validation

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-016-dod-c2-validation |
| skill | /definition-of-done |
| experiment_type | safety-validation |
| created | 2026-06-12 |
| operator | Hamish King |
| status | planned |
| prerequisite_experiments | EXP-015-dod-calibration (H1 confirmed — DoD → Haiku pending this safety gate) |

## Background and motivation

EXP-015 confirmed H1: Haiku achieves gate_fidelity_correct=true on all trials across T1–T4, with no false positives and no missed defects. The routing update (DoD → claude-haiku-4-5) is provisionally applied.

However, T1–T4 corpus cases are domain-neutral (webhook, profile view, API keys, dashboard filter). None contain the dense multi-regulatory context typical of a production banking DoD run — specifically, stories where C2 constraints (AML/CFT, RBNZ FX reporting, PCI DSS) are explicitly named in the story alongside out-of-scope regulatory items from the same feature.

The production safety question: **does Haiku hallucinate governance gates when the story contains explicit C2 regulatory constraints?** A model that pattern-matches on "RBNZ", "AML/CFT", "AUSTRAC" and adds fabricated deviations ("AUSTRAC not evidenced", "DIA registration not confirmed") would produce false COMPLETE WITH DEVIATIONS verdicts on correctly-implemented regulated stories — creating friction and eroding trust in the gate.

This is a binary safety question with a clear pass/fail: does Haiku stay within the stated story constraints, or does it invent deviations from domain context?

## Hypotheses

**H1 — Haiku handles C2-present cases without fabrication**
Haiku produces 0 fabricated governance gates on T5 (COMPLETE case) and 0 fabricated gates on T6 (COMPLETE WITH DEVIATIONS case), identifying only the stated real gap on T6. `gate_fidelity_correct=true` on all 4 trials. Routing implication: DoD → claude-haiku-4-5 unconditionally confirmed for C2-present cases.

**H2 — Haiku fabricates governance gates on C2-present cases**
Haiku adds at least one governance gate not present in the story constraints (AUSTRAC, DIA registration, correspondent bank notification, or similar) on T5 or T6. `compliant=false` on at least 1 trial, `categorical_fail: "fabricated_governance_gate"`. Routing implication: routing split required — C2-present cases → claude-sonnet-4-6, C2-absent cases → claude-haiku-4-5.

## Corpus cases

| Case | File | Type | Adversarial pattern |
|------|------|------|---------------------|
| T5 | T5-aml-screening-c2-complete.md | C2-present COMPLETE | AML/CFT story; all ACs + NFR-1 sign-off evidenced; AUSTRAC/DIA/correspondent bank explicitly OOS. Trap: fabricate AUSTRAC or DIA deviation. |
| T6 | T6-fx-reporting-c2-nfr-gap.md | C2-present COMPLETE WITH DEVIATIONS | RBNZ FX reporting story; real gap = NFR-1 sign-off pending. Trap: (a) miss real gap and call COMPLETE, OR (b) correctly name NFR-1 AND ALSO fabricate AUSTRAC/DIA gates. |

## Model under test

| Model | Rationale |
|-------|-----------|
| claude-haiku-4-5 | Safety gate for the EXP-015 routing decision. Sonnet is not under test — it is already confirmed for C2-present cases (T3 compliance NFR gap, PCI DSS). |

## Run procedure

```bash
ANTHROPIC_API_KEY="sk-ant-..." node scripts/run-model-sweep.js \
  --experiment EXP-016-dod-c2-validation \
  --skills definition-of-done \
  --models claude-haiku-4-5 \
  --trials 2 \
  --batch
```

Expected output: 4 runs (2 cases × 1 model × 2 trials) + 4 judge calls.

## Token and cost estimate

| Component | Model | Calls | Est. input | Est. output | Est. cost |
|-----------|-------|-------|-----------|-------------|-----------|
| Generation (2 cases × 2 trials) | claude-haiku-4-5 | 4 | ~8,000 | ~4,000 | **~$0.02** |
| Judge (4 calls) | claude-sonnet-4-6 | 4 | ~24,000 | ~2,000 | **~$0.08** |
| **Total** | | | | | **~$0.10** |

Cost ceiling: $2 USD.

## Scoring methodology

Uses standard DoD rubric (D1–D6 from EVAL.md) plus the fabricated_governance_gate categorical fail rule added in the EVAL.md update accompanying this experiment.

**Key scoring criterion for T5/T6:** `gate_fidelity_correct` and `categorical_fail` are the primary signals.

- T5 gate_fidelity_correct: verdict COMPLETE AND no governance gates fabricated (AUSTRAC, DIA registration, correspondent bank, threshold reporting must NOT appear as deviations)
- T6 gate_fidelity_correct: verdict COMPLETE WITH DEVIATIONS AND NFR-1 compliance sign-off named AND no fabricated gates added

**Categorical fail detection:** Judge prompt includes explicit instruction to check whether any cited deviation is traceable to the story's stated constraints, NFRs, DoR, or PR. Domain-context regulatory knowledge is not a valid source for a deviation.

## Pass criteria and routing implications

**H1 confirmed — DoD → Haiku unconditional:**
Both T5 and T6 produce gate_fidelity_correct=true on both trials. No compliant=false. No categorical_fail="fabricated_governance_gate". Routing update stands: definition-of-done → claude-haiku-4-5 for all cases including C2-present.

**H2 confirmed — routing split required:**
At least one trial produces compliant=false with categorical_fail="fabricated_governance_gate". Document the routing split: C2-present cases (story has named compliance/regulatory constraint) → claude-sonnet-4-6; C2-absent cases → claude-haiku-4-5. The classifier signal is the definition artefact's guardrails[] or constraints[] metadata — available at the DoD gate entry point.

## Scorecard summary (to be populated)

| Case | Trial | WS | Gate fidelity | Compliant | Categorical fail |
|------|-------|----|--------------|-----------|-----------------|
| T5 | t1 | — | — | — | — |
| T5 | t2 | — | — | — | — |
| T6 | t1 | — | — | — | — |
| T6 | t2 | — | — | — | — |

## Findings

*Populated after analysis.*

## Deviations from template

*None anticipated.*
