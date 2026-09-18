# AC Verification Script: `design.system` Context Tag Triggers a Real DoR Hard Block

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s5.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s5-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story is about governance tooling, not a page you visit — verification here means running `/definition-of-ready` against a couple of throwaway test stories, not clicking around a UI.
2. Have access to run `/definition-of-ready` in a session.

**Reset between scenarios:** No reset needed — each scenario uses its own separate test story fixture.

---

## Scenarios

---

### Scenario 1: The design system is referenced, not copied into the skill files

**Covers:** AC1

**Steps:**
1. Open `context.yml`.
2. Look for a reference to `DESIGN.md`.

**Expected outcome:**
> `context.yml` points to `DESIGN.md` by its file path. You do NOT find the actual token values, color hex codes, or design rules copy-pasted into `context.yml` or any SKILL.md file — just a reference to where the real file lives.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A story that ignores the design system genuinely gets blocked

**Covers:** AC2, AC3

**Steps:**
1. Create (or ask for) a deliberately non-compliant test story — one that's tagged as design-system-governed but uses a hardcoded color not in the approved palette (e.g. some random hex code, not one of `DESIGN.md`'s listed colors).
2. Run `/definition-of-ready` against it.

**Expected outcome:**
> `/definition-of-ready` blocks — you see an explicit failure message naming which file has the problem color and what that color value is. Sign-off does not go through.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A story that follows the design system correctly is not blocked

**Covers:** AC4

**Steps:**
1. Create (or ask for) a test story tagged the same way, but using only colors from `DESIGN.md`'s actual token list.
2. Run `/definition-of-ready` against it.

**Expected outcome:**
> `/definition-of-ready` does NOT block on the design-system check — it passes cleanly, the same way it would if this new check didn't exist at all.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Stories that aren't tagged for design-system compliance are unaffected

**Covers:** AC5

**Steps:**
1. Run `/definition-of-ready` against a normal story that is NOT tagged as design-system-governed (most stories in this repo).
2. Confirm all the usual DoR checks still run as expected.

**Expected outcome:**
> The new design-system check doesn't even run for this story — it's skipped entirely, silently, with no effect. Every other existing DoR check behaves exactly as it always has.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (Reference, not embedded) | | |
| Scenario 2 (Noncompliant story blocked) | | |
| Scenario 3 (Compliant story not blocked) | | |
| Scenario 4 (Untagged stories unaffected) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
