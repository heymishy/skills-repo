## Epic: Governance Observability Foundation

**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, platform contributors and future coding agents can find authoritative answers to governance implementation questions — trace format, test output conventions, feature lifecycle — in written standards documents, without reading source code. The platform operator can initialise a new feature in pipeline-state.json atomically and schema-validated using a single CLI command rather than a hand-crafted `node -e "..."` script.

This epic does not deliver the governance close. That is Epic 2. This epic builds the documented foundation and tooling that makes Epic 2 safe to implement correctly. The Wave 1 stories here are prerequisites, not the point — the point is M2 and M4.

## Out of Scope

- Changes to any enforcement module logic (assurance-gate.yml, run-assurance-gate.js, governance-package.js) — documentation and CLI only.
- Writing test plans or DoR artefacts for dependent stories — that is /test-plan and /definition-of-ready.
- Adding governance check scripts — the scripts are Epic 2 scope.
- Wiring H-checks to CI — that is SC-03 in Epic 2.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| M1: Architecture documentation coverage | 15 undocumented principles | 0 | SC-01 and SC-04 document all 15 principles across two standards files in `standards/governance/` |
| M3: Architecture blind-spot recurrence rate | 3 documented pattern categories | 0 new entries (6 months) | SC-04 formally closes the test-output-format blind-spot; SC-01 documents the trace enforcement path; SC-05 closes the feature-initialisation workaround category (G5 evidence from this feature's own delivery) |

## Stories in This Epic

- [ ] SC-01: Write trace contract standards document — `gpa-sc-01-trace-contract.md`
- [ ] SC-04: Write test output format standards document — `gpa-sc-04-test-output-format.md`
- [ ] SC-05: Add `skills init` command for atomic feature initialisation — `gpa-sc-05-skills-init.md`

## Human Oversight Level

**Oversight:** Low
**Rationale:** SC-01 and SC-04 are documentation-only stories with no code changes. SC-05 adds a new CLI command to a non-enforcement path (pipeline-state.json feature creation). No changes to enforcement logic, CI configuration, or shared governance modules.

## Complexity Rating

**Rating:** 1–2
**Scope stability:** Stable
