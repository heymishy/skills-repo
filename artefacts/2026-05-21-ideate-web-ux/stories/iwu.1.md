## Story: Render context manifest panel with chip layout in the /ideate session shell

**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-web-session-surface.md
**Discovery reference:** artefacts/2026-05-21-ideate-web-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-05-21-ideate-web-ux/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want to see which SKILL.md, reference artefacts, and prior pipeline documents were loaded at session start displayed as chips in a `#context-manifest` panel,
So that I can identify missing context before the first lens runs and avoid re-runs caused by invisible gaps (M2).

## Benefit Linkage

**Metric moved:** M2 — Rework rate from invisible assumptions
**How:** Completing this story makes context gaps visible at session open — before any lens runs — so operators can detect and fix missing context before it causes downstream re-runs. The prior session baseline includes re-runs triggered by artefacts that were assumed loaded but were not (`ideationRerunCause: invisible-assumptions`).

## Architecture Constraints

- Implement as a named `#context-manifest` panel section within the existing `handleGetChatHtml` session shell pattern — no new server routes required
- Collapsed chip layout per UX mockup structural decision: one chip per loaded artefact, `chip-ok` / `chip-warn` states — implement against the existing `src/web-ui` stylesheet; do not replicate mockup CSS
- Sanitise all artefact path display values before DOM injection — no `innerHTML` with unsanitised content (architecture security guardrail)
- Accessibility guardrail (ADR): colour alone must not be the only chip state indicator — `chip-ok` and `chip-warn` must each carry a non-colour discriminator (label, icon, or `aria-label`)
- ADR-011 artefact-first rule satisfied — this story artefact is present before implementation

## Dependencies

- **Upstream:** None — this story establishes the left-panel context manifest independently; no dependency on iwu.2 or later stories
- **Downstream:** iwu.2 (informs the right panel layout story that `#context-manifest` is an existing left-panel section, not a right-panel section; avoids layout interference)

## Acceptance Criteria

**AC1:** Given an `/ideate` session is opened via the web UI, when the session shell HTML renders, then `#context-manifest` is present as a named section in the DOM containing at least one chip element per loaded context file.

**AC2:** Given a context file was loaded successfully at session start, when the chip renders, then it displays the filename (not the full path) and carries both a colour indicator and a non-colour discriminator (e.g. a tick icon or "loaded" label) for the `chip-ok` state.

**AC3:** Given a context file was expected but not found at session start, when the chip renders, then it displays the filename with both a colour indicator and a non-colour discriminator (e.g. a warning icon or "missing" label) for the `chip-warn` state.

**AC4:** Given no context files were loaded at session start, when the manifest panel renders, then `#context-manifest` displays a "no context loaded" placeholder message rather than an empty or collapsed container.

**AC5:** Given an operator navigating with a keyboard only, when they reach `#context-manifest`, then all chips are keyboard-reachable and each chip announces its filename and loaded/missing state to assistive technology via an accessible name or `aria-label`.

## Out of Scope

- `#assumption-cards` panel and assumption card rendering — iwu.3
- Right panel two-section layout restructure — iwu.2
- `#draft-content` live artefact draft panel — iwu.5
- Real-time manifest updates during the session — the manifest is static (loaded once at session start); no live refresh
- Filtering or sorting chips by artefact type

## NFRs

- **Security:** Artefact path display values HTML-escaped before DOM injection (no XSS via crafted path)
- **Accessibility:** WCAG 2.1 AA — chip states not communicated by colour alone; keyboard navigable; assistive technology announces loaded/missing state
- **Performance:** None beyond the existing session shell render time

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Rationale:** The chip layout and `chip-ok`/`chip-warn` states are well-specified. The ambiguity is in identifying where the current session initialisation code surfaces context file lists — requires code reading of `src/web-ui/routes/skills.js` or equivalent before implementation.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
