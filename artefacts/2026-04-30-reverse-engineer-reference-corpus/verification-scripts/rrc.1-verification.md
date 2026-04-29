# AC Verification Script: Add Output 9 — `/discovery` pre-population seed

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.1-discovery-seed-output.md`
**Technical test plan:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.1-test-plan.md`
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the file `.github/skills/reverse-engineer/SKILL.md` in a text editor or on GitHub.
2. Have the file `.github/templates/discovery.md` open in a second tab for comparison (Scenario 4).
3. No running application, no database, no browser required — this is a documentation file review.

**Reset between scenarios:** No reset needed — all scenarios read the same file independently.

---

## Scenarios

---

### Scenario 1 — Output 9 instruction is present with the correct filename

**Covers:** AC1

**Steps:**
1. Open `.github/skills/reverse-engineer/SKILL.md`.
2. Search for the text "Output 9" (Ctrl+F or ⌘F).
3. Read the Output 9 section.

**Expected outcome:**
- The text "Output 9" appears in the file.
- The Output 9 entry names the file `discovery-seed.md` stored in `artefacts/[system-slug]/reference/`.
- The section instructs the operator to produce this file at the end of an INITIAL or DEEPEN pass.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 2 — All four format sections are described for `discovery-seed.md`

**Covers:** AC1

**Steps:**
1. In the Output 9 section of the SKILL.md, look for the format description of `discovery-seed.md`.
2. Check for each of the following four items:
   - [ ] **System name** — the name of the legacy system being extracted
   - [ ] **Problem framing** — the known failure modes and reason the system needs engagement
   - [ ] **Known constraints** — the PARITY REQUIRED rules (mandatory migration constraints)
   - [ ] **Personas** — the user types identified in the system

**Expected outcome:**
All four items are described in the Output 9 format section.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 3 — DEFER outcome does not instruct Output 9

**Covers:** AC3

**Steps:**
1. In `.github/skills/reverse-engineer/SKILL.md`, search for "DEFER" (the Q0 outcome where no useful corpus can be extracted).
2. Read the DEFER section.
3. Check whether it instructs the operator to produce `discovery-seed.md` (Output 9).

**Expected outcome:**
The DEFER section does NOT mention Output 9 or `discovery-seed.md`. When an operator reaches a DEFER outcome, they should not be asked to produce a seed that would be empty or misleading.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 4 — `discovery-seed.md` structure mirrors the discovery template

**Covers:** AC4

**Steps:**
1. Open `.github/templates/discovery.md`.
2. Note the section headings (e.g. Problem framing, Constraints, Personas, or similar).
3. Return to the Output 9 format description in `.github/skills/reverse-engineer/SKILL.md`.
4. Compare: does each section in the `discovery-seed.md` format correspond to a named section in `discovery.md`?

**Expected outcome:**
At least the Problem framing, Constraints, and Personas sections in `discovery-seed.md` correspond to identically named (or clearly equivalent) sections in `discovery.md`. The intent is that a `/discovery` run can treat the seed as a pre-filled draft without any reformatting.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 5 — VERIFY pass instructs updating `discovery-seed.md` when rules change

**Covers:** AC5

**Steps:**
1. In `.github/skills/reverse-engineer/SKILL.md`, search for the VERIFY pass section (the pass type used after a delivery cycle to check whether rules have changed).
2. Read the VERIFY pass instructions.
3. Check whether they include a step to review and update Output 9 (`discovery-seed.md`) if any PARITY REQUIRED rules changed since the last pass.

**Expected outcome:**
The VERIFY pass section contains an instruction along the lines of: "Review Output 9 (`discovery-seed.md`) — if any PARITY REQUIRED rules changed, update the seed to reflect the current constraint set." The seed should stay in sync with the live corpus.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 6 — SKILL.md stays within the line-count limit

**Covers:** NFR (≤ 650 lines)

**Steps:**
1. In your terminal, run: `wc -l .github/skills/reverse-engineer/SKILL.md`
   (On Windows: `(Get-Content .github/skills/reverse-engineer/SKILL.md).Count` in PowerShell)
2. Note the line count.

**Expected outcome:**
Line count is 650 or fewer. If the count exceeds 650, the implementation added too much — flag this as a finding.

**Pass / Fail:** _______  **Notes:** _______________________

---

## Summary

| Scenario | AC | Result |
|----------|----|--------|
| 1 — Output 9 present with correct filename | AC1 | |
| 2 — All 4 format sections in seed | AC1 | |
| 3 — DEFER does not instruct Output 9 | AC3 | |
| 4 — Seed mirrors discovery template | AC4 | |
| 5 — VERIFY pass updates seed | AC5 | |
| 6 — Line count ≤ 650 | NFR | |

**Overall result:** [ ] Pass — all scenarios pass  [ ] Fail — see findings above
**Verified by:** _____________  **Date:** _____________
