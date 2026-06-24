# AC Verification Script: inf.1 — Write `infra-definition` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.1.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.1-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Locate the file `.github/skills/infra-definition/SKILL.md` in the repo
2. Open it in a text editor

**Reset between scenarios:** Not required — all scenarios read the same file

---

## Scenarios

---

### Scenario 1: SKILL.md exists and contains all five mandatory sections

**Covers:** AC1

**Steps:**
1. Open `.github/skills/infra-definition/SKILL.md`
2. Check that these five section headings (or labelled fields) exist somewhere in the file:
   - Change description (what the change does)
   - Blast-radius statement (what could break)
   - Rollback plan (how to undo the change)
   - Tier-applicability table (which environments are affected)
   - Plan/preview attachment (where to paste the tool output)

**Expected outcome:**
> All five sections are present. Each has a clear heading or label. None are missing or combined in a way that would make them ambiguous.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Tier-applicability table covers all four environment tiers

**Covers:** AC2

**Steps:**
1. In the SKILL.md, find the tier-applicability section
2. Check that it mentions all four tiers: local (or local dev), CI (or test/CI), staging, and production
3. Check that there is a column or field for validation status (e.g. "Validated" or "Not yet validated")

**Expected outcome:**
> The table or section lists local, CI, staging, and production as separate rows. A status column is present indicating whether each tier has been validated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Rollback plan requires discrete steps and an estimated time

**Covers:** AC3

**Steps:**
1. Find the rollback plan section in the SKILL.md
2. Check that the template prompts for numbered or bulleted discrete steps (not just a single text block)
3. Check that there is a field or prompt asking for the estimated time to execute the rollback

**Expected outcome:**
> The rollback section asks for at least a step-by-step list and an estimated time-to-execute. There is no version that would allow an operator to fill in a single sentence like "reverse the change" and be considered complete.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: `ops/` prefix is supported as a feature slug

**Covers:** AC4

**Steps:**
1. Read the SKILL.md guidance for what to use as the feature slug when running `/infra-definition`
2. Check whether `ops/YYYY-MM-DD-[change-slug]` is described as a valid option for standalone operational changes

**Expected outcome:**
> The skill either explicitly describes the `ops/` prefix as a valid standalone-ops slug, or uses a generic `[feature-slug]` placeholder that clearly encompasses it. There is no restriction to the standard `YYYY-MM-DD-[slug]` format only.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: No hardcoded tool names appear as requirements

**Covers:** AC5

**Steps:**
1. Search the SKILL.md for: Terraform, Pulumi, CDK, Ansible, CloudFormation
2. For each occurrence found, check whether it appears as:
   - A **required tool** ("you must use Terraform" or "run terraform plan") — this would be a FAIL
   - An **example** in a non-exhaustive list ("e.g. Terraform, Pulumi, CDK or your tool of choice") — this is a PASS

**Expected outcome:**
> None of the tool names appear as required tools. Any occurrences are in illustrative example lists that make clear the operator uses their own tooling. The skill refers to the operator's plan output as "your plan/preview output" or similar tool-agnostic language.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Plan/preview attachment section warns against credentials

**Covers:** NFR-SEC

**Steps:**
1. Find the plan/preview attachment section in the SKILL.md
2. Check that it contains a warning against pasting credentials, tokens, passwords, or API keys into the attachment field

**Expected outcome:**
> A visible warning is present in or near the plan/preview attachment section. The warning explicitly names one or more of: credentials, tokens, passwords, secrets, connection strings.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — five mandatory sections present | | |
| Scenario 2 — tier table covers all four tiers | | |
| Scenario 3 — rollback requires discrete steps and time | | |
| Scenario 4 — ops/ prefix supported | | |
| Scenario 5 — no hardcoded tool names as requirements | | |
| Scenario 6 — credentials warning in attachment section | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
