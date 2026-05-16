# Meta-Review: Model Evaluation Framework
**Scope:** Evaluation infrastructure for the model evaluation capability feature (`2026-05-10-model-evaluation-capability`)
**Review date:** 2026-05-16
**Reviewer:** GitHub Copilot (claude-sonnet-4-6) — automated meta-review
**Sources read:** All five EVAL.md files; EXP-001/002a/003/004/005/006/007/007R manifests and scorecards; `scripts/run-model-sweep.js`; `tests/check-model-routing.js`; `workspace/proposals/routing-policy-framework.md`; `workspace/experiments/eval-programme-roadmap.md`; `workspace/handoffs/pipeline-corpus-S2-S7.md`; `docs/handoff-2026-05-14.md`; corpus case samples for all five skills.

**Constraint:** This review does not re-run experiments, modify EVAL.md files, corpus cases, routing policy documents, or SKILL.md files.

**Finding format:** F[N] — Severity (HIGH/MEDIUM/LOW) — Category

---

## Summary scorecard

| Category | Findings | HIGH | MEDIUM | LOW |
|----------|----------|------|--------|-----|
| 1 — Structural consistency | 5 | 0 | 4 | 1 |
| 2 — Evidence traceability | 6 | 2 | 3 | 1 |
| 3 — Corpus quality | 5 | 2 | 2 | 1 |
| 4 — Sweep harness / automation | 5 | 1 | 3 | 1 |
| 5 — Maintainability | 4 | 1 | 2 | 1 |
| **Total** | **25** | **6** | **14** | **5** |

**Overall assessment:** The framework is structurally sound and has produced meaningful routing decisions backed by real evidence. The evidence quality degrades in two areas that now block confident production use: the end-to-end CPF tension (Config C FAIL unresolved while Haiku routing is live) and the universal perfect-score problem in EXP-004/005 that undermines corpus credibility. Both are addressable. The harness automation gap is the most significant operational risk going forward.

---

## Category 1 — Structural consistency

### F1 — MEDIUM — Dimension naming scheme inconsistency across all five EVAL.md files

**Location:** `.github/skills/definition-of-ready/EVAL.md` vs all others

**Issue:** Four EVAL.md files use `D1–Dn` dimension identifiers. The `/definition-of-ready` EVAL.md uses `G1–G6` with a different naming rationale (`G` = "gate"). There is no cross-file convention document that explains or justifies this divergence. A reviewer reading experiment manifests that reference `G1`, `G2` etc. cannot immediately know which skill they belong to without looking up the file.

**Impact:** Cognitive overhead in cross-skill comparisons; risk of misattributing findings when referencing dimensions across manifests.

**Remediation:** Adopt `D1–Dn` universally across all EVAL.md files and update the DoR EVAL.md accordingly. If the `G` prefix is intentionally preserved as a semantic marker for gate-type dimensions, document that convention explicitly in a central eval design notes file.

---

### F2 — MEDIUM — Four incompatible primary metric acronyms; `/discovery` has no named formula

**Location:** All five EVAL.md files and routing-policy-framework.md

**Issue:** Each skill introduces a unique primary metric acronym (CPF, GF, FDR, TCF). The `/discovery` EVAL.md defines no named formula-level primary metric — it uses a straight weighted dimension score without a named abstraction. This creates asymmetry: you cannot write a unified routing-policy row for discovery that cites a metric comparable to CPF, GF, FDR, or TCF.

The acronyms are internally coherent but they do not share a naming grammar. `CPF` (Constraint Propagation Fidelity) describes a measured output property; `GF` (Gate Fidelity) describes a process compliance rate; `FDR` (Finding Detection Rate) is a recall metric; `TCF` (Test Coverage Fidelity) is a coverage ratio. These are not comparable across skills and there is no meta-metric that aggregates them.

**Impact:** When a new skill (e.g. `/benefit-metric`) receives an EVAL.md, there is no template for what the primary metric should look like. The proliferation continues without a constraint.

**Remediation:** Define a canonical primary metric grammar: `[Coverage Metric Name] = measured_output_count / expected_output_count`. Apply a named metric to discovery (e.g. `DQF — Discovery Quality Fidelity`). Document the grammar in a central EVAL design reference rather than inferring it per-skill.

---

### F3 — MEDIUM — Pass threshold inconsistency across skills; definition EVAL.md states no threshold

**Location:** All five EVAL.md files

**Issue:**
| Skill | Pass threshold | Source |
|-------|----------------|--------|
| /discovery | 0.70 (weighted score) | EVAL.md |
| /definition | 1.00 required on CPF | EVAL.md |
| /review | FDR_HIGH must equal 1.00 | EVAL.md |
| /test-plan | TCF must equal 1.00 | EVAL.md |
| /definition-of-ready | 0.80 (weighted GF) | EVAL.md |

