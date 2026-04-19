# Benefit Metric: Skills Platform — Phase 4: Distribution, Structural Enforcement, and Non-Technical Access

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Date defined:** 2026-04-19
**Metric owner:** heymishy

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes — this feature also runs a controlled experiment comparing Sonnet 4.6 vs Opus 4.6 outer loop quality (experiment ID: `exp-phase4-sonnet-vs-opus-20260419`). Product metrics measure real user outcomes from the Phase 4 deliverables. Meta metrics measure what we learn about model quality differences when both models receive identical inputs. The feature can succeed on product metrics even if the experiment is inconclusive, and vice versa — these are independent evaluation planes.

---

## Tier 1: Product Metrics (User Value)

### Metric 1 (M1): Distribution sync — zero-commit install and sync success rate

| Field | Value |
|-------|-------|
| **What we measure** | Two things: (1) whether the platform install command generates zero commits in the consumer's repository history, and (2) the percentage of subsequent sync (update) attempts that complete without requiring manual conflict resolution by the consumer |
| **Baseline** | 0% — no zero-commit install or sync mechanism exists today. All current installs require manual git operations (`git clone`, `git remote add`, `git pull`) that generate commits in the consumer's repo and frequently collide with the consumer's existing directory structure. Craig and Thomas have both experienced this directly. |
| **Target** | 100% zero-commit install (the install command must never generate a commit in the consumer repo) + ≥90% sync success rate (≥9 out of 10 sync attempts by Craig and Thomas require no manual intervention) |
| **Minimum validation signal** | One successful end-to-end install by Craig or Thomas that generates zero consumer commits and pulls the governance package into their repo — a single confirmed successful install proves the mechanism works |
| **Measurement method** | Automated: the install tooling asserts zero commits generated (CI-verifiable, part of the Spike C deliverable). Manual: Craig and Thomas self-report sync friction incidents after each platform release cycle. heymishy reviews the reports after each release. Frequency: per release cycle. |
| **Feedback loop** | If minimum signal is not met by Spike C completion, the distribution architecture is revisited before Theme B implementation stories begin. If ≥90% target is not met after 3 post-Phase 4 release cycles, the distribution mechanism design is reconsidered — findings feed Phase 5 distribution hardening scope. |

**Directional indicators covered:** Indicators 1 and 2 (stay current without breaking repo structure or commit provenance; contribute PRs back alongside normal delivery work).

---

### Metric 2 (M2): Consumer confidence — unassisted team member onboarding

| Field | Value |
|-------|-------|
| **What we measure** | Whether at least one team member — selected by Craig or Thomas, not by the platform team — can complete the full outer loop (discovery through definition-of-ready) on a real story in their work context without asking Craig, Thomas, or heymishy for help at any point |
| **Baseline** | 0 — no consumer has successfully onboarded a team member unassisted. Every adoption attempt to date has required platform team involvement to resolve tooling, structural, or workflow friction. |
| **Target** | ≥1 team member completes the full outer loop (discovery through DoR) on a real story without any question to Craig, Thomas, or heymishy |
| **Minimum validation signal** | The team member successfully completes at least one outer loop step (e.g. /discovery) unassisted and produces a valid artefact — partial completion counts as the minimum signal and confirms the onboarding path is viable even if not yet smooth |
| **Measurement method** | The onboarding team member documents their experience in a structured friction log: what worked, where they got stuck, and what they needed help with (if anything). Craig or Thomas collects and submits the log to heymishy at Phase 4 close. Reviewed once at Phase 4 close. |
| **Feedback loop** | If minimum signal is not met (team member cannot complete even one step unassisted), onboarding documentation, install tooling, and governance readability are all revisited before Phase 4 is declared complete. If full target is not met, friction log findings feed directly into Phase 5 onboarding and documentation work. |

**Directional indicators covered:** Indicators 3 and 4 (Craig and Thomas confident enough to onboard their teams; a team member can adopt without hitting the same walls).

---

### Metric 3 (M3): Teams bot C7 fidelity — zero violations in test session

