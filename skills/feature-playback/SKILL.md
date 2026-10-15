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

Run `scripts/playback-capture.js [feature-slug]`. This reads every story's DoD artefact under `artefacts/[feature-slug]/dod/`, parses each one's own AC Coverage table and Metric Signal section via `parseDodAcCoverage`/`parseDodMetricSignal`, plus the feature's own `benefit-metric.md` via `parseBenefitMetricTargets`, then calls `generateWalkthroughMarkdown` to write `artefacts/[feature-slug]/playback/walkthrough.md` with one section per AC, sourced verbatim from the DoD table rows — never re-authored or sourced from raw E2E test file content.

---

## Step 3 — Capture screenshots

`captureAcScreenshots` drives Playwright against the feature's own stable UI state for each AC (the same interaction script used for that AC's own DoD evidence), saving one screenshot per AC to `artefacts/[feature-slug]/playback/screenshots/`. `embedScreenshotPaths` embeds each one into its own AC section in `walkthrough.md`.

---

## Step 4 — Editorial review (mandatory — does not bypass)

The package status starts at `"pending-review"` in `artefacts/[feature-slug]/playback/package-status.json`. Ask the engineer:

> Review each captured screenshot in `artefacts/[feature-slug]/playback/screenshots/`. Confirm each one shows the intended, stable UI state for its AC.
>
> Reply: confirmed — or describe what needs recapturing

Only after explicit confirmation, call `markPackageReviewed` to set status to `"complete"`. Automated capture never sets this status itself.

---

## What this skill does NOT do

- Record video — a separate story (`fpd-s2`), not this skill's own capture step
- Build or update the web-app viewer — that is `fpd-s3`/`fpd-s4`
- Run against a feature that is not DoD-validated — this is not a general-purpose demo tool

---

## Integration

**Reads:** `.github/pipeline-state.json`, `artefacts/[feature-slug]/dod/*.md`, `artefacts/[feature-slug]/benefit-metric.md`
**Produces:** `artefacts/[feature-slug]/playback/walkthrough.md`, `artefacts/[feature-slug]/playback/screenshots/`, `artefacts/[feature-slug]/playback/package-status.json`
**Follows:** /definition-of-done
**Precedes:** (within this epic) video walkthrough, web-app viewer

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** once the package reaches `"complete"` status:

- Set the feature's `playbackPackage.status` ← `"complete"`
- Set the feature's `playbackPackage.path` ← `artefacts/[feature-slug]/playback/`
- Set `updatedAt` on the feature ← now