The `/definition` EVAL.md states the CPF threshold in the scoring notes but does not have a standalone `pass threshold` field comparable to the other files. The 0.70 discovery threshold vs 1.00 for the downstream skills creates an implicit quality funnel: discovery can pass with a 30% quality gap, but by the time a story reaches the definition stage, 100% constraint propagation is required. This design decision is intentional but not documented as such.

**Impact:** A reviewer cannot determine from discovery data alone whether a 0.71 discovery score produces an adequately constrained downstream pipeline, because the relationship between discovery score and downstream CPF is unvalidated (EXP-002a provides no CPF carry-through data).

**Remediation:** Add a `## Pass thresholds and rationale` section to each EVAL.md. Document why the discovery threshold is lower. Consider whether a 0.70 discovery score with full CPF at definition is empirically achievable — EXP-003 shows CPF can fail even at higher discovery quality levels due to slicing strategy non-determinism.

---

### F4 — MEDIUM — DoR EVAL.md corpus note contradicts actual programme state

**Location:** `.github/skills/definition-of-ready/EVAL.md`, corpus section

**Issue:** The EVAL.md states: _"corpus directory is created but empty — populate with first EXP-002 sweep output"_. EXP-004 was executed successfully with a populated four-case corpus (T1–T4). The note is stale by at least one full experiment cycle.

**Impact:** A new operator reading this EVAL.md would incorrectly believe the corpus is empty. If following the instructions literally, they might re-populate the corpus directory and overwrite the existing cases.

**Remediation:** Update the DoR EVAL.md corpus section to reflect actual state: four corpus cases present, validated by EXP-004.

---

### F5 — LOW — `/discovery` EVAL.md dimension count implied by scorecard does not match observable file content

**Location:** `.github/skills/discovery/EVAL.md`; `EXP-002a scorecard.md`

**Issue:** The EXP-002a scorecard tables reference D7 (constraint completeness) as a scoring dimension with weight influence on the weighted average. The discovery EVAL.md as read specifies D1–D6 (D6 = success observability, weight 0.08). The weights D1+D2+D3+D4+D5+D6 sum to 0.95 (0.22+0.15+0.22+0.15+0.13+0.08), implying a D7 exists with weight 0.05. However, no D7 section is explicitly confirmed as part of the EVAL.md specification vs. a scorecard column added by EXP-002b post-hoc. The lineage is ambiguous.

**Impact:** Reproducibility gap — an evaluator following the EVAL.md from scratch cannot reliably reconstruct the 7-dimension weighted score used in EXP-002a without reading the scorecard column definitions.

**Remediation:** Confirm whether D7 is part of the canonical EVAL.md or a scorecard-local extension from EXP-002b. If canonical: add D7 to the EVAL.md with explicit weight. If scorecard-local: add a note to the EVAL.md cross-referencing the scorecard column.

---

## Category 2 — Evidence traceability

### F6 — HIGH — EXP-003 Config C pending re-run is unresolved while Haiku routing policy is live

**Location:** `workspace/experiments/EXP-003-pipeline-eval/manifest.md` (Findings F4, F5, F6); `workspace/proposals/routing-policy-framework.md`; `workspace/state.json` (pendingActions)

**Issue:** This is the most material traceability gap in the framework. The routing policy routes four of five pipeline skills to Haiku (`measurement_backed: true`). The evidence cited for the downstream skills (EXP-004 for DoR, EXP-005 for definition, EXP-006 for review, EXP-007/007R for test-plan) is all from **isolated per-stage evaluations**. EXP-003 is the only experiment that tests the full pipeline end-to-end with a single CPF measurement across all stages.

EXP-003 results:
- Config A (Sonnet uniform): CPF 1.00 ✅
- Config B (Opus front-loaded): CPF 1.00 ✅
- Config C run 1: **INVALID** — model switch not executed (F4 finding)
- Config C run 2: **Chain CPF 0.68 FAIL; regulated chain CPF 0.675 FAIL** (below 0.80 regulated threshold)

The manifest F6 finding attributes the Config C failure to Sonnet's slicing strategy choice at the definition stage, not to Haiku downstream. The fix-validation run (definition-f6f7-r1) confirmed C2 propagation at definition stage with Step 4a applied, scoring CPF 1.00 in isolation. However, **no full-pipeline Config C run with the Step 4a SKILL.md fix has been executed**. The pending action in `workspace/state.json` marks this as PRIORITY 2 ("EXP-003 Config C re-run required with corrected model and updated SKILL.md").

