## Story: Skill launcher redesign: show 5 primary CTAs, hide chained skills
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **the skill launcher to show only 5 primary CTAs (discovery, ideate, reverse-engineer, spike, improve) and hide all 27+ chained skills from the primary launcher view while preserving backward-compatible access for advanced operators**,
So that **I can see at a glance which skills are valid entry points to a new pipeline run (not chained stages)**.
## Benefit Linkage
Metric 1 — Skill launcher clarity (benefit-metric.md): moves "skill entry points are rationalized and clear" from 0% (all 41+ skills shown equally) to the target (5 primary CTAs shown; chained skills hidden; advanced access preserved).
## Architecture Constraints
Modify `src/web-ui/skill-launcher.js` (the skill picker component, new file) to conditionally render only 5 primary CTAs and hide chained skills. The entry-point skill list (discovery, ideate, reverse-engineer, spike, improve) is hardcoded in the launcher as a constant (`const PRIMARY_SKILLS = [...]`); parameterization via context.yml is deferred to Phase 5. Preserve backward compatibility: advanced operators must still be able to run any skill directly via a secondary affordance (an "Advanced" or "All skills" link/button) that displays all 41+ skills. No new npm dependencies. The advanced affordance is implemented as a collapsible "Advanced skills" section below the primary CTAs, labeled distinctly and visually de-emphasized (smaller text, lower contrast, or collapsed state by default).
## Dependencies
None (standalone launcher redesign). This story does not depend on ep1-s1 or ep1-s2, though its own benefit is maximized when signals are visible (ep1-s1 + ep1-s2) so operators understand why `/improve` is now a primary CTA.
## Acceptance Criteria

**AC1 — Primary CTAs are rendered and prominently displayed:**
Given the operator opens the skill launcher on the dashboard,
When the launcher component renders,
Then exactly 5 CTA buttons are displayed in the primary section: discovery, ideate, reverse-engineer, spike, improve. Each button includes a label (skill name) and is keyboard-navigable (Tab order, Enter to activate). Primary CTAs occupy the top 50% of the launcher panel and use larger text/button sizing compared to the advanced section.

**AC2 — Chained skills are hidden by default:**
Given the launcher has rendered the primary section,
When the page is loaded and the operator views the launcher,
Then all 27+ chained skills (clarify, estimate, definition, test-plan, review, dor, implementation-plan, tdd, subagent-execution, verify-completion, trace, decisions, benefit-metric, modernisation-decompose, and all others not in the 5 primary list) are NOT displayed in the primary section. No chained skill is visible unless the operator accesses the advanced affordance.

**AC3 — Advanced affordance provides access to all skills:**
Given the primary skills section is displayed,
When the operator clicks the "Advanced skills" affordance (a collapsible section, link, or toggle button),
Then all 41+ skills (including the 5 primary skills and all 27+ chained skills) are displayed in a complete, unfiltered list. The list is readable and navigable (scrollable if needed, or paginated). Advanced access preserves the backward-compatible ability to run any skill directly.

**AC4 — Advanced affordance is visually de-emphasized:**
Given the advanced affordance is present on the page,
When the page is viewed in a standard browser at normal viewport width,
Then the advanced section is visually distinct from primary CTAs: it uses smaller text size, lower contrast, indentation, or a collapsed state (not expanded by default). An operator reading the launcher first sees the 5 primary CTAs; discovering the advanced affordance requires explicit action (clicking, scrolling, or expanding).

**AC5 — Backward compatibility is preserved:**
Given an advanced operator wants to run a chained skill directly (e.g., `/clarify` or `/estimate` as a standalone session, not chained),
When they click the skill in the advanced affordance,
Then a new skill session launches for that skill. The launcher does not block access to any skill; it only rationalizes the default view.

**AC6 — Entry-point skill list is stable:**
Given the story is implemented and tested,
When the launcher renders in a clean state (no localStorage, no session overrides),
Then the 5 primary CTAs are always discovery, ideate, reverse-engineer, spike, improve. The list does not change based on prior sessions, operator history, or feature state. (Parameterization of this list via context.yml is deferred to Phase 5.)
## Out of Scope
- Config.yml parameterization of entry-point skill list (hardcoded for MVP; deferred to Phase 5)
- Skill search or filtering within the advanced access path (all skills shown in a flat list or scrollable view)
- Grouping or categorization of chained skills (hidden entirely; no internal organization)
- Sorting or re-ordering of primary CTAs (fixed order: discovery → ideate → reverse-engineer → spike → improve)
- Skill descriptions or help text on launcher buttons (labels only; detailed help is deferred)
- Caching or persistence of advanced-section expanded/collapsed state (starts collapsed on every page load)
## NFRs
- Visual clarity: primary CTAs are immediately prominent; advanced access is discoverable but not distracting
- Accessibility: all CTA buttons are keyboard-navigable and screen-reader accessible. Color is not the sole indicator of visual hierarchy
- Performance: launcher renders in <100ms; advanced section renders on-demand when expanded (lazy-load acceptable)
- Backward compatibility: no existing skill workflows are broken; bookmarks or direct links to any skill continue to work
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
