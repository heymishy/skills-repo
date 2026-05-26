## Story: Expand DoD entry condition message with actionable guidance

**Epic reference:** artefacts/2026-05-18-skill-robustness-improvements/epics/sri-phase1-inner-loop-reliability.md
**Discovery reference:** artefacts/2026-05-18-skill-robustness-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-05-18-skill-robustness-improvements/benefit-metric.md

## User Story

As an **operator running `/definition-of-done` for the first time or as part of an unfamiliar pipeline**,
I want **the pre-merge gate message to tell me exactly what to do next**,
So that **I can progress to merge without consulting external documentation or asking for help**.

## Benefit Linkage

**Metric moved:** M2 — DoD entry condition actionability (structural completeness: 3 of 3 elements present)
**How:** Rewriting the entry condition block to include (a) how to check PR merge status, (b) the specific next steps to reach merge, and (c) a brief explanation of why this gate exists raises the element count from 0 of 3 to 3 of 3 — the minimum validation signal is that a first-time operator reads the message and takes the correct next action without a follow-up question.

## Architecture Constraints

- Platform change policy: this change is to `.github/skills/definition-of-done/SKILL.md` — a governed file requiring PR with platform team review before merge.
- Text-only change — no logic, no schema, no scripts. The observable behaviour of the DoD skill (when it fires the gate and when it proceeds) is unchanged.

## Dependencies

- **Upstream:** None — independent of sri.1 and sri.3.
- **Downstream:** None — this story does not block other stories.

## Acceptance Criteria

**AC1:** Given `/definition-of-done` is invoked before the PR is merged, When the entry condition fires, Then the message includes guidance on how to check whether the PR is merged (e.g. link to the PR, or a `gh pr view` command to run).

**AC2:** Given `/definition-of-done` is invoked before the PR is merged, When the entry condition fires, Then the message includes the sequence of next steps required to reach merge: mark PR ready for review, obtain approval, merge, then re-run `/definition-of-done`.

**AC3:** Given `/definition-of-done` is invoked before the PR is merged, When the entry condition fires, Then the message includes a brief explanation of why the gate exists — specifically that DoD validates what has actually shipped, not what is proposed in an open PR.

**AC4:** Given `/definition-of-done` is invoked before the PR is merged, When the entry condition fires, Then all three elements (AC1, AC2, AC3) appear in a single readable message block — not spread across separate prompts or follow-up questions.

**AC5:** Given `/definition-of-done` is invoked after the PR is merged, When the entry condition check passes, Then no part of the new guidance message is shown — the skill proceeds normally with no change to the post-merge flow.

## Out of Scope

- Adding automated PR merge status detection (the skill does not call the GitHub API — operator confirms merge manually; this story is a text change only).
- Changing the logic that determines when the entry condition fires — only the message content changes.
- Personalising the message based on operator experience level.

## NFRs

- **Performance:** None identified — text change only.
- **Security:** None identified — no data is read or written by this change.
- **Audit:** None identified.
- **Accessibility:** None identified.

## Complexity Rating

**Rating:** 1 — Text-only change to a single SKILL.md file. Scope is fully specified: three named elements must appear in the entry condition block. No implementation ambiguity.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
