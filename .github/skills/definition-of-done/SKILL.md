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
> [Specific issue - e.g. "PR is not yet merged. Run this after merge, not before."]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 - Confirm the story and PR

State what was found:

> **Story:** [story title]
> **PR:** [ref] - merged [date]
> **ACs to check:** [n]
> **Tests from plan:** [n]
>
> Running definition-of-done check. Ready?
> Reply: yes - or specify a different story/PR

---

## Step 2 - AC coverage check

For each AC in the story, verify the merged code satisfies it.
Reference specific test results or observable behaviour where possible.

Use the AC coverage table format from `templates/definition-of-done.md`.

**A deviation is any difference between implemented behaviour and the AC** -
even if minor. Deviations are not failures, but they must be recorded.

If any AC is ❌:

> ❌ **AC[n] not satisfied: [description]**
>
> What do you want to do?
> 1. Create a follow-up story to address it
> 2. Accept the gap and record it in /decisions as RISK-ACCEPT
> 3. Reopen the PR - this should have been caught before merge
>
> Reply: 1, 2, or 3

---

## Step 3 - Out-of-scope check

Verify the merged PR did not implement anything in the story's or epic's
out-of-scope section.

If a violation is found:

> ⚠️ **Scope deviation: [behaviour] was explicitly out of scope.**
>
> This is recorded for /trace and may need a follow-up story.
> Acknowledge and continue?
> Reply: yes - I'll note it / no - this needs to be reverted

---

## Step 4 - Test plan coverage

Before running any verification commands, read `.github/context.yml` and check the `tools` block for the configured test runner. Use that runner in all test commands — never assume `npx jest` or any other framework.

Confirm the tests from the test plan were implemented and are passing in CI.

**Coverage gap audit:** If the test plan contains any `CSS-layout-dependent` gaps:
- Were they RISK-ACCEPTed in /decisions before coding started? (check `decisions.md`)
- Was the manual verification scenario actually executed during pre-code sign-off or post-merge smoke test?
- Record both answers in the DoD artefact - this is the audit trail for layout bugs that ship post-merge.
- If a RISK-ACCEPT was not recorded and a layout bug shipped → flag as deviation (not a failure, but must be recorded).

If any tests were not implemented:

> ⚠️ **Test gap: [test name] was not implemented.**
> Risk: [which AC is now less covered]
>
> Accept this gap?
> 1. Yes - log in /decisions as RISK-ACCEPT
> 2. No - create a follow-up to implement it
>
> Reply: 1 or 2

---

## Step 5 - NFR check

Check the feature-level NFR profile at `artefacts/[feature]/nfr-profile.md` (if it exists).
If it does not exist, fall back to individual story NFR fields.

For each NFR in the profile (or story), confirm it was addressed.

**NFR categories to check:**
- Performance targets — evidence of measurement
- Security requirements — code review confirmation or automated scan results
- Data residency — deployment configuration reviewed
- Availability — no SLA degradation from this change
- Compliance — named clause obligations met; sign-off documented if required

If any NFR has no evidence:

> ⚠️ **NFR not evidenced: [NFR description]**
> What evidence exists that this was addressed?
>
> Reply: describe evidence — or "not addressed, I'll log it"

Update the NFR profile's status if all NFRs in the profile are verified:
- Set `Status: Active → Verified at [date]` in `nfr-profile.md`

If no NFR profile exists and no story-level NFRs:
> ✅ **NFR check: No NFRs defined** — confirmed not applicable at [date]

---

## Step 6 - Metric signal

For each metric in the feature's `metrics` array whose `contributingStories` list includes this story's slug:

1. Ask: **Has a signal been measurable since this story merged?** (yes / not yet)
2. If yes - ask for the observed result and date measured.
3. Determine signal status: `on-track` / `at-risk` / `off-track` (see definitions below).

> **[Metric name]**
> Signal: [on-track / at-risk / off-track / not-yet-measured]
> Evidence: [observed result, or "Measurement not yet possible - [reason]"]
> Date measured: [date, or null]

**Signal definitions:**
- `on-track` - current result is within acceptable range of the target
- `at-risk` - partial progress but below minimum validation signal
- `off-track` - result is clearly not trending toward the target
- `not-yet-measured` - measurement is not yet possible (e.g. no real sessions run yet)

This section does not claim success - it records what is now observable.

**State write for metrics:** After capturing signals, update the feature's `metrics` array in pipeline-state.json:
- Set `metrics[x].signal` to the determined value
- Set `metrics[x].evidence` to the evidence string (or `null` if not yet measured)
- Set `metrics[x].lastMeasured` to today's date (ISO 8601) if a measurement was taken, else leave `null`

---

## Output

Conforms to `.github/templates/definition-of-done.md`.
Save to `artefacts/[feature]/dod/[story-slug]-dod.md`.

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
> Reply: yes - or there are more stories to process first

---

## What this skill does NOT do

- Does not approve or merge PRs - that is a human action
- Does not claim metric success without evidence - records what is now observable
- Does not create follow-up stories - flags what needs follow-up for humans to action

---

## State update - mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when the DoD artefact is saved:

- Set story `stage: "definition-of-done"`, `dodStatus: "complete"`, `prStatus: "merged"`, `health: "green"`, `updatedAt: [now]`
- If all ACs are covered: set `releaseReady: true`
- If deviations or gaps exist: set `releaseReady: false`, `health: "amber"`, note deviation in `blocker`
- Update the epic `status`: if all stories in the epic are `dodStatus: "complete"`, set epic `status: "complete"`
- **Layout gap audit (from Step 4):** Set `layoutGapsAtMerge: true` if the test plan had any `CSS-layout-dependent` gaps at merge time; set `layoutGapsRiskAccepted: true` if a RISK-ACCEPT was recorded in /decisions before coding started
- **Metrics (from Step 6):** For each metric that was assessed, update the feature's `metrics` array:
  - `metrics[x].signal` ← determined signal value (`"on-track"` / `"at-risk"` / `"off-track"` / `"not-yet-measured"`)
  - `metrics[x].evidence` ← evidence string or `null`
  - `metrics[x].lastMeasured` ← ISO 8601 date string or `null`
- **Guardrails compliance update (from Step 5 — NFR check):** Update the feature-level `guardrails[]` array:
  - For each NFR that was verified in Step 5, update the matching `guardrails[]` entry (by `id`): set `"status": "met"` if verified successfully, `"status": "not-met"` if gaps found, with `"assessedBy": "/definition-of-done"`, `"assessedAt": "[now]"`, `"evidence": "[verification outcome]"`
  - For compliance NFRs with named regulatory clauses: if sign-off is confirmed, set `"status": "met"`; if missing, set `"status": "not-met"` with `"evidence"` noting the gap
  - Merge by `id` — do not remove existing entries from other skills
  - **Schema-valid guardrail values only.** When writing `status`, use only: `met`, `not-met`, `na`, `excepted`, `not-assessed`. Do not use informal synonyms (`pass`, `fail`, `deferred`, `no-breach`, `not-applicable`, `has-finding`). When writing `category`, use only: `mandatory-constraint`, `adr`, `nfr`, `compliance-framework`, `pattern`, `anti-pattern`. Subcategories (`performance`, `security`, `audit`) must be written as `nfr`. These values are validated by `validate-trace.sh --ci` — invalid values cause hard CI failures on agent PRs.
