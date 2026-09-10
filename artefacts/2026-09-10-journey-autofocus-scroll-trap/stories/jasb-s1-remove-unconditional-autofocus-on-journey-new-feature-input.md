# Story: /journey's unconditional autofocus on the "new feature" input auto-scrolls the browser past the entire feature list on every page load

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the finding below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator visiting `/journey` to find and continue an existing feature**,
I want **the page to load scrolled to the top, showing the feature list**,
So that **I can actually see and click into my features, instead of landing on a viewport that looks completely blank/broken because the browser has already auto-scrolled almost to the bottom of the page before I see anything**.

## Benefit Linkage

**Metric moved:** the same "can an operator tell where they are and find what they need" thread as `2026-08-31-web-ui-navigation-legibility` (currently at discovery, re-clarified this session) — found live, during a Chrome walkthrough undertaken specifically to verify that feature's own navigation problem, on `wuce-staging.fly.dev` (2026-09-10).

**How:** The operator reported being unable to locate a specific feature via `/journey` in the web UI. Live Chrome investigation confirmed the page's DOM/content was correct (`get_page_text` returned the full 269-feature list, including the feature in question) but the rendered viewport was solid black. JS inspection found `window.scrollY` / `document.documentElement.scrollTop` at `26914.5` (of a `scrollHeight` of `27657`, `clientHeight` `743`) immediately after page load — i.e. the page had already auto-scrolled to within one viewport-height of the very bottom before the operator's screenshot was ever taken. `document.activeElement` was `<input id="jh-fname" autofocus>`. Root cause: `src/web-ui/routes/journey.js:344` sets `autofocus` unconditionally on the "Feature name" input inside the "Start a new feature" section, which always renders at the bottom of the page (`src/web-ui/routes/journey.js:338`, `jh-new-section`, rendered regardless of the `showNewForm`/`?new=1` state — only the panel's highlight styling is conditional, not its presence). Standard browser behaviour scrolls any autofocused element into view on load. With 269 non-terminal features currently in `pipeline-state.json` and no pagination/virtualization on this page, that section sits ~27,600px down — so every `/journey` visit auto-scrolls almost the entire page height before the operator sees the feature list at all. This will only get worse as the feature count grows.

## Architecture Constraints

- **Fix:** remove the unconditional `autofocus` attribute from the `#jh-fname` input (`journey.js:344`). Reuse the existing `showNewForm` boolean (already computed from `req.query.new === '1'`, already gating the panel's highlight styling at `journey.js:338`) to also gate focus — the input should only receive `autofocus` when the operator has explicitly navigated to `/journey?new=1` (i.e. clicked "+ New feature"), not on every plain `/journey` load.
- No change to the "Start a new feature" section's own rendering, fields, or submit behaviour — only when the input receives initial focus.
- No change to `_mergeStateFeaturesIntoJourneyList`, card layout, or any other part of the page.
- **Out of scope, explicitly:** pagination/virtualization of the (currently 269-item, ~27,600px-tall) feature list. That is a real, separate problem this story does not attempt to solve — it only removes the autofocus-triggered scroll-jump. If the list keeps growing, the list-length problem itself will need its own story.

## Dependencies

- **Upstream:** None.
- **Downstream:** None. `2026-08-31-web-ui-navigation-legibility` (context-panel collapse, persistent next-stage action) is unrelated code in the same file area (`src/web-ui/routes/skills.js`, not `journey.js`) — no ordering dependency, but worth rebasing either branch against the other's latest master if both are in flight at once, per that discovery's own noted file-conflict risk.

## Acceptance Criteria

**AC1:** Given `/journey` with no `?new=1` query param and at least one non-terminal feature present, When the page loads, Then `window.scrollY` is `0` and no element on the page has received focus-triggered scroll (i.e. `document.activeElement` is `document.body`, not `#jh-fname`).

**AC2:** Given `/journey?new=1` (the operator clicked "+ New feature"), When the page loads, Then the "Feature name" input (`#jh-fname`) is focused and scrolled into view — the existing, intended behaviour for that entry point is preserved unchanged.

**AC3:** (regression guard) Given `/journey` (with or without `?new=1`), When the "Start a new feature" form is filled in and submitted, Then it behaves exactly as before this fix — this story changes only initial-focus/scroll behaviour, not the form's fields, validation, or submission.

## Out of Scope

- Pagination, virtualization, filtering, or any other change to how the feature list itself is rendered or how many items load at once.
- Any change to card layout, the "No product" bucket logic, or `_mergeStateFeaturesIntoJourneyList`.
- Fixing any other autofocus/scroll-on-load issue elsewhere in the app — this story is scoped to `journey.js:344` only.

## NFRs

- **Performance:** None material — attribute-conditional change only, no new computation or request.
- **Accessibility:** Must preserve keyboard operability — the input remains reachable via Tab/click when not autofocused; AC3 guards this.
- **Security:** None identified.
- **Availability:** None identified.

## Complexity Rating

**Rating:** 1 — a single conditional-attribute fix reusing an existing, already-computed flag (`showNewForm`). Small, well-understood blast radius.
**Scope stability:** Stable — root cause is precisely identified via live reproduction (JS scroll/focus state captured directly), not inferred.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
