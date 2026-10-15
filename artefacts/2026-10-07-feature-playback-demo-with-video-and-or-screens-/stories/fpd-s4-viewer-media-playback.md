## Story: Viewer renders the actual screenshot gallery and plays video per AC

**Epic reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/epics/feature-playback-web-viewer.md
**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **feature sponsor / business owner reviewing a delivered feature**,
I want **to see each AC's own evidencing screenshot and play its video clip directly inside the review page, without leaving the app**,
So that **I can confirm a feature does what it claims without downloading files or asking an engineer to show me — closing the loop M1 measures**.

## Benefit Linkage

**Metric moved:** M1 — Acceptance loop closure rate (a package isn't genuinely "reviewed" until the evidence is actually visible, not just linked); M2 — Sponsor feedback re-entry rate (seeing the real evidence per AC is what lets a sponsor give specific, actionable feedback rather than a vague impression)
**How:** This story completes the walking skeleton `fpd-s3` started — the navigable structure now shows real evidence, not placeholders, making the package genuinely reviewable end to end inside the app.

## Architecture Constraints

- **Serves existing files directly — no new storage.** Screenshots (PNG) and video (`.webm`, per `fpd-s2`'s own corrected format) are served from the same `artefacts/[feature-slug]/playback/` files `fpd-s1`/`fpd-s2` already produce — no copy, no separate CDN or hosting layer (discovery's own Constraints section).
- **Native `<video>` element, no custom player.** `.webm` plays natively; no third-party video player library is introduced (ADR-026 — reuse the platform, don't add a dependency for something the browser already does).
- **Captions track wired to the native player.** The video element exposes the caption file `fpd-s2` produces (e.g. a `<track kind="captions">` element) — not a separate, disconnected caption viewer.
- **Playback-only (discovery Out of Scope item 5).** No trim/edit/annotate controls — standard native video controls only.

## Dependencies

- **Upstream:** `fpd-s1` (screenshots), `fpd-s2` (video + captions/transcript), `fpd-s3` (the structure this story renders media into).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a story's own AC section on the review page (`fpd-s3`), When that AC has a screenshot in the playback package, Then the screenshot renders directly in that AC's own section, at a size readable without zooming on a normal desktop viewport.

**AC2:** Given a story's own AC section, When that AC has an associated video clip (or is covered by the feature's single combined walkthrough), Then a native `<video>` player renders in that section, playable without leaving the page.

**AC3:** Given a video is playing, When the user enables captions via the native player controls, Then the captions `fpd-s2` generated display, synced to the video.

**AC4:** Given a video's own transcript, When the user wants to read rather than watch, Then the standalone transcript text is also accessible from the same AC section — not only available as a caption track requiring the video to be played.

**AC5:** Given an AC with no screenshot or video evidence yet (e.g. the package is still mid-production), When the review page renders that AC's own section, Then it shows a clear "no evidence captured for this AC yet" state — not a broken image or a silently empty section.

## Out of Scope

- **Downloading the original files** — if needed, this is a browser's own native "save video/image as" capability on the rendered media, not a dedicated download button/feature.
- **Video editing, trimming, or annotation** — per discovery Out of Scope item 5.
- **A custom video player UI** — native browser controls only, per Architecture Constraints.
- **Multiple format support** — `.webm`/PNG only, per discovery Out of Scope item 6.

## NFRs

- **Performance:** Media is served directly from disk, not transcoded or processed on request — no new performance risk beyond standard static-file serving.
- **Security:** Same session-based authentication as `fpd-s3`; media files are served only to authenticated users with access to that feature's own tenant.
- **Accessibility:** WCAG 2.1 AA — native video controls and caption track (AC3) are keyboard-operable and screen-reader-compatible by default, consistent with MC-A11Y-01/MC-A11Y-02; the standalone transcript (AC4) gives a non-video-dependent path to the same content.
- **Audit:** None — read-only viewing, no new mutating action.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
