# Contract Proposal — Close the real-capture loop

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s5-close-the-real-capture-loop.md
**Date:** 2026-10-18

## What will be built

- `src/utils/dod-parsing.js`: `parseDodAcCoverage` extended to also detect and parse a `## AC Verification` heading (`AC | Verified by | Result` columns) alongside the existing `## AC Coverage` heading, returning the same `{acId, description, satisfied, evidence, verificationMethod, deviation}` shape for both (`verificationMethod`/`deviation` default to `''` for the `AC Verification` shape, which has no equivalent columns).
- `src/web-ui/routes/playback.js`: `resolveScreenshotPathForAc`, `resolveVideoPathForAc`, `resolveCaptionTranscriptForVideo`, `resolveAcMedia` gain a `storySlug` parameter, inserted into the path convention as `artefacts/<featureSlug>/playback/<storySlug>/screenshots/<acId>.png` (and the equivalent for `video/`). `buildFeaturePlaybackStructure` passes `story.slug` through. `handleGetPlaybackMedia`'s `MEDIA_PATH_RE` updated to match the new, story-namespaced shape.
- `scripts/playback-capture.js`: `captureAcScreenshots`/`embedScreenshotPaths` updated to the same new story-namespaced path convention, keeping the capture mechanism in sync with what the viewer now expects.
- `.github/workflows/staging-deploy.yml`: add `'!artefacts/*/playback/**'` to the `on.push.paths-ignore` array, after the existing `'artefacts/**'` entry.
- A real capture run against `2026-06-14-web-ui-pm-flow`'s own `pmf.3` story (the real, already-shipped story using the `## AC Verification` shape) — real screenshots taken via the operator's own authenticated Chrome session, written to the new story-namespaced path, replacing the earlier hand-authored demo package at that location.

## What will NOT be built

- Real video/caption/transcript capture — `captureVideoRecording`/`generateCaptionsForVideo` are not invoked or modified (story's own Out of Scope item 1).
- No change to any other feature's own DoD file content — AC1 only widens what the parser accepts.
- No migration/merge of the earlier hand-authored `web-ui-pm-flow` demo package — it is replaced outright, not merged with the new real package.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit: `parseDodAcCoverage` against an `## AC Verification` fixture; Integration: `buildFeaturePlaybackStructure` + `renderPlaybackReviewHtml` renders real rows for a story using that shape | Unit, Integration |
| AC2 | Unit: `resolveScreenshotPathForAc`/`resolveVideoPathForAc` with two stories sharing an AC id resolve independently; Integration: `buildFeaturePlaybackStructure` attaches non-colliding media for two stories | Unit, Integration |
| AC3 | Unit: the real `staging-deploy.yml`'s own `paths-ignore` array contains the negation pattern, correctly ordered | Unit |
| AC4 | Manual: real capture run, real push, real deploy watched, real authenticated Chrome session confirms rendering | Manual |

## Assumptions

- `2026-06-14-web-ui-pm-flow`'s own `pmf.3-dod.md` remains unchanged and still uses the `## AC Verification` shape at implementation time (confirmed 2026-10-18, same day as this contract).
- The operator's own already-authenticated Chrome session remains valid for the live verification step — the same recurring OAuth-non-persistence risk already logged this session; if it drops again, the operator re-authenticates, same as every prior live check this cycle.
- GitHub Actions' own path-filter negation syntax (`!pattern` within `paths-ignore`, later pattern wins) behaves as documented — confirmed via GitHub's own Actions documentation; AC4's own real push is the independent behavioural confirmation, not just the docs.

## Estimated touch points

**Files:** `src/utils/dod-parsing.js` (modify), `src/web-ui/routes/playback.js` (modify), `scripts/playback-capture.js` (modify), `.github/workflows/staging-deploy.yml` (modify), `tests/check-fpd-s5-close-the-real-capture-loop.js` (new), `artefacts/2026-06-14-web-ui-pm-flow/playback/**` (replaced with a real capture)
**Services:** None
**APIs:** None

## H8-ext — Cross-story schema dependency check

**Dependencies block:** Upstream — `fpd-s1`, `fpd-s2`, `fpd-s3`, `fpd-s4`.
**schemaDepends:** `[]` (empty)
**Rationale:** Depends on shipped code and shipped conventions (`fpd-s1`'s capture script, `fpd-s4`'s media resolution and routing) — not on any `pipeline-state.json` schema field from any of the four.
