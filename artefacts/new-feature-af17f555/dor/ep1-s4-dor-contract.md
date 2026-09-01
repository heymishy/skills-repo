# Contract Proposal: Stage-Based Skill Routing and Navigation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s4.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-01

---

## What will be built

1. A pure `getNextSkill(stage, contextFlags)` function implementing the routing table from `design.md` Component 4 (ideation→discovery, discovery→spike-or-benefit-metric, benefit-metric→estimate-or-definition, definition→review, review→test-plan-or-dor-gate, dor-gate→release), including its two conditional branches (spike no-build recommendation; test-plan skipped for non-engineering surface types).
2. A `getValidBackwardTargets(completedStages, currentStage)` pure function returning every stage strictly earlier than `currentStage` that appears in `completedStages`.
3. A stage selector UI component in the skill session panel: shows current + prior stages, disables stages later than current, and on clicking an earlier stage shows the existing confirmation ("Move back to [stage]? ...") before navigating — reusing the res-s1-s4 materiality-check pattern unmodified.
4. Keyboard accessibility for the selector: arrow keys move focus between stage entries, Enter selects.

## What will NOT be built

- Automatic regeneration of downstream artefacts on backward navigation
- The materiality check's own display/approval logic — reused from res-s1-s4 as-is, not modified by this story
- Custom skill ordering or squad-specific routing overrides
- Multi-branch skill paths based on feature properties beyond the two named conditionals (spike recommendation, surface type)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (routing decision) | Unit tests on `getNextSkill`/`getValidBackwardTargets` for every table entry and both conditional branches | Unit |
| AC1 (stage selector visibility, keyboard nav, forward-nav restriction) | E2E via Playwright — cannot be verified in jsdom (DOM presence/interaction/keyboard-focus behaviour) | E2E |

## Assumptions

- The res-s1-s4 materiality-check mechanism is already implemented and stable — this story calls into it, does not reimplement it.
- `completedStages` on the journey record (backfilled by ep1-s3, or natively populated for web-UI-originated journeys) is the source of truth for which stages are valid backward-navigation targets — not pipeline-state.json's `stage` field alone, since a feature could theoretically have a `stage` further along than what its journey record shows as completed (an edge case explicitly not required to reconcile by this story).
- Playwright is already configured (confirmed — same devDependency ep1-s1 already relies on); no E2E tooling gap.

## Estimated touch points

Files: routing-table module (exact path TBD at `/implementation-plan`), `src/web-ui/routes/skills.js` (stage selector wiring into session panel), a new or existing stage-selector UI template/component. Services: none new. Depends on: ep1-s3 (`completedStages` from the backfilled/native journey record).
