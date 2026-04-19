# Benefit Metric: Skills Platform — Phase 4: Distribution, Structural Enforcement, and Non-Technical Access

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Date defined:** 2026-04-19
**Metric owner:** heymishy

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes — this feature also runs a controlled experiment comparing Sonnet 4.6 vs Opus 4.6 outer loop quality. Product metrics and meta metrics are defined separately. The feature can succeed on product metrics even if the experiment is inconclusive, and vice versa.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Distribution sync — zero-commit install + sync success rate

| Field | Value |
|-------|-------|
| **What we measure** | (1) Whether the platform install generates zero commits in the consumer's repo; (2) percentage of sync attempts by Craig and Thomas that require no manual conflict resolution |
| **Baseline** | 0% — no zero-commit sync mechanism exists today; all current installs require manual git work and generate consumer commits |
| **Target** | 100% zero-commit install + ≥ 90% of sync attempts require no manual intervention |
| **Minimum validation signal** | Zero-commit install works for both Craig and Thomas at least once — a single successful end-to-end install with no consumer commits generated |
| **Measurement method** | Automated: install tooling asserts zero commits generated (Spike A deliverable, CI-verifiable). Manual: Craig and Thomas self-report manual intervention incidents after each sync. heymishy reviews after each platform release. |
| **Feedback loop** | If minimum signal is not met by Spike A completion, distribution approach is revisited before Spikes B1/B2/C begin. If ≥ 90% target is not met after 3 release cycles post-Phase 4, distribution mechanism design is reconsidered. |

---

### Metric 2: Consumer confidence — unassisted team member onboarding

| Field | Value |
|-------|-------|
| **What we measure** | Whether at least one team member (picked by Craig or Thomas) completes the full outer loop — discovery through DoR — on a real story without platform team involvement |
| **Baseline** | 0 — no consumer has successfully onboarded a team member unassisted; every adoption attempt so far has required platform team involvement |
| **Target** | At least 1 team member completes the full outer loop (discovery through DoR) on a real story without any question to Craig, Thomas, or heymishy |
| **Minimum validation signal** | The team member successfully completes at least one outer loop step (e.g. discovery) unassisted — partial completion counts as the minimum signal |
| **Measurement method** | The team member documents their onboarding experience in a structured note (what worked, what they got stuck on). Craig or Thomas submits the note to heymishy at Phase 4 close. Reviewed once at Phase 4 close. |
| **Feedback loop** | If minimum signal is not met (team member cannot complete even one step unassisted), onboarding documentation and tooling are revisited before Phase 4 is declared complete. If full target is not met, findings from the friction log feed directly into Phase 5 onboarding work. |

---

### Metric 3: Teams bot C7 fidelity

| Field | Value |
|-------|-------|
| **What we measure** | C7 violation rate — number of interactions where the Teams bot presents more than one question simultaneously or allows a step to be skipped, divided by total interactions in a test session |
| **Baseline** | Not applicable — no Teams bot exists today; first measurement is the prototype test session itself |
| **Target** | 0 C7 violations across a complete test session of one outer loop step (e.g. /discovery run end-to-end in Teams) |
| **Minimum validation signal** | Bot completes at least 3 consecutive C7-compliant turns in a single session — receives a question, operator answers, bot advances correctly, 3 times without violation |
| **Measurement method** | heymishy runs the test session and records a structured turn-by-turn test log (question presented / single or multiple / operator answered / bot advanced correctly). Log saved to artefacts at Spike D completion. |
| **Feedback loop** | If minimum signal (3 consecutive C7-compliant turns) is not met, Spike D is not complete — Teams surface is not viable at current architecture and scope defers to Phase 5. If minimum is met but full target (0 violations across complete step) is not met, specific violation patterns are documented and fed into Phase 5 hardening scope. |

---

## Tier 2: Meta Metrics (Sonnet 4.6 vs Opus 4.6 Outer Loop Experiment)

**Experiment ID:** exp-phase4-sonnet-vs-opus-20260419
**Hypothesis:** Opus 4.6 produces higher-quality outer loop artefacts (tighter scope, better constraint capture, more testable ACs) than Sonnet 4.6 given identical input, at the cost of higher token spend. Quantifying the delta informs model routing policy for future outer loop runs.
**Design:** Sonnet run (this session) establishes the baseline artefacts. Opus run follows with identical input documents. heymishy reviews both outputs blind against a shared scorecard.
**Scorecard location:** artefacts/2026-04-19-skills-platform-phase4/experiment-scorecard.md (created at /definition close)

---

### Meta Metric MM-A: Scope fidelity

