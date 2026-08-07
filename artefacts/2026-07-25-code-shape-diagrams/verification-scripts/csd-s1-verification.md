# AC Verification Script: Prove the canvas diagram mechanism with a real data-model example

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s1-derisk-canvas-mermaid.md
**Technical test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the local dev server (`npm run web` or equivalent, per this repo's own README).
2. Open the `/ideate` canvas view for any feature in a browser.
3. Load the test fixture canvas payload containing a data-model diagram block (path provided by whoever implements this story).

**Reset between scenarios:** Reload the canvas page between scenarios — no shared state to reset otherwise.

---

## Scenarios

---

### Scenario 1: A data-model diagram renders as a picture, not text

**Covers:** AC1

**Steps:**
1. Open the `/ideate` canvas page with the test fixture loaded.
2. Look at the area where the data-model diagram block appears.

**Expected outcome:**
> You see a rendered diagram — boxes and lines showing tables and their relationships — not a wall of raw text starting with something like `erDiagram`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A realistic diagram is actually readable

**Covers:** AC2 🔴

**Steps:**
1. Open the `/ideate` canvas page with the 5+ entity data-model fixture loaded.
2. Look at the rendered diagram without zooming in or squinting.

**Expected outcome:**
> You can read every table name and every relationship line without difficulty — no overlapping boxes, no text cut off, no lines crossing through labels in a way that makes them hard to follow. If you have to guess which line connects to which box, that is a fail.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Existing canvas content still works

**Covers:** AC3

**Steps:**
1. Open the `/ideate` canvas page for a feature that has clusters, tables, and paragraphs (no diagram).
2. Confirm the page looks exactly as it did before this change.

**Expected outcome:**
> Clusters, tables, and paragraphs all display exactly as they always have — nothing looks different, nothing is missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: An unrecognised diagram type doesn't break the page

**Covers:** AC4

**Steps:**
1. Load a canvas payload containing a content-block with a made-up, unrecognised type (e.g. `type: 'not-a-real-type'`).
2. Load the canvas page.

**Expected outcome:**
> The page loads without crashing or showing a blank white screen. The unrecognised block is either skipped silently or shows a small "unsupported content type" note — it does not break the rest of the page.

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
