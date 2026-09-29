## Story: Skill launcher redesign: show 5 primary CTAs, hide chained skills
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **the skill launcher to show only 5 primary CTAs (discovery, ideate, reverse-engineer, spike, improve) and hide all 27+ chained skills from the primary launcher view while preserving backward-compatible access for advanced operators**,
So that **I can see at a glance which skills are valid entry points to a new pipeline run (not chained stages)**.
## Benefit Linkage
Self-improvement loop accessibility + skill launcher clarity — moves "skill entry points are rationalized and clear" from 0% (all 41+ skills shown equally) to 100% (5 primary CTAs shown; chained skills hidden; advanced access preserved).
## Architecture Constraints
Launcher must preserve backward compatibility (advanced operators can still run any skill directly via `/skills` or direct skill links). No new npm dependencies. The entry-point skill list (discovery, ideate, reverse-engineer, spike, improve) is hardcoded in the launcher; deferred to Phase 5 for config.yml parameterization if this list changes frequently.
## Dependencies
None (standalone launcher redesign; does not depend on signals aggregator or route handler)
## Acceptance Criteria
Given the operator opens the skill launcher in the dashboard,
When the launcher renders,
Then only 5 primary CTA buttons are shown (discovery, ideate, reverse-engineer, spike, improve), all other skills are hidden, and an advanced affordance (e.g., "View all skills" link or a separate "Advanced" section) allows operators to access the full skill list if needed.
## Out of Scope
- Config.yml parameterization of entry-point skill list (hardcoded for MVP; deferred to Phase 5)
- Skill search or filtering within the advanced access path (all skills shown in a flat list or scrollable view)
- Grouping or categorization of chained skills (hidden entirely; no internal organization)
- Sorting or re-ordering of primary CTAs (fixed order: discovery → ideate → reverse-engineer → spike → improve)
## NFRs
- Visual clarity: primary CTAs are immediately prominent; advanced access is discoverable but not distracting
- Accessibility: all CTA buttons are keyboard-navigable and screen-reader accessible
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
