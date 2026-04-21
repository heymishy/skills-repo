# Benefit Metric: Modernisation Decompose — Bridging /reverse-engineer to the Delivery Pipeline

**Discovery reference:** artefacts/2026-04-22-modernisation-decompose/discovery.md
**Date defined:** 2026-04-22
**Metric owner:** Platform maintainer (Hamish)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative tests whether a codified decomposition heuristic can replace ad-hoc human judgment when bridging a reverse-engineering corpus to the delivery pipeline. That means two types of metrics: product metrics tracking pipeline consistency outcomes, and meta metrics tracking whether the skill guidance itself works.

---

## Tier 1: Product Metrics (Pipeline Outcome Value)

### M1: Decomposition consistency

| Field | Value |
|-------|-------|
| **What we measure** | When two independent operators run `/modernisation-decompose` on the same rev-eng report, the percentage agreement on: (a) number of candidate features produced, and (b) rule-to-feature assignment (same rule in same feature). |
| **Baseline** | 0% — no consistent decomposition heuristic exists today; every operator cuts features differently |
| **Target** | ≥ 80% agreement on feature count and rule assignment across two independent runs on the same corpus |
| **Minimum validation signal** | ≥ 1 squad lead uses the output of a `/modernisation-decompose` run without manually revising the feature boundaries |
| **Measurement method** | Platform maintainer: compare two independent candidate-features.md outputs for the same system-slug. Measured at first real-world adoption. |
| **Feedback loop** | If < 80% on first adoption: review the heuristic rules in the SKILL.md, identify which boundary signals are ambiguous, and revise before next use. |

---

### M2: Modernisation outer-loop entry rate

| Field | Value |
|-------|-------|
| **What we measure** | % of modernisation projects (those with a rev-eng corpus) that enter `/discovery` with a candidate-features.md produced by `/modernisation-decompose`, rather than a manually constructed feature brief |
| **Baseline** | 0% — bridging skill does not exist |
| **Target** | 100% — all modernisation paths use the skill (no manual decomposition) |
| **Minimum validation signal** | Skill is invocable and produces a valid candidate-features.md for any well-formed rev-eng report |
| **Measurement method** | Platform maintainer: inspect pipeline-state.json entries for features with `track: modernisation` — check whether each has a parent corpus artefact. Measured per programme. |
| **Feedback loop** | If teams bypass the skill: investigate why (skill too slow, output not trusted, entry condition too strict) and address before next sprint. |

---

### M3: Convergence metric visibility

| Field | Value |
|-------|-------|
| **What we measure** | Whether per-system convergence fields (module coverage %, `[VERIFIED]:[UNCERTAIN]` rule rating ratio) are written to the corpus artefact and visible on the pipeline visualiser per system-slug after running `/modernisation-decompose` |
| **Baseline** | Not tracked — convergence has no defined representation today |
| **Target** | Fields written by default on every `/modernisation-decompose` run; human-readable on the pipeline visualiser |
| **Minimum validation signal** | Fields exist in at least one corpus artefact and render correctly in the viz |
| **Measurement method** | Platform maintainer: verify corpus-state.md (or equivalent) is written on first run and that the viz renders the values. |
| **Feedback loop** | If fields are missing or not rendered: fix in the next skill revision cycle. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### MM-A: First-run acceptance rate

| Field | Value |
|-------|-------|
| **Hypothesis** | A codified Java decomposition heuristic (Maven module boundaries, Spring @Service clustering, JPA aggregate ownership, @Transactional span analysis) produces feature boundaries that a squad lead considers correct without modification on first use |
| **What we measure** | % of candidate-features.md outputs accepted by the receiving squad lead without manual boundary revision on first use |
| **Baseline** | Not measurable pre-skill |
| **Target** | ≥ 75% first-run acceptance — squad leads use the output as-is in 3 out of 4 first uses |
| **Minimum signal** | ≥ 1 squad lead confirms they used the output as-is and found the feature boundaries sensible |
| **Measurement method** | Platform maintainer: structured debrief with squad lead after first use (5 questions: did you revise? which boundaries? why?). Measured on first 4 real-world runs. |

---

### MM-B: Heuristic coverage for low-signal codebases

| Field | Value |
|-------|-------|
| **Hypothesis** | The skill's escalation path for poorly-modularised systems (pre-Maven, circular dependencies, no clear aggregate roots) is sufficient — operators know what to do when signals are ambiguous, and they don't abandon the skill |
| **What we measure** | Whether operators who hit a low-signal codebase complete the decomposition (possibly with manual overrides) vs abandon the skill run entirely |
| **Baseline** | Not measurable pre-skill |
| **Target** | 0 abandoned skill runs attributable to unclear low-signal guidance |
| **Minimum signal** | The SKILL.md's escalation path is exercised at least once and the operator completes the run |
| **Measurement method** | Platform maintainer: track completion vs abandonment in any session where the low-signal escalation path is triggered. Self-reported in workspace/learnings.md. |

---

## Metric Coverage Matrix

*(Populated by `/definition` after stories are created)*

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Decomposition consistency | TBD | Gap — pending /definition |
| M2 — Outer-loop entry rate | TBD | Gap — pending /definition |
| M3 — Convergence metric visibility | TBD | Gap — pending /definition |
| MM-A — First-run acceptance rate | TBD | Gap — pending /definition |
| MM-B — Heuristic coverage for low-signal codebases | TBD | Gap — pending /definition |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
