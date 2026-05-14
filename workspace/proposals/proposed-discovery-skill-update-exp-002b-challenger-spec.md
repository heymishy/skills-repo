# Challenger Spec: proposed-discovery-skill-update-exp-002b

## User Story

As a platform maintainer,
I want to validate the proposed change to the `discovery` skill,
so that any modification to the skill file is backed by evidence and a pre-check result.

## Acceptance Criteria

- **AC1:** The proposed-skill.md has the same heading structure as the current `discovery` SKILL.md.
- **AC2:** The proposed change improves or does not regress the eval harness results.
- **AC3:** No credentials, personal data, or org identifiers are introduced by the change.
- **AC4:** The diff target section (before/after) is structurally valid.

## Done condition

Pre-check is complete when a `proposed-discovery-skill-update-exp-002b-challenger-result.md` file exists in
`workspace/proposals/` with all 5 required fields: `verdict`, `session_summary`,
`traces_produced`, `reviewer` (named human identity), `reviewed_at` (ISO datetime).

## Proposal reference

- **Proposal ID:** proposed-discovery-skill-update-exp-002b
- **Skill slug:** discovery
- **Confidence:** medium
- **Created at:** 2026-05-13
- **Evidence count:** 2

## Proposed diff summary

**Before:** These don't need to be precise metrics yet - that's /benefit-metric's job.

**After:** Three changes: (1) constraint labelling rule in S6, (2) observability minimum rule in S7, (3) /clarify decision gate after S8. See proposal body for full diff.

## Notes

Reviewer must be a named human identity — CI job IDs are not accepted.
See `[FILL IN: team review process]` for how to record a pre-check result.
