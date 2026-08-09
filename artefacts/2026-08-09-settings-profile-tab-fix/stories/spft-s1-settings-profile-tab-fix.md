## Story: Fix the Settings page's Profile tab so it actually renders instead of showing blank

**Epic reference:** None — short-track (bug fix, found via live Chrome-browser exploration of the operator's real staging environment)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **user visiting `/settings`**,
I want **the default Profile tab to actually show my identity and linked sign-in methods**,
So that **I can see and use the page I landed on, instead of a blank panel under a tab bar with no indication anything is wrong**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — found live on `wuce-staging.fly.dev/settings` (2026-08-09): the Profile tab, the DEFAULT tab every visitor lands on, renders completely blank. Billing/Credits/Impersonate all render correctly; only Profile is broken, and it never recovers even after switching to another tab and back.

**How:** Root-caused via direct source read of `src/web-ui/routes/settings.js`: `renderProfileTab()` returns its own self-wrapping `<div id="tab-panel-profile" class="sw-tab-panel">`, but `renderSettingsPage()` wraps that a second time inside `<div id="tab-panel-profile-wrap" class="sw-tab-panel sw-tab-panel--active">`. Every other tab (Billing/Credits/Impersonate) is a single div whose id exactly matches what the tab-switching script (`swShowSettingsTab`, `getElementById("tab-panel-"+name)`) targets — Profile is the only one double-wrapped. Two compounding effects: (1) on page load, the CSS-relevant `--active` class sits on the outer wrapper, not the inner div holding the real content, so `.sw-tab-panel{display:none}` still applies to the inner div and hides it from the first render; (2) clicking away and back doesn't fix it either — `swShowSettingsTab` strips `--active` from every `.sw-tab-panel` element (including the outer wrapper) then only re-adds it to the inner div by id, so the outer wrapper never regains `--active` and permanently `display:none`'s its own child.

## Architecture Constraints

- **No new pattern needed.** The fix is to make Profile's markup shape match every other tab exactly: a single div whose `id` is `tab-panel-<name>` and which directly carries `sw-tab-panel--active` on initial render (matching Billing/Credits/Impersonate's existing single-div convention).
- **Do not change `renderProfileTab`'s own content** (identity card, sign-in methods list) — only the wrapping structure around it in `renderSettingsPage`.
- **Do not change `swShowSettingsTab` or `_TAB_CSS`** — the bug is in the markup shape produced by `renderSettingsPage`, not in the shared tab-switching script/CSS, which already works correctly for every other tab.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a user loads `GET /settings` for the first time in a session, When the page renders, Then the Profile tab's content (identity card + sign-in methods list) is visible immediately, without any user interaction — the rendered HTML's `#tab-panel-profile` element carries the `sw-tab-panel--active` class directly (not on a separate wrapping element).

**AC2:** Given the Profile tab is showing, When the user clicks the Billing tab and then clicks back to Profile, Then the Profile tab's content is visible again — the double-wrap regression (outer wrapper never regaining `--active`) no longer occurs because there is no longer a separate outer wrapper to lose it.

**AC3:** Given the rendered Settings page HTML, When inspected, Then there is exactly one element with an id matching `tab-panel-profile` (not two nested elements, `tab-panel-profile-wrap` and `tab-panel-profile`) — matching the single-div shape already used by Billing (`#tab-panel-billing`), Credits (`#tab-panel-credits`), and Impersonate (`#tab-panel-impersonate`).

**AC4:** Given a non-admin user (Credits/Impersonate tabs absent), When the Settings page renders, Then Profile and Billing both still render correctly — this fix must not regress the existing non-admin rendering path.

## Out of Scope

- **Any change to the Billing, Credits, or Impersonate tabs' own rendering** — all three already work correctly and are not touched.
- **Any change to `renderProfileTab`'s content** (identity card, sign-in methods, provider linking) — only the outer wrapping structure changes.
- **The dashboard sidebar's "No product" link** — a separate, unrelated bug tracked as its own story (`nplf-s1`).

## NFRs

- **Accessibility:** No regression — `role="tabpanel"` and `aria-labelledby="tab-profile"` (already present on `renderProfileTab`'s own returned div) are preserved; removing the redundant outer wrapper does not remove any ARIA attribute needed for the panel itself.
- **Performance:** Negligible — one fewer wrapping `<div>` in the response HTML.

## Complexity Rating

**Rating:** 1 — well-understood, single-file, single-function change; the exact broken lines and the exact correct shape (matching the other three tabs verbatim) are already identified.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
