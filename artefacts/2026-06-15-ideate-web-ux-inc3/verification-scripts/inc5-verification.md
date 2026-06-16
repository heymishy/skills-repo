# AC Verification Script: Canvas-JSON marker instruction in /ideate SKILL.md

**Story reference:** artefacts/2026-06-15-ideate-web-ux-inc3/stories/inc5.md
**Technical test plan:** artefacts/2026-06-15-ideate-web-ux-inc3/test-plans/inc5-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. For Scenarios 4 and 5 (text presence checks): no server required — these are file reads. Open `.github/skills/ideate/SKILL.md` in a text editor.
2. For Scenarios 1, 2, and 3 (live session checks): start the server and open a real `/ideate` session in the browser.
   ```powershell
   # PowerShell — load .env then start server
   Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
   node src/web-ui/server.js
   ```
   ```bash
   # bash/zsh
   export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
   ```
3. Navigate to the URL shown in the server startup output (typically `http://localhost:3000`) and start a new `/ideate` session.

**Reset between scenarios:** Start a fresh `/ideate` session for each of Scenarios 1–3 so prior lens output doesn't carry canvas blocks into the next check.

---

## Scenarios

---

### Scenario 1: Lens A produces a cluster-tree block in the canvas panel 🔴 Blocking DoD gate

**Covers:** AC1

**Steps:**
1. In a fresh `/ideate` session, select Lens A from the lens picker.
2. Run Lens A on any real product topic and wait for the full response.
3. Look at the canvas panel on the right side of the screen (labelled "Canvas").

**Expected outcome:**
> A structured block appears in the canvas panel showing a cluster/tree-style visual layout of the opportunity map (clusters and their items), not a wall of markdown text. No raw `---CANVAS-JSON:` text appears anywhere in the chat conversation on the left.

**Result:** [ ] Pass  [ ] Fail  [ ] Not yet verified
**Notes:**

---

### Scenario 2: Lens D produces a table block in the canvas panel 🔴 Blocking DoD gate

**Covers:** AC2

**Steps:**
1. In a fresh `/ideate` session (or continuing from Scenario 1), select Lens D from the lens picker.
2. Run Lens D's 10-question strategy pass and wait for the full response.
3. Look at the canvas panel.

**Expected outcome:**
> A table appears in the canvas panel showing the Lens D strategy output in rows and columns, not a wall of markdown text. No raw `---CANVAS-JSON:` text appears anywhere in the chat conversation.

**Result:** [ ] Pass  [ ] Fail  [ ] Not yet verified
**Notes:**

---

### Scenario 3: Each lens output produces exactly one canvas block (cadence)

**Covers:** AC6

**Steps:**
1. Run any single lens step (A, C, D, or E) once in a fresh session.
2. Count how many distinct blocks appear in the canvas panel as a result of that one lens response.

**Expected outcome:**
> Exactly one new block appears in the canvas panel per lens step. Running the same lens step again (e.g. asking a follow-up within the same lens) does not silently duplicate an identical block, and a single lens response does not produce two or more separate canvas blocks.

**Result:** [ ] Pass  [ ] Fail  [ ] Not yet verified
**Notes:**

---

### Scenario 4: SKILL.md documents the marker schema and an example for every block type

**Covers:** AC3, AC4

**Steps:**
1. Open `.github/skills/ideate/SKILL.md` in a text editor.
2. Search for the string `CANVAS-JSON`.
3. Read the surrounding instruction text.

**Expected outcome:**
> The file documents the marker format `---CANVAS-JSON: {"type":"...","title":"...","content":...}---`, names all three valid `type` values (`cluster-tree`, `table`, `text`), and shows one complete, well-formed example marker for each of the three types. The `text` type instruction is explicitly tied to narrative/prose lens output (e.g. Lens C or Lens E), not structured data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: CANVAS-JSON markers never appear as raw text in the chat stream

**Covers:** AC5

> This scenario is primarily verified by inc4's existing automated test (`tests/check-inc4-canvas-panel.js`, T5), which is unmodified by this story. The manual check below confirms the behaviour is still observable end to end after inc5's SKILL.md change.

**Steps:**
1. Run any lens step that produces a canvas block (e.g. Lens A or Lens D, as in Scenarios 1–2).
2. Read the full chat message that appears in the conversation panel on the left.

**Expected outcome:**
> The chat message contains the lens's narrative response text, but no literal `---CANVAS-JSON:` string and no raw JSON object. The structured content only appears, rendered visually, in the canvas panel.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1, blocking) | | |
| Scenario 2 (AC2, blocking) | | |
| Scenario 3 (AC6) | | |
| Scenario 4 (AC3, AC4) | | |
| Scenario 5 (AC5) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |

---

## Note

Scenarios 1 and 2 passing (with results recorded) satisfies the human verification entry condition for this story's Definition of Done (`artefacts/2026-06-15-ideate-web-ux-inc3/verification/inc5-canvas-skill-verification.md`), and also satisfies the inc4 DoD entry condition that was deferred pending this story.
