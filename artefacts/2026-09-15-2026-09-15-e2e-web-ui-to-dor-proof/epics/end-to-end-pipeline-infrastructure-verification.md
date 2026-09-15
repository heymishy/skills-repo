## Epic: End-to-End Pipeline Infrastructure Verification

**Discovery reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/benefit-metric.md
**Slicing strategy:** vertical-slice

## Goal

Confirm that the wsd/wsap pipeline-state and artefact-path fixes compose correctly through the web UI outer loop by running a complete discovery → definition stage sequence with real GitHub commits and correct state updates at each boundary.

## Out of Scope

- Any real product functionality or code changes
- Inner loop execution, branch setup, or coding agent dispatch
- Automated regression test infrastructure
- More than 2 stories or additional verification runs

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/benefit-metric.md]

## Stories in This Epic

- [ ] Verify discovery through definition pipeline stages — artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s1.md
- [ ] Verify review through definition-of-ready pipeline stages — artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s2.md

## Human Oversight Level

**Oversight:** High
**Rationale:** This is a critical infrastructure verification run before further feature delivery. A regression in the pipeline state or artefact paths would compound into all future features.

## Complexity Rating

**Rating:** 1

## Scope Stability

**Stability:** Stable
