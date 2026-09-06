## Story: The feature artefact-index page renders every document's real status, using the canonical trace

**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Benefit-metric reference:** artefacts/2026-09-06-canonical-artefact-trace/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer**,
I want **`/features/:slug` to render from the canonical trace, with a visible "Unregistered" indicator on any document that needs one**,
So that **opening `2026-04-19-skills-platform-phase4` (or any of the other 49 zero-registration features) shows every real document correctly, instead of the 73-card undifferentiated dump this session found**.

## Benefit Linkage

**Metric moved:** Unregistered documents visible without a bug report; registered-vs-disk divergence rate
**How:** This story is where the operator actually sees the fix — replacing `feature-story-structure.js`'s independent derivation (consumed by `fadm-s1`'s table/matrix rendering) with `cat-s1`/`cat-s3`'s canonical output.

## Architecture Constraints

- Reuses `fadm-s1`'s exact design tokens and table/matrix primitives (`--surface`, `--line`, `--ink`, `--muted`, `--accent`; `.doc-table`, `.doc-matrix`) — no new visual language introduced.
- MC-A11Y-02 (color not sole indicator) — the "Unregistered" indicator is a `.sw-pill` variant with a text label plus icon, never color alone.
- WCAG 2.1 AA (per this session's own established bar, `fpux.1`'s precedent) — keyboard-operable via existing native `<table>`/`<a>` markup, no new custom interactive elements.

## Dependencies

- **Upstream:** cat-s1 (trace builder), cat-s2 (label table), cat-s3 (divergence classification) — this story is the first to render their combined output.
- **Downstream:** None within this epic — this is a leaf integration story.

## Acceptance Criteria

**AC1:** Given `2026-04-19-skills-platform-phase4` (205 real files, zero `pipeline-state.json` registration), when its `/features/:slug` page renders, then every one of the 205 documents appears — grouped by inferred story where disk patterns support it, in a clearly-labeled section otherwise — none silently dropped or dumped into the old 73-card type-grouped listing.

**AC2:** Given any document classified `unregistered` by `cat-s3`, when it renders on the page, then it carries a visible "Unregistered" `.sw-pill` indicator with a text label (not color alone), regardless of whether it was successfully grouped by inference.

**AC3:** Given any story classified `orphaned-registration` by `cat-s3` (a registered story with zero matching files), when it renders on the page, then it shows a distinct empty/gap state — visually and textually different from the `unregistered`-document flag, so an operator can tell the two failure modes apart at a glance.

**AC4:** Given a feature with full, correct registration and no divergence (the ~65% common case, e.g. this repo's own `2026-09-06-feature-artefact-document-matrix`), when its page renders, then the output is byte-identical to what `fadm-s1` already produces today — this story changes the data source underneath the rendering, not the rendering itself, for the already-correct case.

**AC5:** Given the multi-tenant `not-yet-synced` state from `cat-s3`, when a feature in that state renders, then the page shows a clear "still syncing" message at the feature level — not a 500 error, not an empty page, not the `unregistered` flag (a different state, per `cat-s3`'s own AC3).

## Out of Scope

- Any change to `/artefact/:slug/:type`'s own fetch/resolve logic — that is `cat-s5`.
- Sorting, filtering, or search within the matrix — explicitly out of scope per the discovery artefact.

## NFRs

- **Performance:** Page render time for `phase4`'s 205-file case must not regress beyond the empirically-measured 6ms directory-walk cost plus normal rendering overhead — no new performance ceiling needed given `cat-s1`'s own measured numbers.
- **Security:** None identified — no new input surface.
- **Accessibility:** WCAG 2.1 AA; "Unregistered" indicator never relies on color alone (MC-A11Y-02).
- **Audit:** Not applicable — read-only page render.

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
