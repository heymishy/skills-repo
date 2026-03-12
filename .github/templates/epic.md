# Epic Template

<!-- 
  USAGE: This is the canonical format for all epics produced by the /definition skill.
  Skills reference this file. Do not embed epic structure inside skill files.
  To evolve the format: update this file, open a PR, tag BA lead + engineering lead for review.
  Git history on this file is the audit trail of how your standards evolved and why.
-->

## Epic: [Title]

<!-- Title should be outcome-oriented, not feature-oriented.
     Good: "Engineers can onboard to a new repo without a human guide"
     Bad:  "Build onboarding documentation feature" -->

**Discovery reference:** [Link to approved discovery artefact]
**Benefit-metric reference:** [Link to benefit-metric artefact]
**Slicing strategy:** [Vertical slice / Walking skeleton / User journey / Risk-first]

<!-- Slicing strategy must be recorded explicitly. It frames why stories are shaped 
     the way they are and helps reviewers evaluate decomposition quality. -->

## Goal

One paragraph. What does the world look like when this epic is complete? 
Written in terms of user or system behaviour, not feature delivery.

## Out of Scope

<!-- MANDATORY. "N/A" is not acceptable. 
     Explicitly naming what this epic does NOT cover prevents scope creep 
     and gives the /review skill something concrete to check stories against.
     Minimum 2 items. -->

- [Thing that might seem in scope but is explicitly excluded, and why]
- [Adjacent capability that will be addressed in a separate epic]

## Benefit Metrics Addressed

<!-- List each metric from the benefit-metric artefact that stories in this epic 
     are expected to move. At least one metric must be listed.
     If no metric is addressed, this epic should not be in MVP scope. -->

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| [metric name] | [baseline value] | [target value] | [mechanism] |

## Stories in This Epic

<!-- Populated by the /definition skill. Each story links back to this epic. -->

- [ ] [Story title] — [Story Issue link]
- [ ] [Story title] — [Story Issue link]

## Human Oversight Level

<!-- Set at epic level. Applies to all stories unless a story overrides it.
     Low: coding agent can proceed without checkpoints
     Medium: coding agent should pause for human review at PR
     High: coding agent should not proceed autonomously — human implements -->

**Oversight:** [Low / Medium / High]
**Rationale:** [Why this level — e.g. touches PCI scope, customer-facing, experimental]

## Complexity Rating

**Rating:** [1 / 2 / 3]

<!-- 1 = Well understood, low ambiguity, clear path
     2 = Some ambiguity, known unknowns, may need spike
     3 = High ambiguity, unknown unknowns, consider discovery spike first -->

## Scope Stability

**Stability:** [Stable / Unstable]

<!-- Stable: scope is unlikely to change during implementation
     Unstable: requirements may shift — flag for more frequent check-ins -->
