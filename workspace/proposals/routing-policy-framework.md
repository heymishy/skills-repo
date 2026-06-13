# Routing Policy Framework

**Status:** Measurement-backed for all outer-loop skills (discovery, definition, review, test-plan, DoR, definition-of-done); provisional for /benefit-metric only (no experiment)
**Governed by:** Platform change policy — changes to this document require a pipeline story + PR + platform team review
**Measurement_backed updates:** Any routing table update must cite the `experiment_id` that produced the evidence. Undocumented routing changes are out-of-process.

---

## Purpose

This document defines the model routing policy for the skills pipeline: which model is used for which skill, scenario, and input type. It is the formalised output of the eval programme described in `workspace/experiments/eval-programme-roadmap.md`.

Routing decisions at three levels:

1. **Skill-level routing** — which model handles each pipeline skill
2. **Scenario routing** — whether context files are injected (Scenario 2) or not (Scenario 1), and the consequences for model selection
3. **Input-type routing** — which input characteristics require model upgrades or local model use

---

## Cost layers

All routing decisions must account for two distinct cost layers. Every cost figure in this document should specify which layer it applies to.

**Layer 1 — GitHub Copilot AI Credits (VS Code model selector):** Cost is measured in AI Credits, which are consumed at a per-model multiplier rate relative to Claude Sonnet 4.6 (1x baseline). This is the cost layer for all manually-run, VS Code-based pipeline sessions.

**Layer 2 — Direct API (programmatic via `run-model-sweep.js`):** Cost is measured in dollars per million input/output tokens at published API rates. This is the cost layer for automated sweeps and CI-driven eval runs.

**Key Layer 1 multipliers (verified 2026-05-12):**

| Model | Layer 1 multiplier | Layer 2 rate (input/output per M) |
|-------|-------------------|-----------------------------------|
| claude-opus-4-7 | 15x | $5.00/$25.00 (API string confirmed 2026-05-12; claude-opus-4-6 also valid as API string) |
| claude-sonnet-4-6 | 1x (baseline) | $3.00/$15.00 |
| claude-haiku-4-5 | 0.33x | $1.00/$5.00 |
| gpt-4o | 0x (free) | ~$2.50/$10.00 (TODO: verify) |
| gpt-4.1 | 0x (free) | TODO: verify |
| gpt-5-mini | 0x (free) | TODO: verify |

**Routing implication:** A model with a 0x Layer 1 multiplier has zero Copilot credit cost regardless of Layer 2 API rates. If EXP-002a confirms GPT-4o meets quality threshold on T1 and T3, it becomes the cost-optimal routing for non-regulated generative stages under Layer 1 — regardless of quality differential with Sonnet where both pass threshold.

For Layer 2 rates, always check the PRICING map in `scripts/run-model-sweep.js` (canonical source) and verify against published pricing before running large sweeps.

---

## Production caveats — validated routing

> **Read this section before using Haiku routing for any regulated-domain story.**

### /definition — regulated story caveat (LIFTED — EXP-003 Config C run 3 complete 2026-05-16)

**Status: CAVEAT LIFTED ✅**

EXP-003 Config C run 3 (2026-05-16) validated that Haiku maintains regulated CPF = 1.00 at `/definition` when Step 4a (regulated constraint propagation check) is active in `.github/skills/definition/SKILL.md` (commit acdc349 verified).

**Evidence:**
- Config C run 3 regulated CPF = 1.00 (5/5 constraints: C2 PCI DSS, C3 AML/CFT, C5 audit gap all propagated to DoR HARD GATE)
- Step 4a fired correctly during /definition, enforcing C2 and C3 presence in S1.2 and S2.2 Architecture Constraints
- Haiku downstream stages (/review, /test-plan, /definition-of-ready) all propagated constraints correctly
- Layer 2 CPS: ~$0.70 (53% cost savings vs Config A uniform Sonnet ~$1.50)

**Previous caveat context:** Config C run 2 (Sonnet at definition) showed CPF = 0.68 on regulated constraints due to vertical-slice decomposition strategy (not a model-specific failure). Config C run 3 (Haiku at definition with Step 4a active) achieved CPF = 1.00, confirming the Step 4a fix works regardless of model choice.

**Routing consequence:** `/definition` now defaults to `claude-haiku-4-5` for both regulated and non-regulated stories. No Sonnet override required when Step 4a is active in the SKILL.md (verified in commit acdc349).

---

## Current routing policy

**Status:** Measurement-backed for all outer-loop skills; see caveats section above for /definition regulated story override.

