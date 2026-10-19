---
name: feature-playback
description: >
  Generates a sponsor-presentable playback package (walkthrough document +
  AC-mapped screenshots) scripted from a DoD-validated feature's own DoD
  artefact. Refuses to run against a feature that is not DoD-validated.
  Use after a feature reaches /definition-of-done and needs a reviewable
  package for sponsor acceptance. Run when someone says "make a playback
  package", "generate a demo walkthrough", or "package this feature for
  review".
triggers:
  - "make a playback package"
  - "generate a demo walkthrough"
  - "package this feature for review"
  - "feature playback"
---

# Feature Playback Package Skill

## Entry condition

The target feature must have `dodStatus: "complete"` in `.github/pipeline-state.json`.

If not:

> ❌ **Feature playback refused: dodStatus is not "complete".**
> Run /definition-of-done first.

---

## Step 1 — Identify the feature

Read `.github/pipeline-state.json`. Confirm the target feature's `dodStatus` is `"complete"` via `checkDodGate` in `scripts/playback-capture.js`. If it throws, surface the exact error message (it names the unmet gate) and stop.

---

## Step 2 — Generate the walkthrough document

Read every story's DoD artefact under `artefacts/[feature-slug]/dod/`, parse each one's own AC Coverage table and Metric Signal section via `parseDodAcCoverage`/`parseDodMetricSignal`, plus the feature's own `benefit-metric.md` via `parseBenefitMetricTargets`, then call `generateWalkthroughMarkdown` to write `artefacts/[feature-slug]/playback/walkthrough.md` with one section per AC, sourced verbatim from the DoD table rows — never re-authored or sourced from raw E2E test file content. All of these functions are in `scripts/playback-capture.js`.

---

## Step 3 — Capture real screenshots (and, optionally, video)

As of `rpca-s1`-`rpca-s3` (epic `2026-10-19-real-playback-capture-automation`), a real authenticated session can be constructed for this step — not just a mocked `page`. Follow this real orchestration, all functions from `scripts/playback-capture.js`:

1. Set `E2E_STAGING_AUTH_STUB_SECRET` in the environment, then call `authenticateStagingSession(baseUrl, secret)` — this reuses the already-deployed `GET /test/session` route, returns a real session id.
2. Launch a real Playwright browser, open a context, and add the session cookie (`{ name: 'session_id', value: sessionId, url: baseUrl }`) so the page is authenticated.
3. For each story, call `buildCaptureList(featureSlug, storySlug, acIds, specFiles)` — derives `{acId, selector}` for every AC with E2E spec coverage or a manual fallback entry, skipping (with a named warning, not a crash) any AC with neither.
4. Call `captureAcScreenshots({ page, featureSlug, storySlug, acList })` with that **real** page and the **real** derived `acList` — this function itself is unchanged by this epic (it already took `page`/`acList` as plain injected arguments, ADR-018/ADR-026, not a D37 adapter), but this is the first time it has ever been given real, not mocked, input. Saves one screenshot per AC to `artefacts/[feature-slug]/playback/[story-slug]/screenshots/`.
5. Optionally, for a story that also needs video: call `captureVideoForClip({ browser, featureSlug, storySlug, clip })` (`rpca-s3`) for each clip — produces a real `.webm` via Playwright's own `recordVideo`, and wires the result to `generateCaptionsForVideo` (marked `reviewed: false` until explicitly confirmed).
6. `embedScreenshotPaths` embeds each saved screenshot into its own AC section in `walkthrough.md`.

**Known gap:** there is no equivalent "embed video into `walkthrough.md`" function yet — a captured video lands at the existing `artefacts/[feature-slug]/playback/[story-slug]/video/` path, but is not automatically referenced in the walkthrough document. Link to it manually if a story's own package needs video evidence, until this gap is closed by a future story.

---

## Step 4 — Editorial review (mandatory — does not bypass)

The package status starts at `"pending-review"` in `artefacts/[feature-slug]/playback/package-status.json`. Ask the engineer:

> Review each captured screenshot in `artefacts/[feature-slug]/playback/[story-slug]/screenshots/`. Confirm each one shows the intended, stable UI state for its AC.
>
> Reply: confirmed — or describe what needs recapturing

Only after explicit confirmation, call `markPackageReviewed` to set status to `"complete"`. Automated capture never sets this status itself.

---

## What this skill does NOT do

- Capture against production — explicitly deferred to a fast-follow story (`decisions.md`, epic `2026-10-19-real-playback-capture-automation`); staging only
- Bulk retrofit real capture against existing, already-DoD-complete features — this is proven going forward on new features, not run as a backfill campaign
- Automatically embed a captured video into `walkthrough.md` — a known gap (see Step 3); video is saved to disk but must be linked manually for now
- Build or update the web-app viewer — that is `fpd-s3`/`fpd-s4`
- Run against a feature that is not DoD-validated — this is not a general-purpose demo tool

---

## Integration

**Reads:** `.github/pipeline-state.json`, `artefacts/[feature-slug]/dod/*.md`, `artefacts/[feature-slug]/benefit-metric.md`
**Produces:** `artefacts/[feature-slug]/playback/walkthrough.md`, `artefacts/[feature-slug]/playback/[story-slug]/screenshots/`, `artefacts/[feature-slug]/playback/[story-slug]/video/` (where used), `artefacts/[feature-slug]/playback/package-status.json`
**Follows:** /definition-of-done
**Precedes:** (within this epic) web-app viewer

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** once the package reaches `"complete"` status:

- Set the feature's `playbackPackage.status` ← `"complete"`
- Set the feature's `playbackPackage.path` ← `artefacts/[feature-slug]/playback/`
- Set `updatedAt` on the feature ← now
