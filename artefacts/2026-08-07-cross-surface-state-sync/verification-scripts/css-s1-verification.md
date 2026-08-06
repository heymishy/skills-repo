# AC Verification Script: Automatically reflect a CLI-side gate advance on the corresponding web-UI journey

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s1-cli-advance-reflects-on-web-ui-journey.md
**Technical test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a feature in `.github/pipeline-state.json` that has not yet reached the `discovery-approved` gate.
2. Have that same feature's slug set up as a web-UI journey (a test/staging journey is fine — this does not require a real customer journey).
3. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Re-run `node bin/skills init [a fresh test feature slug]` between scenarios so each scenario starts from a feature with no gates advanced yet.

---

## Scenarios

---

### Scenario 1: Advancing a gate on the CLI updates the connected journey automatically

**Covers:** AC1

**Steps:**
1. Run `node bin/skills gate-advance [feature-slug] [story-id] discovery-approved artefacts/[feature-slug]/discovery.md`
2. Open the connected web-UI journey for that same feature slug (no manual "Sync" click)

**Expected outcome:**
> The web-UI journey already shows the Discovery stage as complete — you did not need to click any "Sync" button on the dashboard to see it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A feature with no connected journey advances normally

**Covers:** AC2

**Steps:**
1. Pick a feature slug that exists in `pipeline-state.json` but has never been started as a web-UI journey.
2. Run `node bin/skills gate-advance [feature-slug] [story-id] discovery-approved artefacts/[feature-slug]/discovery.md`

**Expected outcome:**
> The command finishes normally with no error message — there is no journey to update, and nothing complains about that.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A journey pointing at a repo whose pipeline-state.json doesn't have the feature is flagged, not silently ignored

**Covers:** AC3

**Steps:**
1. Set up a web-UI journey whose feature slug does not exist anywhere in its connected repo's `pipeline-state.json`.
2. Trigger a gate advance from the CLI side that would normally try to sync to that journey.
3. Check the sync/mismatch log (location confirmed at implementation time).

**Expected outcome:**
> The journey's own record is untouched, and a log entry exists naming the mismatched feature slug — it is visible, not silently dropped.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Advancing a different gate type does not trigger this story's sync

**Covers:** AC4

**Steps:**
1. Advance a gate other than `discovery-approved` (e.g. `test-plan-complete`) for a feature with a connected journey.
2. Check the connected journey immediately afterward.

**Expected outcome:**
> The journey is unchanged — this story only syncs the `discovery-approved` gate; other gate types are covered by a later story (css-s4).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
