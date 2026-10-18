# Playback Walkthrough: 2026-10-11-journey-cx-redesign

**Captured:** 2026-10-18, live against `https://wuce-staging.fly.dev`, logged in as the real operator account — the second real capture produced with `fpd-s5`'s own real-capture loop fix, against a genuinely different feature (not `web-ui-pm-flow`) to prove the cross-story/cross-feature path-namespacing fix for real.

## jcx-s6 — Restructure the Customer experience tab into a real timeline + swimlane grid

### AC1 — Stages render left-to-right as columns

Real screenshot of the real "Customer experience" tab on a real journey (`jae-s3 live-verify (skills-framework)`), captured live:

![Customer experience swimlane grid](jcx-s6/screenshots/AC1.png)

Stage columns (Evaluate, Discover, Purchase, Onboard, Retain — scrollable) render left-to-right exactly as `jcx-s6-dod.md`'s own AC1 describes, with swimlane rows (Emotion, Customer actions, ...) aligned underneath — this same page was already live-confirmed once before, by a prior session, at merge time; this capture is the first time it's been captured through the Feature Playback mechanism itself.

## How this package was produced

Captured via the operator's own authenticated Chrome session, same method and same transparency note (JPEG bytes under a `.png` name — no image-conversion tool available in this sandbox) as the `web-ui-pm-flow` capture. This feature's own `dodStatus` field at the feature level was never set (`undefined`) despite all 7 of its real stories (`jcx-s1`-`jcx-s7`) being individually `dodStatus: complete` — the same pattern already found in `feature-playback-demo` itself. A feature-level-only search for capture targets would have missed this (and ~270 other features in this repo with at least one real DoD-complete story) entirely.