The current routing policy is based on the inference that Step 4a fixes the Config C failure. That inference has not been validated by a complete chain run.

**Impact:** The Haiku routing policy for /definition may produce regulated-constraint failures in end-to-end production use. The evidence gap is specifically for regulated stories (CPF regulated threshold: 0.80). Non-regulated stories may be adequately served.

**Remediation:** Complete EXP-003 Config C run 3 with: (a) correct Haiku model switch executed, (b) Step 4a-updated SKILL.md in effect. If Config C run 3 achieves regulated CPF ≥ 0.80, the routing policy is validated end-to-end. Until then, the routing policy header should be annotated: _"E2E CPF validation pending for Config C — Haiku/definition routing carries residual regulated-story risk."_

---

### F7 — HIGH — EXP-004 manifest has future creation date; scorecard summary and routing implication sections are blank

**Location:** `workspace/experiments/EXP-004-dor-rubric/manifest.md`

**Issue:** Three data integrity problems in a single manifest:

1. **Future creation date:** `created: 2026-05-21`. Current date at review is 2026-05-16. This is either a 5-day clock error or a copy-paste artefact from a template. As the canonical record for a completed experiment, an incorrect creation date undermines the traceability chain.

2. **Blank scorecard summary table:** The `## Scorecard summary` section reads _"Populated after all runs complete."_ The manifest's `## Final results` section confirms all 16 runs are complete and all achieved GF = 1.00. The scorecard summary table was never populated.

3. **Blank routing implication section:** The `## Routing implications` section reads _"Populated after analysis complete."_ The routing policy already cites EXP-004 as evidence for the DoR-Haiku routing decision, but the analysis is not captured in the manifest.

**Impact:** The manifest is the durable record that supports `/trace` validation. A `/trace` run reading this manifest would see incomplete evidence for a routing decision that is already live.

**Remediation:** (1) Correct creation date to 2026-05-14 (EXP-004 was completed 2026-05-14 per handoff doc). (2) Populate the scorecard summary table with the GF=1.00 results. (3) Fill in the routing implications section: Haiku approved for /definition-of-ready; GF = 1.00 (all trials); 0.33× cost vs Sonnet; no categorical fails across T1–T4.

---

### F8 — MEDIUM — Routing policy status header is stale

**Location:** `workspace/proposals/routing-policy-framework.md`, header `Status` field

**Issue:** The routing policy header reads `Status: partially measurement-backed`. As of EXP-007R (2026-05-16), all five outer-loop skills have measurement-backed routing decisions. The only non-measurement-backed entries are `/benefit-metric` and `/definition-of-done`, which are explicitly marked as `Provisional, Sonnet (no experiment)`.

**Impact:** A reviewer reading the status header would incorrectly conclude the policy is partially evidenced when the outer-loop skills are fully evidenced.

**Remediation:** Update header to `Status: measurement-backed for all outer-loop skills (discovery, definition, review, test-plan, DoR); provisional for benefit-metric and definition-of-done (no experiment)`.

---

### F9 — MEDIUM — EXP-003 Config C run 1 is present in the runs log but was executed with the wrong model

**Location:** `workspace/experiments/EXP-003-pipeline-eval/manifest.md`, runs log, row C-1

**Issue:** The runs log row for Config C run 1 shows `⚠️ Haiku switch not executed` in the model column. The finding F4 acknowledges this. However, the run data remains in the canonical runs log as a partially labelled row with CPF scores (0.60 binary, 0.40 at-source) that may be misread as Config C evidence by a future reviewer who skims the table.

**Impact:** The CPF table's Config C row currently shows only one valid CPF number (from run 2). A future analyst consuming this table without reading all footnotes might average the rows or treat C-1 scores as partial Config C evidence.

**Remediation:** Mark the C-1 row header in bold red annotation: `INVALID RUN — Sonnet used throughout, not Haiku. Do not use for Config C evidence. See F4.` Move the C-1 row to a separate `## Invalid runs` subsection below the main scorecard.

---

### F10 — MEDIUM — EXP-002a status is "planned" in manifest but experiment is complete

**Location:** `workspace/experiments/EXP-002a-cross-provider-discovery/manifest.md`, metadata table

**Issue:** The manifest metadata table shows `status: planned`. The experiment has a complete scorecard with 63 result files, findings, and recommendations. The status field was never updated to `complete` after execution.

**Impact:** `workspace/state.json` correctly records EXP-002a as complete. But a tool that reads experiment status directly from manifests (e.g. a future `/trace` extension or automated dashboard) would report a mismatch.

**Remediation:** Update manifest status to `complete`.

---

