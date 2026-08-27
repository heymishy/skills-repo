## Story: Add a visible separator between an artefact's type label and its file link on the feature-index page

**Epic reference:** None — short-track (bug fix, live gap found via direct operator usage on staging)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator viewing a feature's artefact list** (`GET /features/:slug`),
I want **the "Discovery" / "Benefit Metric" / etc. type label to be visually separated from the artefact's file path link next to it**,
So that **I can actually read the label and the path as two distinct pieces of information, instead of one run-on string**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-27) on `wuce-staging`: every artefact row on `/features/new-feature-52aa6100` rendered as e.g. "Discoveryartefacts/new-feature-52aa6100/discovery.md" — the label and the link text run directly together with no space, making the label look absent or garbled at a glance.

**How:** `routes/features.js`'s `renderArtefactItem` builds the row as two adjacent inline elements with zero whitespace or separator between them in the template string: `` `<span class="artefact-list__type">${escHtml(type)}</span>` + `<a class="artefact-list__link" href="${escHtml(viewUrl)}">${escHtml(name)}</a>` ``. Neither `.artefact-list__type` nor `.artefact-list__link` has any CSS rule anywhere in this codebase (confirmed via repo-wide search — these class names are unstyled), so nothing supplies a visual gap by default; adjacent inline elements with no whitespace between them in the source HTML render flush against each other in every browser. This has apparently been the actual behaviour since this page was built — not a new regression — and was only noticed now via direct visual inspection.

## Architecture Constraints

- **Smallest fix that solves the reported problem.** Add a literal, human-readable separator (`: `) directly after the label text inside the `<span>`, so the row reads naturally as "Discovery: artefacts/.../discovery.md" — no new CSS class, no restructuring of the existing two-element markup, no change to `.artefact-list__type`/`.artefact-list__link`'s (currently nonexistent) styling.
- **Do not touch the `<time>` element or the `Resume conversation` link's own markup** — both already have a leading space in the template (` <time...>`, ` <a class="artefact-list__resume-link"...>`) and render correctly spaced from their neighbours today; this story only fixes the one missing separator between the type label and the file link.
- **Do not add a real CSS stylesheet rule for `.artefact-list__type`/`.artefact-list__link`** as an alternative fix — a literal separator is simpler, matches this codebase's existing convention of embedding small textual separators directly in generated HTML rather than introducing new CSS rules for one-off spacing, and is more robust to any future change in how these elements are laid out (a CSS-based fix could silently stop working if the markup structure changes; a literal character in the string cannot).

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given `renderArtefactItem({ type: 'Discovery', name: 'artefacts/x/discovery.md', viewUrl: '...' })` is called, When the returned HTML is inspected, Then the type label and the file-path link text are visually separated by a colon-and-space (`Discovery: `) — not rendered flush against each other.

**AC2 (regression guard):** Given the existing test `T5.2` in `tests/check-wuce6-feature-navigation.js` (asserting `"Ready Check"` renders and `"dor"` does not leak as standalone visible text), When re-run after this fix, Then it still passes unchanged — the separator addition does not affect label-escaping or leak any raw internal type identifier.

**AC3 (regression guard):** Given a full `/features/:slug` page render via `renderArtefactIndexHtml` with a mix of artefact types (including one with a resolvable "Resume conversation" link and one without), When the HTML is inspected, Then every row shows the new separator, the `<time>` element and `Resume conversation` link (where present) remain correctly spaced exactly as before, and no row is missing its date or resume link as a result of this change.

## Out of Scope

- **Any broader visual/CSS overhaul of the `/features/:slug` page.** This story fixes the one specific, confirmed spacing defect — not a general design pass.
- **The separate "no dedicated Decision Log view" gap** (flagged earlier this session) — different, larger scope; not addressed here.

## NFRs

- **Performance:** None — a two-character string addition.
- **Security:** None new — `escHtml`'s existing escaping is unaffected; the added `: ` is a static literal, not user-supplied content.
- **Accessibility:** Mild positive — a screen reader announcing "Discovery" immediately followed by a long file path with no pause is arguably harder to parse than "Discovery:" followed by the path; not a formal accessibility requirement for this story, just a incidental improvement.
- **Audit:** None affected.

## Complexity Rating

**Rating:** 1 — a two-character string addition in one function.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
