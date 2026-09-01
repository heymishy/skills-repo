## Story: Stage-Based Skill Routing and Navigation
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Discovery reference:** artefacts/new-feature-af17f555/discovery.md
**Benefit-metric reference:** artefacts/new-feature-af17f555/benefit-metric.md
## User Story
As a **Platform owner**,
So that [observable outcome].
## Benefit Linkage
[Not specified by the definition session]
## Architecture Constraints
Stage field from pipeline-state.json, routing logic pure and testable, backward navigation triggers materiality check (existing res-s1-s4 pattern), no new npm dependencies
## Dependencies
ep1-s3
## Acceptance Criteria
**So that** I don't have to choose which skill to run next, the web UI automatically routes me to the appropriate next skill based on the feature's current stage and completed stages.

**Given** a feature at a known stage in pipeline-state.json with a journey record showing completedStages,
**When** I select the feature and the session starts,
**Then** the web UI determines next appropriate skill using routing table (ideation→discovery, discovery→spike or benefit-metric, etc.) and lands session on that skill. Stage selector menu is visible; backward navigation available to any earlier stage; forward navigation only for later stages.
## Out of Scope
- Automatic regeneration of downstream artefacts if earlier stage revised
- Materiality check display or operator approval
- Custom skill ordering or squad-specific routing overrides
- Multi-branch skill paths based on feature properties
## NFRs
Routing table deterministic and covers all valid transitions; backward navigation keyboard-accessible (arrow keys, Enter); no UI blocks operator continuation if prior stage missing; stage selector updates on every skill transition
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
