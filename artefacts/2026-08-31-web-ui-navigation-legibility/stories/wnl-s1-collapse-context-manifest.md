## Story: Collapse the always-expanded "Ref docs" context manifest into a single summary indicator

**Epic reference:** artefacts/2026-08-31-web-ui-navigation-legibility/epics/web-ui-navigation-legibility.md
**Discovery reference:** artefacts/2026-08-31-web-ui-navigation-legibility/discovery.md
**Benefit-metric reference:** artefacts/2026-08-31-web-ui-navigation-legibility/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer running a multi-stage feature session through the web UI**,
I want **the "Ref docs" context panel to show as a single collapsed summary by default, expandable on demand**,
So that **I can see at a glance that context is loaded correctly without every session permanently consuming vertical space with a file-by-file list I rarely need to inspect**.

## Benefit Linkage

**Metric moved:** M1 — Time-to-orientation after returning to a long-running session
**How:** Removing the always-expanded, growing file-by-file list (currently one chip per loaded file — SKILL.md, mission.md, tech-stack.md, constraints.md, roadmap.md, and more as a session progresses) frees the operator from having to visually parse a row of chips just to get back to the actual content on every return to the session; a single "Context loaded (N files) ✓" summary answers the same question in one glance.

## Architecture Constraints

- Reuse the existing native `<details>`/`<summary>` disclosure pattern already established in this codebase for exactly this kind of collapse/expand UI (e.g. `src/web-ui/routes/features.js`'s `renderStory()` — `.sw-story-row`) — keyboard- and screen-reader-operable by default, no custom JS state needed. Do not introduce a new collapse mechanism or a new npm dependency (`product/tech-stack.md`'s "Zero new npm dependencies" runtime constraint and Mandatory Constraint MC-SELF-02 — not ADR-009, which governs an unrelated topic, CI evaluation/write-back trigger separation; see `CLAUDE.md`'s own note on this exact prior mis-citation).
- Modify `buildContextManifestHtml()` (`src/web-ui/routes/skills.js:2680`) — the existing per-file chip-rendering logic (loaded/missing states, `chip-ok`/`chip-warn` classes) is reused unchanged inside the expanded state; only the wrapping structure changes from always-visible to collapsed-by-default.
- **Existing test dependency:** `tests/check-iwu1-context-manifest.js` (iwu.1) directly unit-tests `buildContextManifestHtml()`'s HTML output shape (8 tests + 1 integration test — `chip-ok`/`chip-warn` presence, `id="context-manifest"`, escaping). Those assertions test raw HTML string inclusion, not DOM open/closed visual state, so wrapping the existing, unmodified chip markup inside a `<details>` element (per AC5) should keep every existing assertion passing — but this must be confirmed by actually running `node tests/check-iwu1-context-manifest.js` before considering this story done, not assumed.
- Mandatory Constraints (`architecture-guardrails.md`): no user-supplied content injected into HTML without sanitisation — the existing `escHtml()` calls on file basenames must be preserved exactly as-is; all interactive elements (the collapse toggle) must be keyboard-accessible; colour alone must not be the only indicator of loaded/missing status (the existing ✓/⚠ symbols and "loaded"/"missing" text labels already satisfy this — do not remove them when collapsing).

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a skill session has at least one loaded context file, When the session page first renders, Then the context manifest shows as a single collapsed summary line (e.g. "Context loaded (N files) ✓") instead of one chip per file.

**AC2:** Given the collapsed summary is showing, When the operator clicks/activates it, Then it expands in place to show the existing per-file chip list (unchanged loaded/missing states, unchanged ✓/⚠ symbols and text labels) exactly as it renders today.

**AC3:** Given the summary is expanded, When the operator clicks/activates it again, Then it collapses back to the single summary line — the toggle is reversible, not one-way.

**AC4:** Given at least one context file has a `missing` status (the existing `warn` chip case), When the collapsed summary renders, Then the summary itself visibly indicates a problem exists (e.g. "Context loaded (4 of 5 files) ⚠") rather than looking identical to the all-loaded case — an operator must not have to expand the panel just to learn something failed to load.

**AC5 (regression guard):** Given the existing per-file chip markup (`chip-ok`/`chip-warn` classes, `escHtml()`-escaped basenames, ✓/⚠ symbols, "loaded"/"missing" labels), When the panel is expanded, Then that markup is byte-for-byte unchanged from what `buildContextManifestHtml()` produces today — this story changes only the collapsed/expanded wrapping, not the per-file rendering itself.

**AC6:** Given the collapse toggle, When operated via keyboard only (no mouse), Then it can be focused and activated (Tab + Enter/Space) exactly as a native `<details>/<summary>` element supports by default — no custom keyboard handling required, but must not be broken by any added styling/JS.

## Out of Scope

- Any change to which files are loaded into context, or how/when they're loaded — this story only changes how the already-correct file list is *displayed*.
- Any change to the `missing`/`warn` detection logic itself (whether a file failed to load) — reused exactly as-is.
- A persistent, cross-session "remember whether I had this expanded" preference — defaults to collapsed on every fresh page load; not in scope for this story.

## NFRs

- **Performance:** None material — a collapse/expand toggle adds no new network requests or computation; the existing per-file HTML is still generated identically, just wrapped differently.
- **Security:** None beyond the existing `escHtml()` requirement (Architecture Constraints) — no new user input surface.
- **Accessibility:** Native `<details>`/`<summary>` keyboard and screen-reader operability (AC6); colour-alone status indication is prohibited (AC4's summary-level warning must use a symbol/text cue, not colour alone), per architecture-guardrails.md's Accessibility mandatory constraint.
- **Audit:** None identified — no state-changing action, purely a display toggle.

## Complexity Rating

**Rating:** 1 — a single, well-understood UI change reusing an already-established, already-live pattern in this exact codebase. No new design-system components, no backend/data change.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
