## Story: Restructure right panel into two named sections for assumption cards and artefact draft coexistence

**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-web-session-surface.md
**Discovery reference:** artefacts/2026-05-21-ideate-web-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-05-21-ideate-web-ux/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want the right panel of the `/ideate` session to be pre-structured as two named sections — `#assumption-cards` at top and `#draft-content` below — before any content populates them,
So that subsequent stories can inject cards and draft content into the correct sections without layout collision (prerequisite for M1, M3).

## Benefit Linkage

**Metric moved:** M3 — Session completion rate
**How:** This story establishes the right panel layout that prevents context-switch cost during a session. Without a two-section coexistence layout, the assumption cards and artefact draft would compete for the same space, causing layout conflicts that contribute to session abandonment. This story is a technical prerequisite that enables M3 to be measured at all.

## Architecture Constraints

- Implement as a modification to the existing right panel HTML in the `handleGetChatHtml` session shell view — no new server routes
- `#assumption-cards`: `flex: 0 0 auto; max-height: 42%` — scrolls internally when cards overflow (per UX mockup structural decision)
- `#draft-content`: `flex: 1` — expands to fill remaining right panel height
- Right panel container: `display: flex; flex-direction: column`
- Both sections must be present in the DOM on initial render, even when empty, so iwu.3 and iwu.5 can inject content into them by ID without dynamic DOM creation
- Implement against the existing `src/web-ui` stylesheet — no new CSS file; do not replicate mockup CSS
- ADR-011 artefact-first rule satisfied — this story artefact is present before implementation

## Dependencies

- **Upstream:** None — pure layout restructure; no dependency on iwu.1 (manifest is left-panel), though user-journey delivery order places this after iwu.1
- **Downstream:** iwu.3 depends on `#assumption-cards` DOM section existing; iwu.5 (live artefact draft) depends on `#draft-content` DOM section existing — both are blocked until this story merges

## Acceptance Criteria

**AC1:** Given an `/ideate` session shell renders, when the right panel DOM is inspected, then both `#assumption-cards` and `#draft-content` are present as named sections with the correct IDs.

**AC2:** Given no assumption cards have been emitted, when `#assumption-cards` renders, then it displays a placeholder message (e.g. "assumptions will appear here") and is visible in the DOM — it is not hidden, collapsed, or removed from layout.

**AC3:** Given no artefact draft content has been emitted, when `#draft-content` renders, then it displays a placeholder message (e.g. "artefact draft will appear here") and occupies the remaining right panel height (flex: 1).

**AC4:** Given both sections contain content, when the right panel layout is active, then `#assumption-cards` does not exceed 42% of right panel height and scrolls internally if its content overflows; `#draft-content` expands to fill the remaining space below `#assumption-cards`.

**AC5:** Given an operator navigating with a keyboard only, when they reach the right panel, then `#assumption-cards` and `#draft-content` are reachable as distinct sections and their roles or headings are announced to assistive technology.

## Out of Scope

- Populating `#assumption-cards` with real card content — iwu.3
- Populating `#draft-content` with real SSE-driven draft content — iwu.5
- `#context-manifest` chip layout — iwu.1 (left panel)
- The lens track topbar indicator (done/active/pending dots) — deferred; not in MVP scope per discovery

## NFRs

- **Accessibility:** WCAG 2.1 AA — right panel sections keyboard-reachable; section boundaries announced to assistive technology
- **Performance:** Layout restructure is static HTML/CSS — no runtime performance cost

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
**Rationale:** Well-understood layout change — adding two named `div` sections with flex properties to an existing panel. No new behaviour, no server changes.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
