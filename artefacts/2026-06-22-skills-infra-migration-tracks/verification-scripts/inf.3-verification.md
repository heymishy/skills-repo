# AC Verification Script: inf.3 — Write `infra-plan` SKILL.md as the infra track sign-off skill

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.3.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.3-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/skills/infra-plan/SKILL.md` in a text editor

---

## Scenarios

---

### Scenario 1: SKILL.md requires a passing infra-review as its entry condition

**Covers:** AC1

**Steps:**
1. Read the entry conditions section of the SKILL.md (usually at the top)
2. Check that it explicitly requires a passing infra-review artefact (status PASS) before the skill can run

**Expected outcome:**
> The SKILL.md states that a PASS infra-review artefact must exist at the expected path before infra-plan proceeds. Without it, the skill either refuses to start or raises an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Sign-off artefact includes tier execution sequence, checkpoints, and execution checklist

**Covers:** AC2

**Steps:**
1. Find the section of the SKILL.md that describes the artefact it produces
2. Check that the sign-off artefact template includes:
   - A final tier execution sequence (ordered list of which tiers to deploy in)
   - Per-tier validation checkpoints (what to check before moving to the next tier)
   - An operator execution checklist (discrete numbered steps)

**Expected outcome:**
> All three components are in the artefact template. The tier execution sequence is an ordered list. The checkpoints are associated with specific tiers. The execution checklist has discrete steps.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Unacknowledged DESTRUCTIVE finding from infra-review blocks sign-off

**Covers:** AC3

**Steps:**
1. Find the section of the SKILL.md that handles the case where the infra-review had DESTRUCTIVE findings
2. Check that the skill explicitly refuses to produce a sign-off artefact if DESTRUCTIVE findings remain unacknowledged
3. Check that the unacknowledged finding is surfaced (shown to the operator) when the block occurs

**Expected outcome:**
> The SKILL.md states that unacknowledged DESTRUCTIVE findings from infra-review block infra-plan sign-off. The blocked response re-surfaces the finding so the operator knows what needs to be resolved.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Output path follows the audit-trail convention

**Covers:** AC1, Audit NFR

**Steps:**
1. Find where the SKILL.md specifies the output path for the sign-off artefact
2. Confirm the path follows `artefacts/[feature]/infra/[story-id]-infra-plan.md`

**Expected outcome:**
> The documented output path is `artefacts/[feature]/infra/[story-id]-infra-plan.md` — consistent with infra-definition and infra-review conventions. This path is what `infraPlanPath` is set to on the story entry in pipeline-state.json.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — requires passing infra-review as entry | | |
| Scenario 2 — artefact has tier sequence, checkpoints, checklist | | |
| Scenario 3 — unacknowledged DESTRUCTIVE blocks sign-off | | |
| Scenario 4 — output path follows convention | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
