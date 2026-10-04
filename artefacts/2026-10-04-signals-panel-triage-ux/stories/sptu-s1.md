## Story: Add `/signals` to the main navigation
**Epic reference:** artefacts/2026-10-04-signals-panel-triage-ux/epics/signals-panel-triage-controls.md
**Discovery reference:** artefacts/2026-10-04-signals-panel-triage-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md
**Domain:** [web-ui]
## User Story
As a **Solo operator (you, today)**,
I want **a visible "Signals" entry in the main sidebar nav that links to `/signals`**,
So that **I (or the secondary Tech lead/squad lead persona) can reach the triage flow by clicking, not by knowing or guessing the raw URL — making Metric 1's "Time-to-triage" measurement actually well-defined, since a task that starts with "first, find the page" has no meaningful completion time today**.
## Benefit Linkage
Metric 1 — Time-to-triage (benefit-metric.md): the metric's own measurement method times "the full filter→sort→dismiss×10 interaction sequence," which implicitly assumes the operator can already navigate to `/signals`. Today that assumption is false for anyone who doesn't already know the route exists.
## Architecture Constraints
**Real, confirmed gap (not estimated):** `src/web-ui/utils/html-shell.js`'s `NAV_ITEMS` array (lines 54–78) has no entry for `/signals`. `src/web-ui/routes/signals-panel.js`'s `handleGetSignalsPanelHtml` already calls `renderShell({ ..., active: 'signals' })` (line 39) — the route was written anticipating a nav row with `id: 'signals'` that was never added. This is the same "API shipped, UI never wired" gap this repo has fixed twice before: `pod-manager` (pmnv-s1) and `admin-mock-gateway` (alrf-s7) — both documented inline in `html-shell.js` as precedent (lines 56–61, 72–77).
**Placement:** main product nav section (not `section: 'account'`), matching `pod-manager`'s own placement rationale — `/signals` is an `authGuard`-only route (no `requireAdmin`), tenant/workspace-wide, not account-settings-scoped.
**No new npm runtime dependency** (discovery.md Constraints).
## Dependencies
None — this story only adds a static array entry to an already-shipped file; it does not depend on `sptu-s2`/`s3`/`s4`.
## Acceptance Criteria

**AC1 — A "Signals" nav row renders in the main sidebar:**
Given any authenticated page that calls `renderShell`,
When the sidebar renders,
Then a nav row labelled "Signals" appears in the main product nav section, linking to `/signals`.

**AC2 — The nav row shows active state on `/signals` itself:**
Given the operator is on `/signals` (any page/filter/sort state),
When the sidebar renders,
Then the "Signals" row is visually marked active (`sw-nav-item--active`), using the existing `active: 'signals'` value `handleGetSignalsPanelHtml` already passes to `renderShell` — no change to the route handler itself is required.

**AC3 — No existing nav row or page is regressed:**
Given the full set of pages that call `renderShell` with `NAV_ITEMS`,
When the new row is added,
Then every existing nav row (Org board, Pod Manager, Settings, Admin credits, Admin mock gateway) still renders in its existing position, and the existing dangling-link regression test (per `html-shell.js`'s own AC3 precedent comment) still passes.

**AC4 — The nav row is keyboard-accessible:**
Given an operator navigating by keyboard only,
When they Tab through the sidebar,
Then the "Signals" row receives focus in the same way every other `sw-nav-item` row does (no new focus trap, no `tabindex` override).
## Out of Scope
- Any icon/branding bikeshedding beyond picking a single-character glyph consistent with the existing `NAV_ITEMS` icon convention (e.g. `◎`)
- Changing `handleGetSignalsPanelHtml`'s own `active: 'signals'` value or any other route logic — this story is additive to `NAV_ITEMS` only
- Badging the nav row with an unread/count indicator — not requested, not needed to make the page discoverable
## NFRs
- Accessibility: nav row keyboard-reachable, matching every existing `sw-nav-item` (AC4)
- No new attack surface: a static label/href addition, no new input, no new query handling
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
