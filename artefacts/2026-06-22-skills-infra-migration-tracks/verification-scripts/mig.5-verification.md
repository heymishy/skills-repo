# AC Verification Script: mig.5 — Write `staging-data-policy` template with three named options and declared-choice field

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.5.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.5-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/templates/staging-data-policy.md` in a text editor

---

## Scenarios

---

### Scenario 1: Template contains exactly three named options

**Covers:** AC1

**Steps:**
1. Read `.github/templates/staging-data-policy.md`
2. Identify the three named options:
   - (a) synthetic generated data
   - (b) anonymised snapshot via named tool/process
   - (c) non-PII production subset
3. Confirm all three are present, clearly labeled, and distinct

**Expected outcome:**
> Exactly three options are listed. Each option has a distinct label matching the canonical names in the story. No extra options, no missing options.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: `Declared choice` field requires non-blank selection

**Covers:** AC2

**Steps:**
1. Find the "Declared choice" field (or equivalent) in the template
2. Check that the field instructions state the operator must select exactly one of the three named options
3. Check that the instructions explicitly prohibit leaving the field blank or writing "TBD"

**Expected outcome:**
> The Declared choice field exists. Instructions state the operator must select one of the three options. "TBD" or blank is explicitly disallowed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Tool/process free-form field accepts description

**Covers:** AC4

**Steps:**
1. Find the tool/process field in the template
2. Confirm it accepts a free-form text description (e.g. "anonymised snapshot via pg_dump + scrub script at scripts/anonymise.sh")
3. Confirm it is adjacent to or within the anonymised-snapshot option (or applicable to all options)

**Expected outcome:**
> A free-form tool/process field exists. It accepts any text description of the specific implementation. No constraint to a particular tool name.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Template warns against credentials in tool/process field

**Covers:** Security NFR

**Steps:**
1. Read the instructions around the tool/process field
2. Check for an explicit warning against committing production credentials or connection strings

**Expected outcome:**
> A credentials/connection-string warning is present near the tool/process field. The language is explicit — not implied.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — three named options present | | |
| Scenario 2 — Declared choice field, TBD prohibited | | |
| Scenario 3 — free-form tool/process field | | |
| Scenario 4 — credentials warning present | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
