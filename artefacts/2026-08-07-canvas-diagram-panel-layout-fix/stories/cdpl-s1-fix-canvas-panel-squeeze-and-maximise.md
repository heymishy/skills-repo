## Story: Stop the artefact panel squeezing the diagram panel, and fix the dead "maximise canvas" button

**Epic reference:** None — short-track (bounded UI bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui] — this story's scope is entirely `src/web-ui/views/chat-view.js`

## User Story

As an **operator running `/design` or `/definition` in the web UI**,
I want to **see the generated diagram at a usable height, with a way to expand it to full screen**,
So that **I can actually read a program-design or data-model diagram instead of it being squeezed to a sliver by a long artefact draft above it**.

## Benefit Linkage

**Metric moved:** Direct usability defect fix (short-track, no formal benefit-metric artefact) — confirmed via live staging testing on 2026-08-07: the diagram box rendered "very short" with no way to resize it, and the artefact panel was "pushed vertically and took most space."

**How:** Direct source-code inspection of `src/web-ui/views/chat-view.js`'s `sw-artefact-pane` (used by `/design` and `/definition`, added post-DoD per the csd-s3/csd-s4 comment) confirms the root cause: `#artefact-panel` is `flex:0 1 auto` with no `max-height`, so a long artefact draft takes its full natural height in the flex column, leaving `#canvas-panel` (`flex:1 1 auto`, meant to grow) almost no room. No resize splitter exists between the two sections. Separately, the ideate 3-panel layout's own "Maximise canvas" button (`onclick="swExpandCanvas()"`) calls a function that is never defined anywhere in this file — a pre-existing dead button, found while investigating this story's own fix.

## Architecture Constraints

- **Shared surface module constraint:** `chat-view.js` is a shared surface module (per architecture-guardrails.md's own anti-pattern table: "Any change to shared surface modules... is a story — even a small one"). This story is that story.
- **Reuse the existing working fullscreen pattern:** `swToggleArtefactFs()`/`.ad-fs` already provides a working toggle-fullscreen mechanism for the artefact panel in this same pane. This story's canvas-maximise fix must reuse that same pattern (a toggle class + CSS `position:fixed` rule), not invent a second, different fullscreen mechanism — and must fix `swExpandCanvas()`'s missing definition using the same reused pattern, since both call sites solve the identical problem (maximise a panel within `sw-chat-pane`/`sw-artefact-pane`).
- **No D37/adapter concern:** this is a client-side rendering/CSS/JS change with no new server-side call or injectable adapter.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the `/design` or `/definition` skill's artefact pane renders a long artefact draft, When the pane is displayed at a typical viewport height (e.g. 800px or taller), Then `#artefact-panel` does not exceed a fixed maximum height (e.g. 55% of the pane's available height) and becomes independently scrollable beyond that height, rather than expanding to consume the pane.

**AC2:** Given AC1's height cap is in place, When the artefact pane renders, Then `#canvas-panel` (the "Diagrams" section) always receives at least a minimum usable height (e.g. at least 200px, or a defined minimum share of the pane) regardless of how long the artefact draft is.

**AC3:** Given the design/definition pane's "Diagrams" section header, When the operator clicks a new maximise/expand control on that section, Then the diagram panel expands to fill the screen (reusing `swToggleArtefactFs()`'s existing `.ad-fs`-style toggle pattern, applied to the canvas panel), and clicking again restores the normal split-pane view.

**AC4:** Given the ideate 3-panel layout's existing "Maximise canvas" button (`id="sw-expand-canvas"`, `onclick="swExpandCanvas()"`), When it is clicked, Then a real `swExpandCanvas()` function now exists and toggles that layout's canvas panel to fullscreen — fixing the pre-existing dead-button defect, using the same reusable toggle mechanism as AC3, not a second separate implementation.

**AC5 (CSS-layout-dependent):** Given a long artefact draft is loaded in the design/definition pane on a real browser, When the page is rendered at a typical viewport height, Then the diagram panel is visually confirmed to occupy a usable, non-trivial portion of the vertical space (not squeezed to a sliver) — classified per this repo's CSS-layout-dependent AC policy at DoR time (Playwright visual check or RISK-ACCEPT + manual smoke script, decided at `/test-plan`).

## Out of Scope

- The ideate 3-panel layout's own existing working canvas panel (the `flex:1 1 auto` layout at line ~405, used when `assumption-cards`/lens pips are present) — this story only fixes its dead maximise button (AC4), not its base layout, which does not have the squeeze problem (no long artefact-panel sibling competing for space in that variant).
- A user-draggable resize splitter between artefact and canvas panels — a fixed height cap (AC1/AC2) plus a maximise toggle (AC3/AC4) resolves the reported usability problem without the added complexity of a drag-to-resize control; a true splitter can be a follow-up if operators still find the fixed proportions insufficient.
- Any change to diagram content/rendering itself (Mermaid syntax, diagram generation) — this story is layout-only.

## NFRs

- **Performance:** No new network calls or server-side work; a pure CSS/client-JS change.
- **Security:** None identified — no new user input handling.
- **Accessibility:** The new maximise/expand button follows the existing `.ad-fs-btn` pattern's `aria-label`/`title` convention (already accessible); fullscreen toggle must not trap keyboard focus.
- **Audit:** Not applicable — no server-side or data-layer change.

## Complexity Rating

**Rating:** 1 — well-understood, isolated CSS/JS fix in one file, reusing an existing working pattern.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