### F11 — LOW — Config D entry in EXP-003 and routing policy is still listed as "pending" after EXP-002a definitively disproved H5

**Location:** `workspace/experiments/EXP-003-pipeline-eval/manifest.md`, Config D row; routing policy Config D entry

**Issue:** Config D (GPT-4o/Haiku hybrid) is listed as pending in EXP-003, gated on _"EXP-002a H5 confirmed"_. EXP-002a explicitly states H5 is **disproved**: GPT-4o scores 0.467 on T1+T3 (well below the 0.70 threshold); GPT-4o-mini scores 0.592. Neither model meets the threshold required to justify Config D as a cost optimisation.

**Impact:** Config D occupies real space in the routing policy and EXP-003 manifest as if it remains a live option. This creates unnecessary scope ambiguity.

**Remediation:** Close Config D formally: update the EXP-003 manifest to record `Config D: cancelled — H5 disproved by EXP-002a (GPT-4o T1+T3 avg 0.467, below 0.70 threshold)`. Update routing policy to remove Config D column or annotate as cancelled. Record the closure in `decisions.md`.

---

## Category 3 — Corpus quality

### F12 — HIGH — Universal perfect scores in EXP-004 and EXP-005 indicate corpus cases are insufficiently discriminating

**Location:** `workspace/experiments/EXP-004-dor-rubric/manifest.md`; `workspace/experiments/EXP-005-definition-rubric/haiku-vs-sonnet-final.md`

**Issue:** EXP-004: All 16 runs (4 cases × 2 models × 2 trials) scored GF = 1.00 on every dimension. Every trial for every case for both Haiku and Sonnet produced a perfect gate fidelity score with zero variance.

EXP-005: All 16 runs (4 cases × 2 models × 2 trials) scored CPF_def = 1.00 and D3 = 1.00. Both Haiku and Sonnet achieved perfect scores across all regulated cases in both trials.

This pattern is structurally implausible for an adversarial evaluation corpus. When every model, every trial, every dimension scores 1.00, one of three things is true:
(a) The corpus cases are not adversarial enough — modern LLMs handle them trivially.
(b) The scoring rubric is too coarse — the judge cannot distinguish between good and acceptable performance.
(c) Both.

The EXP-003 experience provides a counterpoint: in end-to-end pipeline evaluation, C2 was dropped with a chain CPF of 0.35. This strongly suggests (a) — the isolated per-stage corpus inputs do not replicate the failure modes that emerge in real pipeline runs.

The DoR corpus cases (T1: missing ACs, T2: unresolved HIGH finding, T3: governance-only engineer) all present clean single-defect patterns. Real DoR evaluations involve ambiguous partial AC coverage, concurrent warnings, and oversight level edge cases. The current cases may be testing whether the model can recognise an obvious defect, not whether it can correctly calibrate in borderline situations.

**Impact:** The routing decisions for DoR and definition are backed by experiments that may be measuring floor performance rather than actual discriminative capability. The 0.33× cost saving claim for Haiku over Sonnet is premature if both models score 1.00 because the tasks are too easy, not because they are equivalent.

**Remediation:** Add at least two adversarial-edge cases to each corpus:
- DoR: one case with ACs that are present but untestable (borderline H2); one case with partial review — two MED findings, zero HIGH, but the story has a security component that a careful reviewer would flag as potentially HIGH.
- Definition: one case where the constraint is mentioned in the narrative but uses indirect phrasing requiring extraction judgment; one case with a competing constraint where satisfying C2 for Regulation A creates a new constraint under Regulation B.

---

### F13 — HIGH — T2/T4 evaluation in EXP-002a is architecturally broken for all models

**Location:** `workspace/experiments/EXP-002a-cross-provider-discovery/scorecard.md`, Finding 1

**Issue:** T2 ("improve onboarding") and T4 ("make the API faster") test whether a model correctly asks for clarification before producing an artefact. This is a multi-turn behaviour. The EXP-002a harness sends a single-turn prompt. Every model across every trial produced a full fabricated artefact and scored 0.000 on all dimensions. The scorecard correctly identifies this as an architectural limitation of the eval harness, not a model capability difference.

However, the routing policy cites EXP-002a as evidence for the discovery routing decision without noting that T2/T4 clarification-gate behaviour is entirely untested. The current routing decisions are therefore silent on whether any model correctly handles ambiguous inputs in the production skill flow.

The downstream risk: in production, a discovery run on a vague input that should ask clarifying questions will instead produce a full artefact with fabricated scope — a failure mode with potentially significant downstream CPF consequences if that fabricated scope omits constraints.

**Impact:** The clarification-gate failure mode is the highest-frequency real-world edge case (operators frequently provide ambiguous inputs). It is completely uncharacterised in the evaluation framework.

