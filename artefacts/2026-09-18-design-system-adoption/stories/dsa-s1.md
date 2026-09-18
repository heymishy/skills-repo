## Story: Restyle the Artefact Viewer to Match DESIGN.md

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## User Story

As a **beta user** (one of the platform's 2 onboarded external users),
I want **the artefact viewer to look like a modern, consistent SaaS product rather than today's dated "Notion-calm" styling**,
So that **my first impression of the platform's visual credibility is a positive one**.

## Benefit Linkage

**Metric moved:** Visual consistency across the 4 real screens
**How:** This story converts the artefact viewer — one of the 4 real screens the metric counts — from the old token values to `DESIGN.md`'s exact token values, moving the metric from 0/4 toward 4/4.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one." This story exists specifically to satisfy that guardrail, matching the exact lesson it cites (the prior "Notion-calm" system's own undocumented direct-to-master delivery).
- Confirmed via `/clarify`: reuse and extend `src/web-ui/utils/html-shell.js`'s existing `:root`/dark-mode CSS custom-property blocks — do not introduce a parallel styling mechanism. Update hex values to match `DESIGN.md`'s token table; rename `--green`/`--amber`/`--red` to `--success`/`--warn`/`--danger`.
- Real target files (confirmed to exist, per this feature's own reference investigation): `src/web-ui/routes/artefact.js`, `src/web-ui/views/artefact-view.js`.

## Dependencies

- **Upstream:** None
- **Downstream:** None (independently demo-able and revertible, per this epic's vertical-slice strategy)

## Acceptance Criteria

**AC1:** Given the artefact viewer is rendered in dark mode, When its computed CSS custom-property values are inspected, Then every color token (`--bg`, `--surface`, `--ink`, `--ink-2`, `--muted`, `--muted-2`, `--muted-3`, `--accent`, `--accent-soft`, `--accent-ink`, `--success`, `--warn`, `--danger`) matches `DESIGN.md`'s dark-mode token table exactly.

**AC2:** Given the artefact viewer is rendered in light mode (via the existing Settings toggle), When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s light-mode token table exactly.

**AC3:** Given the artefact viewer's layout follows `DESIGN.md`'s "Artefact/document viewer" layout pattern (two-column, `minmax(0,1fr) 320px`, doc body in Source Serif 4 on a surface card, sidebar with Sign-off card and Comments card), When the real page is rendered, Then this structure is present and visually matches the `Skills Platform - Artefact Viewer.dc.html` mock.

**AC4:** Given the artefact viewer's pre-existing functionality (viewing artefact content, sign-off status, comments), When the restyle is applied, Then no existing functional behavior regresses — verified by running this screen's own pre-existing test coverage before and after the change.

## Out of Scope

- Any other of the 3 remaining real screens (dashboard, landing, skill-session chat) — each has its own story.
- Building the `design.system` DoR governance mechanism — that is `dsa-s5`, a separate epic's story.
- New icons or components beyond what `DESIGN.md` and the mock already specify.

## NFRs

- **Performance:** No measurable page-load regression from the restyle (CSS-only/markup changes, no new network calls expected).
- **Security:** None identified — no new user input handling introduced.
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9's existing platform-wide floor) — the restyled screen must not regress any existing accessibility property (contrast ratios, keyboard navigation) already present.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
