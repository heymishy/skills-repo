## Epic: Governed artefact chain is reachable from CI runs without git access

**Discovery reference:** `artefacts/2026-04-23-ci-artefact-attachment/discovery.md`
**Benefit-metric reference:** `artefacts/2026-04-23-ci-artefact-attachment/benefit-metric.md`
**Slicing strategy:** Walking skeleton — caa.1 establishes the CI-agnostic artefact collection engine; caa.2 delivers the first platform adapter (GitHub Actions) and workflow integration; caa.3 adds the `context.yml` configuration harness that makes the whole feature opt-in and platform-switchable.

## Goal

When this epic is complete, a non-technical stakeholder with no git access can reach the full governed artefact chain — discovery through DoD — from a CI run URL in two clicks or fewer. A platform consumer configures the behaviour entirely through `context.yml` with no workflow file edits. A second CI platform (e.g. GitLab CI) can be supported by adding one adapter file, with no changes to the collection engine or the assurance gate core logic.

## Out of Scope

- Non-git consumer distribution (Teams bot, Foundry, Confluence) — that is WS0.4, depends on Spike D.
- External project management tool integration (Jira, ServiceNow, Azure DevOps work items) — consumers use the artifact download link themselves.
- Long-term archival beyond the CI platform's native artifact retention window.
- Verbatim instruction assembly record (G19) — intentionally deferred to Phase 6 WS9 per product/constraints.md.
- Multi-feature PR artefact collection (Spike C5 second sub-question) — single-feature resolution only in this epic.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Evidence reach without git access | ≥5 manual steps, no self-service path | ≤2 clicks from a shared CI run URL | caa.2 uploads the bundle and posts a direct link; caa.3 makes it opt-in |
| M2 — Zero breakage to existing consumers | 0 failures | 0 regressions | Default `ci_attachment: false`; caa.3 opt-in gate; test coverage in caa.1 and caa.3 |
| M3 — CI-platform adapter extensibility | No adapter interface exists | Second platform addable with one new file | caa.2 defines and documents the interface; caa.3 routes by `ci_platform` |
| MM1 — `context.yml` as single config surface | No CI integration config exists | Platform switch requires only a `context.yml` edit | caa.3 reads `audit.ci_platform` and dispatches to adapters |
| MM2 — `trace-report.js` zero-dependency constraint | Zero external deps | Zero new deps after `--collect` added | caa.1 uses Node built-ins only; verified in test suite |

## Stories in This Epic

- [ ] caa.1 — Add `--collect` flag to `trace-report.js`: CI-platform-agnostic artefact assembly
- [ ] caa.2 — GitHub Actions adapter: upload artefact bundle and post summary link
- [ ] caa.3 — `context.yml` opt-in gate and `ci_platform` adapter routing

## Human Oversight Level

Medium — coding agent should pause for human review at PR. This feature modifies `scripts/trace-report.js` (a zero-dependency script with wide consumption) and `assurance-gate.yml` (a governance-critical workflow). Human review of both before merge is appropriate.
