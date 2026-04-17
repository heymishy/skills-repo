# AC Verification Script: Capture block schema and Markdown template

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.2-capture-block-schema.md
**Technical test plan:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.2-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Pre-code** [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the repository in a file browser or code editor.
2. Navigate to `.github/templates/capture-block.md`.
3. Open the file in a text or Markdown viewer.

**Reset between scenarios:** Not needed — all scenarios are read-only inspections of a committed template file.

---

## Scenarios

---

### Scenario 1: Template file exists and opens as valid Markdown

**Covers:** AC1, AC5

**Steps:**
1. Navigate to `.github/templates/capture-block.md`.
2. Confirm the file exists.
3. Open it in a Markdown preview (VS Code: Ctrl+Shift+V) or read it as plain text.

**Expected outcome:**
> The file opens without errors. It renders as structured Markdown — headings are visible, no raw HTML outside fenced blocks, no broken syntax. There is a top-level heading (e.g. `## Capture Block`) at or near the top.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Template has exactly six metadata fields

**Covers:** AC2

**Steps:**
1. In `capture-block.md`, find the metadata table (usually under a `## Capture Block` or `### Metadata` heading).
2. Count the rows in the metadata table (exclude the header row).

**Expected outcome:**
> The metadata table has exactly six rows, one for each of: `experiment_id`, `model_label`, `cost_tier`, `skill_name`, `story_id`, `run_date`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: List and numeric field types are declared

**Covers:** AC3

**Steps:**
1. In `capture-block.md`, read the template fields or their descriptions.
2. Find `files_referenced`. Check whether its type or placeholder value makes clear it holds a list (e.g. `[file.md, other.md]` or `type: list`).
3. Find `constraints_inferred_count`. Check whether its type or placeholder value makes clear it is a number (e.g. `0` or `type: integer`).

**Expected outcome:**
> `files_referenced` is marked or illustrated as a list. `constraints_inferred_count` is marked or illustrated as a numeric value. Delta calculation is possible: a reviewer can subtract one run's `constraints_inferred_count` from another to track change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Operator review section accepts blank entries

**Covers:** AC4

**Steps:**
1. In `capture-block.md`, find the operator review section (look for `context_score`, `linkage_score`, `notes`, `reviewed_by`).
2. Check whether the template is presented as optional — for example, the fields have blank placeholders (`____` or `""`) rather than required markers.

**Expected outcome:**
> The operator review section exists with all four fields (`context_score`, `linkage_score`, `notes`, `reviewed_by`). The template indicates these are filled by the human after review — it is clear you can leave them blank (the block is still "complete") and fill them in as a deliberate operator action.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Structural metrics section contains all required fields

**Covers:** AC1 (full structural verification)

**Steps:**
1. In `capture-block.md`, find the structural metrics section (look for `turn_count`, `files_referenced`, `constraints_inferred_count`).
2. Confirm `intermediates` sub-section is present (look for a sub-entry within the section, or a nested structure).
3. Confirm `fidelity_self_report` and `backward_references` have their own sections or headings.
4. In `backward_references`, confirm both `target` and `accurate` fields are present.

**Expected outcome:**
> All four structural sections are present: Metadata (6 fields), Structural metrics (`turn_count`, `files_referenced`, `constraints_inferred_count`, `intermediates`), Fidelity self-report, and Backward references (`target` + `accurate`). Every field described in the story ACs is accounted for.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
