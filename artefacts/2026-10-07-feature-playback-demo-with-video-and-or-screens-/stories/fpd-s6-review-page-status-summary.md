## Story: Add an at-a-glance coverage summary to the top of the playback review page

**Epic reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/epics/feature-playback-web-viewer.md
**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **feature sponsor / business owner reviewing a delivered feature**,
I want **the playback review page to show me, at the very top, how much of the feature's own AC evidence has actually been captured — before I scroll through dozens of individual stories and ACs**,
So that **I can judge at a glance whether a package is ready to review properly or still mid-capture, instead of having to scroll past every "No evidence captured for this AC yet." line myself to work that out**.

## Benefit Linkage

**Metric moved:** M1 — Acceptance loop closure rate; M2 — Sponsor feedback re-entry rate
**How:** Direct operator feedback on a real, live production page (`/playback/2026-10-11-journey-cx-redesign`, 2026-10-18) found that a sponsor opening a partially-captured package has no way to tell its overall coverage state without scrolling through every AC section individually — this is friction at exactly the point M1/M2 depend on (a sponsor actually reviewing the package and giving feedback). A visible coverage summary removes that friction before the sponsor reads a single AC.

## Architecture Constraints

- **Extends `renderPlaybackReviewHtml` in place — does not introduce a second rendering path (ADR-026).** The summary is computed from the same `structure.epics`/`structure.stories`/`ac.media` shape `renderStorySection`/`renderAcMediaHtml` already consume; it does not re-fetch or re-derive data from a different source.
- **No new route or endpoint.** The coverage count is computed server-side inside the existing `GET /playback/:slug` handler path, at render time, from data already being iterated for the per-story sections — not a second pass requiring new I/O.
- **MC-A11Y-02 (Colour not sole indicator of gate status) applies to AC3's "visibly different state/treatment" for full vs. partial coverage.** The distinction must be carried by text/label, not colour alone — e.g. different wording ("Full coverage" vs. "M of N ACs have captured evidence") satisfies this; a colour-only badge change does not. (Found at /review, run 1, finding 1-M2.)

## Dependencies

- **Upstream:** `fpd-s3`, `fpd-s4` — both DoD-complete; this story extends the review page they built, not a page still in progress.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a feature's playback structure with N total ACs across all its stories and M of them having captured media (`ac.media.screenshotPath` or `ac.media.videoPath` set), When the `/playback/:slug` review page renders, Then a summary element appears immediately after the existing Scope/Benefit card and before any per-story section, showing the count as "M of N ACs have captured evidence" (exact values, not a percentage-only display).

**AC2:** Given a feature where 0 of N ACs have captured evidence (the common case for a freshly-generated package), When the page renders, Then the summary states this plainly (e.g. "0 of N ACs have captured evidence yet") rather than omitting the summary or rendering a misleading "complete" state.

**AC3:** Given a feature where all N of N ACs have captured evidence, When the page renders, Then the summary reflects full coverage distinctly from the partial-coverage case (e.g. a visibly different state/treatment, not just the same text with different numbers silently blending in).

**AC4:** Given the existing per-story/per-AC sections below the summary, When the page renders, Then they are unchanged in structure and content — this story adds a summary above them, it does not alter `renderStorySection`/`renderAcMediaHtml`'s own existing output.

## Out of Scope

- **Automating the underlying capture itself** — this story only summarizes whatever evidence already exists; it does not address why coverage is currently low for most shipped features (the `scripts/playback-capture.js` automation gap, confirmed during this story's own scoping to have no working CLI entrypoint, no real-browser integration, and no per-AC selector derivation — see `workspace/capture-log.md`, 2026-10-18). That gap is being scoped separately via a fresh `/discovery` pass, not folded into this story.
- **A per-epic or per-story coverage breakdown** — the summary is feature-level only (one "M of N" figure for the whole page); drilling into which specific stories are incomplete remains visible via scrolling the existing per-story sections, unchanged by this story.
- **Visual/CSS polish beyond a plain, readable summary element** — no new design system component, no chart/progress-bar widget; a text-based summary satisfies the AC.

## NFRs

- **Performance:** None beyond what `fpd-s3`/`fpd-s4` already established — the count is derived from data already being iterated for the per-story render, no new request-path I/O.
- **Security:** None new — no new input surface, read-only derived display of already-rendered data.
- **Accessibility:** The summary element must be readable by a screen reader in document order before the per-story sections (WCAG 2.1 AA, product/constraints.md #9) — plain text/semantic markup, not an image or canvas-drawn count.
- **Audit:** None — no new mutating action.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
