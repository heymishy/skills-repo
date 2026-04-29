# Benefit Metric: /reverse-engineer Reference Artefact Set

**Discovery reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/discovery.md`
**Date defined:** 2026-04-30
**Metric owner:** Hamish — Platform maintainer
**Reviewers:** Hamish — Platform maintainer (self-review; platform evolution cycle)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative is platform tooling — it improves a skill library capability rather than delivering direct end-user value. All metrics are Tier 2 meta-metrics measuring platform efficiency and adoption. There are no Tier 1 product metrics for this feature.

---

## Tier 2: Meta Metrics (Platform Tooling Improvement)

### MM1: Discovery pre-population time saved

| Field | Value |
|-------|-------|
| **Hypothesis** | An operator with a reverse-engineering corpus and a pre-populated `discovery-seed.md` can complete a `/discovery` run for a feature touching that system significantly faster than without one — because the constraint inventory, problem framing, and system context are already structured. |
| **What we measure** | Operator focus time from "start /discovery session" to "discovery artefact saved as Draft" — compared across sessions with and without a reference corpus. |
| **Baseline** | No `discovery-seed.md` exists for any system. Estimated current time for non-trivial system: ~30 minutes of operator focus time to reconstruct context. |
| **Target** | Operator can complete /discovery for a system with an existing corpus in < 10 minutes (vs ~30 min without). Discovery artefact is noticeably richer in the constraints section when seeded. |
| **Minimum signal** | At least one /discovery run uses a `discovery-seed.md` and produces a discovery artefact with a populated "Known legacy constraints" section that the operator did not write manually. |
| **Measurement method** | Operator self-report at session end. Compare `/estimate` E1 focus-time for seeded vs unseeded discovery runs in `workspace/estimation-norms.md`. |

---

### MM2: Constraint index coverage in story DoR artefacts

| Field | Value |
|-------|-------|
| **Hypothesis** | Tech leads writing DoR artefacts for stories touching legacy-adjacent code will include a constraint-index.md reference pointer once the index exists — reducing the likelihood that a coding agent violates a legacy constraint that was documented but not surfaced in context. |
| **What we measure** | Count of DoR artefacts for legacy-adjacent stories that include an explicit reference to `constraint-index.md` (or its contents) vs total DoR artefacts for legacy-adjacent stories. |
| **Baseline** | 0 — no `constraint-index.md` exists for any system; no DoR artefacts reference one. |
| **Target** | 100% of DoR artefacts for stories touching a system with an existing corpus include a constraint-index.md reference. |
| **Minimum signal** | At least 1 DoR artefact for a legacy-adjacent story explicitly references `constraint-index.md`. |
| **Measurement method** | Manual check at DoD: does the story's DoR artefact reference `constraint-index.md`? Record in DoD artefact under AC coverage. |

---

### MM3: Reference corpus continuity across delivery cycles

| Field | Value |
|-------|-------|
| **Hypothesis** | The reference corpus remains materially current (no silent staleness) across at least 2 feature delivery cycles touching the same system when `/reference-corpus-update` is used after each delivery. |
| **What we measure** | Whether `corpus-state.md` for a system is updated via `/reference-corpus-update` after a feature touching that system is merged — or whether the corpus goes stale without detection. |
| **Baseline** | No `/reference-corpus-update` skill exists. Corpus staleness is currently undetectable without a full re-extraction. |
| **Target** | At least 2 consecutive feature deliveries touching a system with an existing corpus result in a `/reference-corpus-update` run and an updated `corpus-state.md`. |
| **Minimum signal** | `/reference-corpus-update` invoked at least once after a real feature delivery; `corpus-state.md` updated with a non-trivial change note. |
| **Measurement method** | Check `corpus-state.md` `lastRunAt` and change note after each delivery touching the system. Record in `/record-signal` or DoD artefact. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| MM1 — Discovery pre-population time saved | rrc.1 (Output 9 / discovery-seed), rrc.3 (/discovery integration) | To be confirmed at /definition |
| MM2 — Constraint index coverage in DoR | rrc.2 (Output 10 / constraint-index) | To be confirmed at /definition |
| MM3 — Reference corpus continuity | rrc.4 (/reference-corpus-update skill) | To be confirmed at /definition |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
