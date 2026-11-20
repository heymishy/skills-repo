## Story: Content inside a collapsed product-view group is not reachable by keyboard or screen reader until the group is opened

**Epic reference:** None - short-track (accessibility defect found while repairing the E2E spec `frsr-s1-feature-row-session-resume`, story esh-s1)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-20-e2e-selector-hygiene/decisions.md` D2 and `dod/esh-s1-dod.md`. On the product view every module or phase group starts collapsed (`src/web-ui/routes/products.js` lines 389 to 400, pdt-s1 AC2). A collapsed group is hidden only by `grid-template-rows: 0fr` with `overflow: hidden` (lines 976 to 978), which clips the content to zero height but leaves it focusable. A local probe on 2026-11-20 pressed Tab 80 times on a product page with one feature: 78 focus stops, 6 of them inside `.a4-module-body--collapsed` (the row link `a.pvc-item-link`, the rename button `.pvc-rename-btn` and the pods button `.pvc-pods-btn`, for two copies of the row). The old keyboard E2E test had been passing only because `focus()` works on a clipped link.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [accessibility]

## User Story

As **a person who uses the product view with a keyboard or a screen reader**,
I want **the rows inside a collapsed group to be skipped until I open the group**,
So that **focus never lands on something I cannot see, and opening a group is the one way to reach what is inside it**.

## Benefit Linkage

**Metric moved:** the number of Tab stops inside collapsed groups on the product view falls from 6 (of 78, in the probe above) to 0, and stays 0 for every group the user has not opened.
**How:** while a group is collapsed its body is `visibility: hidden`, which removes its content from the tab order and the accessibility tree. The visibility change is delayed by the length of the existing collapse animation, so the animation is unchanged, and it applies immediately on expand.

## Architecture Constraints

- Change confined to the stylesheet string in `src/web-ui/routes/products.js` (the `.a4-module-body` and `.a4-module-body--collapsed` rules, lines 976 and 977), one new node check, one new E2E spec, and artefacts. `src/` changes go through a pull request.
- CSS only: no change to the markup, to `a4ToggleModule`, to the search auto-expand code, to the bulk-assign code, or to any other page. Every JS path that opens or closes a group toggles the class `a4-module-body--collapsed`, so one CSS rule covers all of them.
- No colour, font or spacing token is added or changed (no design-system track).
- The collapse and expand animation (`grid-template-rows` over 0.25 s) must be unchanged in look and timing.
- `a4-module-header` buttons stay focusable and keep `aria-expanded` and `aria-controls`.
- Preserve each file's existing line endings.

## Dependencies

- **Upstream:** pdt-s1 (groups start collapsed), a4 (the collapsible group), esh-s1 (found it and repaired `frsr-s1` to open the group first).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given a product page whose groups are all collapsed (the default), When a keyboard user presses Tab through the whole page, Then no focus stop lands inside any collapsed group (no row link, no rename button, no pods button).
**AC2:** Given a collapsed group, When its header is focused and Enter is pressed, Then the header reports `aria-expanded="true"`, and the next Tab stop is inside that group (the row link), so a keyboard path to the content exists.
**AC3:** Given an opened group, When its header is activated again, Then it reports `aria-expanded="false"` and its content is again absent from the tab order.
**AC4:** Given the stylesheet the product view emits, When a group is collapsed, Then its body is `visibility: hidden` with a visibility transition delayed by the length of the existing animation (0.25 s); and when it is not collapsed, Then it is visible with no delay, so expanding shows the content at once and collapsing hides it only after the animation.
**AC5:** Given the existing group-related checks, When they run, Then they pass unchanged: `check-pdt-s1-consolidate-epic-list`, `check-pflx-s1-auto-expand-search-match`, and the specs `a4-module-expand-collapse`, `frsr-s1-feature-row-session-resume`, `ep2-s1-presence-sidebar` and `ep2-s2-stage-visibility` (which already open a group before touching its rows).
**AC6:** Given a search that opens a collapsed group (pflx-s1), When the group is open, Then its rows are reachable by Tab, because the search removes the same class.
**AC7:** Given the pull request, When its changed files are listed, Then `src/` has only `products.js` (stylesheet strings only), and the rest are the new check, the new spec, its one entry in `tests/e2e/capability-matrix.json` (the lpw-s2 rule: every spec file is listed once with a capability and a lane), and artefacts.

## Out of Scope

- Changing which groups start collapsed, or expanding them by default (a product decision).
- Tab-order or focus behaviour anywhere else in the product (the stage panel, the journeys canvas, the sidebar).
- The remaining E2E failures and test isolation (the next story).
- Any change to the group markup, the toggle script, the rename or pods buttons themselves.

## NFRs

- **Accessibility:** content inside a collapsed group is neither focusable nor exposed to assistive technology; the header remains the single way in.
- **Compatibility:** `visibility` and a delayed `visibility` transition are supported by every browser the product targets; no new attribute (such as `inert`) is required.
- **Behaviour unchanged for mouse users:** the group looks and animates exactly as before.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
