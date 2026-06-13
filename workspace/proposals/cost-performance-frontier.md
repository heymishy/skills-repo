# Cost-Performance Frontier — Skills Pipeline Discovery Programme

**Created:** 2026-06-13  
**Author:** Hamish King  
**Status:** Active — drives EXP-021 through EXP-026  
**Data sources:** EXP-010 (Fable 5/Sonnet/Opus), EXP-011 (OpenAI 4.x), EXP-012 (GPT-5.4 family), EXP-013 (clarification), EXP-014 (judge ceiling), EXP-015/016 (DoD calibration), EXP-019 (pipeline fidelity), EXP-020 (context injection)

---

## 1. Purpose

The eval programme (EXP-010 through EXP-020) established _which_ model is correct for each skill. This document shifts focus to _what is the optimal cost-performance frontier_: given all tested and untested models, where are the Pareto-efficient routing choices, and what experiments are needed to close the frontier gaps?

---

## 2. Model × Skill Coverage Matrix

Cell values: **TESTED** (avg weighted score) / **PARTIAL** (limited cases) / **NOT TESTED** / **–** (no eval planned)

| Model | /discovery | /definition | /definition-of-ready | /definition-of-done | /review | /test-plan | /benefit-metric |
|-------|------------|-------------|----------------------|---------------------|---------|------------|----------------|
| claude-fable-5 | **TESTED** 0.712 avg | – | – | – | – | – | – |
| claude-sonnet-4-6 | **TESTED** 0.617 avg | **TESTED** | **TESTED** | **TESTED** ~0.97 avg | **TESTED** | **TESTED** | provisional |
| claude-haiku-4-5 | **NOT TESTED** (S-series) | **TESTED** | **TESTED** | **TESTED** ~0.87 avg | **TESTED** | **TESTED** | – |
| claude-opus-4-6 | **TESTED** 0.571 avg | – | – | – | – | – | – |
| gpt-5.4 | **TESTED** 0.480 avg | – | – | – | – | – | – |
| gpt-5.4-mini | NOT TESTED | – | – | – | – | – | – |
| gpt-5.4-nano | NOT TESTED | – | – | – | – | – | – |
| gpt-4.1 | **TESTED** 0.419 avg | – | – | – | – | – | – |
| gpt-4o | **TESTED** 0.254 avg | – | – | – | – | – | – |
| gpt-4o-mini | **TESTED** 0.276 avg | – | – | – | – | – | – |
| gpt-5-mini | NOT TESTED | – | – | – | – | – | – |

**Discovery notes:**
- `claude-haiku-4-5` is TESTED on T1/T3 only via EXP-002a (avg 0.759, 5/6 pass) but NOT TESTED on the S-series corpus (S1-S13). This is the critical gap.
- All OpenAI models tested with the Claude-specific SKILL.md. Format-neutral SKILL.md not yet tested.
- EXP-010 used max-tokens 4096; S-hard Fable 5 outputs were truncated (see Section 9 Limitation 6, EXP-010 scorecard). Comparison to EXP-021 (max-tokens 8192) must account for this.

**DoD notes:**
- EXP-015/016: Haiku T4 (complex AC structure) showed lower consistency (avg 0.328 in EXP-015, 0.970 in EXP-016 after C2 gate fix). EXP-016 avg 0.916 across T1–T6. Haiku approved as default.
- Sonnet DoD avg across T1/T2/T3/T4 from EXP-015: 0.970. Only 4 cases tested.

---

## 3. Discovery Cost-Performance Data

### 3a. Per-run and per-passing-trial costs

Corpus: S1–S13 (13 cases × 2 trials = 26 cells per model). Pass threshold: weighted score ≥ 0.70.

| Model | Avg score | Pass rate | Est. cost/run | Cost/passing trial | Token ceiling | Source |
|-------|-----------|-----------|---------------|--------------------|---------------|--------|
| claude-haiku-4-5 | UNTESTED | UNTESTED | ~$0.013 est. | UNTESTED | — | — |
| gpt-4o-mini | 0.276 | 0/26 (0%) | <$0.001 | ∞ | 4096 | EXP-011 |
| gpt-4o | 0.254 | 0/26 (0%) | ~$0.007 | ∞ | 4096 | EXP-011 |
| gpt-4.1 | 0.419 | 1/32 (3%) | ~$0.008 | $0.513 | 4096 | EXP-011 |
| gpt-5.4 | 0.480 | 4/32 (13%) | ~$0.032 | $0.516 | 4096 | EXP-012 |
| claude-sonnet-4-6 | 0.617 | ~56% | ~$0.033 | ~$0.059 | 4096 | EXP-010 |
| claude-opus-4-6 | 0.571 | ~38% | ~$0.055 | ~$0.145 | 4096 | EXP-010 |
| claude-fable-5 | 0.712 | ~50% | $0.170 actual | $0.340 | 4096* | EXP-010 |

