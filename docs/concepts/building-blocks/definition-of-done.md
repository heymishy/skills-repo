# Definition of Done

## What it is

The Definition of Done (DoD) is the post-merge confirmation that a delivered story satisfies its acceptance criteria (ACs) as observed in the running system or the review artefacts. The `/definition-of-done` skill runs after a PR merges and produces a DoD artefact recording AC coverage, any deviations, and the metric signal status.

The DoD is a human judgment call, made with evidence: the merged PR, the test results, the trace entries, and the assurance gate verdict. The platform automates verification; it does not automate the DoD judgment itself.

## Why it exists

A merged PR is not the same as a delivered story. Merge means the code is in the repository; Done means the code does what was specified. Without a structured DoD step, teams skip this distinction — features are counted as delivered when they are merged, not when they are confirmed to work.

The DoD step also closes the feedback loop. The DoD artefact records what was delivered, any deviations from the ACs, and whether the benefit metrics were moved. This is the input to `/improve` and to future estimates.

## How it works

The `/definition-of-done` skill is run by the operator after a PR merges. It:

1. Reads the story's ACs from the DoR artefact
2. Reviews the merged implementation against each AC
3. Records which ACs were met, which had deviations, and which were not verified
4. Checks whether the story's benefit metric signal was triggered
5. Writes the DoD artefact to `artefacts/[feature-slug]/dod/[story-slug]-dod.md`
6. Updates `pipeline-state.json` with `dodStatus: "confirmed"` and the confirmation timestamp

The DoD artefact is the final evidence record for the story. It is read by `/trace` (for the chain health report) and by `/improve` (for pattern extraction).

## What you do with it

Run `/definition-of-done` promptly after each PR merges — ideally in the same session. The longer you wait, the colder the context.

Work through each AC. For ACs that can be verified from the PR (tests passing, code review, diff), verify them from the artefacts. For ACs that require live environment observation (end-to-end behaviour, performance), note what you observed and when.

If an AC was not met or was met only partially, record the deviation rather than glossing over it. Deviations are useful inputs to the next story's definition and to `/improve`.

## How it relates to

- [Definition of Ready](definition-of-ready.md) — the DoD confirms the story delivered what the DoR specified
- [Governance traces](governance-traces.md) — the DoD is the final trace entry in the story chain
- [Benefit metrics](benefit-metrics.md) — the DoD records whether the story's metric signal was triggered
