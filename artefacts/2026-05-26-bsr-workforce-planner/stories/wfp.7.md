## Story: Hiring gap view and leadership coverage view

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md

## User Story

As a **Head of Engineering**,
I want to see all hiring gaps grouped by initiative with role and skill-tag detail, and a leadership coverage status per initiative showing whether the required overhead roles are present in the allocation,
So that hiring conversations and initiative scoping decisions are grounded in specific, structural gaps rather than general headcount shortfalls.

## Benefit Linkage

**Metric moved:** M3 — Hiring Gap Specificity Rate
**How:** This view renders the `hiringGap: true` entries from `initiative-map.json` — each with `requiredRole` and `requiredTags`. M3 measures whether 100% of gaps have role + skill-tag specificity; this view makes that measurable visually. The leadership coverage flag is the observable implementation of the discovery-defined threshold: 3+ FTE across multiple squads with no Product Owner or Engineering Chapter Lead in the allocation.

## Architecture Constraints

- Static HTML only — additional tabs/views within the existing `dashboards/workforce.html` file. No separate file.
- No external CSS or JS libraries — inline only (architecture-guardrails.md).
- Leadership roles are identified by a configurable list in the HTML file (e.g. a JS constant `LEADERSHIP_ROLES = ["Product Owner", "Engineering Chapter Lead", "People Leader"]`) not hardcoded per-person — so the threshold logic can be adjusted without rewriting per-initiative logic.
- Reads `workforce/initiative-map.json` from a relative path. No backend API call.

## Dependencies

- **Upstream:** wfp.4 (workforce-map extended modes) must be DoD-complete — this view reads `hiringGap: true` and net-new entries from `initiative-map.json` produced by wfp.4.
- **Upstream:** wfp.5 and wfp.6 must be implemented first — this view adds further tabs to the shared `dashboards/workforce.html` file.
- **Downstream:** None — this is the final story in the feature.

## Acceptance Criteria

**AC1:** Given `workforce/initiative-map.json` contains entries with `hiringGap: true`, when I navigate to the "Hiring Gaps" tab, then each gap is displayed as a row with: initiative slug, required role (from `requiredRole` field), required skill tags (from `requiredTags` array, displayed as comma-separated badges or tags), allocation mode ("net-new" or "profile-match — no match"), and the label "No current capacity — hiring required".

**AC2:** Given I select a product group in the group filter (the same filter control used in the Roster view), when I view the Hiring Gaps tab, then only gap entries associated with initiatives belonging to the selected product group are shown. Given the initiative-map entry does not have a `productGroup` field, the entry remains visible under all filter selections (not hidden).

**AC3:** Given `workforce/initiative-map.json` contains direct and profile-match allocations for initiatives, when I navigate to the "Leadership Coverage" tab, then each initiative with a total computed FTE of 3 or more (counting direct + profile-match only) is shown with a list of allocated people's roles and a flag indicating whether at least one person's `role` value matches a value in the `LEADERSHIP_ROLES` list.

**AC4:** Given an initiative has 3 or more FTE in its direct + profile-match allocation AND no allocated person has a role in `LEADERSHIP_ROLES`, when I view the Leadership Coverage tab, then that initiative is highlighted with a "Leadership gap" badge in a visually distinct colour (amber or red, supplemented with the text label — not colour only).

**AC5:** Given an initiative has fewer than 3 FTE in its allocation, when I view the Leadership Coverage tab, then that initiative is shown without a leadership gap badge (the threshold is 3+ FTE across multiple squads; below-threshold initiatives do not trigger the flag).

**AC6:** Given `workforce/initiative-map.json` has no entries with `hiringGap: true`, when I navigate to the Hiring Gaps tab, then the tab displays the message "No hiring gaps recorded — all initiatives have capacity or are not yet mapped" rather than an empty table.

## Out of Scope

- Configuring the `LEADERSHIP_ROLES` list from the browser — it is a JS constant in the HTML file; changes require editing the file.
- Automatically identifying which product group an initiative belongs to when `productGroup` is not in initiative-map.json — the filter silently includes untagged entries rather than failing.
- Recommending specific people to fill leadership gaps — the dashboard flags the gap only; resolution is an operator decision.
- Exporting the hiring gap list or leadership coverage report — out of scope for Phase 1.
- Editing the `hiringGap` flag or gap entries from the browser — dashboard is read-only.

## NFRs

- **Performance:** Both views render in under 2 seconds for up to 50 initiatives on a modern browser.
- **Accessibility:** Gap badges and leadership gap indicators use both colour and text label. Table headers are `<th>` elements.
- **Security:** No network calls to external origins. Reads only local relative-path JSON.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
