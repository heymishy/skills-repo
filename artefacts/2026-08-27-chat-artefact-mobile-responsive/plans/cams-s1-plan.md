# Implementation Plan: cams-s1 — Stack the chat/artefact split-panel into a single column on mobile

**Story:** artefacts/2026-08-27-chat-artefact-mobile-responsive/stories/cams-s1-stack-chat-artefact-panels-on-mobile.md
**Test plan:** artefacts/2026-08-27-chat-artefact-mobile-responsive/test-plans/cams-s1-test-plan.md
**DoR:** artefacts/2026-08-27-chat-artefact-mobile-responsive/dor/cams-s1-dor.md
**Worktree:** .worktrees/cams-s1 (branch `cams-s1`, based on origin/master)

---

## Tasks

### Task 1 — Add the mobile breakpoint
- `views/chat-view.js`: add `@media (max-width: 768px)` block collapsing `.sw-chat` to a single column, `height: auto`, removing pane-level overflow clipping as needed.
- ACs covered: AC1-AC4 (part 1, the CSS mechanism).

### Task 2 — New Playwright E2E spec
- `tests/e2e/cams-s1-chat-artefact-responsive.spec.js` covering AC1-AC5 (mobile + desktop, live chat page, historical stage view, ideate 3-panel variant).
- ACs covered: AC1-AC5.

### Task 3 — Regression sweep
- Re-run `check-mfc1-model-first-chat-session.js`, `check-csd-s1-derisk-canvas-mermaid.js`, `check-csd-s2-canvas-diagram-rendering.js`, then the full suite, then the new Playwright spec locally.
- ACs covered: AC6.

---

## Sequencing

Single-file CSS change; tasks sequential (fix → test → verify) given the small scope.