\* Fable 5 EXP-010 results on S12/S13 are truncated at 4096 tokens (see EXP-010 scorecard Limitation 6). S-hard scores are understated. See EXP-024 to correct.

**Cost source notes:**
- Fable 5 $0.170/run: actual from batch billing (EXP-010 batch-result-summary.json). All others: estimated from PRICING map in `scripts/run-model-sweep.js` using S-series average token counts.
- Layer 1 cost (GitHub Copilot AI Credits): Haiku = 0.33×, Sonnet = 1× baseline, Opus = 15×. GPT models = 0× (free under Copilot subscription).
- Model string source: PRICING map in `run-model-sweep.js` (last verified 2026-06-11 via comment). `/v1/models` API call was not available in current shell environment; PRICING map entries are treated as confirmed.

### 3b. OpenAI cost-per-passing-trial anomaly

GPT models have very low cost-per-run but near-zero pass rates, making cost-per-passing-trial effectively infinite for gpt-4o/gpt-4o-mini and extremely high for gpt-4.1/gpt-5.4. The 0x Layer 1 multiplier (free under GitHub Copilot) is relevant only if quality threshold is met. As of EXP-011/012, no GPT model meets the threshold under the Claude-specific SKILL.md.

---

## 4. Pareto Frontier Analysis — /discovery

A model is on the Pareto frontier if no other tested model is both cheaper per passing trial AND produces higher average quality.

### 4a. Frontier table

| Model | Avg score | Cost/passing trial | Frontier position | Dominated by |
|-------|-----------|-------------------|-------------------|-------------|
| claude-haiku-4-5 | UNTESTED | ~$0.013 est. | **UNTESTED** | — |
| gpt-4o-mini | 0.276 | ∞ | DOMINATED | Sonnet |
| gpt-4o | 0.254 | ∞ | DOMINATED | Sonnet |
| gpt-4.1 | 0.419 | $0.513 | DOMINATED | Sonnet ($0.059, 0.617) |
| gpt-5.4 | 0.480 | $0.516 | DOMINATED | Sonnet ($0.059, 0.617) |
| claude-opus-4-6 | 0.571 | $0.145 | DOMINATED | Sonnet ($0.059, 0.617) |
| claude-sonnet-4-6 | 0.617 | $0.059 | **FRONTIER** | — |
| claude-fable-5 | 0.712* | $0.340 | **FRONTIER** (quality) | — |

**Frontier interpretation:**
- Sonnet is the cost frontier: cheapest per passing trial among compliant models.
- Fable 5 is the quality frontier: highest average score among tested models — but at 5.8× the cost per passing trial. The T3-series quality gap (Fable 5 0.807 vs Sonnet 0.938 avg) and structural D2/D3 weaknesses make the quality premium ambiguous even at the upper end.
- \* Fable 5 S-hard scores understated due to 4096 token truncation. True frontier position unconfirmed until EXP-024.

### 4b. Frontier gaps (models not yet placed on frontier)

1. **claude-haiku-4-5 on S-series** — CRITICAL. At ~$0.013/run (estimated Layer 2), Haiku is ~2.5× cheaper than Sonnet per run. If Haiku achieves even 40% pass rate on S1-S8 (easy/medium), it would have cost/passing trial of ~$0.033 — cheaper than Sonnet's $0.059. This would make Haiku the frontier for easy/medium discovery and shift the frontier boundary. EXP-021 closes this gap.

2. **GPT models with format-neutral SKILL.md** — HIGH. GPT models scored 0/32 pass under Claude-specific SKILL.md. EXP-011/012 judge notes cite D4 (out-of-scope discipline) and D5 (assumption quality) failures — possibly caused by prompt format mismatch rather than fundamental capability. At 0x Layer 1 cost, any pass rate >0 changes the Layer 1 frontier. EXP-022 closes this gap.

3. **claude-fable-5 S-hard at 8192 tokens** — MEDIUM. EXP-010 Limitation 6 documents truncation. True Fable 5 S-hard quality is unknown. EXP-024 closes this gap.

4. **gpt-5.4-mini and gpt-5.4-nano** — LOW. These models have not been tested. gpt-5.4-mini ($0.75/$4.50 per M) is approximately as expensive as Haiku per run but based on gpt-5.4 architecture. EXP-022 can include one of these to establish their position.

---

