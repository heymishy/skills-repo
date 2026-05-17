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

H5 (AQ quality premium at equivalent CPF): Config B (Opus front-loaded) will produce higher AQ (Artefact Quality) scores than Config A on stories where both achieve CPF ≥ 0.80. Hypothesis: Opus at /discovery and /definition produces better problem framing, tighter scope discipline, and more coding-agent-executable ACs — higher inner-loop executability — even when regulated constraint propagation is equivalent. Expected: AQ(Config B) > AQ(Config A) by ≥ 0.10 on high-complexity stories (S8, S10, S12, S13). If confirmed, this is the quality-above-threshold justification for the Config B cost premium.

## Prerequisites

| Prerequisite | Status | Notes |
|-------------|--------|-------|
| EXP-003 complete (all four configs on S1) | Partial — Config D pending | Config D EXP-003 result is not a hard gate for EXP-008 Config A/B/C; it is a gate for EXP-008 Config D |
| EXP-002a H5 confirmed (GPT-4o context loading) | Not confirmed | Required before running any EXP-008 Config D run |
| Context injection files for S8–S13 | Complete | `corpus/context-injection/` — 13 files covering S8–S13 scenarios |
| Context injection files for S2–S7 | Complete | `corpus/context-injection/` — 9 files covering S2–S7 scenarios (S2 ×2, S3 ×1, S4 ×2, S5 ×2, S7 ×2). Created 2026-05-17. |

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
| judge_model | claude-sonnet-4-6 (locked — same as EXP-003; scores both CPF propagation and AQ per completed run) |
| pass_threshold_cpf_general | 0.60 (general constraints) |
| pass_threshold_cpf_regulated | 0.80 (regulated constraints — no warning band; below 0.80 is a failure for regulated) |
| total_planned_runs | 44 (11 CPF stories × 4 configs; S6 excluded — behavioural scoring, not CPF) — multi-session effort |

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
| /discovery | claude-opus-4-6 |
| /definition | claude-opus-4-6 |
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
| S6 | Failure scenarios (S6a — thin brief, S6b — contradiction, S6c — scope creep) | Behavioural — clarification trigger / contradiction detection / scope discipline | N/A — behavioural, not CPF | 0 — no C1–C5 inventory; scored on clarification trigger rate and contradiction detection, not constraint propagation | N/A — no injection (injection would interfere with behavioural measurement) |
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
C5_surfacing_rate = (stories where c5_surfaced == true) / 11
```

Denominator is 11, not 12 — S6 is a behavioural scenario (clarification trigger / contradiction detection) with no C1–C5 constraint inventory. It is excluded from the C5 surfacing rate.

A config with C5_surfacing_rate < 0.50 is assessed as failing to detect high-subtlety hidden constraints at acceptable rates — a material finding for regulated production use.

## AQ (Artefact Quality) scoring methodology

AQ is a secondary scoring dimension applied alongside CPF. Where CPF measures whether regulated constraints *propagated* through the pipeline, AQ measures the *quality and executability* of artefacts produced — whether the pipeline run would generate working, reviewable delivery when handed to a coding agent.

AQ is scored by the judge model (claude-sonnet-4-6) at the end of each pipeline run, after /definition-of-ready completes. The judge reads the full artefact set (discovery, definition, review, test plan, DoR contract) and scores five dimensions:

| Dimension | What it measures | Max |
|-----------|-----------------|-----|
| Problem framing | Discovery frames the problem as a regulatory + competitive gap, not a solution description. Personas are complete and correctly scoped. Success indicators are anchored to measurable baselines. | 2 |
| Scope discipline | MVP scope is appropriately bounded. Additions and out-of-scope items are explicitly named. No scope creep into unrelated features. | 2 |
| Story testability | ACs are unambiguous and coding-agent-executable. No AC requires human judgement to verify. Each AC has a clear pass/fail condition. | 2 |
| NFR specificity | NFRs in the test plan are concrete, testable assertions (specific thresholds, named standards, measurable conditions) — not generic statements ("must be performant", "must be secure"). | 2 |
| DoR gate quality | The DoR contract gates the right regulated conditions. Adversarial cases are covered in the test plan, not just the happy path. A real PR passing this DoR would be safe to merge in a regulated environment. | 2 |

```
AQ = total_score / 10
```

**AQ thresholds:**
- AQ ≥ 0.80 — high quality; artefacts suitable for handoff to a coding agent without rework
- AQ 0.60–0.79 — acceptable; minor rework expected before coding agent handoff
- AQ < 0.60 — insufficient quality; significant rework required; not recommended for regulated production delivery

**The quality-above-threshold question:** The primary AQ finding in EXP-008 is whether Config B produces higher AQ than Config A on stories where *both* achieve CPF ≥ 0.80. CPF = 1.00 does not guarantee AQ ≥ 0.80 — a pipeline can propagate all constraints but still produce under-specified ACs, poorly bounded scope, or generic NFR statements. If Config B achieves equivalent CPF at meaningfully higher AQ (≥ 0.10 delta), the cost premium for Opus at /discovery and /definition is justified for regulated production pipelines.

**Scoring note:** AQ is not measured for S6 (behavioural scenarios have no artefact set to score against the rubric).

**Judge prompt:** `judge-prompts/aq-scoring-prompt.md` — operator runbook, full scoring rubric with 0/1/2 criteria per dimension, prompt template to paste into the judge session, human review workflow, and run record YAML format.

## Run prioritisation

Session 1 (highest stakes — F16 remediation directly addressed):
- S2 Config A (prior run in EXP-003/config-A-S2/ was without injection — not comparable to EXP-008 design; fresh run required with S2 injection files injected at /discovery start)
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
| S2 | CPF=1.00 | CPF=1.00 | CPF=1.00 | — |
| S3 | — | — | — | — |
| S4 | — | — | — | — |
| S5 | — | — | — | — |
| S6 | N/A — behavioural | N/A — behavioural | N/A — behavioural | N/A — behavioural |
| S7 | — | — | — | — |
| S8 | CPF=1.00 | CPF=1.00 | CPF=1.00 | — |
| S9 | — | — | — | — |
| S10 | — | — | — | — |
| S11 | — | — | — | — |
| S12 | — | — | — | — |
| S13 | CPF=1.00 | CPF=1.00 | CPF=1.00 | — |

Config D column: all cells blocked on EXP-002a H5 gate.

**Update 2026-05-17:** Config C S13 complete. CPF=1.00 (multi-jurisdiction: nz_leg=1.00, au_leg=1.00, cross_border=1.00). AQ pending Sonnet judge scoring.

## C5 surfacing rate tracker

| Story | Config A C5 surfaced | Config B C5 surfaced | Config C C5 surfaced | Config D C5 surfaced |
|-------|---------------------|---------------------|---------------------|---------------------|
| S2 | true | true | true | — |
| S3 | — | — | — | — |
| S4 | — | — | — | — |
| S5 | — | — | — | — |
| S7 | — | — | — | — |
| S8 | true | true | true | — |
| S9 | — | — | — | — |
| S10 | — | — | — | — |
| S11 | — | — | — | — |
| S12 | — | — | — | — |
| S13 | true | true | true | — |
| **Rate** | **3/11** | **3/11 (S2,S8,S13)** | **3/11 (S2,S8,S13)** | **—/11** |

## AQ score tracker

AQ scores per story per config. Score = 0.0–1.0 (sum of five 0–2 rubric dimensions, divided by 10). AQ ≥ 0.80 = high quality. AQ < 0.60 = insufficient for regulated delivery.

| Story | Config A AQ | Config B AQ | Config C AQ | Config D AQ |
|-------|------------|------------|------------|------------|
| S2 | 0.90 {2,2,2,2,1} | 0.90 {2,2,1,2,2} | 0.70 {2,2,1,1,1} | — |
| S3 | — | — | — | — |
| S4 | — | — | — | — |
| S5 | — | — | — | — |
| S6 | N/A — behavioural | N/A — behavioural | N/A — behavioural | N/A — behavioural |
| S7 | — | — | — | — |
| S8 | 0.80 {2,2,1,2,1} | 1.00 {2,2,2,2,2} | 0.80 {2,2,1,2,1} | — |
| S9 | — | — | — | — |
| S10 | — | — | — | — |
| S11 | — | — | — | — |
| S12 | — | — | — | — |
| S13 | 0.90 {2,2,1,2,2} | 0.90 {2,2,1,2,2} | 0.80 {2,2,1,1,2} | — |
| **Mean (CPF stories)** | **0.87 (S2=0.90, S8=0.80, S13=0.90; N=3)** | **0.93 (S2=0.90, S8=1.00, S13=0.90; N=3)** | **0.77 (S2=0.70, S8=0.80, S13=0.80; N=3)** | **—** |

## Context injection setup — S2–S7 (required before those runs)

**Injection design rule (applies to all S2–S13 injection files):** Files may signal regulatory obligation frameworks and known system risk indicators, but must not name the specific compliance gap or its enforcement consequence. Hidden constraints must be surfaced through model reasoning, not document reading. See `workspace/experiments/CONVENTIONS.md` — Context injection file design.

Files to create in `corpus/context-injection/` before starting each S2–S7 run:

| Story | Files needed | Content guidance |
|-------|-------------|-----------------|
| S2 | S2-ea-registry-lending-origination.md, S2-fma-responsible-lending-excerpt.md | EA entry for digital lending platform; FMA/CCCFA reasonable inquiry policy guidance |
| S3 | S3-ea-registry-rtp-gateway.md, S3-rtp-scheme-policy-excerpt.md | EA entry for RTP gateway; scheme operator policy doc |
| S4 | S4-ea-registry-experience-api.md, S4-pci-dss-architecture-guardrails.md | EA entry for experience API layer; architecture guardrail on PCI DSS data handling |
| S5 | S5-ea-registry-crm-platform.md, S5-privacy-policy-excerpt.md | EA entry for Dynamics CRM; Privacy Act / data retention policy excerpt |
| S6 | No injection files — behavioural scenario | S6 measures clarification trigger rate, contradiction detection, and scope discipline. Injecting context would provide material the model should be asking for — this would invalidate the behavioural measurement. |
| S7 | S7-context-yml-excerpt.md, S7-architecture-guardrails-excerpt.md | Standard Azure deployment config; architecture guardrails WITHOUT retention policy content (C5 intentionally absent) |

Use the S8–S13 injection files as format reference. Each file should be 4–8KB. Content is synthetic — do not use real enterprise policy text.

## Runs log

_(Populated as runs are completed. One YAML entry per story per config. Format defined in `judge-prompts/aq-scoring-prompt.md`.)_

```yaml
- story: S2
  config: A
  date: 2026-05-17
  model_discovery: claude-sonnet-4-6
  model_definition: claude-sonnet-4-6
  model_review: claude-sonnet-4-6
  model_test_plan: claude-sonnet-4-6
  model_dor: claude-sonnet-4-6
  cpf_general: 1.00
  cpf_regulated: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery
  c5_surface_mechanism: "operator brief ('not escalated beyond reviewing team' + 'not disclosed to FMA') + EA registry CDM-RISK-001 CRITICAL signal + FMA policy excerpt Principle 3 disclosure obligation"
  aq: 0.90
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 2
    story_testability: 2
    nfr_specificity: 2
    dor_gate_quality: 1
  aq_overrides: []
  aq_override_notes: "DoR gate quality: scored 1 not 2 — all regulated constraints gated with specific enforcement and adversarial tests, but gate specifications lack named responsible parties. Story testability close call at 2: 'clear'/'appropriate' adjectives qualified by exhaustive enumerations."
  artefacts_dir: runs/config-A-S2/
  review_findings: "3 HIGH (H1: Story 1.2 AC4 remediation definition ambiguous; H2: Story 2.3 production gate missing enforcement mechanism; H3: Story 3.2 schema dependency not formalised); all 3 resolved inline in test plan"
  notes: "Full outer-loop run with context injection active at all stages. C5 surfaced as B1 blocker at /discovery. All 5 constraints propagated through to DoR contract. cpf_regulated=1.00 (3/3 regulated constraints: C1 CCCFA, C2 FMA model validation, C5 FMA enforcement risk). cpf_general=1.00 (5/5 total constraints). DoR verdict: PROCEED. Oversight level: HIGH."