| Field | Value |
|-------|-------|
| **What we measure** | The C7 violation rate during a structured test session: number of interactions where the Teams bot presents more than one question simultaneously, allows a step to be skipped, or fails to advance correctly after an answer — divided by total interactions in the session |
| **Baseline** | Not applicable — no Teams bot exists today. The first measurement is the prototype test session itself. There is no current C7 violation rate to compare against because the non-technical surface does not yet exist. |
| **Target** | 0 C7 violations across a complete test session running one outer loop step (e.g. /discovery) end-to-end in the Teams bot |
| **Minimum validation signal** | Bot completes at least 3 consecutive C7-compliant turns in a single session — receives a question, operator answers, bot advances correctly — 3 times without a violation. Below this, the Teams surface is not viable at the current architecture and scope defers to Phase 5. |
| **Measurement method** | heymishy runs the test session against the live Teams bot prototype and records a structured turn-by-turn log: question presented, single or multiple questions shown, operator answered, bot advanced correctly or not. The log is saved to artefacts at Spike D completion. Frequency: once at Spike D close. |
| **Feedback loop** | If minimum signal (3 consecutive C7-compliant turns) is not met, Spike D is not complete — the Teams surface is not viable at the current architecture, and non-technical access scope defers to Phase 5. If minimum is met but full target (0 violations across a complete step) is not met, the specific violation patterns are documented and fed into Phase 5 hardening scope. |

**Directional indicator covered:** Indicator 5 (non-technical participant can interact via Teams bot demonstrating C7 fidelity).

---

## Tier 1b — Metric quality check results

All three product metrics passed the quality check:

| Metric | Measurable today without building? | Two people get same answer? | Target unambiguous? |
|--------|-----------------------------------|-----------------------------|---------------------|
| M1 | No — install mechanism does not exist yet | Yes — zero commits is binary; sync friction is self-reported per incident | Yes — "zero commits" and "≥90% sync success" are specific |
| M2 | No — no consumer has onboarded a team member yet | Yes — "completed without asking for help" is observable and documented in friction log | Yes — "full outer loop on a real story without help" has a clear completion boundary |
| M3 | No — Teams bot does not exist yet | Yes — C7 compliance per turn is binary (one question or more than one) | Yes — "0 violations across a complete test session" is specific |

---

## Tier 2: Meta Metrics (Sonnet 4.6 vs Opus 4.6 Outer Loop Experiment)

**Experiment ID:** exp-phase4-sonnet-vs-opus-20260419
**Hypothesis:** Opus 4.6 produces higher-quality outer loop artefacts (tighter scope, better constraint capture, more testable ACs) than Sonnet 4.6 given identical input documents and operator instructions, at the cost of higher token spend. Quantifying the quality delta and cost delta together informs model routing policy for future outer loop runs.
**Design:** Sonnet runs first and establishes the baseline artefacts. Opus runs second with identical input documents (discovery.md, benefit-metric.md, ref-skills-platform-phase4-5.md, architecture-guardrails.md, decisions.md). heymishy reviews both outputs against a shared scorecard. Artefacts are stored in separate directories to prevent cross-contamination.
**Scorecard location:** `artefacts/2026-04-19-skills-platform-phase4-opus/experiment-scorecard.md` (Opus arm; Sonnet arm at `artefacts/2026-04-19-skills-platform-phase4/experiment-scorecard.md`)

---

### Meta Metric MM-A: Scope fidelity

| Field | Value |
|-------|-------|
| **Hypothesis** | Both models will introduce some scope drift when decomposing a complex 4-item MVP with 5 spikes into stories; Opus will drift less due to stronger constraint adherence |
| **What we measure** | Count of stories that introduce scope not present in the discovery artefact's 4 MVP items, or that drop MVP scope items without an explicit out-of-scope decision logged in decisions.md |
| **Baseline** | Sonnet 4.6 run score (recorded at Sonnet /definition close) |
| **Target** | 0 drift items in both runs; comparison value is the delta between Sonnet and Opus drift counts |
| **Minimum signal** | Both runs produce a complete /definition output (epics + stories + scope accumulator) — without complete outputs from both arms, comparison is not possible |
| **Measurement method** | heymishy blind-reviews both story sets against the discovery MVP scope items, counts drift items per run. A drift item is defined as: a story whose scope does not trace to any of the 4 MVP items, or a MVP item with no story coverage. Recorded in experiment-scorecard.md after both runs complete. |

---

### Meta Metric MM-B: Constraint capture

| Field | Value |
|-------|-------|
| **Hypothesis** | Opus will capture more of the 5 named constraints (C1, C4, C5, C7, C11) in story ACs and Architecture Constraints sections without operator prompting |
| **What we measure** | For each of the 5 named constraints: is it correctly reflected in at least one story AC or Architecture Constraint field, without the operator having to prompt the model to include it? Scored per constraint per run: captured / missed / prompted. |
| **Baseline** | Sonnet 4.6 run score (recorded at Sonnet /definition close) |
| **Target** | 5/5 constraints captured unprompted in both runs; comparison value is the delta |
| **Minimum signal** | ≥3/5 constraints captured in at least one run — below this the outer loop is not safe for governance-critical work regardless of model |
| **Measurement method** | heymishy reviews each story's Architecture Constraints and AC sections against the 5 named constraints, marks each as captured / missed / prompted per run. Recorded in experiment-scorecard.md. |

