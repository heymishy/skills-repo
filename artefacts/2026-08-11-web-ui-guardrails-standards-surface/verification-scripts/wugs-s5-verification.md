# AC Verification Script: Provide a create/edit form for a guardrail or standard

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s5-create-edit-form.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s5-create-edit-form-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a product's guardrails/standards view with at least one existing entry visible.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: Add and Edit actions are visible

**Covers:** AC1

**Steps:**
1. Look at the guardrails/standards view.

**Expected outcome:**
> You see an "Add" button/link, and next to each existing entry, an "Edit" button/link.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Editing an entry shows its real current text

**Covers:** AC2

**Steps:**
1. Click "Edit" on an existing entry.

**Expected outcome:**
> The form opens with the entry's actual current content already typed into the text box — not blank, not placeholder text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Submitting a blank form shows an error, doesn't silently succeed

**Covers:** AC3

**Steps:**
1. Click "Add" to open a new entry form.
2. Leave the content box empty (or type only spaces).
3. Submit.

**Expected outcome:**
> You see a clear error message. Nothing gets created — going back to the view, there's no new entry.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A valid submission carries the right content to the right target

**Covers:** AC4

**Steps:**
1. Click "Add" next to "Standards" to create a new standard, or "Edit" on an existing entry.
2. Type real content (and, if adding a new standard, a target file path — e.g. `standards/your-discipline-name`).
3. Submit.

**Expected outcome:**
> The form submits without a client-side-only validation error, and the exact content and target path you entered are what get sent onward — nothing silently transformed, dropped, or misdirected to the wrong file/repo.
>
> **Known limitation at this story's stage:** the actual write (branch/PR creation) is not yet wired to a real backend — that lands with a later story (`wugs-s6`). Until then, submitting will not yet produce a real PR; this scenario verifies the form's own submission behaviour (content/path correctness, no client-only validation gap) up to that handoff point, not the end-to-end write.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
