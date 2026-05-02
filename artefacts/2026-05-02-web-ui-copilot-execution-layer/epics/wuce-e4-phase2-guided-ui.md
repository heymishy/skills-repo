## Epic: Phase 2 — Guided skill UI (browser conversation layer)

**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md
**Slicing strategy:** User journey

## Goal

A non-technical stakeholder can initiate a pipeline skill (starting with `/discovery`) from the web UI, answer the skill's questions in a guided step-by-step form, see the artefact building incrementally in the browser as answers are accepted, and end the session with a structurally valid, attributed artefact committed to the repository — without opening VS Code, a terminal, or a text editor. The entire outer loop skill execution journey is available in the browser, producing artefacts that are indistinguishable in structure and quality from those produced via the VS Code path.

## Out of Scope

- The execution engine itself (process spawning, session isolation, BYOK) — that is Epic 3; this epic is the UI layer on top
- Extending to skills beyond `/discovery` in the first release — the engine and UI are proven end-to-end with one skill; other skills follow as configuration without new stories
- Real-time multi-user collaborative editing of the same artefact simultaneously — explicitly deferred
- Streaming token-by-token output to the browser (server-sent events infrastructure) — acceptable for v1 to poll/batch; streaming is a progressive enhancement story, not a launch requirement
- Skill authoring or editing of SKILL.md files via the UI — explicitly out of scope for the entire feature

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| P2 — Unassisted /discovery completion rate | 0% | ≥70% of Phase 2 /discovery sessions produce valid artefact on first attempt | This epic is the direct delivery mechanism for P2 — the question flow, artefact build, and write-back are all in this epic |
| P3 — Non-technical attribution rate | Established by Phase 1 | ≥90% of approved discovery artefacts | Phase 2 write-back commits under authenticated user's identity, same as Phase 1 |
| P5 — Sign-off wait time | Establishing | ≥30% reduction | The outer loop cycle time shortens because non-engineers can now run skills themselves without scheduling an engineer session |

## Stories in This Epic

- [ ] wuce.13 — Skill launcher and guided question flow (step-by-step form UI)
- [ ] wuce.14 — Incremental artefact preview (builds in browser as questions are answered)
- [ ] wuce.15 — Artefact write-back with attribution (commit to repo under user identity)
- [ ] wuce.16 — Multi-turn session persistence (resume an in-progress skill session)

## Human Oversight Level

**Oversight:** High
**Rationale:** Browser UI layer that renders artefact content and handles multi-turn session state. Incorrect rendering of artefact content could misrepresent governance records. Session state management across browser refreshes and reconnects must handle edge cases (partial artefact, interrupted session) without data loss or corruption. Human review required at each story.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable
