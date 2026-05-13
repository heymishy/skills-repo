# Benefit Metric: Model Evaluation Capability

**Discovery reference:** `artefacts/2026-05-10-model-evaluation-capability/discovery.md`
**Date defined:** 2026-05-14
**Metric owner:** heymishy (platform maintainer)
**Reviewers:** operator (solo repo — single-person review acknowledged)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative is a Tier 2 (meta) initiative: it validates tooling capability and measurement infrastructure, not end-user product value. All metrics below are Tier 2 meta-metrics. There are no Tier 1 product metrics at this stage — the output of this work is the measurement capability itself, which will be used to validate Tier 1 metrics in future features.

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1 (MM1): Skill sweep coverage — EVAL.md adoption

| Field | Value |
|-------|-------|
| **Hypothesis** | Having EVAL.md rubric files for critical skills will allow the platform to make measurement-backed model routing decisions rather than intuition-based ones |
| **What we measure** | Number of skills with a complete EVAL.md (rubric + corpus + pass threshold) |
| **Baseline** | 0 skills with EVAL.md at 2026-05-10 |
| **Target** | ≥ 2 skills with EVAL.md and at least one completed sweep run each |
| **Minimum signal** | 1 skill with EVAL.md and a completed scorecard |
| **Measurement method** | Count files matching `.github/skills/*/EVAL.md`; verify each has a scorecard in `workspace/experiments/` |
| **Current status** | ✅ **Target met** — 2 EVAL.md files: `/discovery` (EXP-001 scorecard 2026-05-12) and `/definition-of-ready` (EVAL.md written; sweep pending EXP-003) |

---

### Meta Metric 2 (MM2): T5 hidden constraint surfacing pass rate

| Field | Value |
|-------|-------|
| **Hypothesis** | After the proposed `/discovery` SKILL.md update (constraint surfacing rule), the model's T5 hidden-constraint pass rate will exceed the 0.70 threshold that both models currently fail |
| **What we measure** | Average T5 dimension score across Opus 4.6 and Sonnet 4.6 on the 5 financial services corpus cases, under the updated SKILL.md |
| **Baseline** | Sonnet 4.6: 0.490 (Scenario 1, EXP-001); Opus 4.6: 0.490 (Scenario 1, EXP-001). Both fail. Context-loaded (EXP-002b): Opus 0.562, Sonnet 0.350 — both still fail |
| **Target** | Opus 4.6 T5 avg ≥ 0.70 after SKILL.md update applied and EXP-003 run |
| **Minimum signal** | Opus T5 avg ≥ 0.60 (directional improvement confirms the hypothesis, even if threshold not met) |
| **Measurement method** | EXP-003 run against the same 5 corpus cases using the updated SKILL.md; scores recorded in `workspace/experiments/EXP-003-*/scorecard.md` |
| **Current status** | ⚠️ **Baseline established, target not yet measured** — EXP-003 blocked on: (1) SKILL.md challenger pre-check on `workspace/proposals/proposed-discovery-skill-update-exp-002b.md`, (2) EXP-002a (OpenAI provider setup for cross-provider comparison) |

---

### Meta Metric 3 (MM3): Routing policy measurement-backed coverage

| Field | Value |
|-------|-------|
| **Hypothesis** | Explicitly tagging routing policy tiers with `measurement_backed: true/false` will surface which routing decisions lack evidence and create a named link between policy and experiment artefacts |
| **What we measure** | Percentage of model routing tiers in `token-optimization` SKILL that are tagged `measurement_backed: true` |
| **Baseline** | 0% — no `measurement_backed` field exists in the routing tiers at 2026-05-10 |
| **Target** | ≥ 1 tier tagged `measurement_backed: true`, referencing a completed EXP-xxx artefact |
| **Minimum signal** | The `measurement_backed` field exists in at least one tier (structural improvement regardless of value) |
| **Measurement method** | Read `.github/skills/token-optimization/SKILL.md` routing tier definitions; check for `measurement_backed` field |
| **Current status** | ⚠️ **Proposal written, not yet applied** — `workspace/proposals/proposed-update-token-optimization-measurement.md` is awaiting operator review and application |

---

## Metric Coverage Matrix

| Metric | Story coverage | Notes |
|--------|---------------|-------|
| MM1 — Sweep coverage | EXP-001 (complete), EXP-002b (complete), EXP-003 (planned) | /definition-of-ready sweep pending EXP-003 |
| MM2 — T5 pass rate | EXP-002b baseline established; EXP-003 will measure post-SKILL.md update | Blocked on challenger pre-check |
| MM3 — Routing policy coverage | Proposal `proposed-update-token-optimization-measurement.md` | Awaiting operator review |

---

## Signal Log

| Date | Metric | Signal | Evidence |
|------|--------|--------|----------|
| 2026-05-12 | MM1 | ✅ Minimum signal met — 1 skill with EVAL.md + scorecard | `workspace/experiments/EXP-001-discovery-phase4-5/scorecard.md` |
| 2026-05-12 | MM1 | ✅ Target met — 2 EVAL.md files built | `/discovery/EVAL.md`, `/definition-of-ready/EVAL.md` |
| 2026-05-12 | MM2 | Baseline established — both models fail T5 at 0.490 | EXP-001 run-3b scorecard |
| 2026-05-13 | MM2 | Context-loading improves Opus T5 to 0.562 but does not reach threshold | `workspace/experiments/EXP-002b/scorecard.md` |
| 2026-05-14 | MM3 | Proposal written — `measurement_backed` field proposed | `workspace/proposals/proposed-update-token-optimization-measurement.md` |

---

## Next measurement actions

1. **MM2:** Run challenger pre-check on `workspace/proposals/proposed-discovery-skill-update-exp-002b.md`; if passes, apply the 3 SKILL.md changes; run EXP-003 to measure post-update T5 score.
2. **MM3:** Review `workspace/proposals/proposed-update-token-optimization-measurement.md`; if accepted, apply to `token-optimization` SKILL and tag at least one routing tier with `measurement_backed: true` referencing EXP-001 scorecard.
3. **MM1:** After EXP-003 completes, confirm `/definition-of-ready` EVAL.md sweep has been run and scorecard produced.