| Skill | Current model | Evidence basis | measurement_backed | Review trigger |
|-------|--------------|----------------|--------------------|----------------|
| /discovery (non-regulated input) | claude-sonnet-4-6 | EXP-002a: T1+T3 avg 0.807, 6/6 pass rate. EXP-010 S-series extension (13 cases, 2 trials): avg 0.617, cost frontier at ~$0.059/passing trial. Sonnet is the Pareto frontier — no tested model is both cheaper and higher quality. | true (`experiment_id: EXP-002a, EXP-010-fable5-model-sweep`) | EXP-021 (Haiku S-series — tiered routing candidate) |
| /discovery (non-regulated, easy/medium cases, cost-optimised) | ~~claude-haiku-4-5~~ → **claude-sonnet-4-6** | **EXP-021 HOLD (2026-06-13): 0/22 pass rate across all 11 S-series cases.** Failure modes are capability-level: S2 fabricated regulatory constraints not present in input (hallucinated FMA bias audit from domain pattern-matching); S4 wrong output format (consulting report vs discovery artefact); S12 near-total failure (0.098). EXP-002a T1/T3 approval does not generalise to S-series corpus. Tiered routing at any difficulty tier is NOT viable. **EXP-026 (tiered routing validation) CANCELLED** — precondition (H1 confirmed) not met. | true (`experiment_id: EXP-002a`) for T1/T3 only; EXP-021 HOLD for all S-series tiers | EXP-026 CANCELLED |
| /discovery (regulated input, non-S-hard) | claude-sonnet-4-6 | EXP-002a: D7 T3 = 0.900 (above 0.80 regulated threshold). EXP-010: Sonnet remains frontier on S-series regulated cases. | true (`experiment_id: EXP-002a, EXP-010-fable5-model-sweep`) | EXP-003 (CPF validation) |
| /discovery (regulated input, S-hard — S9-S13 class) | claude-sonnet-4-6 + context-regulated.yml | EXP-020: S13 0.995 (+0.378, 2/2). EXP-025b: S11 0.897 (2/2). EXP-025c: S9 0.956 (2/2), S12 0.846 (2/2). S10 unresolved (judge infra failure, EXP-020). S12 shows high variance (EXP-025b: 0.524 1/2; EXP-025c: 0.846 2/2) — pooled 3/4 pass. Without context: S-hard 0.49–0.73 (below pass threshold). With context: S9/S11/S13 consistently ≥ 0.897, S12 high-variance. Haiku+context NOT viable (EXP-020: S13 0.306). | true (`experiment_id: EXP-020, EXP-025b, EXP-025c`) | S10 re-run (judge infra fix); S12 variance investigation |
| /discovery — context injection directive (regulated NZ banking eval runs) | context-regulated.yml with `eval_mode` directive | **Mandatory for batch/eval mode.** `eval_mode.single_turn: true` + imperative instruction ("Asking a question instead of producing the artefact is a protocol violation in this context"). Without directive: EXP-013 clarification gate fires on regulated inputs — ambiguity surfaces as clarification request, not scoreable artefact. With directive: complete discovery artefact produced on first turn; ambiguities surface as labelled assumptions. Validated in EXP-025b. Does not affect interactive (REPL/chat) sessions where operator is present. | true (`experiment_id: EXP-025b-regulated-context-eval-mode`) | Context file position in system prompt (directive must load before SKILL.md clarification gate) |
| /definition | claude-haiku-4-5 | EXP-005: all 4 cases pass at 0.33× Sonnet cost; measurement_backed: true | true (`experiment_id: EXP-005`, 2026-05-14) | Corpus expansion or categorical fail |
| /review (default) | claude-haiku-4-5 | EXP-006: FDR_HIGH 1.00 across T1–T3 both trials (6/6 adversarial cases); zero phantom HIGHs on T5; avg weighted 0.98; no categorical fails. Approved at 0.33× Sonnet cost. | true (`experiment_id: EXP-006-review-rubric`, 2026-05-14) | Corpus expansion or categorical fail trigger |
| /review (direct-author override) | claude-sonnet-4-6 | EXP-006: FDR_HIGH 1.00 both trials; identical gate performance to Haiku but adds causal chain reasoning, explicit fix text, and downstream impact articulation — higher value when review output is delivered directly to story author or compliance reviewer. | true (`experiment_id: EXP-006-review-rubric`, 2026-05-14) | Default if direct-author context confirmed |
| /test-plan (non-regulated stories) | claude-haiku-4-5 | EXP-007: TCF 1.00 both trials, zero categorical fails (5/5 cases × 2 trials). All T3/T4/T5 adversarial traps defeated. 0.33× Sonnet cost. | true (`experiment_id: EXP-007-testplan-rubric`, 2026-05-16) | Corpus expansion or categorical fail trigger |
| /test-plan (PCI/compliance-classified stories) | claude-haiku-4-5 | EXP-007R: Haiku D3=1.0 on T5 after NFR scope rule (commit a8e09c8). NFR-SEC-1 test body contains only negative-constraint assertions (`.not.toContain` on logs and database records). No AC1 gateway assertion present. Weighted score 0.925. EXP-007 D3=0.7 scope-mixing pattern eliminated. | true (`experiment_id: EXP-007R-testplan-nfr`, 2026-05-16) | Corpus expansion or categorical fail trigger |
| /definition-of-ready | claude-haiku-4-5 | EXP-004: GF 1.00 trials 1+2, 0 categorical fails, all 4 adversarial traps defeated. Default at 0.33× Sonnet cost. | true (`experiment_id: EXP-004-dor-rubric`, 2026-05-14) | Corpus expansion or categorical fail trigger |
| /definition-of-ready (fallback) | claude-sonnet-4-6 | EXP-004: GF 1.00 trials 1+2. Escalate on categorical fail trigger only. | true (`experiment_id: EXP-004-dor-rubric`, 2026-05-14) | Corpus expansion |
| /benefit-metric | claude-sonnet-4-6 | Provisional | After EXP-LOCAL-001 if L1 local model available |
| /definition-of-done | claude-haiku-4-5 | EXP-015: H1 effectively confirmed — 21/21 valid trials PASS (WS 0.840–1.000), gate_fidelity_correct=true on all trials, zero false positives. T2 D1 avg 0.867 (thin evidence verbosity, not missed defect). 0.33× Sonnet cost. EXP-016: C2 safety gate cleared — T5+T6 (C2-present cases) 4/4 PASS, gate_fidelity_correct=true, 0 fabricated governance gates, no categorical fails. Unconditional — no routing split required for regulated banking stories. EXP-019: Pipeline fidelity confirmed — DoD gate correctly parsed real pipeline-format bundle (S5 crm.2 story), evaluated all 5 ACs against test plan, verified vulnerability policy NFR, returned COMPLETE with no fabricated governance gates. Bundle format compatible: `>` operator trigger, `###` inner headings, fenced PR description, `##` terminator. | true (`experiment_id: EXP-015-dod-calibration + EXP-016-dod-c2-validation + EXP-019-pipeline-fidelity`, 2026-06-12) | EXP-017: per-AC evidence citation + metric-signal confirmation improvement (T2 D1/D5 quality gap) |

