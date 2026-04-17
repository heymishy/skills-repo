# Epic: Operator can capture structured performance data across model runs

**Discovery reference:** artefacts/2026-04-18-skill-performance-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-18-skill-performance-capture/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, a platform operator can enable opt-in instrumentation via a single `context.yml` block, run an outer loop skill session, and find a structured capture block appended to each phase output artefact (`discovery.md`, `benefit-metric.md`, each story, each test plan`). Running the same scenario twice with different model labels produces two sets of artefacts with comparable, schema-consistent capture blocks. The operator can read them side by side and make a cost-vs-quality judgement. Experiment output lives in a named `workspace/experiments/[experiment-id]/` directory. Instrumentation is off by default — consumers of the framework at scale pay no overhead unless they opt in.

## Out of Scope

- Automated comparison or analysis of capture blocks across runs — collation is manual operator work
- Turn-by-turn structural enforcement of capture (e.g. MCP tool mediation) — mechanisms may evolve in Phase 4; this epic delivers structured self-report only
- Fleet-scale aggregation of capture data across operators or squads
- Automated model routing based on captured data

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Capture block completeness rate | 0% (feature does not exist) | 100% | Stories spc.1–spc.3 implement the mechanism; spc.5 adds a governance check |
| MM1 — Context breadth (unprompted repo file refs) | Established on first run | ≥2 file delta between runs | spc.2 schema includes a `files_referenced` field; spc.3 instructs agent to populate it |
| MM2 — Constraint inference rate | Established on first run | Directional delta between runs | spc.2 schema includes a `constraints_inferred` count field |
| MM3 — Artefact linkage richness | Established on first run | Directional delta + 0 hallucinations | spc.2 schema includes a `backward_references` section with an accuracy field |

## Stories in This Epic

- [ ] spc.1 — `context.yml` instrumentation config schema defined
- [ ] spc.2 — Capture block schema and Markdown template defined
- [ ] spc.3 — Agent instruction integration in `copilot-instructions.md`
- [ ] spc.4 — Experiment workspace structure and manifest format
- [ ] spc.5 — Governance check: validate capture block completeness

## Human Oversight Level

**Medium** — changes touch `copilot-instructions.md` (agent instructions, governed) and introduce new template/schema files. No destructive changes. Coding agent should open as draft PR; human reviews before merge.
