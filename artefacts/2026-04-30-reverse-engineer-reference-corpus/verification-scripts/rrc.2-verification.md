# AC Verification Script: Add Output 10 — Constraint index to `/reverse-engineer`

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.2-constraint-index-output.md`
**Technical test plan:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.2-test-plan.md`
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/skills/reverse-engineer/SKILL.md` in a text editor.
2. Also open `artefacts/2026-04-30-reverse-engineer-reference-corpus/decisions.md` for DEC-001 reference.
3. No running application or database required — all scenarios are file review only.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1 — Output 10 instruction is present with the correct filename

**Covers:** AC1

**Steps:**
1. Open `.github/skills/reverse-engineer/SKILL.md`.
2. Search for "Output 10".
3. Read the Output 10 entry.

**Expected outcome:**
- "Output 10" appears in SKILL.md.
- The Output 10 entry names the output file as `constraint-index.md`.
- The entry states that this file is produced during an INITIAL or DEEPEN pass, stored in `artefacts/[system-slug]/reference/`.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 2 — `constraint-index.md` has all five required columns

**Covers:** AC1

**Steps:**
1. In the Output 10 section of SKILL.md, locate the format description for `constraint-index.md`.
2. Check for each of the following five columns:
   - [ ] `rule-id`
   - [ ] `source-file`
   - [ ] `confidence`
   - [ ] `disposition`
   - [ ] `summary`

**Expected outcome:**
All five columns are present in the described format. The format is pipe-delimited (markdown table).

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 3 — rule-id format follows `<layer>-<sequence>` convention

**Covers:** DEC-001 ([decisions.md](../decisions.md))

**Steps:**
1. In the Output 10 section, find the description of the `rule-id` column.
2. Check whether the format is described as `<layer>-<sequence>` (e.g. `L1-001`, `L3-012`).

**Expected outcome:**
The `rule-id` column description specifies the layer-prefixed format (layer number followed by a zero-padded 3-digit sequence number). This is consistent with DEC-001.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 4 — `[CHANGE-RISK]` notation referenced in constraint-index instructions

**Covers:** AC2

**Steps:**
1. In the Output 10 / constraint-index section, look for instructions about the `disposition` or `summary` column.
2. Check whether `[CHANGE-RISK]` notation is described — specifically that rows identifying a change-sensitive constraint should include `[CHANGE-RISK]` in the summary.

**Expected outcome:**
SKILL.md references `[CHANGE-RISK]` notation in the context of constraint-index. The `[CHANGE-RISK]` text must appear as the exact notation (not a variant like "CHANGE RISK" or "change-risk").

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 5 — VERIFY pass instructs updating `constraint-index.md` when dispositions change

**Covers:** AC3

**Steps:**
1. Find the VERIFY pass section in SKILL.md.
2. Check whether it instructs the operator to review and update `constraint-index.md` when constraint dispositions change (e.g. after a delivery cycle, when a PARITY REQUIRED rule is retired or a disposition changes from PENDING to MIGRATED).

**Expected outcome:**
The VERIFY pass section references `constraint-index.md` or Output 10 with an update instruction.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 6 — DEFER outcome does not instruct Output 10

**Covers:** AC4

**Steps:**
1. Find the DEFER outcome section in SKILL.md.
2. Check whether Output 10 or `constraint-index.md` is mentioned.

**Expected outcome:**
The DEFER outcome does NOT instruct the operator to produce `constraint-index.md`. When no useful corpus can be extracted, a constraint index would be empty and misleading.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 7 — SKILL.md stays within the line-count limit

**Covers:** NFR (≤ 650 lines, shared with rrc.1 additions)

**Steps:**
1. In your terminal run: `wc -l .github/skills/reverse-engineer/SKILL.md`
   (Windows PowerShell: `(Get-Content .github/skills/reverse-engineer/SKILL.md).Count`)
2. Note the line count.

**Expected outcome:**
Line count ≤ 650. If exceeded, flag as a finding — the combined rrc.1 + rrc.2 additions exceeded the NFR budget.

**Pass / Fail:** _______  **Notes:** _______________________

---

## Summary

| Scenario | AC | Result |
|----------|----|--------|
| 1 — Output 10 present with correct filename | AC1 | |
| 2 — All 5 format columns present | AC1 | |
| 3 — rule-id uses layer-sequence format | DEC-001 | |
| 4 — [CHANGE-RISK] notation referenced | AC2 | |
| 5 — VERIFY pass updates constraint-index | AC3 | |
| 6 — DEFER does not instruct Output 10 | AC4 | |
| 7 — Line count ≤ 650 | NFR | |

**Overall result:** [ ] Pass — all scenarios pass  [ ] Fail — see findings above
**Verified by:** _____________  **Date:** _____________
