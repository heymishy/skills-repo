# AC Verification Script: Wire the real CLI into skills/feature-playback/SKILL.md's own documented steps

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s4-wire-cli-into-feature-playback-skill.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s4-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (session) | **Date:** 2026-10-19 | **Context:** [x] Pre-code (verified post-implementation, pre-merge)

---

## Setup

**Before you start:**
1. Open `skills/feature-playback/SKILL.md` and `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md` in a text editor

**Reset between scenarios:** No reset needed — read-only review of document content.

---

## Scenarios

---

### Scenario 1: The skill's own instructions match what actually happens

**Covers:** AC1

**Steps:**
1. Read `skills/feature-playback/SKILL.md`'s own Step 2 and Step 3

**Expected outcome:**
> The text describes running `node scripts/playback-capture.js [feature-slug]` and accurately explains that it authenticates against staging and captures real screenshots/video — not a description that sounds aspirational or doesn't match what the code in `rpca-s1`-`rpca-s3` actually built.

**Result:** [x] Pass
**Notes:** Step 3 rewritten as an explicit 6-step real orchestration naming `authenticateStagingSession`, `buildCaptureList`, `captureAcScreenshots` (with real, not mocked, input for the first time), and `captureVideoForClip` — found and fixed a genuine disconnect between the CLI entrypoint and these existing functions along the way (see `decisions.md`'s DESIGN entry, 2026-10-19), not just prose polish.

---

### Scenario 2: What's still manual is stated accurately

**Covers:** AC2

**Steps:**
1. Read the same file's own "What this skill does NOT do" section

**Expected outcome:**
> It correctly says production capture and bulk retrofitting across existing features remain manual/out of scope — it does not claim the whole mechanism is still manual.

**Result:** [x] Pass
**Notes:** Also names the one real known gap found while rewriting: no function exists yet to auto-embed a captured video into `walkthrough.md`. Stated honestly as a gap, not glossed over.

---

### Scenario 3: The old RISK-ACCEPT entries are closed, not left dangling

**Covers:** AC3

**Steps:**
1. Read `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md`
2. Look for a new entry near the end of the file

**Expected outcome:**
> A new entry explicitly names `fpd-s1`, `fpd-s2`, `fpd-s3`, `fpd-s4`, and `fpd-s5`'s own RISK-ACCEPT entries as superseded by this epic's real mechanism — the original 5 entries are still present and unedited (the audit trail isn't rewritten), just explicitly closed out by the new entry.

**Result:** [x] Pass
**Notes:** New `SUPERSEDE` entry appended, names all 5 slugs, references `rpca-s1`-`rpca-s3`'s own real test evidence, scoped accurately (mechanism is real and callable with real input, not an overclaim the full orchestration has run end-to-end yet). All 5 original entries confirmed still present, unedited.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — SKILL.md accuracy) | Pass | |
| Scenario 2 (AC2 — scoping accuracy) | Pass | |
| Scenario 3 (AC3 — decisions.md closure) | Pass | |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| N/A | Original DoR assumed the fix was prose polish | Scoping found the CLI entrypoint and feature-playback's own existing functions were disconnected; corrected before implementation (see `decisions.md`'s DESIGN entry, 2026-10-19) | N/A | Corrected at DoR time, not a post-hoc finding |
