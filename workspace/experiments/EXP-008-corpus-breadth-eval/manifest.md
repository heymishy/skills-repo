# EXP-008-corpus-breadth-eval

## Purpose

Validate whether the EXP-003 routing policy generalises across the full S2–S13 corpus at greater constraint complexity, multi-jurisdiction regulatory scenarios, and with context injection always enabled. Where EXP-003 established CPF baselines on a single domain story (S1), EXP-008 tests corpus breadth — 12 stories across lending origination, real-time payments, regulatory reporting, KiwiSaver, core banking migration, open banking, AI model governance, and trans-Tasman multi-jurisdiction payments.

This is a Scenario 3 experiment (end-to-end pipeline CPF measurement). The controlled variable is the model orchestration config (A/B/C/D). The corpus, context injection posture, and CPF scoring methodology are identical to EXP-003. Results answer: does Config B's regulated-constraint advantage over Config A and Config C hold at S2–S13 complexity? Does Config C's regulated CPF deficit grow worse at harder scenarios?

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-008-corpus-breadth-eval |
| experiment_type | end-to-end-pipeline |
| created | 2026-05-17 |
| operator | Hamis |
| status | setup |
| prerequisite_experiment | EXP-003-pipeline-eval (routing policy baseline — required reading before interpreting results) |
| motivating_finding | EXP-003 meta-review F16 — CPF evidence is N=1 domain story; routing policy not validated for regulated domains beyond S1 |

## Hypothesis

H1 (Depth advantage holds): Config B (Opus front-loaded) will achieve ≥0.80 regulated CPF across all 12 stories, including multi-jurisdiction S9, S11, S13, and the adversarial S8, S10, S12 scenarios. Config A (Sonnet uniform) will also achieve ≥0.80 on most stories, with potential drops at the hardest hidden constraints (S12 MRM version mismatch, S13 SWIFT contractual clause).

H2 (Config C gap grows): Config C (Haiku) regulated CPF will be ≤0.60 on complex regulated stories (S8, S9, S10, S11, S12, S13), worse than its S1 result. The cost saving of Config C is not justified for regulated stories at this complexity level.

H3 (Context injection improves hidden constraint surfacing): With context injection enabled, hidden constraint (C5) surfacing rates will be higher than baseline EXP-003 S1 runs (which had no context injection). This comparison is directional only — EXP-003 and EXP-008 are different corpora.

H4 (Multi-jurisdiction adds scoring challenge for all configs): S13 multi-jurisdiction (NZ + AU + cross-border) will expose regime-coverage gaps where a config propagates one jurisdiction's constraints but drops the other leg.

## Prerequisites

| Prerequisite | Status | Notes |
|-------------|--------|-------|
| EXP-003 complete (all four configs on S1) | Partial — Config D pending | Config D EXP-003 result is not a hard gate for EXP-008 Config A/B/C; it is a gate for EXP-008 Config D |
| EXP-002a H5 confirmed (GPT-4o context loading) | Not confirmed | Required before running any EXP-008 Config D run |
| Context injection files for S8–S13 | Complete | `corpus/context-injection/` — 13 files covering S8–S13 scenarios |
| Context injection files for S2–S7 | **NOT YET CREATED** | Must be created before S2–S7 runs. Format: EA registry entry + policy excerpt per scenario. See S8–S13 files as reference. |

## Data classification check

