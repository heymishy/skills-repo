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
| /discovery (non-regulated, easy/medium cases, cost-optimised) | claude-haiku-4-5 | EXP-002a: T1+T3 avg 0.759, 5/6 pass rate; 0.33x Layer 1 cost. **EXP-021 PENDING**: Haiku has not been tested on the S-series corpus (S1-S13). T1/T3 approval stands until EXP-021 either confirms or redefines the easy/medium boundary. | true (`experiment_id: EXP-002a`) — S-series validation PENDING | EXP-021 (Haiku S-series frontier) |
| /discovery (regulated input, non-S-hard) | claude-sonnet-4-6 | EXP-002a: D7 T3 = 0.900 (above 0.80 regulated threshold). EXP-010: Sonnet remains frontier on S-series regulated cases. | true (`experiment_id: EXP-002a, EXP-010-fable5-model-sweep`) | EXP-003 (CPF validation) |
| /discovery (regulated input, S-hard — S9-S13 class) | claude-sonnet-4-6 + context-regulated.yml | EXP-020: Sonnet S13 with regulated context injection scored 0.995 (+0.378 vs no-context baseline of 0.617, 2/2 pass). Context injection is the mechanism — not model change. EXP-025 pending for S9/S11/S12 breadth. Haiku+context remains NON-COMPLIANT on S-hard (EXP-020: S13 0.306). | true (`experiment_id: EXP-020-context-injection`) | EXP-025 (context injection breadth for S9/S11/S12) |
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
| claude-haiku-4-5 | UNTESTED (S-series) | ~$0.013 est. | **UNTESTED** — EXP-021 |
| claude-sonnet-4-6 | 0.617 | ~$0.059 | **FRONTIER** (cost-quality) |
| claude-fable-5 | 0.712* | $0.340 | **FRONTIER** (quality peak) |
| claude-opus-4-6 | 0.571 | $0.145 | DOMINATED by Sonnet |
| gpt-5.4 | 0.480 | $0.516 | DOMINATED by Sonnet |
| gpt-4.1 | 0.419 | $0.513 | DOMINATED by Sonnet |

\* Fable 5 S-hard scores may be understated due to 4096 token truncation (EXP-010 scorecard Section 9). EXP-024 will produce corrected scores.

**Key frontier unknowns:**
- Haiku S-series (EXP-021): if Haiku passes S1-S8 at ≥0.70, it enters as the easy/medium frontier at ~$0.013-$0.017/passing trial
- GPT format-neutral (EXP-022): if any GPT model passes with format-neutral SKILL.md, it enters as the 0x Layer 1 frontier
- Regulated context injection default (EXP-025): whether `.github/context-regulated.yml` injection should be the default for all S-hard regulated discovery (not model-specific)

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
| /discovery S-hard regulated — context injection as quality lever | EXP-020 | Sonnet S13 with context-regulated.yml: 0.995 (+0.378 delta vs no-context 0.617), 2/2 pass. S10 judge failures (infrastructure artifact). Haiku NON-COMPLIANT on S-hard under context injection (S13 0.306, S10 0.018). Gap of 0.689 far exceeds falsification threshold — routing unchanged. Context injection is the quality lever, not model switch. | Added /discovery (regulated S-hard) routing row with context injection default; added EXP-025 as pending breadth confirmation | 2026-06-13 |

---

## token-optimization SKILL.md update gate

Changes to the model routing guidance in `.github/skills/token-optimization/SKILL.md` are governed by:

1. This document must be updated first (measurement_backed update above)
2. A pipeline story must exist with the experiment_id in its AC
3. PR must cite this document and the experiment artefact
4. Platform team review required (platform change policy)

No one-liner or ad-hoc updates to `token-optimization/SKILL.md` routing guidance. The harness evidence → this document → SKILL.md is the only permitted path.
