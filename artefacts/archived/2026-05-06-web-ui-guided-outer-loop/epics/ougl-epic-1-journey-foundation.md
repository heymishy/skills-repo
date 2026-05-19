## Epic: Journey Foundation — handoff infrastructure and state management

**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md
**Slicing strategy:** User journey — stories follow the chronological implementation path; each builds on the previous.

## Goal

When this epic is complete, the web UI skill session engine can inject prior-stage artefact content into a new session's system prompt (enabling coherent multi-stage conversations), and the server maintains per-journey state that tracks which stages have been completed and which artefacts have been saved to disk. All downstream outer loop routing stories depend on this infrastructure being in place first.

## Out of Scope

- No user-facing UI is delivered in this epic. There are no new HTML pages or routes visible to the operator.
- Story-level iteration (per-story /test-plan / /review / /definition-of-ready orchestration) — this epic provides only the single-session handoff primitive; multi-story loops are Epic 3.
- Artefact disk-write logic — that belongs to the gate-confirm handler in Epic 2.
- Pipeline-state.json writes — remain a manual operator step for MVP per discovery scope.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| MM1 — Artefact quality parity (web UI trace pass rate ≥ VS Code baseline) | 0% (feature not yet built) | ≥ VS Code baseline | The handoff block gives each new stage session the prior artefact content, ensuring the model has the same context a VS Code operator would have manually. Without this, quality parity is impossible. |
| MM2 — Handoff coherence ≥ 4/5 operator rating | Not measured | ≥ 4/5 on first 3 features | The HANDOFF CONTEXT injection is the mechanism by which the next-stage model understands what was decided in prior stages. |

## Stories in This Epic

- [ ] ougl.1 — Extend `buildSystemPrompt` with optional `priorArtefacts` parameter
- [ ] ougl.2 — Journey state store module, `registerHtmlSession` extension, and server.js wiring

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Changes to `buildSystemPrompt` affect every HTML skill session (existing and journey). The priorArtefacts parameter is additive and backward-compatible, but regressions in the core system prompt would break all sessions. Coding agent should pause for human review at PR.

## Complexity Rating

**Rating:** 1

These are well-scoped additive changes to a pure function (`buildSystemPrompt`) and a new module with no external dependencies. The pattern (injectable adapter, in-memory store) is already established in the codebase.

## Scope Stability

**Stability:** Stable

The handoff schema and stage sequence were resolved by the spike. The interface contracts (function signatures, data model) are fixed.
