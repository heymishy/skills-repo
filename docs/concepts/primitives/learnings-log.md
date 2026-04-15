# Learnings Log

## What it is

`workspace/learnings.md` is the structured record of delivery findings, failure patterns, and standards improvements written by `/improve` at feature close. Entries include date, context, evidence, and follow-on action. The learnings log accumulates across all features and surfaces to feed skills and standards improvements.

The learnings log is not a retrospective or a personal note. Entries are evidence-backed findings sourced from the artefact chain — from traces, test results, and DoD artefacts — not from memory or subjective impression.

## Why it exists

Individual delivery loops produce insights that are valuable beyond that single loop. A team that discovers a more effective way to structure acceptance criteria, or that encounters a recurring failure pattern in a particular kind of story, has knowledge that should propagate to the platform and to other teams. Without a structured log, that knowledge stays in the team's memory and disappears when people move on.

The learnings log is the mechanism by which individual delivery experience compounds into platform improvement. It feeds the improvement agent (which reads traces and proposes SKILL.md changes) and the `/improve` skill (which extracts patterns and writes them to standards).

## How it works

`/improve` is run after each PR merges and DoD is confirmed. It reads:

- The completed artefact chain for the feature (discovery through DoD)
- The trace entries
- Any notes raised during delivery (PR comments, DoR blockers, test failures)

It extracts reusable patterns and writes them to `workspace/learnings.md` as structured entries. Each entry has a date, a description of the finding, the evidence it is based on, and a follow-on action (which may be a skill update, a standards addition, or an architecture guardrail change).

## What you do with it

Run `/improve` after every feature loop closes. Review the entries it proposes before accepting them — the skill will ask you to confirm each write. Entries that look correct and actionable should be accepted; entries that are too vague or that describe a one-off should be rejected with a brief explanation.

Over time, the learnings log becomes the institutional memory of the platform in your context. New team members and new sessions can read it to understand what failure patterns have been encountered and resolved, and what delivery practices have been found to work well.

## Further reading

Optional further reading: [Self-improving harness](../principles/self-improving-harness.md) — explains the broader improvement cycle of which the learnings log is a part.
Optional further reading: [Eval suite](eval-suite.md) — the structured regression suite that is populated from learnings.