## 5. EXP-021 through EXP-026 — Experiment Programme

Ordered by frontier impact (highest first).

### EXP-021: Haiku Discovery Frontier (CRITICAL)
**Fills:** Frontier gap #1 — Haiku on S-series  
**Priority:** P0 — blocks all tiered-routing decisions  
**Full manifest:** `workspace/experiments/EXP-021-haiku-discovery-frontier/manifest.md`

**Design:**
- Skill: discovery
- Model: claude-haiku-4-5
- Cases: S1–S13 (full S-series corpus, 13 cases)
- Trials: 2
- Context: none
- max-tokens: 8192 (avoids truncation confound; note: EXP-010 Sonnet baseline was 4096)
- Total cells: 26

**Hypotheses:**
- H1: Haiku passes S1–S8 at ≥0.70 threshold (easy/medium cases) → tiered routing viable
- H2: Haiku fails S9–S13 (S-hard) → Sonnet remains default for hard cases
- H3: Haiku cost/passing trial on S1–S8 < Sonnet's $0.059 → Haiku is the frontier for easy/medium

**Routing implication if H1 confirmed:** Tier discovery routing by difficulty — Haiku for S1-S8 class inputs, Sonnet for S9-S13 class inputs. EXP-026 validates the tiered config.

**Cost estimate:** ~$0.91 (26 generation + 26 judge calls). Within $2 ceiling.

---

### EXP-022: OpenAI Format-Neutral Discovery
**Fills:** Frontier gap #2 — GPT with format-neutral SKILL.md  
**Priority:** P1 — determines if 0x Layer 1 tier is ever viable for /discovery  
**Full manifest:** `workspace/experiments/EXP-022-openai-format-neutral/manifest.md`

**Prerequisite:** Create `.github/skills/discovery/SKILL-format-neutral.md` — a version of SKILL.md with Claude-specific output formatting removed and neutral persona instructions.

**Design:**
- Skill: discovery (format-neutral variant)
- Models: gpt-4.1, gpt-5.4, gpt-5.4-mini (adds cheaper OpenAI tier)
- Cases: S1, S3, S5, S8 (4 cases, easy to medium — avoid S-hard for initial format validation)
- Trials: 2
- Total cells: 24 (3 models × 4 cases × 2 trials)

**Hypotheses:**
- H1: At least one GPT model achieves pass rate >0 on T-easy cases under format-neutral prompt → format was the constraint, not capability
- H2: GPT pass rate remains 0 under format-neutral prompt → fundamental capability gap on D4/D5/D7

**Routing implication if H1 confirmed:** GPT models enter the frontier for non-regulated discovery at 0x Layer 1 cost. Adds a Scenario 1 routing row.

**Cost estimate:** ~$0.25. Within $2 ceiling.

---

### EXP-023: Haiku No-Context Discovery Baseline
**Fills:** EXP-020 known gap — Haiku S10/S13 without regulated context  
**Priority:** P1 — required to compute context injection delta for Haiku  
**Design:**
- Skill: discovery
- Model: claude-haiku-4-5
- Cases: S10, S13
- Trials: 2
- Context: none
- max-tokens: 8192

**Hypothesis:** Haiku no-context S10/S13 scores are lower than Haiku+context (EXP-020: 0.306 S13, NON-COMPLIANT S10). The delta confirms context injection effect on Haiku specifically.

**Comparison matrix (post-run):**

| Cell | No-context | +context (EXP-020) | Delta |
|------|------------|---------------------|-------|
| Haiku S10 | TBD | 0.018 NC | TBD |
| Haiku S13 | TBD | 0.306 NC | TBD |
| Sonnet S10 | 0.628 (EXP-010) | 0.000 (judge fail) | unresolved |
| Sonnet S13 | 0.617 (EXP-010) | 0.995 (EXP-020) | +0.378 |

**Cost estimate:** ~$0.14. Trivial.

---

### EXP-024: Fable 5 S-Hard at 8192 Tokens
**Fills:** Frontier gap #3 — Fable 5 true S-hard quality  
**Priority:** P2 — determines whether Fable 5 is a cost-premium frontier option for S-hard  
**Design:**
- Skill: discovery
- Model: claude-fable-5
- Cases: S10, S11, S12, S13 (all S-hard)
- Trials: 2
- max-tokens: 8192
- Total cells: 8

**Hypothesis:** Fable 5 S-hard scores increase by ≥0.10 under 8192 token ceiling vs EXP-010 baseline (S12 avg 0.582, S13 avg 0.543).

**Reference baselines (EXP-010, max-tokens 4096):**