- story: S8
  config: A
  date: 2026-05-17
  model_discovery: claude-sonnet-4-6
  model_definition: claude-sonnet-4-6
  model_review: claude-sonnet-4-6
  model_test_plan: claude-sonnet-4-6
  model_dor: claude-sonnet-4-6
  cpf_general: 1.00
  cpf_regulated: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery
  c5_surface_mechanism: "follow-up context ('no formal review has occurred / analyst who wrote it is still with the team and is the only person who fully understands the correction rules') + EA registry RRPL-RISK-002 ('no independent review of the transformation logic is on record'; severity: HIGH) + FMA policy doc s.4.2 (legacy analyst-maintained spreadsheet calculations being incorporated into automated pipelines — documentation, independent review, governance sign-off, regulatory notification all required)"
  c5_surfacing_quality: partial
  c5_surfacing_notes: >
    Factual basis (single-author Excel macro, no independent review)
    reproduced from RRPL-RISK-002. Governance gap conclusion and
    change-control inferential inversion are model reasoning.
    "No test suite" is a model addition with no injection source.
    Not a pure domain-knowledge surface — injection provided the
    factual premise, model drew the compliance conclusion.
  aq: 0.80
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 2
    story_testability: 1
    nfr_specificity: 2
    dor_gate_quality: 1
  aq_overrides: []
  aq_override_notes: >
    story_testability scored 1 (not 2): Story 1.2 AC1 uses "sufficient precision for
    independent reproduction" — T-REG-005 tests structural field presence but cannot
    mechanically verify precision depth; Story 3.2 AC5 uses "legible" and "sufficient
    to independently verify" (partially mitigated by T-AUDIT-007 human drill).
    dor_gate_quality scored 1 (not 2): Gate 3 explicitly names Compliance Officer;
    Gates 1 and 2 specify technically precise conditions (document IDs, business-day
    CI/CD check) but do not name the responsible party in the gate description itself.
    Both dimensions are close calls — see run-record.yaml aq_override_notes for full reasoning.
  artefacts_dir: runs/config-A-S8/
  review_findings: "3 HIGH (H1: regulatory notification gate missing — no BS11 s.4.2 advance notification workflow; H2: normalisation governance blocked — Excel macro not independently reviewed; H3: TreasuryLedger API gap — no automated extraction path); all 3 resolved inline in test plan"
  notes: "Full outer-loop run with context injection active at all stages. C5 surfaced as B2 blocker at /discovery. All 5 constraints propagated through to DoR contract. cpf_regulated=1.00 (2/2 regulated constraints: C1 RBNZ BS11 material change notification, C2 FMA Regulatory Returns Guide methodology disclosure). cpf_general=1.00 (5/5 total constraints). DoR verdict: PROCEED. Oversight level: HIGH. C5 surfacing quality annotated as partial — see c5_surfacing_notes."