---

## Scenario routing decision tree

```
For each skill run:

1. Does the skill require context files (Scenario 2 or 3)?
   └── No → Use Scenario 1 routing table (above)
   └── Yes → Go to step 2

2. Is data_classification_check.approved_for_external_api = true?
   └── No → REQUIRED: use local-* model only
             └── Does a local model of sufficient tier exist? (see capability-tiers.md)
                 └── No → Cannot run this skill until local model qualified or context files sanitised
                 └── Yes → Use the highest-tier available local model
   └── Yes → Go to step 3

3. Is this a regulated input? (see regulated input definition below)
   └── Yes → Use cloud Opus or equivalent (see regulated input routing)
   └── No → Use standard Scenario 2 routing (cloud Sonnet or higher)

4. For non-regulated inputs: which Layer 1 cost tier applies?
   └── If running via Layer 1 (VS Code Copilot) → Go to step 5a
   └── If running via Layer 2 (direct API) → Go to step 5b

5a. Does any compliant model have a 0x Copilot multiplier?
   └── Yes AND EXP-002a H5 confirmed for this skill/tier:
         Zero-cost model is the routing choice. Confirm it is in the compliant list from step 3.
         GPT-4o, GPT-4.1, GPT-5-mini are candidates when H5 is confirmed.
   └── Yes but EXP-002a H5 not yet confirmed:
         Use Sonnet as interim. Note in run metadata that H5 recheck is pending.
   └── No 0x model is compliant:
         Apply standard Layer 1 cost comparison (lowest multiplier among compliant models).

5b. Apply Layer 2 cost comparison using PRICING map in run-model-sweep.js.
    Use the lowest-cost model that meets the quality threshold for this skill tier.
```

---

## Regulated input routing

### Definition — what counts as a "regulated input"

An input is a regulated input if the operator's brief, or any context file loaded for the run, references:

- **AML/CFT obligations** — transaction record retention, suspicious activity reporting, customer due diligence requirements
- **PCI DSS** — payment card data, QSA assessment obligations, cardholder data environment
- **Prudential banking regulation** — capital requirements, operational risk policy, business continuity obligations mandated by the relevant regulatory authority
- **Data residency obligations** — any requirement that data must be stored in a specific jurisdiction, including statutory requirements under national data protection or banking legislation

### Regulated input routing rule — non-negotiable

**When input is regulated:**
- Required model: a cloud model with demonstrated T3 D7 ≥ 0.80 on the regulated input corpus. As of EXP-002a, claude-sonnet-4-6 (D7 T3 = 0.900) meets this threshold and is the routing default.
- Prohibited at /discovery: claude-haiku-4-5 (D7 T3 gap — not measured at regulated threshold; EXP-002a evidence); any local-* model at tier L1 or L2 (regardless of general T1/T3 scores)
- Prohibited at /definition: no model-level prohibition is currently evidenced — see slicing strategy risk note below
- Prohibited: gpt-4o and gpt-4o-mini — EXP-002a confirmed both fail all regulated cases on D4/D5/D7
- Opus exception: claude-opus-4-7 may still be preferred if the operator has domain-specific reasons for requiring higher D5 assumption quality (near 1.0 on T1 and T3), with a RISK-ACCEPT logged in `decisions.md` citing the cost premium (15x over Sonnet)

