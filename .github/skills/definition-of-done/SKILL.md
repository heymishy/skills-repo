---
name: definition-of-done
description: >
  Post-merge validation. Checks that the merged PR satisfies the ACs and test plan
  for the story. Produces a DoD artefact recording AC coverage, any deviations, and
  metric signal status. Use when a PR is merged and someone says "mark as done",
  "definition of done", "validate the story", or "check what shipped".
  Requires merged PR, story artefact, test plan, and DoR artefact.
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

Before asking anything, verify:

1. PR has been merged (not just opened or approved)
2. Story artefact exists
3. Test plan artefact exists
4. DoR artefact exists (confirms story went through the full pipeline)

If not met:

> ❌ **Entry condition not met**
> [Specific issue — e.g. "PR is not yet merged. Run this after merge, not before."]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 — Confirm the story and PR

State what was found:

> **Story:** [story title]
> **PR:** [ref] — merged [date]
> **ACs to check:** [n]
> **Tests from plan:** [n]
>
> Running definition-of-done check. Ready?
> Reply: yes — or specify a different story/PR

---

## Step 2 — AC coverage check

For each AC in the story, verify the merged code satisfies it.
Reference specific test results or observable behaviour where possible.

Present as a table:

| AC | Satisfied? | Evidence | Deviation |
|----|-----------|----------|-----------|
| AC1 | ✅ / ⚠️ / ❌ | [test name / behaviour] | [if any] |

**A deviation is any difference between implemented behaviour and the AC** —
even if minor. Deviations are not failures, but they must be recorded.

If any AC is ❌:

> ❌ **AC[n] not satisfied: [description]**
>
> What do you want to do?
> 1. Create a follow-up story to address it
> 2. Accept the gap and record it in /decisions as RISK-ACCEPT
> 3. Reopen the PR — this should have been caught before merge
>
> Reply: 1, 2, or 3

---

## Step 3 — Out-of-scope check

Verify the merged PR did not implement anything in the story's or epic's
out-of-scope section.

If a violation is found:

> ⚠️ **Scope deviation: [behaviour] was explicitly out of scope.**
>
> This is recorded for /trace and may need a follow-up story.
> Acknowledge and continue?
> Reply: yes — I'll note it / no — this needs to be reverted

---

## Step 4 — Test plan coverage

Confirm the tests from the test plan were implemented and are passing in CI.

If any tests were not implemented:

> ⚠️ **Test gap: [test name] was not implemented.**
> Risk: [which AC is now less covered]
>
> Accept this gap?
> 1. Yes — log in /decisions as RISK-ACCEPT
> 2. No — create a follow-up to implement it
>
> Reply: 1 or 2

---

## Step 5 — NFR check

For each NFR from the story, confirm it was addressed.

If any NFR has no evidence:

> ⚠️ **NFR not evidenced: [NFR description]**
> What evidence exists that this was addressed?
>
> Reply: describe evidence — or "not addressed, I'll log it"

---

## Step 6 — Metric signal

For each metric the story was expected to move:

> **[Metric name]**
> Is a baseline measurement available? [Yes / No]
> When will the first real signal be measurable? [timeline]

This section does not claim success — it records what measurement is now possible.

---

## Output

Conforms to `.github/templates/definition-of-done.md`.
Save to `.github/artefacts/[feature]/dod/[story-slug]-dod.md`.

---

## Completion output

> **Definition of done: [COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE] ✅**
>
> ACs satisfied: [n/n]
> Deviations: [None / n recorded]
> Test gaps: [None / n gaps]
>
> [If COMPLETE WITH DEVIATIONS or INCOMPLETE:]
> Follow-up actions: [list]
>
> Ready to run /release when all stories in this feature are DoD-complete?
> Reply: yes — or there are more stories to process first

---

## What this skill does NOT do

- Does not approve or merge PRs — that is a human action
- Does not measure metrics — records when measurement becomes possible
- Does not create follow-up stories — flags what needs follow-up for humans to action

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when the DoD artefact is saved:

- Set story `stage: "definition-of-done"`, `dodStatus: "complete"`, `prStatus: "merged"`, `health: "green"`, `updatedAt: [now]`
- If all ACs are covered: set `releaseReady: true`
- If deviations or gaps exist: set `releaseReady: false`, `health: "amber"`, note deviation in `blocker`
- Update the epic `status`: if all stories in the epic are `dodStatus: "complete"`, set epic `status: "complete"`
