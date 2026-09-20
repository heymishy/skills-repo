## Story: Fix Mobile-Responsiveness Gaps on the Already-Shipped Artefact Viewer and Dashboard

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## Origin note

This story exists because `DESIGN.md`'s "Responsive behavior" section was added AFTER `dsa-s1` (Artefact Viewer) and `dsa-s2` (Dashboard) had already merged and reached DoD — both stories predate mobile responsiveness being a first-class, explicit requirement of this feature (see `decisions.md`, "FEATURE-WIDE: mobile responsiveness is now an explicit requirement," 2026-09-19). Per this feature's own established convention (a gap found after a story's own DoD becomes a NEW story, not a reopening — the same pattern already used for `dsa-s7`), `dsa-s1`'s and `dsa-s2`'s own DoD verdicts are NOT amended retroactively; they stand as accurate records of what was verified at DoD time. This story tracks the gap forward.

Both screens are fixed in one story (rather than two separate stories) per the operator's own explicit choice among 3 presented options — reasoning: both share the same shared-shell foundation and a related root-cause pattern (a fixed-track CSS grid with zero `@media` override), making one combined story more efficient than two.

**Investigation finding, independently measured before this story was written (2026-09-20) — corrects an assumption made when this story was first scoped:** the two screens' real bugs are NOT identical in failure mode, only related in root cause. `dsa-s2`'s dashboard genuinely overflows horizontally (140px of real overflow at 375px, confirmed via live Playwright measurement against merged master — see `decisions.md`, "dsa-s2 post-merge finding"). `dsa-s1`'s artefact viewer does NOT overflow (`document.body.scrollWidth` stays within the viewport at both 375px and 390px, freshly re-measured via live Playwright against merged master) — instead, its fixed `320px` sidebar column claims nearly the full viewport width, squeezing the `minmax(0,1fr)` main content column to 0px (375px viewport) or 14px (390px viewport) — the actual artefact content a user is there to read becomes completely invisible or unusable, while the sidebar renders at full width. This is a more severe real-world bug than `dsa-s2`'s (content disappears entirely, rather than merely wrapping awkwardly) and would pass a naive "no horizontal overflow" check while still being badly broken — which is why `DESIGN.md`'s own verification bar explicitly requires checking for "no card/column collapsed to an illegibly narrow... state," not just zero overflow.

**A related discrepancy worth noting for implementers:** `DESIGN.md`'s own "Artefact/document viewer" pattern text (written before this independent re-measurement) predicted the sidebar column would be the one to compress ("not compress the 320px sidebar column into an unusably narrow width") — the real, measured bug is the opposite: the sidebar stays at its full 320px and the main content column is what collapses. `DESIGN.md`'s own prescribed fix (stack to a single column below 768px, document body first) remains exactly correct regardless of which column actually compresses — no `DESIGN.md` correction is required, only this note for anyone implementing against it.

## User Story

As a **Hamish King (Founder/Operator)** and as a **beta user** accessing the platform from a phone or narrow-width device,
I want **the artefact viewer and dashboard — two of the platform's core, already-shipped screens — to actually work on mobile, not silently break**,
So that **the mobile-responsiveness bar this feature now holds every screen to (`DESIGN.md`'s "Responsive behavior" section) is genuinely met across all 4 real screens, not just the ones built after that bar existed**.

## Benefit Linkage

**Metric moved:** Visual consistency across the 4 real screens
**How:** `DESIGN.md`'s token-value consistency was already verified 4/4 by `dsa-s4`'s own DoD, but `DESIGN.md` also now includes an explicit, mandatory "Responsive behavior" section as part of what "matching DESIGN.md" means — this story closes the only 2 of 4 screens (the ones that shipped before that section existed) that don't yet meet it, making the metric's own real-world claim ("screens match DESIGN.md") actually true across the full mobile-viewport range the section requires, not just at desktop width.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one." This story does NOT touch `html-shell.js`'s shared shell (sidebar/header) — that already collapses correctly below 768px (confirmed working via `dsa-s2`'s own live-measured finding: off-canvas hamburger drawer, zero overflow, established by `dsa-s1`). This story's changes are confined to each screen's own content area.
- **Real target files, confirmed by direct code read (not assumed):**
  - Dashboard: `src/web-ui/views/dashboard-view.js` — `.sw-skill-grid` (`grid-template-columns: repeat(3, 1fr)`, line ~70) and `.sw-cols` (`grid-template-columns: 1fr 1fr`, line ~84). Zero `@media` rules exist in this file (confirmed via direct grep).
  - Artefact viewer: `src/web-ui/routes/artefact.js` — `.sw-artefact-layout`'s inline style (`display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px`, line ~101, inside `_buildArtefactBodyContent`). Zero `@media` rules exist in this file (confirmed via direct grep). The sidebar's own inner content (`.sw-artefact-sidebar`, Sign-off card + Comments card) is already `display:flex;flex-direction:column` — already single-column, no additional fix needed there.
- **`DESIGN.md`'s own governing text** (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`, "Responsive behavior" section — read this section in full before implementing, do not paraphrase from this story alone):
  - Single breakpoint: `max-width: 768px`.
  - Dashboard/app shell content pattern: a fixed multi-column grid (`repeat(N, 1fr)`) with no override is not acceptable — must either use `repeat(auto-fit, minmax(...))` or an explicit `@media (max-width: 768px)` collapse to single column.
  - Artefact/document viewer pattern: the two-column `minmax(0,1fr) 320px` layout must stack to a single column below 768px, document body first, Sign-off/Comments sidebar below it.
  - Verification bar: a real viewport-width check confirming `document.body.scrollWidth` does not exceed the viewport width, AND that no card/column has collapsed to an illegibly narrow or word-wrap-mangled state. DOM presence or desktop-only computed-style assertions do not satisfy this.
- **Confirmed via `/clarify`:** this story is a pure CSS/layout fix (adding `@media` rules and/or switching to a responsive grid function) — no data-wiring, no new routes, no new backend logic. Both target files' existing desktop-width rendering, existing data sources, and existing functional behavior (sign-off, comments, skill-grid links, waiting-on-you/recent-sessions content) must remain completely unchanged; only the CSS governing layout at narrow widths changes.

## Dependencies

- **Upstream:** `dsa-s1` (the shared shell's own mobile-collapse behavior, which this story reuses without modification) and `dsa-s2` (this story fixes a gap in its own already-shipped output). Both are DoD-complete; this story does not block on any in-progress work.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the real, live dashboard (`GET /dashboard`) is rendered at a real mobile viewport width (375px and 390px), When the page is measured via a real viewport-width check (not desktop-only computed-style assertions), Then `document.body.scrollWidth` does not exceed the viewport width at either size — closing the previously-measured 140px overflow.

**AC2:** Given the real dashboard is rendered at 375px and 390px, When the "Run a skill" grid (`.sw-skill-grid`) and "Waiting on you"/"Recent sessions" columns (`.sw-cols`) are inspected, Then both collapse to a single column with no card narrower than a legible minimum width and no title text forced into awkward mid-word wrapping (e.g. "Definition of ready" must not render as "Definition" / "of ready" across two lines from column-width compression).

**AC3:** Given the real, live artefact viewer (`GET /artefact/:feature/:stage` or equivalent) is rendered at 375px and 390px, When the page is measured via a real viewport-width check, Then `document.body.scrollWidth` does not exceed the viewport width at either size, AND the main document-content column (`minmax(0,1fr)`) does not collapse to a near-zero or illegibly narrow width — closing the previously-measured 0px/14px content-column collapse.

**AC4:** Given the real artefact viewer is rendered at 375px and 390px, When the page's layout is inspected, Then it stacks to a single column below 768px with the document body content appearing before the Sign-off/Comments sidebar in visual (top-to-bottom) order, matching `DESIGN.md`'s own prescribed fix for this pattern.

**AC5:** Given both screens' pre-existing desktop-width (≥768px) rendering and all pre-existing functional behavior (skill-grid links, waiting-on-you/recent-sessions content on the dashboard; sign-off button, comment posting on the artefact viewer), When this story's CSS-only changes are applied, Then no existing functional behavior regresses and desktop-width layout is visually unchanged — verified by re-running both screens' own full pre-existing test coverage (`dsa-s2`'s and `dsa-s1`'s own E2E suites) before and after this change.

## Out of Scope

- Any other of the 4 real screens (landing page, skill-session chat) — already mobile-responsive as part of their own original delivery (`dsa-s3`, `dsa-s4`), not touched by this story.
- Any change to the shared app shell (`html-shell.js`'s sidebar/header mobile-collapse behavior) — already correct, established by `dsa-s1`, not touched.
- Any new functionality, data source, or route — this is a pure CSS/layout fix to two already-shipped, already-functionally-complete screens.
- Retroactively amending `dsa-s1`'s or `dsa-s2`'s own DoD artefacts — both stand as accurate records of what was verified at DoD time; this story's own new DoD tracks the gap closure forward.
- Correcting `DESIGN.md`'s own "Artefact/document viewer" pattern text (which predicted the wrong column would compress) — the prescribed fix is still correct; only this story's own Architecture Constraints note the discrepancy for implementer awareness.

## NFRs

- **Performance:** No measurable page-load regression on either route — this story only adds/modifies CSS, no new network calls or data fetches.
- **Security:** None identified — no data flows, routes, or auth logic are touched.
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9) — no regression to existing accessibility properties; additionally, this story's own fix directly serves accessibility (illegible, near-invisible content at narrow widths is itself an accessibility failure for any user on a real mobile device).
- **Audit:** None identified.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity, not high: the root-cause pattern (fixed-track CSS grid, no @media override) is already established and well-understood from dsa-s2's own prior finding, and both target files/selectors are already confirmed by direct code read -- but this is 2 genuinely different real files with 2 different specific fixes (a straightforward single-column collapse for the dashboard's 2 grids; a more nuanced reorder-and-stack for the artefact viewer's 2-column layout, since DESIGN.md requires document-body-first ordering, not just a naive grid-to-block collapse) rather than 1 well-understood pattern applied twice identically. -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