**This rule applies regardless of cost savings.** A configuration that saves $X per story but loses one PCI DSS constraint in the DoR contract has failed the governance requirement.

**Vertical-slice decomposition risk at /definition (EXP-003 evidence — 2026-05-14):** Vertical-slice slicing strategy in /definition is a **regulated CPF risk, independent of model.** EXP-003 Config C run 2 used Sonnet for /definition (not Haiku — Haiku was never used at /definition in any completed run). The regulated CPF failure (C2 chain = 0.35) was caused by Sonnet choosing vertical-slice decomposition with no regulatory risk rationale. When vertical-slice is chosen: cross-cutting regulatory process gates (C2 type: "external assessment required before go-live") are assigned to preparation stories (scoping, initial engagement) but are not carried forward as Architecture Constraints in every story that makes a change within the gate's scope. In contrast, Config A Sonnet chose risk-first and named C2 as motivation — producing full C2 propagation across all affected stories. A secondary compounding failure: the post-decomposition self-check propagation table validated "constraint appears somewhere in the feature" rather than "constraint appears in every story whose implementation scope triggers the gate" (false positive). `experiment_id: EXP-003-pipeline-eval`, run: config-C-run-2, date: 2026-05-14. See runs/config-C-run-2/cpf-scores.md findings F6 and F7. A /definition SKILL.md update to enforce per-story regulated constraint coverage is pending (EXP-004 will validate the fix).

### Exception protocol

If a regulated-input run must proceed with a non-Opus model (e.g. cost emergency, model unavailability):
1. Log a RISK-ACCEPT in the feature's `decisions.md`
2. Add an explicit "constraint audit" step in the DoR contract: "reviewer must verify all regulatory constraints from discovery artefact appear in test plan NFRs"
3. The exception is valid for one run only — not a standing permission

---

## Local model routing

### Local model permitted conditions

A local model is permitted when:
- `data_classification_check.approved_for_external_api = false` (required, not merely permitted)
- OR cost reduction is the goal AND the skill is in the "L1 sufficient" or "L2 sufficient" category
- AND the local model has a confirmed tier in `local-model-scaffolding/model-registry.md`

### Local model required conditions

A local model is REQUIRED (cloud model prohibited) when:
- `data_classification_check.approved_for_external_api = false`
- This is enforced by the harness guard in `provider-spec.md`

### Local model prohibited conditions

A local model is PROHIBITED when:
- Input is a regulated input (see regulated input definition above) — regardless of local model tier
- The local model's tier is L1 and the skill requires L2 or L3 capability
- The local model's tier is L2 and the skill requires L3 capability
- The local model has no entry in the model registry (untiered)

---

## Cost-performance frontier

**Full analysis:** `workspace/proposals/cost-performance-frontier.md`

The eval programme (EXP-010 through EXP-020) has established routing policy per skill. The frontier analysis determines whether cheaper models can meet the quality threshold — specifically: which models are on the Pareto frontier (no tested model is both cheaper AND higher quality)?

### Discovery frontier positions (Layer 2, cost/passing trial)

| Model | Avg score | Cost/passing trial | Frontier position |
|-------|-----------|-------------------|-------------------|
| claude-haiku-4-5 | 0/22 pass (EXP-021) | N/A — 0 passing trials | **DISQUALIFIED** — EXP-021 HOLD: capability-level failure (fabricated constraints, format failure) |
| claude-sonnet-4-6 (no context) | 0.617 | ~$0.059 | **FRONTIER** (cost-quality, non-regulated and easy/medium) |
| **claude-sonnet-4-6 + context-regulated.yml** | **0.883 S-hard avg (4 cases confirmed)** | ~$0.072 (context adds ~$0.013/run) | **FRONTIER (production-required for S-hard regulated)** — not optional |
| claude-opus-4-8 | 0.594 S-hard avg (EXP-024) | ~$0.340 | **DOMINATED** — EXP-024: 0/8 pass, underperforms Sonnet no-context on S10/S11/S13. Quality-premium model without context injection does not substitute for Sonnet+context. Context injection is the critical mechanism, not model tier. |
| claude-opus-4-6 | 0.571 | $0.145 | DOMINATED by Sonnet |
| gpt-5.4 | 0.480 | $0.516 | DOMINATED by Sonnet |
| gpt-4.1 | 0.419 | $0.513 | DOMINATED by Sonnet |

