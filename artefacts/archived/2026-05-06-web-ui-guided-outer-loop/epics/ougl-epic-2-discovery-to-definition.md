## Epic: Outer Loop Journey — Discovery through Definition

**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md
**Slicing strategy:** User journey — stories follow the operator's chronological experience from first landing on the journey entry screen through confirming the definition artefact.

## Goal

When this epic is complete, an operator can open the web UI at `/journey`, start a new discovery journey, complete the /discovery session, confirm the discovery artefact to disk, and be automatically routed to /benefit-metric with the discovery content injected into the system prompt. The same gate-confirm mechanism carries the operator through /definition. The operator interacts only with the existing chat UI — no new chat pages are needed; this epic adds the journey scaffolding around it.

## Out of Scope

- Per-story stages (/test-plan, /review, /definition-of-ready) — Epic 3.
- GitHub commit / PR creation — artefacts are written to local disk only, per discovery MVP scope. GitHub push remains a manual step.
- Pipeline-state.json auto-update — remains manual for MVP.
- In-progress journey resume — the server restarts with no journey state; no persistence across restarts for MVP.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Journey completion rate ≥ 80% | 0% (feature not yet built) | ≥ 80% | This epic delivers the first three stages of the outer loop, generating the `journey_started` event and enabling the operator to complete discovery → benefit-metric → definition without manual copy-paste. |
| M2 — Non-engineer autonomous completion ≥ 1 within 4 weeks | 0 | ≥ 1 | The entry screen and staged progression make the outer loop approachable without pipeline expertise. |
| MM1 — Artefact quality parity | Dependent on Epic 1 | ≥ VS Code baseline | Gate-confirm writes artefacts to disk and injects them as prior context, enabling the next-stage model to see what was decided. |
| MM2 — Handoff coherence ≥ 4/5 | Not measured | ≥ 4/5 | The "Save and continue to [next skill]" button at each stage end gives the operator a clear, guided transition rather than a dead end. |

## Stories in This Epic

- [ ] ougl.3 — Journey entry screen and start endpoint
- [ ] ougl.4 — Journey session field and journey-aware chat "Save and continue" button
- [ ] ougl.5 — Gate-confirm handler: write to disk, build handoff, route to next stage

## Human Oversight Level

**Oversight:** Medium
**Rationale:** New routes touch the existing chat UI render path (`handleGetChatHtml`). The gate-confirm handler writes files to disk in the repo root directory. Both deserve PR review before merge.

## Complexity Rating

**Rating:** 2

The entry screen and session creation are Complexity 1. The gate-confirm is Complexity 2 — it orchestrates disk writes, session creation, and state transitions, and the feature-slug derivation from `session.artefactPath` requires careful parsing.

## Scope Stability

**Stability:** Stable

Stage sequence, artefact path conventions, and handoff block format were resolved by the spike. The write-then-read pattern is fixed (ADR recorded in decisions.md).