**Remediation:** Design a multi-turn harness for T2/T4: the harness sends the vague input, checks the response for a clarifying question marker (e.g. presence of a `?` at sentence-end without an artefact section header), and conditionally scores (0 if artefact produced, 1 if clarifying question asked). This does not require a full conversational loop — it can be a binary output check. Add this to the EXP-002a-pending and EXP-002b scope.

---

### F14 — MEDIUM — All review corpus cases are single-defect; real-world multi-defect patterns are not tested

**Location:** `.github/skills/review/corpus/` T1-T4

**Issue:** Each adversarial review case (T1–T3) plants exactly one HIGH finding. T4 plants exactly one MEDIUM and one LOW. T5 is a clean baseline. Real-world stories will contain overlapping defects: a story with a broken traceability chain AND an under-specified AC simultaneously. A model that correctly identifies isolated defects may fail to identify the second defect when the first is prominent.

Additionally, there is no corpus case testing:
- A story with a borderline HIGH that a model should classify as MEDIUM (false-positive suppression)
- A story where the correct finding is "no issues" but a weak model finds phantom issues (D2 false-positive pressure)

T5 tests the clean baseline but does not create active false-positive pressure.

**Impact:** FDR_HIGH = 1.00 may reflect single-defect detection capability only. Multi-defect stories may surface model prioritisation failure modes not captured here.

**Remediation:** Add a T6 case: a story with two concurrent adversarial signals (one HIGH traceability + one MEDIUM out-of-scope). Verify that both are identified and correctly severity-classified. Add a T7 case: a story designed to look like it has a finding but does not (e.g. an out-of-scope section that is actually correctly bounded) — tests D2 false-positive suppression under active pressure.

---

### F15 — MEDIUM — T5 (enterprise note-taking) has an unresolved evaluation design confound affecting all models equally

**Location:** `workspace/experiments/EXP-002a-cross-provider-discovery/scorecard.md`; EXP-001 manifest

**Issue:** T5 tests whether a model resists one-pass feature-list generation on a deceptively simple input. The batch-bypass instruction used in EXP-001 run-3b (to produce scoreable artefacts on T1/T3) directly conflicts with T5's criterion — the bypass instruction tells the model to produce a full artefact in one pass, which is the exact behaviour T5 is designed to penalise.

As a result, all EXP-001 T5 cells are conditionally invalid and T5 was excluded from the EXP-002a routing metric. EXP-002a T5 results (all models scoring 0.008–0.661) show high variance with no reliable inter-model differentiation. The discovery corpus has therefore one case (T5) that has never produced reliable routing-relevant data.

**Impact:** The routing metric omits T5 by design, but T5 represents a real production failure mode (model produces a feature list when it should probe for constraints). The framework has no validated measurement of this failure mode.

**Remediation:** Design a T5-compatible evaluation mode that tests constraint-surfacing without relying on one-pass artefact generation. One option: use a two-phase evaluation where Phase 1 sends the input and scores whether any constraint-surfacing probe appears before Section 1 headers; Phase 2 (if Phase 1 passes) sends follow-up answers and scores the full artefact. This decouples the "resists premature commitment" criterion from the "produces complete artefact" criterion.

---

### F16 — LOW — Pipeline corpus (S2-S7) is defined but only S1 has been fully executed in EXP-003

**Location:** `workspace/handoffs/pipeline-corpus-S2-S7.md`; EXP-003 manifest

