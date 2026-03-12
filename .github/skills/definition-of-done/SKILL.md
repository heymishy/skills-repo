---
name: definition-of-done
description: >
  Post-merge validation. Checks that the merged PR actually satisfies the ACs and test plan 
  for the story. Produces a DoD artefact recording AC coverage, any deviations, and 
  metric signal status. Use when a PR has been merged and someone says "mark as done",
  "definition of done", "validate the story", or "check what shipped".
  Requires the merged PR, story artefact, and test plan artefact.
triggers:
  - "mark as done"
  - "definition of done"
  - "validate the story"
  - "check what shipped"
  - "post-merge check"
  - after PR merge
---

# Definition of Done Skill

## Entry condition check

**Before proceeding**, verify:

1. PR has been merged (not just opened or approved)
2. Story artefact exists
3. Test plan artefact exists
4. DoR artefact exists (confirms the story went through the full pipeline)

If any condition is not met, output:

> ❌ **Entry condition not met**  
> [Specific issue: e.g. "PR is not yet merged — run this skill after merge, not before."]

---

## Process

### 1. AC coverage check

For each AC in the story, verify that the merged code satisfies it.
Where possible, reference specific test results or observable behaviour.

| AC | Satisfied? | Evidence | Deviation |
|----|-----------|----------|-----------|
| AC1 | ✅ / ⚠️ / ❌ | [Test name / observable behaviour] | [If any] |

A deviation is anything where the implemented behaviour differs from the AC —
even if the difference seems minor. Deviations are not necessarily failures,
but they must be recorded.

### 2. Out-of-scope check

Verify the merged PR did not implement anything in the story's out-of-scope section
or the epic's out-of-scope section. If it did, flag it:

> ⚠️ **SCOPE DEVIATION:** The merged PR includes [behaviour] which was explicitly 
> out of scope. This is recorded for the /trace skill and may need a follow-up story 
> to address properly.

### 3. Test plan check

Confirm the tests from the test plan were implemented and are passing in CI.
If any tests were not implemented, record the gap.

### 4. NFR check

For each NFR from the story, confirm it was addressed.
Reference specific evidence (performance test results, accessibility scan output, 
audit log entry, security review outcome).

### 5. Metric signal status

For each metric in the benefit-metric artefact that this story was expected to move:
- Is a baseline measurement available?
- Is there any early signal from the implementation?
- When will the first real measurement be possible?

This section does not claim success — it records what measurement is now possible
and when the metric owner should check.

---

## Output

Save to `.github/artefacts/[feature]/dod/[story-slug]-dod.md`.

```markdown
# Definition of Done: [Story Title]

**PR:** [Link]
**Merged:** [Date]
**Story:** [Link]
**Test plan:** [Link]

## AC Coverage
[Table from process step 1]

## Scope Deviations
[None / list of deviations]

## Test Plan Coverage
[Tests implemented: n/n | Tests not implemented: list]

## NFR Status
[Per NFR: addressed / not addressed + evidence]

## Metric Signal
[Per metric: baseline available / measurement timeline]

## Outcome
[COMPLETE — all ACs satisfied, no scope deviations]
[COMPLETE WITH DEVIATIONS — ACs satisfied, deviations recorded for trace]  
[INCOMPLETE — [n] ACs not satisfied — follow-up action required]
```

---

## What this skill does NOT do

- Does not approve or merge PRs — that is a human action
- Does not measure metrics — it records when measurement becomes possible
- Does not create follow-up stories — it flags what needs follow-up for humans to action
