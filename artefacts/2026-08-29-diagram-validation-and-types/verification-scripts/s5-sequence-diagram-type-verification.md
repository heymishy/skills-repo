# AC Verification Script: Add the Sequence diagram type, conditionally emitted

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s5-sequence-diagram-type.md
**Technical test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s5-sequence-diagram-type-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have access to two different feature descriptions to run through `/design` or `/definition`: one that genuinely involves a multi-step interaction (e.g. "an SSE turn exchange with a cache-fallback path"), and one that clearly doesn't (e.g. "add a button that toggles dark mode").

**Reset between scenarios:** Start a fresh session for each scenario.

---

## Scenarios

### 🔴 Scenario 1: A feature involving a real interaction sequence gets a Sequence diagram

**Covers:** AC1, AC2 (the model's judgment call — this is the core behaviour the whole story exists to validate; do not skip)

**Steps:**
1. Start a `/design` session and describe a feature whose core subject matter IS a multi-step interaction — for example: "This feature adds a cache-fallback path: the browser calls the API, the API checks Redis, and on a cache miss falls back to Postgres."
2. Let the session proceed through its normal design step.

**Expected outcome:**
> A new diagram appears labelled "Sequence," showing the browser, API, Redis, and Postgres as separate participants with arrows showing the call order (including the cache-miss fallback path) — not just a System Architecture box-and-arrow diagram.

**Negative check:** If NO Sequence diagram appears for this genuinely interaction-shaped feature, or if the model instead only produces a System Architecture diagram with no ordering/timing information, this is a FAIL — the conditional-emission instruction isn't being triggered when it should be.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Scenario 2: A feature with no interaction to diagram does NOT get a Sequence diagram

**Covers:** AC2 (negative control — equally important, do not skip)

**Steps:**
1. Start a `/design` session and describe a feature with no multi-step interaction worth diagramming — for example: "Add a button that toggles dark mode in the settings page."
2. Let the session proceed through its normal design step.

**Expected outcome:**
> No Sequence diagram appears. (A System Architecture diagram may still appear, since that one is unconditional — that's expected and correct.)

**Negative check:** If a Sequence diagram appears anyway — even a trivial or generic one — this is a FAIL, since it means emission isn't genuinely conditional.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A Sequence diagram renders like the other diagram types

**Covers:** AC3

**Steps:**
1. From Scenario 1's session, look at the rendered Sequence diagram.
2. Click "View diagram source (text alternative)" if present.

**Expected outcome:**
> It looks and behaves like the existing System Architecture / Data Model diagrams — same box styling, same "View diagram source" option showing the raw diagram text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A resumed session shows the same Sequence diagram

**Covers:** AC4

**Steps:**
1. From Scenario 1's session, leave the page and resume/reopen the same session later (or view its stage history if available).

**Expected outcome:**
> The same Sequence diagram appears, looking identical to how it did live.

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