\* Fable 5 S-hard scores understated due to 4096-token truncation (EXP-010 scorecard Section 9). EXP-024 was originally planned with Fable 5 but pivoted to claude-opus-4-8 due to US export control directive making Fable 5 unavailable. EXP-024 manifest updated; Opus 4.8 re-runs at 8192 tokens against same S10-S13 cases.

**Frontier knowns (post EXP-021):**
- Haiku S-series: **DISQUALIFIED** — 0/22 pass, capability-level failures. T1/T3 approval (EXP-002a) does not generalise. EXP-026 cancelled.
- Sonnet + context injection: **production-required configuration** for S-hard regulated cases. 0.924 S-hard avg vs 0.617 no-context baseline (+0.307). Not a quality-of-life addition — without it, S-hard cases fall below pass threshold.

**Remaining frontier unknowns:**
- GPT format-neutral (EXP-022): if any GPT model passes with format-neutral SKILL.md, it enters as the 0x Layer 1 frontier for non-regulated discovery

**Resolved (EXP-024):** Opus 4.8 no-context S-hard: DOMINATED — 0.594 avg, underperforms Sonnet no-context (0.618) on most cases, far below Sonnet+context (0.883). Quality-premium model without context injection is NOT a substitute. Context injection is the critical mechanism.

---

## Regulated context injection findings

**Summary:** Context injection via `context-regulated.yml` is the confirmed quality lever for S-hard regulated discovery. It is not a supplementary enhancement — without it, S-hard cases score below pass threshold regardless of model capability.

### Per-case lift table

| Case | No-context score | +context score | Delta | Source | Status |
|------|-----------------|----------------|-------|--------|--------|
| S9 | 0.643 (EXP-010 Sonnet) | 0.956 | +0.313 | EXP-025c | **CONFIRMED** 2/2 pass |
| S10 | 0.628 (EXP-010 Sonnet) | — | — | EXP-020 (judge failure — infrastructure artefact) | UNRESOLVED |
| S11 | 0.734 (EXP-010 Sonnet) | 0.897 | +0.163 | EXP-025b | **CONFIRMED** 2/2 pass |
| S12 | 0.495 (EXP-010 Sonnet) | 0.524 (EXP-025b) / 0.846 (EXP-025c) | +0.029 / +0.351 | EXP-025b + EXP-025c | **HIGH VARIANCE** — pooled 3/4 pass; context injection lifts above no-ctx baseline but trial-level pass rate inconsistent |
| S13 | 0.617 (EXP-010 Sonnet) | 0.995 | +0.378 | EXP-020 | **CONFIRMED** 2/2 pass |

*S-hard avg with context (confirmed: S9/S11/S12/S13): (0.956 + 0.897 + 0.685 + 0.995) / 4 = **0.883** across confirmed cases. S10 unresolved. S12 high variance — use with caution.*

### eval_mode directive — mandatory for batch/eval context

The EXP-013 clarification protocol hardened SKILL.md so the model asks before artefacting on ambiguous inputs. Regulated context injection amplifies ambiguity signals — the model correctly interprets surfaced regulatory complexity as requiring operator clarification before committing to a full discovery artefact.

In batch/eval mode (no second turn), this behaviour produces a clarification question rather than a scoreable artefact. The `eval_mode` directive in `context-regulated.yml` suppresses this:

```yaml
eval_mode:
  single_turn: true
  clarification_behaviour: surface_as_assumptions
  instruction: "You MUST produce a complete discovery artefact in this response.
    Do not hold sections pending clarification. Surface all regulatory ambiguities,
    unknowns, and risks in the Assumptions and Constraints sections of the artefact.
    Asking a question instead of producing the artefact is a protocol violation in
    this context."
```

**Co-design requirement:** Future changes to the SKILL.md clarification gate must be validated against context-injection eval runs. The clarification gate and the eval_mode directive are a matched pair — changes to one require re-validation of the other. This is documented in the EXP-025b manifest.

### Haiku + context — NOT viable

EXP-020 confirmed Haiku+context is NON-COMPLIANT on S-hard regardless of context injection: S13 0.306 (vs Sonnet+context 0.995), S10 0.018. The 0.689 gap exceeds any reasonable falsification threshold. Context injection does not remediate Haiku's S-hard capability gap — it amplifies the complexity the model cannot handle. No further Haiku+context S-hard experiments are warranted.

---

## Multi-provider routing

**GPT models — EXP-002a finding (2026-05-12):** Both GPT models fail all discovery evaluation cases.

| Model | T1+T3 avg | Pass rate | Permitted for | Evidence |
|-------|-----------|-----------|---------------|----------|
| gpt-4o | 0.467 | 0/6 | Not approved for production discovery routing | EXP-002a (63 results) |
| gpt-4o-mini | 0.592 | 0/6 | Not approved for production discovery routing | EXP-002a (63 results) |