| Field | Value |
|-------|-------|
| context_files_used | corpus/ story files, corpus/context-injection/ injection files, product/ context files, architecture-guardrails.md |
| contains_internal_system_names | false (all synthetic) |
| contains_customer_data | false |
| approved_for_external_api | true — re-evaluate before each run if injection file content changes |
| if_not_approved | Run with local model only — see local-model-scaffolding/provider-spec.md |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 1 (semi-manual via VS Code — Scenario 3 requires operator-driven multi-turn execution) |
| scenario | Scenario 3 — End-to-end pipeline eval |
| skills_swept | /discovery, /definition, /review, /test-plan, /definition-of-ready |
| story_corpus | S2–S13 (12 stories — see Corpus table below) |
| context_injection | Always-on. Inject the corresponding context-injection/ file(s) for each scenario at the start of the /discovery run. S2–S7 require injection files to be created before those story runs begin. |
| trials_per_story_per_config | 1 (Layer 1 cost and time; anomaly re-run allowed if CPF is borderline ±0.10 of threshold) |
| judge_model | claude-sonnet-4-6 (locked — same as EXP-003) |
| pass_threshold_cpf_general | 0.60 (general constraints) |
| pass_threshold_cpf_regulated | 0.80 (regulated constraints — no warning band; below 0.80 is a failure for regulated) |
| total_planned_runs | 48 (12 stories × 4 configs) — multi-session effort |

## Orchestration configurations

### Config A — Uniform Sonnet (baseline)

| Stage | Model |
|-------|-------|
| /discovery | claude-sonnet-4-6 |
| /definition | claude-sonnet-4-6 |
| /review | claude-sonnet-4-6 |
| /test-plan | claude-sonnet-4-6 |
| /definition-of-ready | claude-sonnet-4-6 |

### Config B — Opus front-loaded (quality)

| Stage | Model |
|-------|-------|
| /discovery | claude-opus-4-5 |
| /definition | claude-opus-4-5 |
| /review | claude-sonnet-4-6 |
| /test-plan | claude-sonnet-4-6 |
| /definition-of-ready | claude-sonnet-4-6 |

### Config C — Cost-optimised Haiku

| Stage | Model |
|-------|-------|
| /discovery | claude-sonnet-4-6 |
| /definition | claude-haiku-3-5 |
| /review | claude-haiku-3-5 |
| /test-plan | claude-haiku-3-5 |
| /definition-of-ready | claude-haiku-3-5 |

Expected trajectory for Config C: EXP-003 showed Haiku regulated CPF of 0.33 at-source (pre-review recovery) on S1. Expect regulated CPF to be ≤0.50 on harder stories. Config C runs are still executed — quantifying the degradation rate at increasing complexity is a primary finding.

### Config D — GPT-4o (pending prerequisite)

| Stage | Model |
|-------|-------|
| /discovery | gpt-4o |
| /definition | gpt-4o |
| /review | gpt-4o |
| /test-plan | gpt-4o |
| /definition-of-ready | claude-haiku-3-5 |

**Gate: Do not run Config D until EXP-002a H5 is confirmed.** Config D runs must be flagged with the EXP-002a H5 confirmation date in their run metadata.

## Corpus

