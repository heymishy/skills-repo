## Epic: Operators can reopen and revise any completed stage's live session

**Discovery reference:** `artefacts/2026-08-27-revise-earlier-stage/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-27-revise-earlier-stage/benefit-metric.md`
**Slicing strategy:** User journey

## Goal

When this epic is complete, an operator who has already gate-confirmed a stage (any stage, not just the immediately-preceding one) can click that stage's step-nav link and land directly in a live, resumable chat session for it — the same interactive experience already available for the current active stage — instead of the static read-only stage view. If they send a revision turn, the resulting artefact overwrites the existing file at its original path. The journey's own progress record (`completedStages`, `stage`, `stages[]`) is unaffected by the reopen — a person resuming an old stage does not corrupt or duplicate what the journey already knows about its own history.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    STEPNAV[journey.js: step-nav render]\n    RESUME_CHECK[getGetHtmlSession lookup]\n    CHAT[skills/:skill/sessions/:id/chat]\n    RESOLVE[journey-store.js: resolve stage session]\n    PRIOR[buildSystemPrompt priorArtefacts]\n    TURN[chat turn handler]\n    OVERWRITE[artefact disk overwrite]\n    MATERIALITY[materiality judgment]\n    SUGGEST[chat suggestion message]\n    ACTION[operator action: flag or leave]\n    FLAGSTORE[journey-store.js: stage flag state]\n    STEPNAV --> RESUME_CHECK\n    RESUME_CHECK -->|exists| CHAT\n    RESUME_CHECK -->|missing| RESOLVE\n    RESOLVE --> PRIOR\n    PRIOR --> CHAT\n    CHAT --> TURN\n    TURN --> OVERWRITE\n    OVERWRITE --> MATERIALITY\n    MATERIALITY --> SUGGEST\n    SUGGEST --> ACTION\n    ACTION --> FLAGSTORE\n    FLAGSTORE --> STEPNAV"}}---

## Out of Scope

- **Materiality suggestions and downstream-stage guidance** — this epic only makes reopening and revising possible; judging whether a revision matters downstream is Epic 2.
- **Any entry point other than the step-nav's done-stage links** — e.g. the artefact-index page's plain "View" link. Per discovery's clarification log, these are not automatically covered and would need their own scoping pass if wanted later.
- **Any new versioning or diffing mechanism** — revisions overwrite in place, matching today's artefact-storage model (discovery clarify Q3).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Earlier-stage revisions completed without a journey restart | 0% — capability does not exist today | ≥1 genuine usage/week in beta, journey continues to completion | This epic builds the entry point and the write-back mechanism — without it, no revision can happen at all |
| Recurrence of the original blocking pain | 2 known occurrences (Hamish, Abhi) | 0 further occurrences | Directly closes the gap that caused both known occurrences (no way to fix an earlier stage without restarting) |

## Stories in This Epic

- [ ] Reopen a completed stage's live session from the step-nav — `stories/res-s1-reopen-completed-stage-live-session.md`
- [ ] Overwrite a reopened stage's artefact in place on revision — `stories/res-s2-overwrite-artefact-in-place-on-revision.md`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches shared session/routing logic in `journey.js` — the same file where the `aslr-s1`→`adsr-s1` live regression happened this session. Coding agent should pause for human review at PR, not proceed to merge autonomously.

## Complexity Rating

**Rating:** 3

Resuming a non-active stage's session is a genuinely new capability — the existing session model (`ADR-022`, Option B) was built around one active session per journey, not a resumable session per completed stage. Whether `completedStages` coexists cleanly with this was an open, unconfirmed assumption at discovery.

## Scope Stability

**Stability:** Unstable

The `completedStages` coexistence question could force a redesign of how stage sessions are tracked. Flag for more frequent check-ins during implementation.
