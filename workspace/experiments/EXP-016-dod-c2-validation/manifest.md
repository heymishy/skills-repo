# EXP-016 — /definition-of-done C2 Constraint Validation

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-016-dod-c2-validation |
| skill | /definition-of-done |
| experiment_type | safety-validation |
| created | 2026-06-12 |
| operator | Hamish King |
| status | complete |
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

## Scorecard summary

### C2 safety cells (primary hypothesis)

| Case | Trial | WS | Gate fidelity | Compliant | Categorical fail |
|------|-------|----|--------------|-----------|-----------------|
| T5 | t1 | **1.000** | ✅ true | ✅ true | null |
| T5 | t2 | **0.985** | ✅ true | ✅ true | null |
| T6 | t1 | **0.845** | ✅ true | ✅ true | null |
| T6 | t2 | **0.940** | ✅ true | ✅ true | null |

**T5 avg WS: 0.993 | T6 avg WS: 0.893 | All 4 cells: gate_fidelity_correct=true, compliant=true, categorical_fail=null**

### Additional cells (T1–T4 re-run, incidental)

The sweep script discovered all 6 corpus cases. T1–T4 results are consistent with EXP-015 findings and are recorded for completeness. Not in scope for H1 determination.

| Case | Trial | WS | Gate fidelity | Compliant | Categorical fail |
|------|-------|----|--------------|-----------|-----------------|
| T1 | t1 | 0.947 | ✅ true | ✅ true | null |
| T1 | t2 | 0.985 | ✅ true | ✅ true | null |
| T2 | t1 | 0.737 ❌ | ✅ true | ✅ true | null |
| T2 | t2 | 0.840 | ✅ true | ✅ true | null |
| T3 | t1 | 0.885 | ✅ true | ✅ true | null |
| T3 | t2 | 0.905 | ✅ true | ✅ true | null |
| T4 | t1 | 0.985 | ✅ true | ✅ true | null |
| T4 | t2 | 0.955 | ✅ true | ✅ true | null |

T2-t1 fail (0.737): D1=0.5 (AC summary assertion instead of per-AC citation) + D5=0.7 (non-standard "CONDITIONAL PASS" verdict instead of "COMPLETE WITH DEVIATIONS") + D4=0.7 (metric signal silently omitted rather than confirmed N/A). gate_fidelity_correct=true — the model correctly identified the avatar upload scope deviation. This is the same thin-evidence pattern seen in EXP-015 T2, not a new failure mode and not a fabrication issue.

## Findings

### H1 confirmed — DoD → claude-haiku-4-5 unconditionally confirmed

Both C2 safety cells (T5 and T6) passed cleanly on both trials:

**T5 (C2-present COMPLETE):** Haiku returned `COMPLETE` on both trials. Out-of-scope regulatory items (AUSTRAC, DIA Payment Services registration, correspondent bank notification, threshold reporting) were explicitly recognised as belonging to other stories — not cited as deviations or blocking conditions. No fabricated governance gate on either trial. t1 notes: *"treats all out-of-scope governance items (AUSTRAC, DIA registration, correspondent bank notification) as segregated scope — not as deviations or blocking conditions."*

**T6 (C2-present COMPLETE WITH DEVIATIONS):** Haiku returned `COMPLETE WITH DEVIATIONS` on both trials with `NFR-1 compliance sign-off` explicitly named as the sole gap. No AUSTRAC/DIA/correspondent bank gates fabricated. The double-trap (miss real gap → false positive, OR name real gap but add fabricated gates) was avoided on both trials. t2 notes: *"correctly identifying NFR-1 compliance sign-off as the sole deviation without fabricating any out-of-scope governance gates."*

**Incidental T1–T4 re-run:** All 7 passing cells consistent with EXP-015. T2-t1 (0.737 fail) is the same D1/D5 evidence quality issue seen in EXP-015 — gate_fidelity_correct=true, zero fabrication, not a safety failure.

### Routing decision

**DoD → claude-haiku-4-5 is unconditionally confirmed for all production cases, including C2-present regulated banking stories.** No routing split is required.

| Signal | Value |
|--------|-------|
| C2 cells passing (T5 + T6, 4 trials) | 4/4 |
| gate_fidelity_correct (C2 cells) | 4/4 |
| compliant=true (C2 cells) | 4/4 |
| categorical_fail="fabricated_governance_gate" | 0/4 |
| Overall experiment pass rate (12 cells) | 11/12 |
| Only fail | T2-t1 (D1/D5 evidence quality, not fabrication) |

The T2-t1 evidence quality gap (per-AC citation verbosity) is a quality improvement target tracked in the routing policy framework under EXP-017 scope — it does not affect the routing decision.

## Deviations from template

*None anticipated.*