- story: S13
  config: A
  date: 2026-05-17
  model_discovery: claude-sonnet-4-6
  model_definition: claude-sonnet-4-6
  model_review: claude-sonnet-4-6
  model_test_plan: claude-sonnet-4-6
  model_dor: claude-sonnet-4-6
  cpf_general: 1.00
  cpf_regulated: 1.00
  nz_leg_cpf: 1.00
  au_leg_cpf: 1.00
  cross_border_cpf: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery
  c5_surface_mechanism: "three-signal compositional reasoning: TTPS-SWIFT-001 (JPMorgan Chase active SWIFT correspondent for NZD/AUD) + TTPS-RISK-001 (impact of proprietary channel on correspondent relationship not assessed; severity: HIGH) + ADR-CB-002 Note (correspondent agreements may contain routing restriction terms; notification obligation must be confirmed before routing change)"
  c5_surfacing_quality: full
  c5_surfacing_notes: >
    First confirmed full-quality C5 surface in EXP-008 Config A series. Unlike S8
    (partial — injection provided the factual premise, model drew the conclusion), S13
    C5 required three-signal compositional inference: no single source names the
    contractual clause risk. Model correctly identified the mechanism, elevated C5 to
    R1 with escalation condition, and propagated through all five stages.
  aq: 0.90
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 2
    story_testability: 1
    nfr_specificity: 2
    dor_gate_quality: 2
  aq_overrides: []
  aq_override_notes: >
    story_testability scored 1 (not 2): Epic 1 governance ACs (AC1–AC2 in Stories
    1.1–1.5) describe document-filing and regulatory notification deliverables that are
    precise and unambiguous but require human verification of document existence and
    signatory authority — not executable by a coding agent. This is a rubric structural
    gap (not a vague-language failure); governance-delivery ACs that are precise-but-
    human-executed sit in a category the rubric does not directly model. dor_gate_quality
    scored 2 (vs S8's 1): all five deployment flags name a distinct responsible party by
    functional role in the Coding Agent Instructions block, satisfying the named
    responsible party criterion that S8 only partially met.
  artefacts_dir: runs/config-A-S13/
  review_findings: "0 HIGH, 1 MEDIUM (D1: Story 2.4 idempotency — duplicate credit risk on acknowledgement loss; addressed in T6.4), 6 LOW (DIA timeline, Epic 1 done-definition, flag check ordering, threshold reporting window, DST cut-off, flag revocation)"
  notes: "Full outer-loop run with 3 context injection files active. C5 surfaced at /discovery via three-signal compositional reasoning. Multi-jurisdiction CPF: nz_leg=1.00 (C1+C3+C4), au_leg=1.00 (C2), cross_border=1.00 (C5). Five deployment flags all default=false; go-live gate requires all five=true. DoR verdict: PROCEED. Oversight level: HIGH."

- story: S2
  config: B
  date: 2026-05-17
  model_discovery: claude-opus-4-6
  model_definition: claude-opus-4-6
  model_review: claude-sonnet-4-6
  model_test_plan: claude-sonnet-4-6
  model_dor: claude-sonnet-4-6
  cpf_general: 1.00
  cpf_regulated: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery
  c5_surface_mechanism: "Opus compositional signal: operator brief ('not escalated beyond reviewing team' + 'not disclosed to FMA') + EA registry CDM-RISK-001 CRITICAL + FMA Algorithmic Accountability Principle 3 disclosure obligation. C5 named as R1 (dominant pre-go-live risk) with dual gate owners (CRO decision, GC execution)."
  dor_verdict: BLOCKED
  dor_block_reasons: ["H-GOV (discovery Approved By pending)", "H-NFR3 (no feature NFR profile)"]
  dor_gate_quality: 2
  gate_owner_propagation: CONFIRMED
  aq: 0.90
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 2
    story_testability: 1
    nfr_specificity: 2
    dor_gate_quality: 2
  aq_overrides: []
  aq_override_notes: >
    story_testability scored 1 (not 2): E1 governance stories (S1.1–S1.4) have 14 ACs covering
    document production, committee ratification, and regulatory correspondence that are precise
    but require human verification — same rubric structural gap as Config A S13. The E2–E4
    technical stories are fully automated-testable. dor_gate_quality is unambiguously 2 — no
    close call. Config A S2 scored 1 (enforcement mechanisms only); Config B names General
    Counsel, Chief Risk Officer, CRO+GC jointly, and Head of Consumer Lending directly in the
    Coding Agent Instructions hard-block gates.
  artefacts_dir: runs/config-B-S2/
  config_a_comparison: >
    Config A S2 aq=0.90 {2,2,2,2,1}; Config B S2 aq=0.90 {2,2,1,2,2}. Same total score,
    different composition. story_testability 2→1 (Opus E1 stories more elaborate, 14 human-process
    ACs). dor_gate_quality 1→2 (primary Config B hypothesis CONFIRMED). H-GOV: Config A gave
    PROCEED despite pending discovery Approved By; Config B hard-blocked correctly.
  notes: >
    Config B (Opus at /discovery + /definition; Sonnet at /review + /test-plan + /dor).
    All 5 constraints propagated. dor_gate_quality=2 confirmed — named parties propagated from
    Architecture Constraints in definition.md into Coding Agent Instructions hard blocks.
    BLOCKED verdict is correct gate behaviour (H-GOV + H-NFR3 are corpus design gaps, not
    artefact quality failures). C5 adversarial depth increased vs Config A: T-CDM-003/004
    and T-REG-005/006/007 distinguish "not-recorded" from "remediation-in-progress-incomplete"
    and test in-session flag revocation.

- story: S8
  config: B
  date: 2026-05-17
  model_discovery: claude-opus-4-6
  model_definition: claude-opus-4-6
  model_review: claude-sonnet-4-6
  model_test_plan: claude-sonnet-4-6
  model_dor: claude-sonnet-4-6
  cpf_general: 1.00
  cpf_regulated: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery
  c5_surface_mechanism: "Opus two-layered problem framing: RRPL-RISK-002 (single-author Excel macro, no independent review, no change-control history) + RRPL-RISK-003 (RBNZ has been receiving normalised figures without methodology notification) + FMA s.4.2 (legacy analyst-maintained spreadsheet being incorporated into pipeline requires documentation, independent review, governance sign-off, regulatory notification). C5 named as B2 pre-go-live blocker with explicit regulatory consequence (RBNZ Act 2021 s.93 general disclosure obligation). Governance gap named explicitly including 'no test suite' detail."
  c5_surfacing_quality: full
  c5_surfacing_notes: >
    Config B Opus discovery produced full C5 surface, including the RBNZ Act 2021 s.93 consequence
    mapping and the 'no test suite' detail. Config A S8 C5 surface was annotated as partial —
    injection provided factual premise, model drew the compliance conclusion. Config B elevates this
    to full by naming the key-person-to-key-system risk pattern and the regulatory consequence chain
    explicitly, with three injection signals composited into a named governance gap.
  dor_verdict: PROCEED
  dor_gate_quality: 2
  gate_owner_propagation: CONFIRMED
  aq: 1.00
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 2
    story_testability: 2
    nfr_specificity: 2
    dor_gate_quality: 2
  aq_overrides: []
  aq_override_notes: >
    dor_gate_quality = 2 (vs Config A S8 = 1): All six named gate owners (Compliance Officer,
    Finance Operations Manager, CFO, Independent Technical Reviewer, Engineering Lead, Treasury
    Operations Manager) appear in Coding Agent Instructions C-GATE-1 through C-GATE-6 with explicit
    non-delegable boundaries. This closes the specific gap Config A S8 scored 1 on.
    story_testability = 2 (does NOT drop to 1 as seen in S2 Config B): Governance stories
    1.1/1.2/1.3 are fully automatable via CI/CD gate tests on deployment-configuration field
    presence — binary pass/fail, not human-verification-required document-filing ACs.
    This is the key structural difference between S8 and S2/S13: S8 governance delivery is
    expressed as CI/CD gate conditions (testable) rather than regulatory correspondence and
    committee ratification (human-only). story_testability = 2 is unambiguous here.
  artefacts_dir: runs/config-B-S8/
  config_a_comparison: >
    Config A S8 aq=0.80 {2,2,1,2,1}; Config B S8 aq=1.00 {2,2,2,2,2}.
    Delta = +0.20. story_testability 1→2: Opus governance story design uses CI/CD gates
    (automatable) vs Config A's human-verification-required ACs. dor_gate_quality 1→2:
    Config B primary hypothesis CONFIRMED for S8 — all six gate owners named in CAI blocks.
    This is the largest AQ delta in the experiment so far (S2: delta=0, S8: delta=+0.20).
    The Opus front-loading advantage is not merely on dor_gate_quality but also on
    story_testability — the /definition output shapes how governance ACs are expressed.
  notes: >
    Config B (Opus at /discovery + /definition; Sonnet at /review + /test-plan + /dor).
    All 5 constraints propagated (C1 RBNZ s.2.1/s.4.2, C2 FMA s.4.2, C3 human sign-off,
    C4 normalisation methodology adjustment, C5 Excel macro governance gap).
    DoR verdict: PROCEED (all hard blocks pass; eval-mode waivers for H2/H4/H5/H6/H-GOV/H-NFR-profile).
    Oversight: HIGH. 14 deployment-configuration field names enforced in 6 CAI hard blocks.
    Gate owner survival check: ALL SIX NAMED GATE OWNERS SURVIVED from /definition Step 4a
    table into Coding Agent Instructions with non-delegable constraints explicitly stated.
    story_testability = 2 confirmed in test-plan CPF-TRACE: CI/CD gate enforcement pathway
    makes all governance stories automatable. Config B AQ premium over Config A = +0.20.

- story: S13
  config: B
  date: 2026-05-17
  model_discovery: claude-opus-4-6
  model_definition: claude-opus-4-6
  model_review: claude-sonnet-4-6
  model_test_plan: claude-sonnet-4-6
  model_dor: claude-sonnet-4-6
  cpf_general: 1.00
  cpf_regulated: 1.00
  nz_leg_cpf: 1.00
  au_leg_cpf: 1.00
  cross_border_cpf: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery
  c5_surface_mechanism: "three-signal compositional reasoning (Opus-authored): TTPS-SWIFT-001 (JPMorgan Chase active SWIFT correspondent for NZD/AUD) + TTPS-RISK-001 (impact of proprietary channel on correspondent relationship not assessed; severity: HIGH) + ADR-CB-002 Note (correspondent agreements may contain routing restriction terms; notification obligation must be confirmed before routing change). C5 elevated to R1 with contractual non-delegable classification (Treasury Legal Counsel sole authority)."
  c5_surfacing_quality: full
  c5_surfacing_notes: >
    Opus discovery reproduced the same three-signal compositional inference as Config A S13,
    but elevated C5's ownership boundary more explicitly: Treasury Legal Counsel non-delegable
    to any regulatory function (RBNZ AML/CFT, AUSTRAC, Regulatory Affairs) named in discovery
    with C5 contractual vs regulatory distinction. This boundary survived intact through all
    five stages into DoR Hard Block 5 with explicit rejection reason for any regulatory-function
    authorisation attempt.
  dor_verdict: PROCEED
  dor_gate_quality: 2
  gate_owner_propagation: CONFIRMED
  gate_owner_simplification_detected: false
  aq: 0.90
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 2
    story_testability: 1
    nfr_specificity: 2
    dor_gate_quality: 2
  aq_overrides: []
  aq_override_notes: >
    story_testability scored 1 (not 2): Epic 1 governance ACs (AC1–AC2 per story, 5 stories)
    describe compliance-officer document-filing and regulatory notification deliverables that
    are precise but require human verification of document substance — same rubric structural
    gap as Config A S13 and Config B S2. The enforcement mechanism (document-ID change-control
    in AC3+) is automated; the filing action itself is not. This is a scenario-structural ceiling,
    not a model-quality difference. Opus does not restructure ACs to eliminate the human-gate
    pattern; it preserves the compliance-delivery / enforcement-mechanism separation throughout.
    dor_gate_quality = 2 (clear): all five flags have named responsible parties with non-delegable
    boundaries; C5 Hard Block 5 includes explicit rejection reason for regulatory-function
    authorisation. Gate owner integrity check (user-specified): PASSED — no collapse to generic
    'Compliance Officer'; C5 contractual/not-regulatory boundary preserved.
  artefacts_dir: runs/config-B-S13/
  config_a_comparison: >
    Config A S13 aq=0.90 {2,2,1,2,2}; Config B S13 aq=0.90 {2,2,1,2,2}.
    Delta = 0.00. story_testability: 1→1 (no change — ceiling is structural, not model-quality
    dependent). dor_gate_quality: 2→2 (parity — Config A S13 already achieved the full 2 on this
    dimension). H5 AQ premium hypothesis: NOT CONFIRMED for S13. Opus front-loading produces
    equivalent AQ on S13. Contrast with S8 Config B (delta=+0.20): the Opus advantage on
    story_testability is story-specific — it manifests when Opus redesigns governance ACs to use
    CI/CD gates (S8), but not when the scenario inherently requires human-verification-required
    compliance-delivery ACs (S13). CPF parity (1.00 = 1.00): both configs propagate all five
    constraints through all stages. Multi-jurisdiction CPF breakdown identical: nz_leg=1.00,
    au_leg=1.00, cross_border=1.00 for both Config A and Config B.
  notes: >
    Config B (Opus at /discovery + /definition; Sonnet at /review + /test-plan + /dor).
    All 5 constraints propagated (C1 RBNZ AML/CFT Act 2009, C2 AUSTRAC AML/CTF Act 2006 (Cth),
    C3 RBNZ FX Transaction Reporting NZD $100,000 threshold, C4 PSR 2021 / DIA written
    determination, C5 SWIFT JPMorgan Chase correspondent agreement clause — contractual).
    DoR verdict: PROCEED. Oversight: HIGH. Five deployment flags default=false; all five
    must be true before live activation. Gate owner integrity check: PASSED — no simplification
    from definition Table 3 through Coding Agent Instructions Hard Blocks 1–5.
    Multi-jurisdiction CPF sub-scores: nz_leg_cpf=1.00, au_leg_cpf=1.00, cross_border_cpf=1.00.
    AQ finding: Opus front-loading produces no AQ premium on S13. H5 confirmation status
    for S13 specifically: NOT CONFIRMED (delta=0.00). Running H5 scorecard:
    S2 delta=0.00, S8 delta=+0.20, S13 delta=0.00. H5 holds for S8 scenario type
    (CI/CD-gate governance stories); does not hold for compliance-delivery-AC scenario type.
- story: S2
  config: C
  date: 2026-05-17
  model_discovery: claude-sonnet-4-6
  model_definition: claude-haiku-4-5
  model_review: claude-haiku-4-5
  model_test_plan: claude-haiku-4-5
  model_dor: claude-haiku-4-5
  cpf_general: 1.00
  cpf_regulated: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery (pre-run) + /definition (dedicated gate story E3.2) + /test-plan (3 test cases)
  c5_surface_mechanism: "Sonnet /discovery found three-signal C5: operator brief non-disclosure statement + EA registry CDM-RISK-001 HIGH signal (retroactively softened from CRITICAL post-run 2026-05-17) + FMA Principle 3 disclosure obligation. Haiku /definition propagated C5 as explicit E3.2 hard blocker gate story with three resolution paths (FMA notification, legal opinion, remediation plan). All downstream stages (review, test-plan, DoR) carried C5 forward without simplification."
  c5_surfacing_quality: partial
  dor_verdict: PROCEED
  dor_gate_quality: 1
  gate_owner_propagation: PARTIAL
  aq: 0.70
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 2
    story_testability: 1
    nfr_specificity: 1
    dor_gate_quality: 1
  aq_overrides: []
  aq_override_notes: "Scored by claude-sonnet-4-6 judge. problem_framing=2: both gaps (competitive ASB/ANZ same-day vs 3-5d manual; regulatory FMA+CCCFA) named; 4 scoped personas; measurable indicators (within minutes, >=70% auto-approval). scope_discipline=2: MVP bounded (<=30k, existing customers); 6 explicit OOS items; 7 proportionate stories. story_testability=1: E1.2 AC2/AC4 use e.g. for rationale text (interpretation space); T1.1.3 states 'clear and actionable'. nfr_specificity=1: C2.1 and C3.1 are label-reference checks (verify dependency note exists) without citing FMA Principle 2 or DSA clause. dor_gate_quality=1: all 5 constraints gated, adversarial cases present; C1 owner 'Legal and Compliance' (team) and C3 owner 'Partnerships' (dept) — generic vs Config B's named functional roles."
  artefacts_dir: runs/config-C-S2/
  notes: >
    Config C (Sonnet /discovery only; Haiku /definition–/DoR). All 5 constraints
    propagated (C1 CCCFA, C2 FMA, C3 Centrix DSA, C4 decision ceiling, C5 FMA
    disclosure). CPF: 1.00 general, 1.00 regulated. C5 surfacing: partial
    (post-run injection correction: CDM-RISK-001 severity softened from CRITICAL to HIGH;
    c5_surfacing_quality retroactively aligned with Config A/B assessment).
    DoR verdict: PROCEED with conditions (C1, C2, C3 external prerequisites).
    Oversight: HIGH. AQ: 0.70 — scored by claude-sonnet-4-6 judge (prior Haiku
    self-assessment replaced). Top of acceptable band; constraint propagation thorough
    but testability precision and gate owner specificity show typical cost-config gaps.

- story: S8
  config: C
  date: 2026-05-17
  model_discovery: claude-sonnet-4-6
  model_definition: claude-haiku-4-5
  model_review: claude-haiku-4-5
  model_test_plan: claude-haiku-4-5
  model_dor: claude-haiku-4-5
  cpf_general: 1.00
  cpf_regulated: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery (Sonnet) + /definition (Haiku structured as B2 blocker)
  c5_surface_mechanism: "Sonnet /discovery identified two-signal premise (RRPL-RISK-002 single-author macro + FMA s.4.2 methodology disclosure). Haiku /definition named the governance gap (no-independent-review pattern) but did not elaborate the RBNZ Act 2021 s.93 consequence that Config B named. C5 was propagated as B2 pre-go-live blocker with Compliance Officer enforcement owner (less specific than Config B's named CFO/Finance Operations Manager/Treasury Ops Manager roles)."
  c5_surfacing_quality: partial
  c5_surfacing_notes: "Config B scored full surface (consequence chain explicit); Config C surface is partial (governance gap named without regulatory consequence elaboration). Factual premise (RRPL-RISK-002, FMA s.4.2) is the injection source; governance gap naming is model inference; no consequence chain."
  dor_verdict: PROCEED
  dor_gate_quality: 1
  gate_owner_propagation: PARTIAL
  gate_owner_notes: "Enforcement named as generic 'Compliance Officer', not split into six role-specific gates as Config B. C-GATE-1 and C-GATE-3 list specific fields but do not name Treasury Operations Manager role."
  aq: 0.80
  aq_dimensions:
    problem_framing: 2
    scope_discipline: 2
    story_testability: 1
    nfr_specificity: 2
    dor_gate_quality: 1
  aq_overrides: []
  aq_override_notes: "story_testability=1: same rationale as Config A S8. nfr_specificity=2: NF-NORM-001/NF-AUD-001 reference specific field requirements (transform_rule_id, business_day_ci_run_date) — same precision as Config A. dor_gate_quality=1: all gates present, but gate owner specificity gap vs Config B. Config B S8 scored dor_gate_quality=2 because it named six non-delegable roles; Config C S8 scores 1 because it consolidates to 'Compliance Officer' with no role split."
  artefacts_dir: runs/config-C-S8/
  config_a_comparison: "Config A S8 aq=0.80 {2,2,1,2,1}; Config C S8 aq=0.80 {2,2,1,2,1}. Delta=0.00. story_testability and dor_gate_quality both map to Config A S8 scores (both scored 1). Unlike Config B S8 (delta +0.20), Haiku /definition does not restructure governance stories to use CI/CD gates — it preserves the human-verification-required pattern. dor_gate_quality remains at 1 (generic roles). CPF parity (1.00=1.00): both Config A and Config C propagate all five constraints. C5 surfacing quality: Config A partial, Config C partial (same assessment)."
  notes: >
    Config C (Sonnet /discovery only; Haiku /definition–/DoR). All 5 constraints
    propagated (C1 RBNZ s.2.1/s.4.2, C2 FMA s.4.2, C3 human sign-off, C4 normalisation
    methodology, C5 Excel macro governance gap). DoR verdict: PROCEED (all hard blocks pass).
    Oversight: HIGH. C5 surfacing: partial (governance gap named without regulatory
    consequence). CPF: 1.00 general, 1.00 regulated. AQ=0.80 (same as Config A; no
    Opus-driven improvement). Gate owner propagation: PARTIAL. Haiku cost-config trade-off:
    CPF parity with Config A, but dor_gate_quality and C5 consequence elaboration both less
    specific than Config B.

- story: S13
  config: C
  date: 2026-05-17
  model_discovery: claude-sonnet-4-6
  model_definition: claude-haiku-4-5
  model_review: claude-haiku-4-5
  model_test_plan: claude-haiku-4-5
  model_dor: claude-haiku-4-5
  cpf_general: 1.00
  cpf_regulated: 1.00
  nz_leg_cpf: 1.00
  au_leg_cpf: 1.00
  cross_border_cpf: 1.00
  c5_surfaced: true
  c5_surface_stage: /discovery (Sonnet) + /test-plan (Haiku explicit AC requirement for JPMorgan Chase acknowledgement)
  c5_surface_mechanism: "Sonnet /discovery identified three-signal compositional reasoning (TTPS-SWIFT-001 correspondent ID + TTPS-RISK-001 impact gap + ADR-CB-002 routing restriction note). Haiku /definition propagated C5 as Story 1.4 hard blocker with Haiku-specific framing: 'correspondence review required' with no elaboration of contractual vs regulatory distinction. Haiku /test-plan added explicit AC verification step for 'JPMorgan Chase written acknowledgement' (if required)."
  c5_surfacing_quality: full
  c5_surfacing_notes: >
    First Config C full C5 surface (previously Config C S2/S8 partial). Unlike Config C S8
    where consequence was omitted, C5 is carried forward through all five stages with explicit
    test-plan verification step. Haiku /definition did not name the contractual/regulatory
    boundary distinction (Config B's explicit 'Treasury Legal Counsel non-delegable' gate),
    but /test-plan introduced the acknowledgement verification gate implicitly by adding
    'JPMorgan Chase written acknowledgement received' to AC3 of Story 1.4. This is an
    emergent gate (arises from test plan specificity, not DoR hard block framing).
  dor_verdict: PROCEED
  dor_gate_quality: 1
  gate_owner_propagation: PARTIAL
  gate_owner_simplification_detected: false
  gate_owner_notes: "Five flags present (Story 1.1–1.4, 2.1 gate owners); all named functionally (RBNZ Compliance Lead, Treasury Lead NZ, Regulatory Affairs Lead, Treasury Lead + Legal Counsel, Enterprise + Australian Counterpart Compliance Leads). Haiku preserved multi-jurisdiction specificity (no collapse to generic roles). However, gate ownership language is less precise than Config B: 'Enterprise Compliance Lead + Australian Counterpart Compliance Lead' vs Config B's named Legal Counsel non-delegability boundary for C5."
  aq: pending
  aq_status: requires_sonnet_judge_scoring
  aq_dimensions: null
  aq_override_notes: "AQ scoring deferred to separate Sonnet judge session (Haiku self-assessment not used; Sonnet judge assigned per Config C S2/S8 protocol). Expected range: 0.70–0.80 based on Config C pattern (cost-config trade-off on nfr_specificity and dor_gate_quality, but full CPF propagation and multi-jurisdiction boundary preservation)."
  artefacts_dir: runs/config-C-S13/
  config_a_comparison: >
    Config A S13 aq=0.90 {2,2,1,2,2}; Config C S13 aq=pending. CPF parity (1.00=1.00).
    Multi-jurisdiction CPF sub-scores identical: nz_leg=1.00, au_leg=1.00, cross_border=1.00
    for both Config A and Config C. C5 surfacing: both full (both identify the three-signal
    compositional inference; both carry C5 through all stages). Expected AQ delta: 0.00–0.10
    based on Config C S2/S8 pattern (nfr_specificity and dor_gate_quality gaps). If AQ delta
    on S13 is identical to S8 (delta=0.00), this indicates Haiku cost-config trade-off is
    consistent across governance and multi-jurisdiction scenarios.
  notes: >
    Config C (Sonnet /discovery only; Haiku /definition–/DoR). All 5 constraints
    propagated with multi-jurisdiction specificity (C1 RBNZ AML/CFT Act 2009, C2 AUSTRAC
    AML/CTF Act 2006 (Cth), C3 RBNZ FX Transaction Reporting, C4 DIA Payment Services
    Regulations, C5 SWIFT JPMorgan Chase correspondent agreement clause). DoR verdict:
    PROCEED. Oversight: HIGH. Five deployment flags all named with jurisdiction-specific
    roles (no collapse to generic 'Compliance Officer'); C5 emergent gate arises from
    test-plan verification step. Multi-jurisdiction CPF sub-scores: nz_leg_cpf=1.00,
    au_leg_cpf=1.00, cross_border_cpf=1.00. Gate owner integrity check: PASSED (no
    simplification from /definition regulatory gate ownership table). C5 surfacing quality:
    full (three-signal inference carried through all five stages with test-plan explicit
    acknowledgement gate). CPF finding: Config C S13 achieves CPF=1.00 at equivalent depth
    to Config A/B (multi-jurisdiction boundaries preserved; no constraint collapse).
    Haiku cost-config trade-off: CPF parity, but dor_gate_quality expected to remain <2.0
    (gate ownership language less precise than Config B's named non-delegability boundaries).

# Example entry template (for future runs):
# - story: SX
#   config: A
#   date: YYYY-MM-DD
#   ...
```

## Cross-reference

- **EXP-003** (`workspace/experiments/EXP-003-pipeline-eval/manifest.md`) — S1 baseline, routing policy derivation, CPF methodology source
- **Meta-review F16** (`workspace/eval-framework-review/2026-05-15-meta-review.md`) — motivating finding for EXP-008
- **Corpus S2–S7** (`workspace/handoffs/pipeline-corpus-S2-S7.md`) — full constraint inventories and operator briefs
- **Corpus S8–S13** (`workspace/handoffs/pipeline-corpus-S8-S13.md`) — full constraint inventories, adversarial scenario design notes, context injection maps
- **Context injection files** (`corpus/context-injection/`) — S8–S13 files present; S2–S7 complete (9 files, 2026-05-17)
- **AQ judge prompt** (`judge-prompts/aq-scoring-prompt.md`) — operator runbook, rubric, prompt template, human review workflow
