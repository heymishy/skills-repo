# Scorecard — EXP-003-pipeline-eval

**Experiment:** End-to-end pipeline evaluation — constraint propagation fidelity (CPF) across model configs
**Status:** Partial — Configs A, B, C complete; Config D not run (dependent on EXP-002a)
**Completed runs:** 7 (Config A ×2, Config B ×2, Config C ×3)
**Date range:** 2026-05-14 to 2026-05-16
**Pipeline:** /discovery → /definition → /review → /test-plan → /definition-of-ready
**Scenario:** S1 — Core banking migration (synthetic, unambiguous CPF measurement story)

---

## Config definitions

| Config | Discovery | Definition | Review | Test-plan | DoR | Approx cost |
|--------|-----------|-----------|--------|-----------|-----|-------------|
| A — Uniform Sonnet | Sonnet | Sonnet | Sonnet | Sonnet | Sonnet | ~$1.50/run |
| B — Opus front-loaded | Opus | Sonnet | Sonnet | Sonnet | Sonnet | ~$0.90/run |
| C — Cost-optimised (Haiku downstream) | Sonnet | Haiku | Haiku | Haiku | Haiku | ~$0.45/run |
| D — Cross-provider | GPT-4o | GPT-4o | GPT-4o | GPT-4o | GPT-4o | not run |

---

## CPF results — canonical constraints (C1 RTO/RPO, C2 PCI DSS, C3 AML/CFT)

| Config | Run | Canonical CPF | Regulated CPF (C2 at-source) | Verdict |
|--------|-----|--------------|------------------------------|---------|
| A | Run 1 | **1.00** | **1.00** | ✅ PASS |
| A | Run 2 | **1.00** | **1.00** | ✅ PASS |
| B | Run 1 | **1.00** | **1.00** | ✅ PASS |
| B | Run 2 | **1.00** | **1.00** | ✅ PASS |
| C | Run 1 | 0.60 | 0.33 | ❌ FAIL |
| C | Run 2 | 0.68 | 0.33 | ❌ FAIL |
| C | Run 3 (F6/F7 fix) | 0.68 | 0.675 | ❌ FAIL |

**Pass threshold:** 0.80 canonical CPF; 0.80 regulated CPF

---

## Hypothesis verdicts

**H1 — Config A (Sonnet uniform) CPF = 1.00: PASS**  
**H2 — Config B (Opus front-loaded) CPF ≥ Config A: PASS** (tied at 1.00; depth advantage in constraint extraction)  
**H3 — Config C regulated CPF < 0.80: PASS** (confirmed failing — 0.33–0.675 at source)  
**H4 — Config D: NOT RUN**

---

## Key findings

**F1 — C2 (PCI DSS) dropped at discovery/definition in Config C.** PCI DSS appeared in input narrative but was not captured in discovery Constraints (scored 0.1) and was absent from definition ACs (scored 0.0). At-source regulated CPF = 0.33. The constraint was recovered downstream by /review (H2/H3 HIGH findings) but a coding agent dispatched post-definition would operate without any PCI DSS constraint.

**F2 — Pipeline recovery pattern confirmed.** Review and DoR skills recovered C2 from 0.0 to end-chain presence. Recovery is downstream of the critical handoff (post-definition dispatch). Config C's recovery does not make it safe for regulated inputs.

**F3 — Config B depth advantage.** Opus extracted one additional operational constraint (C6: "100% transaction volume at secondary — cannot partially route") not captured by Sonnet. Non-canonical; does not affect CPF score but validates Opus value for information-dense inputs.

**F4 — F6/F7 SKILL.md fix (Step 4a — explicit constraint scan at definition).** Added to /definition SKILL.md to prevent vertical-slice strategy from suppressing C2. Improved Config C run 3 regulated CPF from 0.33 to 0.675 — still below 0.80 threshold. Config C remains unsafe for regulated inputs.

---

## Routing implication

**Config A (Sonnet uniform) and Config B (Opus front-loaded) are safe for regulated stories.**  
**Config C (Haiku downstream) is NOT safe for regulated inputs.** Any story where discovery contains a process gate (QSA sign-off, regulatory approval, data residency) must use Sonnet or Opus at the definition stage.

**Config D (GPT-4o uniform):** Not run. EXP-002a prerequisite results showed GPT-4o fails on T3/T5 adversarial cases — Config D unlikely to reach CPF threshold and was not prioritised.
