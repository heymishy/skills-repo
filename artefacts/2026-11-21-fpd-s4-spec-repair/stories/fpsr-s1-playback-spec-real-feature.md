## Story: The caption-sync E2E spec opens a playback page that exists, so it passes instead of failing to find a video

**Epic reference:** None - short-track (spec repair of the quarantined `fpd-s4-caption-sync.spec.js`)
**Discovery reference:** None - short-track skips discovery. Evidence, measured on 2026-11-21 on master (`41c70eec1`): `tests/e2e/fpd-s4-caption-sync.spec.js` fails alone with `.playback-ac__video` not found (`toBeVisible` times out at 5 s). The matrix reason said "the spec needs a playback fixture that does not exist". Reading the code shows the fixture does exist: the spec navigates to `/playback/some-dod-complete-feature-with-a-real-package`, a placeholder slug that matches no feature in `.github/pipeline-state.json`, so `handleGetPlaybackReview` answers 404 "Feature not found" and no video is rendered. The playback page reads the real repository: `pipeline-state.json`, `discovery.md`, `benefit-metric.md` and committed media under `artefacts/<feature>/playback/<story>/`. The feature `2026-10-11-journey-cx-redesign` has story `jcx-s3` with a committed `.webm`, a `.vtt` caption file and a transcript beside it; `buildFeaturePlaybackStructure` resolves all five of that story's ACs with video, caption and transcript paths, so the page renders a `<video class="playback-ac__video">` with a `<track kind="captions">`. With the slug changed to that feature, the spec passes (4 of 4 local runs).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [playback] [testing]

## User Story

As **a developer or operator reading the E2E report**,
I want **the caption-sync spec to open a playback page that has a video with captions**,
So that **the only browser test of caption cues during real playback (jsdom cannot play media) runs and passes, and the quarantine list shrinks to the one spec with a real product bug**.

## Benefit Linkage

**Metric moved:** `fpd-s4` goes from failing in every recorded run to 1 of 1 passing; the E2E failing list on CI drops from 2 (`ep3-s1`, `fpd-s4`) to 1 (`ep3-s1`).
**How:** the spec's `page.goto` uses a real feature slug whose committed playback evidence includes a video and captions; one expectation in `check-actr-s1-capture-target-derivation.js` that reads this spec's URL follows it.

## Architecture Constraints

- Change confined to `tests/e2e/fpd-s4-caption-sync.spec.js` (the slug and a comment), the one expected value in `tests/check-actr-s1-capture-target-derivation.js`, one matrix entry (after CI), and artefacts. No file under `src/` changes.
- The spec keeps its mechanism and assertions: the `.playback-ac__video` selector, one `<track kind="captions">`, `textTracks[0].mode = 'showing'`, `play()`, and active cues greater than 0.
- Preserve each file's existing line endings (both files are CRLF).

## Dependencies

- **Upstream:** fpd-s4 (viewer media playback), fpd-s2 (video capture and captions), actr-s1 (reads this spec to derive a capture target), jcx-s3 (the committed evidence the spec now plays).
- **Downstream:** the `fpd-s4` matrix entry leaves quarantine once CI shows it passing.

## Acceptance Criteria

**AC1:** Given the spec on master, When it is run alone, Then it fails with `.playback-ac__video` not found (measured: red); and Given the change, When it is run alone, Then it passes, 3 of 3 consecutive runs.
**AC2:** Given the change, When the spec's diff is read, Then only the `page.goto` URL and an explanatory comment changed; the selector, the track check, the `showing` mode, `play()` and the `activeCues > 0` assertion are untouched.
**AC3:** Given `tests/check-actr-s1-capture-target-derivation.js` reads the real spec for its URL and selector, When it runs after the change, Then all 11 of its tests pass with the expected URL updated to the new slug, and `check-rpca-s2-selector-derivation-from-e2e-specs.js` still passes.
**AC4:** Given the pull request's CI run, When the E2E report is read, Then `fpd-s4` passes there (1 of 1); the matrix entry then moves from `quarantined` to `extended` with a rewritten reason, and CI runs on the final commit before the merge is requested.
**AC5:** Given the pull request, When its changed files are listed (and again on master after the merge), Then they are the spec, the one check, the matrix file and artefacts only, with nothing under `src/`.

## Out of Scope

- Any change to `src/` (the playback page and media route are correct).
- Creating a dedicated test fixture or a stubbed repository root for playback (a possible follow-up if the evidence under `jcx-s3` is ever moved; the spec then fails loudly, which is the intended signal).
- `ep3-s1` (a product bug, issue #1042) and any move to the blocking `core` lane.

## NFRs

- **Test honesty:** the spec must still fail if captions stop rendering or cues stop activating; the assertions that prove that are unchanged.
- **Backward compatibility:** no other spec or check changes behaviour.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