| ID | Scenario | Domain | Difficulty | Regulated C count | C5 hidden type | Context injection files |
|----|----------|--------|------------|-------------------|----------------|------------------------|
| S2 | Lending origination | Credit / CCCFA + FMA | High | 3 (C1 CCCFA, C2 FMA bias, C5 FMA disclosure) | Demographic disparity not disclosed to FMA | **To be created** |
| S3 | Real-time payment integration | Payments / RTP scheme | Medium | 2 | Scheme compliance gap | **To be created** |
| S4 | Experience API + PCI DSS | API / PCI DSS | Medium | 2 | Redis at-rest encryption gap | **To be created** |
| S5 | Dynamics CRM privacy | Privacy / Privacy Act | Medium | 2 | Data retention policy gap | **To be created** |
| S6 | Failure scenarios | Business continuity | Medium-low | 1 | DR test evidence gap | **To be created** |
| S7 | Greenfield React app | Front-end / browser | Low | 1 | Data retention policy | **To be created** |
| S8 | Regulatory reporting pipeline | RBNZ/FMA reporting | Medium-high | 2 (C1 RBNZ, C2 FMA) | Normalisation logic — no change control | S8-ea-registry-regulatory-reporting-pipeline.md, S8-rbnz-fma-policy-doc.md |
| S9 | KiwiSaver switching | FMA KiwiSaver Code | High | 2 (C1 KiwiSaver Code, C2 FMA hardship) | Hardship fee waiver obligation | S9-ea-registry-member-portal-fund-switching.md, S9-fma-kiwisaver-code-conduct-excerpt.md |
| S10 | Core banking loan migration | RBNZ BS11 resilience | Very high | 3 (C1 RBNZ BS11, C2 RBNZ notification, C3 migration risk) | RBNZ BS11 notification timing | S10-ea-registry-loan-ledger-legacy.md, S10-rbnz-bs11-excerpt.md |
| S11 | CDR consent API (open banking) | Privacy Act / CDR | High | 2 (C1 Privacy Act, C2 CDR consent) | Derived-data consent boundary gap | S11-ea-registry-open-banking-consent-platform.md, S11-privacy-act-cdr-policy-excerpt.md |
| S12 | AI credit model retraining | MRM policy / FMA | Very high | 2 (C1 MRM policy, C2 FMA model governance) | MRM policy version mismatch (2023 update) | S12-ea-registry-credit-risk-model-platform.md, S12-mrm-policy-excerpt.md |
| S13 | Trans-Tasman payments | RBNZ + AUSTRAC + contractual | High (multi-jurisdiction) | 2 (C1 RBNZ AML/CFT, C2 AUSTRAC) | SWIFT correspondent bank clause | S13-ea-registry-trans-tasman-payments.md, S13-aml-austrac-payment-services-policy.md, S13-architecture-guardrails-excerpt.md |

**Total constraint inventory per story:** 5 (C1–C5). C5 is always hidden from the model — it must be surfaced through constraint reasoning, not direct reading.

Full constraint inventories: `workspace/handoffs/pipeline-corpus-S2-S7.md` (S2–S7) and `workspace/handoffs/pipeline-corpus-S8-S13.md` (S8–S13).

## CPF scoring methodology

Inherits from EXP-003 manifest (see `EXP-003-pipeline-eval/manifest.md` — CPF scoring methodology section). Summary:

```
CPF = propagated_count / total_constraints_in_discovery
```

Constraint is propagated if it appears by name or clear unambiguous reference in either the DoR contract scope section OR the test plan NFR/acceptance section. Paraphrase with no material detail loss = propagated. Material detail omitted = dropped.

### Multi-jurisdiction extension (S13 only)

S13 scores are split by jurisdiction leg before computing overall CPF:

| Sub-score | Constraints | Regulated threshold |
|-----------|-------------|---------------------|
| NZ-leg CPF | C1 (RBNZ AML/CFT), C3 (RBNZ FX reporting), C4 (DIA/PSR 2021) | C1 regulated: 0.80 floor |
| AU-leg CPF | C2 (AUSTRAC) | C2 regulated: 0.80 floor |
| Cross-border CPF | C5 (SWIFT correspondent clause) | C5 contractual: 0.60 floor |
| Overall S13 CPF | All 5 constraints | 0.80 for regulated (C1, C2) |

A config that passes overall CPF but fails NZ-leg or AU-leg regulated CPF is scored as a **partial failure** on S13 — it is not recommended for multi-jurisdiction regulated stories even if its aggregate number passes.

### Hidden constraint (C5) scoring

C5 is tracked separately as `c5_surfaced: true/false` in every run record. This produces a hidden-constraint surfacing rate per config across all 12 stories, which is a new secondary metric in EXP-008 not tracked in EXP-003.

```
C5_surfacing_rate = (stories where c5_surfaced == true) / 12
```

A config with C5_surfacing_rate < 0.50 is assessed as failing to detect high-subtlety hidden constraints at acceptable rates — a material finding for regulated production use.

## Run prioritisation

Session 1 (highest stakes — F16 remediation directly addressed):
- S2 Config A (partial discovery.md exists in EXP-003 runs/config-A-S2/ but was run without injection — treat as reference; fresh run preferred)
- S8 Config A
- S13 Config A

Session 2:
- S2 Config B, S8 Config B, S13 Config B (Opus comparison on same three high-stakes stories)

