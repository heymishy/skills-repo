# AC Verification Script: Canvas rendering of the diagram content-block type

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s2-canvas-diagram-rendering.md
**Technical test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the local dev server.
2. Load test fixtures covering all three diagram types, one malformed diagram, and an as-designed/as-built pair.

**Reset between scenarios:** Reload the canvas page between scenarios.

---

## Scenarios

---

### Scenario 1: All three diagram types display correctly, each clearly labelled

**Covers:** AC1

**Steps:**
1. Open a canvas page containing a System Architecture, a Program Design, and a Data Model diagram.
2. Look at each one.

**Expected outcome:**
> Each diagram is visibly labelled with its type — "System Architecture", "Program Design", "Data Model" — and each renders as its own distinct picture, not mixed together.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A broken diagram shows a clear error, not a blank space or scary error text

**Covers:** AC2

**Steps:**
1. Open a canvas page containing a diagram block with deliberately broken syntax.
2. Look at where that diagram should appear.

**Expected outcome:**
> You see a labelled message like "Data Model diagram failed to render" — not a blank white space, and not a wall of red programmer error text or a stack trace.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: As-designed and as-built diagrams are clearly told apart

**Covers:** AC3 🔴

**Steps:**
1. Open a canvas page showing both an "as-designed" and an "as-built" Data Model diagram for the same feature.
2. Look at both without reading any surrounding text.

**Expected outcome:**
> You can immediately tell which diagram is which just by looking — a visible label or distinct visual treatment marks one as "As Designed" and the other as "As Built". You are never left guessing which is which.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Keyboard-only navigation still works with a diagram on the page

**Covers:** AC4 🔴

**Steps:**
1. Open a canvas page that has a diagram block plus other clickable elements (links, buttons).
2. Without touching the mouse, press Tab repeatedly to move through the page.

**Expected outcome:**
> Tab moves between the interactive elements on the page in a sensible order — the diagram block does not trap keyboard focus, does not get skipped in a way that breaks the flow, and does not cause focus to jump somewhere unexpected. You can reach every button/link on the page using only the keyboard, the same as before this diagram block existed.

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
