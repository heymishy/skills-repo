# AC Verification Script — sri.2: Expand DoD entry condition message with actionable guidance

**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.2.md
**Date:** 2026-06-25
**For use:** Pre-code sign-off · Post-merge smoke test · Delivery review

---

## Setup

This story changes the entry condition block in `skills/definition-of-done/SKILL.md`. No server required.

**Automated test command:**
```
node tests/check-sri2-dod-entry-condition.js
```
Expected output: 5 tests pass.

For manual verification, open `skills/definition-of-done/SKILL.md` in any text editor and locate the `## Entry condition check` section near the top of the file.

---

## Scenario 1 — Message tells the operator how to check whether the PR is merged (AC1)

**What to check:** In the entry condition block (the section under `## Entry condition check`), find the error message shown when the skill is run before the PR is merged.

Confirm the message includes practical guidance on how to check merge status. For example:
- A `gh pr view` command the operator can run
- A reference to checking the PR on GitHub
- A direct link to the PR or instructions to open it

**Broken behaviour:** The message only says "PR is not yet merged" with nothing else — the operator has no idea how to check or what to do.

---

## Scenario 2 — Message tells the operator what steps to take to reach merge (AC2)

**What to check:** In the same entry condition block, confirm the message describes the sequence of actions needed to progress the PR to merge. It should include steps along the lines of:
1. Mark the PR as ready for review (if it is a draft)
2. Obtain approval from a reviewer
3. Merge the PR
4. Re-run `/definition-of-done`

The sequence does not need to be numbered, but all four steps (or equivalent) should be described.

**Broken behaviour:** The message stops after "PR is not yet merged" — no action guidance.

---

## Scenario 3 — Message explains why the gate exists (AC3)

**What to check:** In the entry condition block, confirm there is a brief explanation of *why* `/definition-of-done` runs after merge, not before. It should communicate something like: "DoD validates what has actually shipped — not what is proposed in an open PR."

The explanation should be one or two sentences — not a full paragraph.

**Broken behaviour:** The gate fires with no explanation, leaving the operator wondering why running DoD on an open PR is rejected.

---

## Scenario 4 — All three elements appear in a single readable block (AC4)

**What to check:** Confirm that the PR status guidance (Scenario 1), the next-steps sequence (Scenario 2), and the gate rationale (Scenario 3) all appear together within the entry condition block — not split across separate sections of the file or shown in separate sequential prompts.

An operator reading the error once should see all three pieces of information without scrolling to another section.

**Broken behaviour:** The guidance, steps, or rationale are in different sections, or the skill asks multiple separate questions to deliver the information.

---

## Scenario 5 — Normal DoD flow is unchanged after the PR is merged (AC5)

**What to check:** Run the automated test — the regression guard (T5) will confirm the post-merge flow sections are intact.

Additionally, open the SKILL.md and scroll past the entry condition block to the first step (Step 1). Confirm the standard DoD steps — AC coverage, test plan coverage, NFR check, and metric signal — are all still present and unchanged.

**Broken behaviour:** The post-merge flow is missing sections or has been accidentally truncated by the edit.

---

## Automated check (post-merge)

```
node tests/check-sri2-dod-entry-condition.js
```

Expected: 5 tests pass. T1–T4 currently fail; T5 currently passes. After the merge, all 5 should pass.