**Failure pattern:** Both GPT models score near-zero on D4 (out-of-scope discipline), D5 (assumption quality), and D7 (constraint completeness) across all cases. These are the three dimensions most critical for regulated input handling. The 0x Copilot Layer 1 multiplier does not offset a 0/6 pass rate — cost savings are irrelevant when the quality bar is not met.

**GPT H5 conclusion:** EXP-002a H5 ("would GPT-4o at 0x cost route for non-regulated discovery?") is confirmed FAIL. GPT models remain unapproved for production pipeline routing on the `/discovery` skill. This will be reviewed if EXP-002b includes a targeted system prompt supplement for GPT (see Recommendation 3 in EXP-002a scorecard).

---

## T5 proactivity gap — interim mitigation

Until EXP-002b resolves the context gap vs model gap question, the following interim mitigation is in effect for all discovery skill runs on any input with potential hidden constraints:

**Operator action:** Before running `/discovery` on any input that may involve regulatory obligations or cross-system constraints, prepend the following to the operator input:

> "Before writing the discovery artefact, identify any constraints in this domain that may not be explicit in the problem statement — including regulatory obligations, data residency requirements, and cross-system dependencies. List them as open questions before proceeding to the problem statement."

This is a manual mitigation for the T5 gap. It is not a permanent fix — it is a workaround until EXP-002b determines the correct structural intervention.

**EXP-020 update (2026-06-13):** For NZ financial regulated inputs specifically, context-file injection (`.github/context-regulated.yml`) is confirmed as the structural intervention — not operator-manual prepend. EXP-020 S13 Sonnet+context scored 0.995 vs no-context baseline of 0.617. The operator-manual workaround above remains valid for non-financial or non-NZ regulated cases where `context-regulated.yml` is not applicable. For NZ financial regulated discovery on S-hard cases, use `--context-files .github/context-regulated.yml` (or the pipeline equivalent) instead of the manual prepend.

---

## Measurement_backed update protocol

### What triggers a routing policy update

1. An experiment completes and results meet or exceed the routing threshold
2. The experiment_id is cited in the update
3. A pipeline story is created for the routing policy change
4. PR opened with the story artefact and experiment evidence

### What does NOT trigger a routing policy update

