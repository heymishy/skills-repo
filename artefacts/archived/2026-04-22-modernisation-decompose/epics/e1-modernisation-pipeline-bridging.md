# Epic: Modernisation Pipeline Bridging

**Discovery reference:** artefacts/2026-04-22-modernisation-decompose/discovery.md
**Benefit-metric reference:** artefacts/2026-04-22-modernisation-decompose/benefit-metric.md
**Slicing strategy:** Risk-first — SKILL.md content (md-1) carries the highest design ambiguity; skill contracts (md-2) and ADR (md-3) are mechanical once md-1 is settled.

## Goal

A platform engineer who has completed a `/reverse-engineer` run can invoke `/modernisation-decompose` and receive a `candidate-features.md` — a structured list of N bounded feature slugs, each pre-populated with the inputs `/discovery` needs. The decomposition is consistent across operators (same corpus → comparable boundaries), the outer-loop convergence status is written as a visible metric, and every candidate feature is pre-configured to use the umbrella parity metric convention so downstream `/review` runs produce zero false HIGH findings.

## Out of Scope

- Formal changes to `/definition` slicing strategies — the bridging skill pre-selects `risk-first` with a modernisation flag; no new strategies are added to the picker.
- Formal changes to `/review` Category A spec — the umbrella metric convention resolves the mis-calibration without touching `/review`.
- Non-Java language heuristics (COBOL, PL/SQL, .NET) — extension points are designed in but not implemented.
- Pipeline visualiser changes to render corpus-state data — the convergence fields are written to `corpus-state.md`; visualiser integration is post-MVP.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Decomposition consistency | 0% | ≥80% agreement across independent runs | SKILL.md defines the canonical heuristics that produce comparable outputs |
| M2 — Outer-loop entry rate | 0% | 100% of modernisation projects use the skill | Skill exists and passes governance suite; teams have a supported path |
| M3 — Convergence metric visibility | Not tracked | Written by default on every run | SKILL.md's mandatory state update step writes convergence fields |
| MM-A — First-run acceptance rate | Not measurable | ≥75% used as-is | Quality of Java boundary heuristics in SKILL.md determines acceptance |
| MM-B — Low-signal heuristic coverage | Not measurable | 0 abandoned runs | Escalation path for ambiguous signals in SKILL.md prevents abandonment |

## Stories in This Epic

- [ ] md-1 — Write `/modernisation-decompose` SKILL.md
- [ ] md-2 — Register skill in `check-skill-contracts.js`
- [ ] md-3 — Add ADR-014 (dual-scope artefact model) to `architecture-guardrails.md`

## Human Oversight Level

**Medium** — the SKILL.md content encodes novel design decisions (decomposition heuristics, convergence criterion) that should be reviewed by the platform maintainer before merge. The coding agent opens a draft PR; the platform maintainer reviews and merges.
