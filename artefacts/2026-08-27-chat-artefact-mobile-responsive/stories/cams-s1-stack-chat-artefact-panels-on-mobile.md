## Story: Stack the chat/artefact split-panel into a single column below the sidebar's existing mobile breakpoint

**Epic reference:** None — short-track (bug fix, from the original 4-item live production bug report, 2026-08-25)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator running a skill session (or reviewing a completed stage's historical conversation) from a phone or narrow browser window**,
I want **the chat conversation and artefact draft to stack into a single readable column instead of squeezing side-by-side**,
So that **I can actually read and interact with either pane on a small screen, instead of both panes being crushed unreadably narrow**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — reported directly by the operator (2026-08-25) as one of 4 live bugs found via direct usage: "mobile layout broken (chat/artefact split-panel has no responsive breakpoints)." Confirmed via source inspection (2026-08-27): the last of the original 4 bugs still un-actioned (the other 3 — `gate-confirm` 403, decision-log-view gap [still open], live sub-step buttons — were triaged separately; this closes the mobile one).

**How:** `views/chat-view.js`'s `renderChat` function (used by both `skills.js`'s live active-session chat page and `journey.js`'s dsh-s3 read-only historical-conversation stage view — fixing this one shared component fixes both surfaces) renders:
```js
'.sw-chat { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 24px; height: calc(100vh - 48px - 64px); max-height: 820px; }',
```
This is a rigid, unconditional two-column grid with **zero `@media` queries anywhere in this file** — confirmed via `grep -n "@media" src/web-ui/views/chat-view.js` returning no results. At any viewport narrower than roughly 700-800px (any phone, most tablets in portrait), each column is forced into an unusably narrow strip — chat text wraps to 2-3 words per line, the artefact draft becomes unreadable, and the ideate skill's 3-panel right side (conditions/assumptions/canvas) compounds the problem further. This is the only split-panel layout in the codebase without a mobile breakpoint — `html-shell.js`'s sidebar nav already collapses to a drawer at `max-width: 768px` (confirmed present and working), establishing both the precedent and the exact breakpoint value this story should match.

## Architecture Constraints

- **Match the existing `max-width: 768px` breakpoint** used by `html-shell.js`'s sidebar drawer (`@media (max-width: 768px)`, line 760) — do not introduce a second, different breakpoint value for the same general "mobile" concept in the same app.
- **Design decision required: stacking order and height behaviour.** Below the breakpoint: `.sw-chat` becomes `grid-template-columns: 1fr` (or `display: block`/`flex-direction: column`), the two (or three, for ideate) panes stack vertically in their existing DOM order (chat thread first, artefact/canvas second — matching reading order and the "conversation drives the artefact" mental model), and the fixed `height: calc(100vh - 48px - 64px); max-height: 820px` becomes `height: auto` so the page scrolls naturally instead of each pane independently scrolling inside a cramped fixed-height box. Each `.sw-chat-pane` keeps its own internal scroll behavior removed (no more `overflow: hidden` forcing internal scrollbars) in favour of one natural page scroll — simpler to implement and matches how the sidebar drawer's own mobile mode already behaves (no competing nested scroll regions).
- **The ideate skill's 3-panel right side is still just one `.sw-chat-pane`** (conditions/assumptions/canvas are internal sub-sections within that single pane, per direct inspection of `chat-view.js` lines 429-490) — the grid-level fix applies uniformly to both the ideate and non-ideate right-pane variants without needing skill-specific CSS.
- **Follow this repo's own established Playwright responsive-test convention** (`tests/e2e/lphf-s2/s3/s4/s5-responsive.spec.js`): viewport-resize + assert `document.body.scrollWidth <= viewportWidth` (no horizontal overflow) + assert key elements are visible with real bounding-box dimensions. Do not invent a new test pattern for this — this repo already has one for exactly this problem class.
- **Do not touch `html-shell.js`'s existing sidebar breakpoint or drawer mechanism** — reused as-is, not modified.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a viewport width of 375px (a typical phone), When the live active-session chat page (`/skills/:name/sessions/:id/chat`) renders, Then `document.body.scrollWidth` does not exceed the viewport width (no horizontal overflow/scroll).

**AC2:** Given the same 375px viewport, When the chat page renders, Then the chat thread pane (`.sw-chat-pane` containing `#chat-messages`) and the artefact/canvas pane are stacked vertically (chat first), not side-by-side, and both are visible with a real, non-zero bounding-box width close to the viewport width (accounting for page padding).

**AC3:** Given the same 375px viewport, When the read-only historical-conversation stage view (`/journey/:journeyId/stage/:skillName`, dsh-s3's split view) renders for a completed stage, Then it exhibits the same stacked, non-overflowing layout as AC1/AC2 — this shares the same `renderChat` component, so this AC also serves as the regression proof that the fix applies uniformly.

**AC4:** Given the ideate skill's 3-panel variant (conditions/assumptions/canvas) specifically, When rendered at 375px, Then all three internal sub-sections remain visible and readable in the stacked layout, with no horizontal overflow.

**AC5 (regression guard):** Given a viewport width of 1280px (desktop), When either page renders, Then the existing two-column side-by-side layout is unchanged — confirmed via the same test file's desktop-width case, matching the `lphf-s*` convention of testing both a mobile and a desktop width in the same parametrized test.

**AC6 (regression guard):** Given the existing chat-page test suite (`check-mfc1-model-first-chat-session.js`, `check-csd-s1-derisk-canvas-mermaid.js`, `check-csd-s2-canvas-diagram-rendering.js`, and any other test asserting on `.sw-chat`/`.sw-chat-pane` markup or inline styles), When re-run after this fix, Then all pass — this is a pure CSS change to `chat-view.js`'s `<style>` block; no HTML structure, class names, or JS behavior changes.

## Out of Scope

- **Redesigning the sidebar nav's own mobile drawer mechanism** — reused as-is, already working, not touched.
- **A collapsible/tabbed mobile UX** (e.g., a toggle to switch between "Chat" and "Artefact" tabs instead of stacking both) — a plain vertical stack is the simplest fix that directly closes the reported "unreadable, not literally broken" gap; a richer tabbed mobile UX is a larger design investment that can be considered separately if simple stacking proves insufficient in practice.
- **Any change to the landing/marketing page's own responsive behaviour** (`lphf-s2` through `lphf-s5`) — those are a different page (unauthenticated `/`) with their own, already-complete responsive work; this story is scoped to the authenticated skill-session chat/stage-view pages only.
- **Tablet-specific intermediate breakpoints** (e.g., a 3-column-to-2-column step at some mid-size width) — this story only addresses the binary "does it work on a phone" gap from the original bug report; the existing 768px breakpoint's single stack/no-stack behavior is the full scope.

## NFRs

- **Performance:** Negligible — a pure CSS media-query addition, no new assets, no new JS.
- **Security:** Not applicable — no new input path, no new rendering of user-controlled content.
- **Accessibility:** Improves accessibility — the current unconditional 2-column grid at narrow widths produces unreadable, cramped text; stacking restores legible reading width and normal tab/reading order (chat pane, which is already first in DOM order, stays first).
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2 — the CSS mechanism itself is simple (one media query, following an established breakpoint and an established test pattern), but there is a genuine design decision (stacking order, height/scroll behaviour) that a Complexity-1 pure-mechanical fix would not have, and it must be verified visually (browser rendering), not just by reading the CSS.
**Scope stability:** Stable — the design decision is resolved directly in this story's Architecture Constraints (stack order, height:auto), not left open for implementation to improvise.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