---

### Meta Metric MM-C: AC completeness — testable and specific vs vague

| Field | Value |
|-------|-------|
| **Hypothesis** | Opus will produce a higher proportion of ACs rated "testable and specific" compared to Sonnet |
| **What we measure** | For each AC across all stories: is it testable (a test plan author can write a failing test from the AC alone) and specific (no ambiguous terms like "should", "appropriate", "properly")? Rated per AC: testable-and-specific or vague. |
| **Baseline** | Sonnet 4.6 run score (recorded at Sonnet /definition close) |
| **Target** | ≥80% of ACs rated testable-and-specific in both runs; comparison value is the percentage delta |
| **Minimum signal** | ≥60% testable ACs in at least one run — below this the stories require rework before /test-plan can run |
| **Measurement method** | heymishy blind-rates each AC as testable-and-specific or vague per run, calculates the percentage for each run. Recorded in experiment-scorecard.md. |

---

### Meta Metric MM-D: Operator intervention rate

| Field | Value |
|-------|-------|
| **Hypothesis** | Opus will require fewer operator corrections during the outer loop run — the model self-corrects or gets it right the first time more often |
| **What we measure** | Count of operator corrections made during the outer loop run: corrections to scope, constraints, ACs, story structure, or workflow violations that were initiated by the operator rather than the model self-correcting or self-detecting |
| **Baseline** | Sonnet 4.6 run count (recorded by heymishy during the Sonnet session) |
| **Target** | Lower correction count in Opus run than Sonnet run; absolute target is 0 operator-initiated corrections needed |
| **Minimum signal** | Operator intervention count is recorded for both runs — without counts from both arms, comparison has no data |
| **Measurement method** | heymishy keeps a tally of corrections made during each run in session notes. A correction is defined as: operator explicitly tells the model to change, add, or remove something the model produced — not a question the model asks the operator. Recorded in experiment-scorecard.md after both runs complete. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

No Tier 3 metrics apply. The discovery artefact does not reference a regulatory change, audit finding, or named compliance framework. The 5 named constraints (C1, C4, C5, C7, C11) are platform design constraints, not regulatory obligations.

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1: Distribution sync | spike-a, spike-c, design-package-manifest, implement-zero-commit-install, implement-sync-command, implement-lockfile-hash-verification, implement-context-yml-seeding, validate-install-sync-e2e (8 stories) | Covered — full install/sync lifecycle with E2E validation |
| M2: Consumer confidence | spike-a, spike-b1, spike-b2, synthesise-enforcement-recommendation, record-enforcement-adr, design-readable-governance-format, implement-trace-plain-language, implement-gate-verdict-narrative, implement-second-line-audit-export, validate-readable-output-review, implement-teams-pipeline-health (11 stories) | Covered — enforcement selection + readable output + second-line audit |
| M3: Teams bot C7 fidelity | spike-d, implement-teams-bot-scaffold, implement-teams-dor-approval, implement-teams-pipeline-health, implement-teams-governance-output, validate-teams-e2e-session (6 stories) | Covered — full Teams lifecycle with E2E validation |
| MM-A: Scope fidelity | All 23 stories (cross-cutting) | Covered — scope accumulator run at /definition close |
| MM-B: Constraint capture | All 23 stories (cross-cutting) | Covered — 5 constraints traceable across story Architecture Constraints sections |
| MM-C: AC completeness | All 23 stories (cross-cutting) | Covered — 85 total ACs across 23 stories available for testability rating |
| MM-D: Operator intervention | All 23 stories (cross-cutting) | Covered — operator correction tally maintained during session |

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
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | benefit-metric |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md |
| run_timestamp | 2026-04-19T18:45:00Z |

> **Security note:** `model_label` is a descriptive string only. No API keys or credentials are included (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 5 |
| intermediates_prescribed | 3 product + 4 meta |
| intermediates_produced | 3 product + 4 meta |

**files_referenced:**

- .github/skills/benefit-metric/SKILL.md
- .github/templates/benefit-metric.md
- .github/templates/capture-block.md
- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
- product/mission.md
- product/roadmap.md
- .github/context.yml

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | All 7 metrics defined with baseline, target, minimum signal, measurement method, and feedback loop |
| Scope adherence | 5 | Metrics trace directly to discovery directional indicators; no metrics invented beyond what the discovery supports |
| Context utilisation | 4 | Product mission, roadmap, Phase 4.5 reference doc, and discovery all incorporated; no EA registry query needed for benefit-metric |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes
- target: artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
  accurate: yes
- target: product/mission.md
  accurate: yes
- target: product/roadmap.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
