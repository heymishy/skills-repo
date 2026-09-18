## Story: Restyle the Dashboard to Match DESIGN.md

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## User Story

As a **Hamish King (Founder/Operator)**,
I want **the dashboard — the screen I use most as day-to-day operator — to look like a modern, consistent SaaS product**,
So that **my own daily experience of the platform reflects the brand direction being set, not the dated "Notion-calm" styling**.

## Benefit Linkage

**Metric moved:** Visual consistency across the 4 real screens
**How:** This story converts the dashboard — one of the 4 real screens the metric counts — from the old token values to `DESIGN.md`'s exact token values, moving the metric from 1/4 (after `dsa-s1`) toward 4/4.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one."
- Confirmed via `/clarify`: reuse and extend `src/web-ui/utils/html-shell.js`'s existing CSS custom-property blocks. **Real structure (see `decisions.md`, "FEATURE-WIDE: the real CSS selector structure is inverted" entry): bare `:root` is LIGHT mode, `[data-theme="dark"]` is the DARK override (plus its `@media` no-JS fallback twin) — update both, not just one "dark-mode block."** Update hex values to match `DESIGN.md`'s token table. **Corrected feature-wide (see `decisions.md`, "FEATURE-WIDE: --green/--amber/--red cannot be renamed" entry, found during `dsa-s1`'s `/implementation-plan`): `--success`/`--warn`/`--danger` are added as NEW aliases alongside the existing `--green`/--amber`/`--red` — the old names are NOT renamed or removed, since 25+ usages across 8 files outside this epic's scope depend on them. `dsa-s1` adds the new aliases at the shared `html-shell.js` level; this story consumes the new names in its own markup and does not need to touch the old names at all.**
- Real target files (confirmed to exist): `src/web-ui/routes/dashboard.js`, `src/web-ui/views/dashboard-view.js`.

## Dependencies

- **Upstream:** `dsa-s1` (adds the new `--success`/`--warn`/`--danger` token aliases at the `html-shell.js` level, per the feature-wide correction in `decisions.md` — this story depends on those aliases already existing to avoid two stories racing to touch the same shared file).
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given the dashboard is rendered in dark mode, When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s dark-mode token table exactly.

**AC2:** Given the dashboard is rendered in light mode (via the existing Settings toggle), When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s light-mode token table exactly.

**AC3:** Given the dashboard follows `DESIGN.md`'s "Dashboard/app shell" layout pattern (fixed 224px sidebar with products list + main nav + account nav pinned to bottom, fluid main column, max-width 1080px content), When the real page is rendered, Then this structure is present and visually matches the `Skills Platform - Dashboard.dc.html` mock.

**AC4:** Given the dashboard's pre-existing functionality (product list, navigation, account nav), When the restyle is applied, Then no existing functional behavior regresses — verified by running this screen's own pre-existing test coverage before and after the change.

## Out of Scope

- Any other of the 3 remaining real screens (artefact viewer covered by `dsa-s1`, landing, skill-session chat) — each has its own story.
- Fixing the stale/dead nav links already tracked separately in the `web-ui-experience-redesign` feature's Epic B — this story is a visual restyle only, not an information-architecture fix.
- Building the `design.system` DoR governance mechanism — that is `dsa-s5`.

## NFRs

- **Performance:** No measurable page-load regression from the restyle.
- **Security:** None identified.
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9) — no regression to existing accessibility properties.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
