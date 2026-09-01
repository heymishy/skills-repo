# Contract Proposal: Stage-Based Skill Routing and Navigation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s4.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-01 (original) — **corrected 2026-09-02, see below**

---

> ⚠️ **Corrected 2026-09-02.** Investigation before `/implementation-plan` (unlike `ep1-s1`/`ep1-s2`, this one confirmed a REAL, non-trivial gap — nothing pre-existing satisfies this story) found two factual errors in the original contract below: (1) there is no existing "Move back to [stage]?" confirmation dialog anywhere to reuse — `handleGetJourneyStageReopen` navigates immediately, no confirm step exists; (2) three different flat, non-branching stage-sequence lookups already exist (`journey-store.js`'s `getNextStage`, `journey.js`'s `BACKFILL_STAGE_SEQUENCE`, and `STAGE_INDEX`) but none reads `.github/pipeline-state.json`'s `stage` field or implements this story's routing table's conditional branches — a genuinely new function is needed, not an adaptation. See `decisions.md` (2026-09-02) for the full investigation. **Corrected contract follows; original kept below for the audit trail.**

## Corrected Contract Proposal (2026-09-02)

### What will be built

1. A pure `getNextSkill(pipelineStage, contextFlags)` function (new — none of the 3 existing flat sequences read `pipeline-state.json` or branch) implementing the routing table from `design.md` Component 4, including its two conditional branches (spike no-build recommendation; test-plan skipped for non-engineering surface types).
2. A `getValidBackwardTargets(completedStages, currentStage)` pure function returning every stage strictly earlier than `currentStage` that appears in `completedStages`.
3. A stage selector on `/journey`'s Continue flow (not a separate "skill session panel" — `_renderJourneyHome`/`handleGetJourneyResume` is the actual target, confirmed by investigation), reusing `handleGetJourneyStageView`'s existing `sn-bar` markup pattern (current/done stages clickable, future stages plain non-clickable text) as its structural basis, extended with a **new, minimal** confirm-before-navigate step — "Move back to [stage]? This will show you prior artefacts and any revisions since then." does not exist today and must be built (a simple interstitial or `confirm()`-equivalent, not a new gate mechanism).
4. Keyboard accessibility for the selector: arrow keys move focus between stage entries, Enter selects — genuinely new; confirmed absent from every existing stage-list rendering.

### What will NOT be built

- Automatic regeneration of downstream artefacts on backward navigation
- The materiality check's own logic (`materiality-check.js`) — unchanged; it already fires automatically once a reopened stage's artefact is revised and saved (`skills.js:5513`), downstream of navigation, not as a pre-navigation gate this story needs to build
- Custom skill ordering or squad-specific routing overrides
- Multi-branch skill paths based on feature properties beyond the two named conditionals (spike recommendation, surface type)
- Any change to `journey-store.js`'s `getNextStage`, `BACKFILL_STAGE_SEQUENCE`, or `STAGE_INDEX` — the new `getNextSkill` is additive, these existing (differently-scoped) lookups are left as-is

### How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (routing decision) | Unit tests on `getNextSkill`/`getValidBackwardTargets` for every table entry and both conditional branches | Unit |
| AC1 (stage selector visibility, keyboard nav, forward-nav restriction, confirm step) | E2E via Playwright — cannot be verified in jsdom (DOM presence/interaction/keyboard-focus behaviour) | E2E |

### Assumptions

- `completedStages` on the journey record (backfilled by `ep1-s3`, merged in PR #808, or natively populated for web-UI-originated journeys) is the source of truth for which stages are valid backward-navigation targets — not `pipeline-state.json`'s `stage` field alone.
- Playwright is already configured (confirmed — same devDependency `ep1-s1` already relies on); no E2E tooling gap.
- The new confirm-before-navigate step can be a plain server-rendered interstitial page (matching this app's existing non-SPA, server-rendered pattern) rather than a client-side JS confirm — consistent with how the rest of `/journey` already works (full-page POST/redirect flows, not AJAX).

### Estimated touch points

Files: `src/web-ui/routes/journey.js` (new `getNextSkill`/`getValidBackwardTargets` functions, `_renderJourneyHome` stage-selector wiring, a new confirm-interstitial handler). Services: none new. Depends on: `ep1-s3` (merged, PR #808 — `completedStages` from the backfilled/native journey record).

---

## Original Contract Proposal (2026-09-01, superseded)

### What will be built

1. A pure `getNextSkill(stage, contextFlags)` function implementing the routing table from `design.md` Component 4 (ideation→discovery, discovery→spike-or-benefit-metric, benefit-metric→estimate-or-definition, definition→review, review→test-plan-or-dor-gate, dor-gate→release), including its two conditional branches (spike no-build recommendation; test-plan skipped for non-engineering surface types).
2. A `getValidBackwardTargets(completedStages, currentStage)` pure function returning every stage strictly earlier than `currentStage` that appears in `completedStages`.
3. A stage selector UI component in the skill session panel: shows current + prior stages, disables stages later than current, and on clicking an earlier stage shows the existing confirmation ("Move back to [stage]? ...") before navigating — reusing the res-s1-s4 materiality-check pattern unmodified.
4. Keyboard accessibility for the selector: arrow keys move focus between stage entries, Enter selects.

### What will NOT be built

- Automatic regeneration of downstream artefacts on backward navigation
- The materiality check's own display/approval logic — reused from res-s1-s4 as-is, not modified by this story
- Custom skill ordering or squad-specific routing overrides
- Multi-branch skill paths based on feature properties beyond the two named conditionals (spike recommendation, surface type)

### How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (routing decision) | Unit tests on `getNextSkill`/`getValidBackwardTargets` for every table entry and both conditional branches | Unit |
| AC1 (stage selector visibility, keyboard nav, forward-nav restriction) | E2E via Playwright — cannot be verified in jsdom (DOM presence/interaction/keyboard-focus behaviour) | E2E |

### Assumptions

- The res-s1-s4 materiality-check mechanism is already implemented and stable — this story calls into it, does not reimplement it.
- `completedStages` on the journey record (backfilled by ep1-s3, or natively populated for web-UI-originated journeys) is the source of truth for which stages are valid backward-navigation targets — not pipeline-state.json's `stage` field alone, since a feature could theoretically have a `stage` further along than what its journey record shows as completed (an edge case explicitly not required to reconcile by this story).
- Playwright is already configured (confirmed — same devDependency ep1-s1 already relies on); no E2E tooling gap.

### Estimated touch points

Files: routing-table module (exact path TBD at `/implementation-plan`), `src/web-ui/routes/skills.js` (stage selector wiring into session panel), a new or existing stage-selector UI template/component. Services: none new. Depends on: ep1-s3 (`completedStages` from the backfilled/native journey record).