- Operator intuition or ad-hoc testing (without an experiment manifest)
- A single run without the standard trials_per_cell (must meet the manifest's trial count)
- Benchmark scores from external sources (not run against this pipeline's EVAL.md corpus)

### Update table (post-experiment)

| Routing rule | Experiment | Finding | Change made | Date |
|-------------|------------|---------|------------|------|
| Haiku permitted for non-regulated T1-class discovery | EXP-002a | T1+T3 avg 0.759, 5/6 pass rate — approved with operator risk acknowledgement of 1-in-6 T3 failure | Added haiku cost-optimised row to routing table; measurement_backed: true | 2026-05-12 |
| GPT-4o tier assessment (/discovery) | EXP-002a | T1+T3 avg 0.467, 0/6 passes — D4/D5/D7 collapse across all cases | Confirmed NOT approved for production routing; H5 hypothesis confirmed FAIL | 2026-05-12 |
| Sonnet as default for regulated discovery | EXP-002a | D7 T3 = 0.900 (above 0.80 threshold); outperforms Opus (0.700) at 1/15th Layer 1 cost | Updated regulated routing from Opus to Sonnet; measurement_backed: true | 2026-05-12 |
| /test-plan — Haiku approved for non-regulated stories | EXP-007 | TCF 1.00 both trials (Haiku); zero categorical fails; all T3/T4/T5 adversarial traps passed. Mean weighted score 0.988. | Added Haiku row for non-regulated; measurement_backed: true | 2026-05-16 |
| /test-plan — Sonnet preferred for PCI/compliance stories | EXP-007 | Haiku D3=0.7 on T5 both trials (NFR scope-mixing); Sonnet D3=1.0 both trials. Not a categorical fail but confirmed systematic pattern. | Added Sonnet row for PCI/compliance pending SKILL.md NFR scope rule fix; measurement_backed: true | 2026-05-16 |
| T5 proactivity intervention | EXP-002b | _pending_ | _pending_ | _pending_ |
| Config recommendation for regulated inputs | EXP-003 | _pending_ | _pending_ | _pending_ |
| Config C regulated CPF assessment | EXP-003 | _pending_ | _pending_ | _pending_ |
| Local model L1 approval (structured skills) | EXP-LOCAL-001 | _pending_ | _pending_ | _pending_ |
| /definition-of-done pipeline fidelity — format compatibility | EXP-019 | Haiku DoD gate parsed real pipeline bundle (S5 crm.2) without structural errors. COMPLETE verdict, all 5 ACs evidenced, vulnerability policy NFR verified, zero fabricated gates. Bundle format validated: `>` trigger, `###` inner headings, fenced PR description, `##` terminator. | Added EXP-019 evidence to /definition-of-done routing entry; pipeline fidelity confirmed | 2026-06-12 |
| /discovery S-series corpus extension — Sonnet frontier confirmed | EXP-010 | S-series (13 cases, 2 trials): Sonnet avg 0.617, ~$0.059/passing trial. Fable 5 avg 0.712, $0.340/passing trial. Opus avg 0.571, $0.145/passing trial. Sonnet is the Pareto frontier — Opus and Fable 5 both dominated on cost. Haiku S-series not tested. | Updated /discovery routing entry to cite EXP-010 alongside EXP-002a | 2026-06-13 |
| /discovery S-hard regulated — context injection as quality lever | EXP-020 | Sonnet S13 with context-regulated.yml: 0.995 (+0.378 delta vs no-context 0.617), 2/2 pass. S10 judge failures (infrastructure artifact). Haiku NON-COMPLIANT on S-hard under context injection (S13 0.306, S10 0.018). Gap of 0.689 far exceeds falsification threshold — routing unchanged. Context injection is the quality lever, not model switch. | Added /discovery (regulated S-hard) routing row with context injection default; added EXP-025b/c as pending breadth confirmation | 2026-06-13 |
| /discovery Haiku tiered routing — EXP-021 HOLD | EXP-021 | 0/22 pass across all 11 S-series cases at max-tokens 8192. S2: fabricated regulatory constraints (hallucinated FMA bias audit not in input). S4: wrong output format (consulting report vs prescribed artefact). S12: 0.098. Failures are capability-level — SKILL.md tuning cannot remediate hallucinated regulatory content. T1/T3 approval (EXP-002a) does not generalise to S-series. | Haiku cost-optimised routing row updated to HOLD. Routing reverts to Sonnet across all tiers. EXP-026 (tiered routing validation) cancelled — precondition not met. | 2026-06-13 |
| /discovery — eval_mode directive in context-regulated.yml | EXP-025b | EXP-013 clarification gate interacts with context injection: regulated context amplifies ambiguity signals, triggering clarification response instead of scoreable artefact in batch eval mode. Added eval_mode.single_turn + imperative instruction to context-regulated.yml. Directive and clarification gate are co-designed — changes to either require re-validation of both. | Added eval_mode directive to context-regulated.yml; added context injection directive row to routing table; documented co-design constraint in EXP-025b manifest. | 2026-06-13 |
| /discovery quality-premium model (EXP-024, Opus 4.8 no-context S-hard) | EXP-024 | Opus 4.8 at 8192 tokens, no context: 0.594 S-hard avg (S10: 0.542, S11: 0.625, S12: 0.599, S13: 0.611). 0/8 pass. Underperforms Sonnet no-context on S10/S11/S13. Far below Sonnet+context (0.883 avg). Key finding: context injection is the critical mechanism, not model tier — a stronger model without regulatory context underperforms a cheaper model with it. Originally planned for Fable 5; pivoted to Opus 4.8 after US export control directive made Fable 5 unavailable. | Quality-premium model slot remains HOLD. Opus 4.8 row in frontier table marked DOMINATED. No routing change. | 2026-06-13 |
| /discovery S-hard regulated context injection breadth — EXP-025c | EXP-025c | S9: 0.956 (+0.313 vs no-ctx 0.643, 2/2 pass). S12: 0.846 (2/2 pass, but HIGH VARIANCE — EXP-025b same config scored 0.524 1/2 pass, pooled 3/4). Combined with EXP-025b S11 (0.897, 2/2), context injection breadth confirmed for S9/S11/S13. S12 is the outlier: consistent lift above baseline but inconsistent pass rate. S-hard routing default with context-regulated.yml confirmed for S9/S11/S13; S12 use with caution. | Updated routing table S-hard row; updated per-case lift table; updated frontier table. EXP-024 Fable 5 → Opus 4.8 pivot also recorded. | 2026-06-13 |

---

## Inner loop skill routing

**Status:** PROVISIONAL — no calibration experiments completed. EXP-036 and EXP-037 will establish measurement-backed routing. All inner loop skills are currently provisionally routed at Sonnet 4.6.

### Inner loop routing table (provisional)

| Skill | Current model | Evidence basis | measurement_backed | Review trigger |
|-------|--------------|----------------|--------------------|----------------|
| /implementation-plan (LOW difficulty — T-series) | claude-sonnet-4-6 | Provisional — EXP-036 pending | false — EXP-036 will establish baseline | EXP-037 (Haiku frontier) |
| /implementation-plan (MEDIUM difficulty — S3-class) | claude-sonnet-4-6 | Provisional — EXP-036 pending | false — EXP-036 will establish baseline | EXP-037 |
| /implementation-plan (HIGH difficulty — regulated, S12/S13-class) | claude-sonnet-4-6 | Provisional — regulated constraint; HIGH difficulty requires IP2 and IP5 discipline; Haiku risk unquantified | false — EXP-036 + EXP-037 pending | EXP-037 (Haiku HIGH cases expected to fail IP2) |
| /verify-completion (all difficulties) | claude-sonnet-4-6 | Provisional — EXP-038 pending. Iron Law requirement (VG1–VG5 gates) suggests gate-skilled model needed | false — EXP-038 will establish VG gate pass rate | EXP-038 (gate fidelity) |
| /subagent-execution (task execution) | Per-task routing (see subagent-execution SKILL.md) | Defined in subagent-execution SKILL.md: fast/cheap for mechanical, standard for integration, most capable for review/architecture | N/A — not a single-model routing decision | SKILL.md update when inner loop eval results available |

**EXP-036 routing trigger:** If Sonnet 4.6 achieves ≥ 0.85 on LOW cases (IL-T1/T3) and ≥ 0.75 on MEDIUM cases (IL-S3/S5) in EXP-036, Haiku frontier testing (EXP-037) is confirmed as the next step. If Sonnet fails LOW cases (< 0.75), the inner loop requires prompt engineering before any model routing decision.

**EXP-037 routing trigger:** If Haiku achieves ≥ 0.75 on LOW cases with no IP2=0.0 instances, Haiku routing for LOW difficulty /implementation-plan will be approved with measurement backing. HIGH cases: Haiku approval requires 100% pass rate (no partial credit for regulated stories).

---

### Constraint propagation chain table

The inner loop constraint propagation chain runs from Discovery constraint → Implementation plan → Verify-completion → DoD. A constraint that drops at any link invalidates the downstream quality signal.

| Chain link | Skill | State field / output | Drop-point risk | Mitigation |
|-----------|-------|----------------------|-----------------|-----------|
| 1 | /discovery → /definition | Constraint named in discovery artefact (assumption or out-of-scope flag) | Constraint not named as an AC or NFR at /definition | Step 4a regulated constraint check in /definition SKILL.md (verified EXP-003 Config C run 3) |
| 2 | /definition → /definition-of-ready | Architecture Constraint C* named in story | Constraint in definition not elevated to H-NFR* or H-GOV in DoR | H-GOV and H-NFR* hard blocks in DoR SKILL.md |
| 3 | /definition-of-ready → /implementation-plan | Architecture Constraint C* + Contract Proposal "What will NOT be built" | Model fabricates out-of-scope scope (IP2 categorical fail) | IP2 dimension + categorical fail rule in eval rubric |
| 4 | /implementation-plan → /subagent-execution | Compiled-in constant constraint (e.g. C4 REDACT_AFTER_DAYS, C6 FAIRNESS_THRESHOLD_PCT, C7 sequential ordering) | Model makes constant configurable or parallelises sequential operation | IP5 dimension + NFR inheritance fail rule in eval rubric |
| 5 | /subagent-execution → /verify-completion | AC verification script scenarios; test run evidence | Model claims PASSED without citing specific test evidence (VG4 gate failure) | VG1–VG5 binary gates; Iron Law in SKILL.md |
| 6 | /verify-completion → /definition-of-done | verifyStatus="passed"; acVerified count; testPlan.passing | DoD fabricates governance gate not in AC verification results | DoD D2 out-of-scope gate; EXP-016 fabricated_governance_gate check |

**Primary risk link:** Chain link 3 (implementation-plan IP2) is the highest consequence drop-point. A plan with fabricated scope causes cascading test failures in subagent-execution that are expensive to detect and fix. IP2=0.0 at EXP-036 for HIGH cases would be a blocking finding.

**Secondary risk link:** Chain link 5 (verify-completion VG4) is the pipeline integrity gate. EXP-038 will quantify the VG4 pass rate. If VG4 fails more than 5% of trials, the Iron Law implementation in /verify-completion SKILL.md requires strengthening.

---

### Inner loop integrated experiment sequencing note

EXP-036 through EXP-040 are sequenced by dependency. The earliest runnable experiments are EXP-036 and EXP-037 (both require only corpus bundles and eval rubric — both now available). EXP-038 depends on EXP-036 completion for plan outputs to use as verify-completion inputs. EXP-039 and EXP-040 depend on EXP-036 and EXP-038.

Proposed run order:
1. EXP-036 + EXP-037 in parallel (independent model sets)
2. EXP-038 (after EXP-036 Phase A complete — needs plan outputs)
3. EXP-039 (after EXP-036 + EXP-038)
4. EXP-040 (after EXP-039 — uses learnings from E2E to design adversarial prompts)

---

## token-optimization SKILL.md update gate

Changes to the model routing guidance in `.github/skills/token-optimization/SKILL.md` are governed by:

1. This document must be updated first (measurement_backed update above)
2. A pipeline story must exist with the experiment_id in its AC
3. PR must cite this document and the experiment artefact
4. Platform team review required (platform change policy)

No one-liner or ad-hoc updates to `token-optimization/SKILL.md` routing guidance. The harness evidence → this document → SKILL.md is the only permitted path.
