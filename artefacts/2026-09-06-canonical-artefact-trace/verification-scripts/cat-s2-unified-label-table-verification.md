# AC Verification Script: Collapse five independent label tables into one shared, corrected table

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s2-unified-label-table.md
**Technical test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s2-unified-label-table-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. Run `node tests/check-cat-s2-unified-label-table.js` and read the printed PASS/FAIL lines.
3. For Scenario 3 (the `CLAUDE.md` check), open `CLAUDE.md` in a text editor instead.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: Every kind of document folder has a real, readable label — nothing shows up as just a raw filename

**Covers:** AC1

**Steps:**
1. Run the test file.
2. Find the lines checking each of the 14 document folder types, including `spikes` and `review`.

**Expected outcome:**
> Every folder type — including the two that were previously missed by some of the old label lists (`review`, `decisions`) and one that no old list recognized at all (`spikes`) — gets a proper, readable label. None of them fall back to showing the raw filename as the label.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The two kinds of "Definition of Ready" documents are told apart

**Covers:** AC2

**Steps:**
1. Run the test file.
2. Find the line comparing a `-dor-contract.md` file against a plain `-dor.md` file.

**Expected outcome:**
> The two file types are recognized as different from each other, using the same logic the site already uses elsewhere for this exact distinction — it isn't reinvented a second time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The written documentation lists the same folder names the code now recognizes

**Covers:** AC3

**Steps:**
1. Open `CLAUDE.md`.
2. Find the sentence listing artefact sub-directories (search for "stories/, epics/, test-plans/").

**Expected outcome:**
> The list now includes `review/`, `decisions/`, and `spikes/` alongside the folders that were already listed — the documentation and the code agree.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Nothing that used to work now silently breaks

**Covers:** AC4

**Steps:**
1. Run the full test suite: `node scripts/run-all-tests.js`.
2. Look for any test file that previously checked a specific label and now fails without explanation.

**Expected outcome:**
> Every test that checked a label from the old system either still passes exactly as before, or was changed on purpose with a clear note explaining why the label changed. Nothing fails silently, and nothing was quietly deleted to make a failure go away.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — all 14 folders labeled | | |
| Scenario 2 — DoR vs DoR-contract distinction | | |
| Scenario 3 — CLAUDE.md documentation updated | | |
| Scenario 4 — no silent test breakage | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