Session 3+:
- S9, S10, S11, S12 (regulatory-heavy, complex hidden constraints)
- S3, S4, S5 (medium complexity)
- S6, S7 (lower complexity, lower regulated constraint count)

Config C and Config D runs: run after Config A and Config B have established the baseline scorecard for each story. This prevents Config C/D time investment before knowing the baseline.

## Run matrix

Each cell: `—` (not started), `setup` (injection files needed), `in-progress`, `CPF=X.XX` (complete).

| Story | Config A | Config B | Config C | Config D |
|-------|----------|----------|----------|----------|
| S2 | — | — | — | — |
| S3 | — | — | — | — |
| S4 | — | — | — | — |
| S5 | — | — | — | — |
| S6 | — | — | — | — |
| S7 | — | — | — | — |
| S8 | — | — | — | — |
| S9 | — | — | — | — |
| S10 | — | — | — | — |
| S11 | — | — | — | — |
| S12 | — | — | — | — |
| S13 | — | — | — | — |

Config D column: all cells blocked on EXP-002a H5 gate.

## C5 surfacing rate tracker

| Story | Config A C5 surfaced | Config B C5 surfaced | Config C C5 surfaced | Config D C5 surfaced |
|-------|---------------------|---------------------|---------------------|---------------------|
| S2 | — | — | — | — |
| S3 | — | — | — | — |
| S4 | — | — | — | — |
| S5 | — | — | — | — |
| S6 | — | — | — | — |
| S7 | — | — | — | — |
| S8 | — | — | — | — |
| S9 | — | — | — | — |
| S10 | — | — | — | — |
| S11 | — | — | — | — |
| S12 | — | — | — | — |
| S13 | — | — | — | — |
| **Rate** | **—/12** | **—/12** | **—/12** | **—/12** |

## Context injection setup — S2–S7 (required before those runs)

Files to create in `corpus/context-injection/` before starting each S2–S7 run:

| Story | Files needed | Content guidance |
|-------|-------------|-----------------|
| S2 | S2-ea-registry-lending-origination.md, S2-fma-responsible-lending-excerpt.md | EA entry for digital lending platform; FMA/CCCFA reasonable inquiry policy guidance |
| S3 | S3-ea-registry-rtp-gateway.md, S3-rtp-scheme-policy-excerpt.md | EA entry for RTP gateway; scheme operator policy doc |
| S4 | S4-ea-registry-experience-api.md, S4-pci-dss-architecture-guardrails.md | EA entry for experience API layer; architecture guardrail on PCI DSS data handling |
| S5 | S5-ea-registry-crm-platform.md, S5-privacy-policy-excerpt.md | EA entry for Dynamics CRM; Privacy Act / data retention policy excerpt |
| S6 | S6-ea-registry-payment-platform.md, S6-dr-policy-excerpt.md | EA entry for payment platform; DR/BCM policy excerpt |
| S7 | S7-ea-registry-web-app.md | EA entry for customer-facing web app; no policy doc needed (lower complexity) |

Use the S8–S13 injection files as format reference. Each file should be 4–8KB. Content is synthetic — do not use real enterprise policy text.

## Runs log

_(Populated as runs are completed. One entry per story per config.)_

---

## Cross-reference

- **EXP-003** (`workspace/experiments/EXP-003-pipeline-eval/manifest.md`) — S1 baseline, routing policy derivation, CPF methodology source
- **Meta-review F16** (`workspace/eval-framework-review/2026-05-15-meta-review.md`) — motivating finding for EXP-008
- **Corpus S2–S7** (`workspace/handoffs/pipeline-corpus-S2-S7.md`) — full constraint inventories and operator briefs
- **Corpus S8–S13** (`workspace/handoffs/pipeline-corpus-S8-S13.md`) — full constraint inventories, adversarial scenario design notes, context injection maps
- **Context injection files** (`corpus/context-injection/`) — S8–S13 files present; S2–S7 to be created
