## Story: Filter Stage Visibility by Role
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator (any role)**,
I want **to see only the pipeline stages relevant to my role by default**,
So that **I'm not overwhelmed by stages that aren't mine to act on**.
## Benefit Linkage
Role-filtered visibility — completing this story delivers the core role-scoping feature.
## Architecture Constraints
role_definitions table defines stageVisibility per role (e.g. "product" role sees ["discovery", "benefit-metric", "definition"]); client-side filtering via JavaScript (no backend enforcement in MVP); ADR-027 (live SaaS mechanism is ordinary app code, not a SKILL.md skill).
## Dependencies
ep1-s3 (feature must have role assignments for collaborators); requires role_definitions table with stageVisibility mapping
## Acceptance Criteria
**AC1:** Given Susan (engineer) loads Feature A1, When the stage list renders, Then Susan sees by default only "test-plan", "review", "definition-of-ready", "coding" (her role's stageVisibility).

**AC2:** Given Hamish (product) loads the same Feature A1, When the stage list renders, Then Hamish sees by default only "discovery", "benefit-metric", "definition" (his role's stageVisibility) — a different default view from Susan's, from the same underlying data.

**AC3:** Given either collaborator's filtered default view, When they click "Show all stages", Then every stage in the pipeline becomes visible, and no previously-visible stage is hidden as a result of toggling.
## Out of Scope
- Hiding stages (only filtering the default view)
- Preventing a user from viewing all stages if they click "show all"
- Enforcing role-based access at the backend (client-side filtering only)
## NFRs
- Role-filtered default view is applied on page load (no separate click needed)
- "Show all stages" toggle persists for the user's current session (localStorage OK; cross-session persistence deferred)
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
