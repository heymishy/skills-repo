## Epic: Outer Loop Journey — Test-Plan through Definition-of-Ready

**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md
**Slicing strategy:** User journey — stories follow the operator's path from story enumeration through DoR completion and the final journey completion screen.

## Goal

When this epic is complete, an operator who has completed the /definition gate-confirm can continue to enumerate the stories they defined, run /test-plan and /review sessions for each story with the correct prior context, and complete /definition-of-ready for each story. When all stories are DoR-complete, a journey completion screen is displayed summarising all artefacts produced. The operator has experienced the entire governed outer loop through a single web UI journey.

## Out of Scope

- Automatic story-slug parsing from the /definition artefact — for MVP the operator enters story slugs manually via a form. Auto-parsing is a post-MVP enhancement.
- Parallel story processing — stories are processed sequentially (one at a time) for MVP.
- GitHub PR creation after DoR — remains manual. The completion screen surfaces the artefact paths.
- Pipeline-state.json auto-update — remains manual for MVP.
- /estimate, /decisions, /clarify, or other support skills — only the 7 governed stages (discovery → benefit-metric → definition → test-plan → review → definition-of-ready) are in scope.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Journey completion rate ≥ 80% | Partial (Epic 2 covers first 3 stages) | ≥ 80% | This epic delivers the `journey_completed` signal (all stages done). Operators can now complete the full outer loop, making the completion rate measurable. |
| M2 — Non-engineer autonomous completion ≥ 1 | Dependent on Epic 2 | ≥ 1 | DoR completion without engineering help is only possible when the full loop is navigable through the UI, not just the first three stages. |
| MM1 — Artefact quality parity | Enabled by Epic 1 | ≥ VS Code baseline | Test-plan and review artefacts produced in the web UI carry full prior context (story + definition artefacts injected as priorArtefacts), enabling the model to produce quality-equivalent artefacts. |

## Stories in This Epic

- [ ] ougl.6 — Per-story stage routing: story list entry form and test-plan/review session management
- [ ] ougl.7 — Definition-of-ready per-story stage and journey completion screen

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Gate-confirm modifications handle per-story mode transitions — a more complex orchestration than the feature-level transitions in Epic 2. Journey completion screen is user-facing. PR review warranted.

## Complexity Rating

**Rating:** 2

The per-story iteration adds branching logic to the gate-confirm handler. The story list form is straightforward. The completion screen is simple HTML.

## Scope Stability

**Stability:** Stable

Stage sequence through DoR is fixed. The story enumeration form (manual slug entry) is an explicit scoping decision to avoid artefact-parsing complexity. No scope changes are expected.