**Issue:** EXP-003 used a single corpus story (S1 — the enterprise payment infrastructure). S2-S7 are defined with constraint inventories and artefact read/write maps, but none have been run through the full pipeline evaluation. The routing policy evidence (Configs A–C) is therefore based on a single domain story. S2 (lending origination) and subsequent stories are more complex (S2 has five constraints including C5 hidden demographic bias — a more subtle hidden constraint than S1's AML audit gap).

**Impact:** The end-to-end CPF evidence is N=1 domain story. Domain-specific constraint extraction behaviours (e.g. financial crime regulation versus credit law) are not captured.

**Remediation:** Run EXP-003 Config A and Config C (with Step 4a) against at least S2 before declaring the routing policy production-validated for regulated domains.

---

## Category 4 — Sweep harness and automation

### F17 — HIGH — No automated regression protection when SKILL.md changes

**Location:** `scripts/run-model-sweep.js`; `tests/check-model-routing.js`; EXP-007R manifest

**Issue:** EXP-007R illustrates the correct pattern: a SKILL.md change (NFR scope rule, commit `a8e09c8`) was identified as potentially fixing a D3=0.7 finding, a confirmatory re-run was executed, and the result (D3=1.0) updated the routing decision. This is a valid process.

However, the re-run was a manual operator action — a single trial triggered via CLI. There is no CI gate that:
1. Detects when a SKILL.md changes
2. Automatically re-runs the affected skill's corpus against the routing-approved model
3. Fails the PR if any dimension score regresses below the approved threshold

Without this, a SKILL.md change that inadvertently introduces a regression (e.g. new instruction text that causes D3 scope-mixing to re-emerge) would only be detected in the next manual experiment run.

`tests/check-model-routing.js` tests the routing policy metadata in the harness script — it does not run any model evaluations. It is a static governance check, not a behavioural regression test.

**Impact:** Every SKILL.md change creates an undetected behavioural regression risk. Given the speed of iteration in this repo (multiple SKILL.md changes per session), this gap is live.

**Remediation:** Add a `check-eval-regression.js` governance check that: (1) reads each SKILL.md's last-modified date; (2) reads the corresponding EVAL.md's `calibration.date` field; (3) fails if a SKILL.md is newer than the most recent experiment run against it. This is a static staleness check — not a model run — and requires no API keys. It warns that manual re-evaluation is needed when skills drift ahead of their evidence base.

---

### F18 — MEDIUM — Multi-turn clarification-gate testing is architecturally absent from the harness

**Location:** `scripts/run-model-sweep.js`; F13 above

**Issue:** The harness sends a single user message to the model and captures the response. All evaluation protocols that require multi-turn interaction (T2/T4 clarification gate; confirmation-gate bypass for discovery artefact production) are handled via input phrasing workarounds rather than harness-level multi-turn support.

The harness has no `--turns` or `--conversation` mode. There is no way to programmatically test whether a model responds to an ambiguous input with a clarifying question vs. a fabricated artefact.

**Impact:** The evaluation framework cannot programmatically characterise the highest-frequency production failure mode for generative skills.

**Remediation:** Add a `--conversation <file>` flag that accepts a YAML conversation spec: `[{role: user, content: ...}, {role: check, match: 'question'}, {role: user, content: ...}]`. The `check` role performs a programmatic assertion (regex match on model response) rather than sending a message. This enables T2/T4 gate validation without requiring a full LLM judge turn.

---

### F19 — MEDIUM — OpenAI pricing in PRICING map is flagged as unverified "TODO" but live in production routing code

**Location:** `scripts/run-model-sweep.js`, PRICING constant

**Issue:** Four GPT model entries in the PRICING map are marked `// TODO: verify current rate`. The values are used for cost-per-story calculations in any run using OpenAI models. Although EXP-002a completed with GPT models and H5 was disproved (making GPT routing unlikely), the PRICING map is a governance artefact cited by `check-model-routing.js` T3. If the values are incorrect, cost projections for any future GPT experiment are wrong.

Additionally, the Opus pricing comment says "claude-opus-4-6 also remains valid as a direct API string" — this should be a formal note not an inline comment, since the COPILOT_MODEL_MAP does not include `claude-opus-4-6` as a key.

**Impact:** Incorrect cost projections; potential confusion about supported Opus model identifiers.

**Remediation:** Verify GPT prices at `platform.openai.com/pricing`, update the map, and remove the TODO markers. Move the Opus API string compatibility note to a dedicated code comment block with a verification date.

---

### F20 — MEDIUM — No automated end-to-end pipeline harness for CPF measurement

**Location:** `scripts/run-model-sweep.js`; EXP-003 manifest

**Issue:** The sweep harness handles isolated per-stage model evaluation (EVAL.md corpus → model → judge → score). EXP-003 was executed entirely manually: the operator ran discovery, then definition, then review, then test-plan, then DoR in sequence, manually capturing artefacts at each stage and scoring CPF by inspection.

There is no programmatic pipeline-eval harness. This means:
- CPF measurement is O(human) — each Config re-run requires a full manual pipeline session
- The pending EXP-003 Config C re-run (F6 above) cannot be automated
- Future pipeline CPF experiments will face the same cost

**Impact:** The most important metric (end-to-end CPF) is the hardest to produce evidence for. This asymmetry incentivises relying on easier per-stage metrics that may not reflect pipeline quality.

**Remediation:** Design a minimal pipeline harness mode: `--pipeline --corpus S1 --config C` that chains stage calls sequentially, passing each stage's output as the next stage's input. This is a significant engineering effort but is necessary for sustained CPF measurement. At minimum, add a `scripts/eval-pipeline-manual.md` runbook that standardises the manual EXP-003 protocol so re-runs are reproducible without reading the entire manifest each time.

---

### F21 — LOW — EXP-007R used a single trial for a routing-update decision; no parallel Sonnet comparison

**Location:** `workspace/experiments/EXP-007R-testplan-nfr/manifest.md`

**Issue:** EXP-007R is a single-trial confirmatory run (`trials: 1`) on a single case (T5). The routing policy update that removed the `/test-plan (PCI/compliance-classified) → Sonnet` row was made based on one data point. While the confirmatory design is reasonable for a targeted fix validation, the single trial provides no variability estimate and no Sonnet comparison. If the fix is fragile and only works on some temperature samplings, a single trial would not detect it.

**Impact:** The T5-Haiku routing approval is based on N=1 trial. The previous EXP-007 finding (D3=0.7 in Haiku T5 both trials, 0/2 pass) was based on N=2 trials. The fix validation has weaker statistical support than the original failure detection.

**Remediation:** Run EXP-007R with at least 2 trials (matching the EXP-007 trial count used to detect the failure). Update the results table. If both trials show D3=1.0, the approval stands with stronger support.

---

## Category 5 — Maintainability

### F22 — HIGH — Routing policy end-to-end evidence gap is not surfaced in any maintained document

**Location:** Cross-cutting — routing-policy-framework.md, EXP-003 manifest, workspace/state.json

**Issue:** This finding consolidates the evidence-chain problem identified in F6 into its maintainability dimension. The routing policy currently shows five skills with `measurement_backed: true`. A new operator reading the routing policy would conclude that all five routing decisions are backed by valid experiments. They would not know:

1. EXP-003 Config C (the only end-to-end test of the Haiku-dominant routing) has a FAIL result
2. The fix-validation for the identified Config C failure was run in isolation at the definition stage only
3. No full pipeline re-run with the fixed SKILL.md has been executed
4. The pending action for this exists only in `workspace/state.json` (pendingActions), not in the routing policy itself

The routing policy is the primary operator-facing document for production routing decisions. If it does not carry the caveat about the unresolved end-to-end validation, any operator who uses it as their sole reference will miscalibrate their confidence.

**Impact:** Ongoing production routing risk for regulated stories that is invisible to operators who read only the routing policy.

**Remediation:** Add a `## Production caveats — validated routing` section to the routing policy with: _"EXP-003 Config C (Haiku for definition/review/test-plan/DoR) has FAIL status for regulated-constraint stories (chain CPF 0.68; regulated CPF 0.675). Fix validation (Step 4a, isolation only) is complete. Full pipeline re-run (Config C run 3) is pending. Until Config C run 3 achieves regulated CPF ≥ 0.80, apply the regulated story override: use Sonnet for the definition stage on any story with regulatory constraints (PCI DSS, AML/CFT, prudential banking regulation, data residency obligations)."_

---

### F23 — MEDIUM — Eval programme roadmap is severely stale; EXP-004 through EXP-007R are not recorded

**Location:** `workspace/experiments/eval-programme-roadmap.md`

**Issue:** The roadmap describes Phases 1–4 with EXP-001 as complete and EXP-002a/002b/003 as "Planned". It does not mention EXP-004, EXP-005, EXP-006, EXP-007, or EXP-007R. The prerequisite table lists `getProvider()` and `evaluation_mode` as "Not yet implemented" — both are now implemented in the harness. The Layer 1 multiplier table references Opus 4.7 at 15× but also references Opus 4.6 from EXP-001 without reconciling the version change.

The programme roadmap has drifted to the point where it no longer reflects the programme as executed. Any operator using it to plan future experiments will get stale dependency information.

**Impact:** Onboarding cost; risk of redoing work that is already done; dependency errors in planning (e.g. continuing to gate EXP-002a on prerequisites that are already met).

**Remediation:** Update roadmap phases: add Phase 5 (rubric series EXP-004/005/006/007) as complete. Update the prerequisite table. Add a `## Current state` section at the top of the roadmap that summarises where the programme actually is as of the last update, with a date.

---

### F24 — MEDIUM — EXP naming suffix convention for fix-validations is undocumented

**Location:** `workspace/experiments/EXP-007R-testplan-nfr/manifest.md`; experiment directory listing

**Issue:** EXP-007R uses a suffix `R` to denote a fix-validation experiment (re-run to confirm a fix). This convention is not documented anywhere. A future operator creating a fix-validation for a different skill would have no guidance on whether to use `R`, `b`, `v2`, a new number, or a different naming pattern. The `EXP-001` experiment also had a partial confound recovery via run-3, run-3b — these are sub-runs within the same experiment manifest rather than separate experiment directories.

**Impact:** Inconsistent experiment naming in future fix-validations; difficulty scanning the experiments directory to distinguish original sweeps from fix validations.

**Remediation:** Document the naming convention in `eval-programme-roadmap.md` or a dedicated `experiments/CONVENTIONS.md`: original sweeps use `EXP-NNN-[skill]-[type]`; fix validations use `EXP-NNNxR-[description]` where `x` is the parent experiment number; incremental scope extensions use a letter suffix (`a`, `b`). Retroactively note that EXP-002a/002b follow the extension convention and EXP-007R follows the fix-validation convention.

---

### F25 — LOW — EXP-001 manifest has four run entries with accumulating confounds; final authoritative scorecard is implicit

**Location:** `workspace/experiments/EXP-001-discovery-phase4-5/manifest.md`

**Issue:** EXP-001 records four runs: run-1 (confounded by product/ context), run-2 (state.json contamination), run-3 (batch bypass issue), run-3b (planned). Each successive run was a recovery from a prior confound. There is no explicit `## Final authoritative results` section that states which data should be used for downstream analysis. The carry-forward inventory in EXP-002a implies T1/T3 from run-3b and T2/T4 from run-3, but this is documented only in EXP-002a, not in EXP-001 itself.

**Impact:** EXP-001 is the baseline for discovery evaluation. A future analyst reading EXP-001 in isolation cannot determine which data is authoritative.

**Remediation:** Add a `## Authoritative results` section to the EXP-001 manifest that explicitly states: _"Authoritative data is from run-3b for T1 and T3; run-3 for T2 and T4 (categorical pass only); T5 is inconclusive due to batch-bypass confound. Do not use run-1 or run-2 data."_

---

## Priority action list

Ordered by severity and operational impact:

| Priority | Finding | Action |
|----------|---------|--------|
| P1 | F6 — E2E CPF gap | Annotate routing policy with regulated-story caveat immediately; schedule Config C run 3 |
| P2 | F22 — Maintainability gap on E2E evidence | Add caveats section to routing policy before any regulated-domain production use |
| P3 | F7 — EXP-004 manifest data integrity | Fix creation date; populate scorecard summary; populate routing implications |
| P4 | F12 — EXP-004/005 perfect-score corpus problem | Design and add adversarial-edge cases to DoR and definition corpus |
| P5 | F13 — T2/T4 clarification-gate gap | Design multi-turn harness protocol; block on EXP-002b design |
| P6 | F17 — No SKILL.md regression protection | Implement `check-eval-regression.js` staleness check (static, no API required) |
| P7 | F11 — Config D not formally closed | Close Config D formally in EXP-003 manifest and routing policy; record in decisions.md |
| P8 | F10 + F8 — Stale status fields | Update EXP-002a manifest status and routing policy header status |
| P9 | F23 — Roadmap severely stale | Add Phase 5 complete; update prerequisite table; add current-state section |
| P10 | F24 — Naming convention undocumented | Add experiments/CONVENTIONS.md or extend roadmap |

---

## Closing observations

**What the framework gets right:**

- The judge model is locked (`claude-sonnet-4-6`) and never changes between experiments. This prevents judge-preference bias contaminating cross-model comparisons.
- The categorical fail conditions in each EVAL.md are well-specified and map to real-world consequences (e.g. missing a HIGH finding in review, dropping a PCI DSS constraint from a test plan).
- The EXP-002a cross-provider evaluation correctly identified that GPT models cannot serve as a cost-free alternative to Anthropic models on discovery-class tasks. H5 was a reasonable hypothesis to test; its falsification was clean and well-evidenced.
- The F6/F7 finding in EXP-003 (slicing strategy effect driving CPF failure, not pure model stochasticity) is a high-quality mechanistic insight. The distinction between "the model is noisy" and "the model makes a discrete strategy choice that deterministically affects downstream CPF" is exactly the kind of finding that justifies SKILL.md structural changes rather than model upgrades.
- The Step 4a fix (regulated constraint propagation check in definition SKILL.md) is appropriately targeted at the identified root cause. The fix-validation approach (EXP-007R pattern) is correct and should be systematised.

**The single highest-risk unresolved issue:**

The framework approved Haiku for four of five pipeline stages based on per-stage isolation evidence. The only end-to-end evidence (EXP-003 Config C) shows a FAIL for regulated-constraint stories. The per-stage experiments and the end-to-end experiment are measuring different properties. Until Config C run 3 produces a PASS, the framework has a logical gap between its strongest routing claims ("Haiku is equivalent to Sonnet on these tasks") and its only end-to-end test ("Haiku routing produces regulated CPF FAIL").

This gap does not invalidate the per-stage evidence. It means the evidence is necessary but not sufficient for regulated-domain production routing.