| Field | Value |
|-------|-------|
| **Hypothesis** | Both models will introduce some scope drift when decomposing a complex discovery into stories; Opus will drift less |
| **What we measure** | Count of stories that introduce scope not present in the discovery artefact, or that drop MVP scope items without an explicit out-of-scope decision |
| **Baseline** | Sonnet 4.6 run score (recorded at /definition close for this session) |
| **Target** | 0 drift items in either run; comparison value is the delta between Sonnet and Opus counts |
| **Minimum signal** | Both runs produce a complete /definition output — without that, comparison is not possible |
| **Measurement method** | heymishy blind-reviews both story sets against the discovery MVP scope, counts drift items per run. Recorded in experiment-scorecard.md after both runs complete. |

---

### Meta Metric MM-B: Constraint capture

| Field | Value |
|-------|-------|
| **Hypothesis** | Opus will capture more of the named constraints (C1/C4/C5/C7/C11) in story ACs without operator prompting |
| **What we measure** | Count of the 5 named constraints (C1, C4, C5, C7, C11) correctly reflected in story ACs without operator prompting, per run |
| **Baseline** | Sonnet 4.6 run score (recorded at /definition close for this session) |
| **Target** | 5/5 constraints captured in both runs; comparison value is the delta |
| **Minimum signal** | ≥ 3/5 constraints captured in at least one run — below this the outer loop is not safe for governance-critical work regardless of model |
| **Measurement method** | heymishy reviews story ACs against the 5 constraints, marks each as captured/missed/prompted per run. Recorded in experiment-scorecard.md. |

---

### Meta Metric MM-C: AC completeness

| Field | Value |
|-------|-------|
| **Hypothesis** | Opus will produce a higher proportion of ACs rated "testable and specific" vs "vague" |
| **What we measure** | Percentage of ACs per story rated "testable and specific" vs "vague" by heymishy blind review |
| **Baseline** | Sonnet 4.6 run score (recorded at /definition close for this session) |
| **Target** | ≥ 80% of ACs rated testable and specific in both runs; comparison value is the delta |
| **Minimum signal** | ≥ 60% testable ACs in at least one run — below this the stories require rework before test-plan can run |
| **Measurement method** | heymishy blind-rates each AC as testable/specific or vague per run. Recorded in experiment-scorecard.md. |

---

### Meta Metric MM-D: Operator intervention rate

| Field | Value |
|-------|-------|
| **Hypothesis** | Opus will require fewer operator corrections during the outer loop run |
| **What we measure** | Count of operator corrections made during the outer loop run — corrections to scope, constraints, ACs, or story structure that were initiated by the operator rather than the model self-correcting |
| **Baseline** | Sonnet 4.6 run count (recorded by heymishy during this session) |
| **Target** | Lower count in Opus run than Sonnet run; absolute target is 0 unprompted corrections needed |
| **Minimum signal** | Operator intervention count is recorded for both runs — without this the comparison has no data |
| **Measurement method** | heymishy tracks corrections made during each run (tally in session notes). Recorded in experiment-scorecard.md after both runs complete. |

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1: Distribution sync | p4-spike-c, p4-dist-install, p4-dist-no-commits, p4-dist-commit-format, p4-dist-lockfile, p4-dist-upgrade, p4-dist-upstream, p4-dist-migration, p4-dist-registry | Complete |
| M2: Consumer confidence | p4-spike-a, p4-spike-b1, p4-spike-b2, p4-enf-decision, p4-enf-package, p4-enf-mcp, p4-enf-cli, p4-enf-schema, p4-enf-second-line, p4-dist-lockfile, p4-nta-artefact-parity, p4-nta-standards-inject | Complete |
| M3: Teams bot C7 fidelity | p4-spike-d, p4-nta-surface, p4-nta-gate-translation, p4-nta-artefact-parity, p4-nta-standards-inject, p4-nta-ci-artefact | Complete |
| MM-A: Scope fidelity | All 24 stories (cross-cutting) | Complete |
| MM-B: Constraint capture | All 24 stories (cross-cutting) | Complete |
| MM-C: AC completeness | All 24 stories (cross-cutting) | Complete |
| MM-D: Operator intervention | All 24 stories (cross-cutting) | Complete |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | benefit-metric |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md |
| run_timestamp | 2026-04-19T17:30:00Z |

> **Security note:** `model_label` is a descriptive string only. No API keys or credentials are included (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 22 |
| constraints_inferred_count | 5 |
| intermediates_prescribed | 3 product + 4 meta |
| intermediates_produced | 3 product + 4 meta |
