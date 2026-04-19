# Epic Template

## Epic: Governance output is human-readable and second-line audit operates independently of first-line delivery

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

Governance output (trace reports, gate verdicts, scope drift analyses) produced by the pipeline is readable by non-engineers without requiring knowledge of JSON schema, pipeline internals, or SKILL.md structure. Second-line audit (risk professionals, auditors) can independently verify pipeline compliance without relying on first-line delivery teams to interpret or present the evidence. This epic delivers Theme F deliverables (4.F.1 through 4.F.4 from the Phase 4.5 reference document) and the readable governance output item from the discovery MVP.

## Out of Scope

- Full enterprise audit integration (ServiceNow, ITSM) — configuration hooks exist in `context.yml` but integration is Phase 5 scope
- Automated compliance reporting against named regulatory frameworks — the NFR profile captures compliance requirements per story, but automated report generation is not Phase 4 scope
- Modifying the existing `dashboards/pipeline-viz.html` architecture — ADR-001 constrains the viz to single-file HTML; this epic produces governance output in a separate rendering path, not embedded in the viz
- Real-time audit monitoring or alerting — Phase 4 delivers batch/on-demand readable output, not a continuous monitoring surface

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2 (Consumer confidence — unassisted team member onboarding) | Not measured | One team member onboards unassisted | Readable governance output reduces the expertise required to understand pipeline health and compliance status |
| MM-A (Scope fidelity — 0 items added/removed vs. discovery) | Discovery: 4 MVP items | 0 drift | This epic covers the "readable governance output" MVP item directly |

## Stories in This Epic

- [ ] Design the human-readable governance output format — design-readable-governance-format
- [ ] Implement trace report rendering as plain-language summary — implement-trace-plain-language
- [ ] Implement gate verdict rendering as structured narrative — implement-gate-verdict-narrative
- [ ] Implement second-line audit export with independent verification path — implement-second-line-audit-export
- [ ] Validate readable output with a non-engineer reviewer — validate-readable-output-review

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Output format design benefits from human input on readability, but implementation is well-constrained by the existing trace and gate data structures. Human review at PR and at the validation story is sufficient.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable — no spike gates this epic. Dependencies are on Epic 1 (enforcement mechanism selection informs what governance data is available) and Epic 2 (distribution model informs what governance package consumers receive).
