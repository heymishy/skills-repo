# AC Verification Script: Write `/modernisation-decompose` SKILL.md

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-1-skill-md.md
**Technical test plan:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Clone or pull the latest version of the skills repo.
2. Confirm the file `.github/skills/modernisation-decompose/SKILL.md` exists (post-merge only).
3. For pre-code verification: work through the file content as a specification review — confirm the described behaviour is what you expect before implementation starts.
4. For post-merge: open the SKILL.md in a text editor alongside this script.

**Reset between scenarios:** Each scenario is independent — no state carry-over between them.

---

## Scenarios

### Scenario 1 — AC1: SKILL.md passes governance check

**Steps:**
1. From the repo root, run `npm test` in a terminal.
2. Observe the output for the `[skill-contracts]` line.

**Expected outcome:** The output line reads something like `[skill-contracts] 38 skill(s), [n] contract(s) OK ✓` — a count that includes the new `modernisation-decompose` skill. No contract failure lines appear.

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 2 — AC2: Entry condition blocks gracefully when no rev-eng report exists

**Steps:**
1. Open `.github/skills/modernisation-decompose/SKILL.md`.
2. Find the section labelled "Entry condition" or "Before running" (near the top of the file).
3. Read the text of that section.

**Expected outcome:** The section explicitly checks for a file at `artefacts/[system-slug]/reverse-engineering-report.md` (or equivalent). It includes a clear error or stop instruction — not a vague "you might need" note — describing what message to show the operator when the file is absent. The message names the missing file path and tells the operator to run `/reverse-engineer` first.

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 3 — AC3: Java boundary signals named as rationale per feature boundary

**Steps:**
1. Open `.github/skills/modernisation-decompose/SKILL.md`.
2. Find the decomposition step section (likely "Step N — Identify feature boundaries" or similar).
3. Check that all four boundary signal types appear: Maven module, Spring `@Service`, JPA aggregate root, `@Transactional` span.
4. Check that the instructions say to use one of these signals as the *stated rationale* for each proposed boundary — not just as a label.

**Expected outcome:** All four signal types are listed. The instructions say something like "for each proposed boundary, state which of these signals supports the boundary" or "the rationale field must name the signal used". Generic labels like "business domain" alone are not sufficient rationale.

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 4 — AC4: corpus-state.md written with three required fields

**Steps:**
1. Open `.github/skills/modernisation-decompose/SKILL.md`.
2. Find the "State update" or completion section describing what gets written to `corpus-state.md`.
3. Check that the instructions list all three fields: (a) module coverage percentage, (b) `[VERIFIED]:[UNCERTAIN]` rule rating ratio, (c) `lastRunAt` timestamp.

**Expected outcome:** All three fields are explicitly named in the write instructions. The instructions describe creating the file if it doesn't exist and updating it if it does.

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 5 — AC5: candidate-features.md entry contains all five required fields

**Steps:**
1. Open `.github/skills/modernisation-decompose/SKILL.md`.
2. Find the section describing the `candidate-features.md` output format.
3. Check that all five fields are described: (a) proposed feature slug, (b) one-sentence problem statement, (c) list of rule IDs assigned to the feature, (d) proposed persona, (e) pre-populated MVP scope paragraph.

**Expected outcome:** All five fields are named in the format description. The instructions state that entries should be ready to paste into a `/discovery` run without manual augmentation.

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 6 — AC6: Low-signal escalation prompt offers three specific options

**Steps:**
1. Open `.github/skills/modernisation-decompose/SKILL.md`.
2. Find the section that handles low-signal codebase conditions (e.g. "Low-signal detection" or similar — triggered when Maven module structure is missing, circular dependencies, or no `@Service` annotations).
3. Check that the escalation prompt: (a) names the specific missing signals, (b) offers exactly three numbered options to the operator.

**Expected outcome:** The escalation section names the missing signals specifically (e.g. "No Maven module structure found"). Three options are present: (1) proceed with package-level grouping as fallback, (2) operator provides module boundary information manually, (3) abort and record system as low-signal in `corpus-state.md`. The options are distinct — not variations of the same action.

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 7 — AC7: umbrellaMetric field and traceability note in candidate-features.md output

**Steps:**
1. Open `.github/skills/modernisation-decompose/SKILL.md`.
2. Find the output format section for `candidate-features.md`.
3. Check that every feature entry is instructed to include: (a) a field or marker named `umbrellaMetric` (with value `true`), (b) a note stating "This feature was produced by /modernisation-decompose. All stories must reference the umbrella Tier-3 parity metric defined at [artefacts/[system-slug]/corpus-state.md]" or equivalent.

**Expected outcome:** Both elements are present in the output format instructions. The `umbrellaMetric` marker format is unambiguous — the reader can understand how it appears in the actual candidate-features.md file (e.g. as a YAML field, a markdown table column, or a clearly labelled paragraph).

**Pass / Fail:** _____ | Notes: _____

---

## Summary

| Scenario | AC | Pass / Fail | Notes |
|----------|-----|-------------|-------|
| 1 — npm test passes | AC1 | | |
| 2 — Entry condition blocks gracefully | AC2 | | |
| 3 — Java boundary signals as rationale | AC3 | | |
| 4 — corpus-state.md three fields | AC4 | | |
| 5 — candidate-features.md five fields | AC5 | | |
| 6 — Low-signal escalation three options | AC6 | | |
| 7 — umbrellaMetric field and note | AC7 | | |

**Overall: PASS / FAIL** (circle one) | **Verified by:** _________ | **Date:** _________
