# AC Verification Script: Playback capture triggers automatically when a feature reaches Definition of Done

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s5-automatic-capture-trigger-at-definition-of-done.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s5-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (session) | **Date:** 2026-10-19 | **Context:** [x] Pre-code (verified post-implementation, pre-merge)

---

## Setup

**Before you start:**
1. Open `scripts/playback-capture.js`, `skills/definition-of-done/SKILL.md`, and `skills/feature-playback/SKILL.md` in a text editor

**Reset between scenarios:** No reset needed — read-only review of document/code content, plus two small fixture-based checks.

---

## Scenarios

---

### Scenario 1: The gate works without the field nobody writes

**Covers:** AC1

**Steps:**
1. Make up a feature with 2 stories, both marked `dodStatus: "complete"`, but no top-level `feature.dodStatus` field anywhere
2. Check whether `checkDodGate` (read its code, or run the automated test) treats this feature as done

**Expected outcome:**
> It's treated as done — `{ ok: true }` — even though the old `feature.dodStatus` field was never set. The gate reads each story's own `dodStatus`, not a field nothing writes.

**Result:** [x] Pass
**Notes:** Also confirmed a stale, disagreeing `feature.dodStatus` field doesn't override the real per-story evidence. One backward-compat safety net added, not in the original ACs: if a feature has zero stories at all in either shape (`feature.stories[]` or `feature.epics[].stories[]`), the gate falls back to checking `feature.dodStatus` directly — found while running the existing `fpd-s1` test, which uses exactly this minimal fixture shape and would otherwise have silently started passing.

---

### Scenario 2: The error message actually tells you what's wrong

**Covers:** AC2

**Steps:**
1. Make up the same feature, but leave one of the 2 stories at `dodStatus: "in-progress"`
2. Check what error message `checkDodGate` produces

**Expected outcome:**
> The error names the specific story that's not done yet — not a generic "not complete" message with no story identified.

**Result:** [x] Pass
**Notes:**

---

### Scenario 3: Reaching DoD on the last story now fires playback automatically

**Covers:** AC3

**Steps:**
1. Read `skills/definition-of-done/SKILL.md`'s own "Feature-completion trace check" section

**Expected outcome:**
> It now says that once every story in a feature is DoD-complete, the skill automatically runs `/feature-playback`'s own walkthrough-generation and screenshot-capture steps (Steps 1-3) — the operator does not have to separately say "make a playback package." It also still says Step 4's own editorial review stays a required human step, unchanged.

**Result:** [x] Pass
**Notes:** Inserted directly after the existing "does every story... now show dodStatus complete?" check, before the pre-existing `/trace` check.

---

### Scenario 4: A capture failure doesn't sink the DoD sign-off

**Covers:** AC4

**Steps:**
1. Read the same section's own description of what happens if the automatic capture run fails (e.g. staging unreachable, secret not set)

**Expected outcome:**
> The story's own DoD verdict still comes through correctly (COMPLETE / COMPLETE WITH DEVIATIONS, based on that story's own ACs/tests/NFRs) — the capture failure does NOT downgrade it. A follow-up action naming the feature and the failure reason gets recorded instead, so it's visible later, not silently lost.

**Result:** [x] Pass
**Notes:**

---

### Scenario 5: Saying "make a playback package" still works the old way too

**Covers:** AC5

**Steps:**
1. Read `skills/feature-playback/SKILL.md`'s own `triggers` list and entry condition

**Expected outcome:**
> The same trigger phrases ("make a playback package", "generate a demo walkthrough", "package this feature for review", "feature playback") still work exactly as before — nothing about the manual path was removed or gated differently.

**Result:** [x] Pass
**Notes:** `skills/feature-playback/SKILL.md` was not touched by this story at all — confirmed unchanged.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — gate works without the field) | Pass | |
| Scenario 2 (AC2 — named error) | Pass | |
| Scenario 3 (AC3 — auto-fires at DoD) | Pass | |
| Scenario 4 (AC4 — failure doesn't sink DoD) | Pass | |
| Scenario 5 (AC5 — manual path unchanged) | Pass | |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| N/A | ACs didn't anticipate a zero-story feature fixture shape | Found via the pre-existing `fpd-s1` test using exactly that shape; added an explicit fallback to `feature.dodStatus` for that case | LOW | Accept — backward-compat safety net, not a gap against this story's own ACs |