| Case | Fable 5 avg | Sonnet avg | Fable 5 truncated? |
|------|-------------|------------|---------------------|
| S10 | — | 0.628 | likely (S-hard density) |
| S11 | — | — | likely |
| S12 | 0.582 | — | EXP-010 judge noted "density" |
| S13 | 0.543 | 0.617 | confirmed — 34 lines vs 203 |

**Routing implication:** If Fable 5 S-hard scores rise to ≥ Sonnet averages, Fable 5 re-enters as a quality-premium option for high-stakes S-hard regulated discovery (at 5.8× cost).

**Cost estimate:** ~$0.50 (Fable 5 generation at $10/$50 per M is expensive). Within $2 ceiling.

---

### EXP-025: Regulated Context Injection Breadth
**Fills:** EXP-020 partial scope — S9/S11/S12 with regulated context  
**Priority:** P2 — determines if regulated context injection should be default for all S-hard  
**Design:**
- Skill: discovery
- Model: claude-sonnet-4-6
- Cases: S9, S11, S12
- Trials: 2
- Context: .github/context-regulated.yml
- max-tokens: 8192
- Total cells: 6

**Hypothesis:** Regulated context injection raises Sonnet scores on S9/S11/S12 as it did on S13 (+0.378 delta, EXP-020). If confirmed, context injection becomes the default for all S-hard discovery — not model-specific.

**Cost estimate:** ~$0.30. Within $2 ceiling.

---

### EXP-026: Tiered Routing Validation (depends on EXP-021)
**Fills:** Post-EXP-021 validation of tiered routing configuration  
**Priority:** P3 — only meaningful after EXP-021 confirms Haiku viability on S1-S8  
**Design:**
- Skill: discovery
- Models: Haiku for S1-S8, Sonnet for S9-S13 (per-case model assignment)
- Cases: S1-S13 (full corpus)
- Trials: 2
- Context: none (Phase 1); regulated for S9-S13 (Phase 2, if EXP-025 confirms benefit)

**Hypothesis:** Tiered routing achieves the same quality profile as uniform Sonnet at ~40% lower Layer 2 cost (9 Haiku runs × ~$0.013 + 4 Sonnet runs × ~$0.033 = ~$0.25 vs 13 Sonnet runs × ~$0.033 = ~$0.43).

**Cost estimate:** ~$0.40 (including judge calls). Within $2 ceiling.

---

## 6. Tiered Routing Candidates

Based on current frontier analysis, before EXP-021 results:

### Candidate 1: Difficulty-tiered discovery (Haiku/Sonnet split)

```
/discovery:
  easy (S1-S8 difficulty class):  claude-haiku-4-5  [PENDING EXP-021]
  hard (S9-S13 difficulty class): claude-sonnet-4-6  [CONFIRMED EXP-010]
```

**Evidence needed:** EXP-021 H1 confirmation (Haiku passes S1-S8 at ≥0.70 threshold).

**Cost saving if confirmed:** Layer 2 cost per 13-case sweep drops from ~$0.43 (uniform Sonnet) to ~$0.25 (tiered), a ~42% reduction. Layer 1 saving is smaller since Haiku is already 0.33× Sonnet.

### Candidate 2: Context-default for S-hard regulated discovery

```
/discovery regulated + S-hard:
  Default: claude-sonnet-4-6 + context-regulated.yml injection
  Evidence: EXP-020 S13 delta +0.378 (0.617 → 0.995)
  Pending confirmation: EXP-025 (S9/S11/S12 context breadth)
```

**Routing change required:** When input classification is "regulated" AND difficulty class is "S-hard", inject `.github/context-regulated.yml` by default. No model change.

### Candidate 3: GPT as 0x Layer 1 /discovery tier (pending EXP-022)

```
/discovery non-regulated + Layer 1:
  If EXP-022 H1 confirmed: gpt-5.4-mini (0x Copilot cost, quality TBD)
  Current status: blocked on format-neutral SKILL.md prerequisite
```

---

## 7. Summary of Frontier Unknowns and Resolution Path

| Unknown | Blocks | Resolving experiment | ETA |
|---------|--------|----------------------|-----|
| Haiku S-series pass rate | Tiered routing decisions | EXP-021 | Next |
| GPT format-neutral quality | 0x Layer 1 routing | EXP-022 | Next |
| Haiku context injection delta | EXP-020 gap | EXP-023 | Trivial |
| Fable 5 S-hard true quality | Quality frontier position | EXP-024 | After EXP-021 |
| Regulated context for S9/S11/S12 | Context-default routing | EXP-025 | After EXP-020 |
| Tiered routing cost/quality | Production config | EXP-026 | After EXP-021 |
