## Test Plan: Stage-Based Skill Routing and Navigation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s4.md
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Test plan author:** Claude Code (agent-authored, operator-directed)
**Date:** 2026-09-01

---

## Entry Condition Check ✅

- Story artefact exists: `artefacts/new-feature-af17f555/stories/ep1-s4.md` ✅
- Review report shows PASS: `artefacts/new-feature-af17f555/review/ep1-s4-review-1.md` (0 HIGH, 0 MEDIUM, 1 LOW-mitigated) ✅
- Story has 1 AC — below the 3-AC convention minimum. Same mitigation as ep1-s1/ep1-s2/ep1-s3. ⚠️

**Proceeding with test plan for ep1-s4.**

---

## Test Environment and Framework

**Confirmed from `package.json` scripts:** `npm test` (Node.js assert-based test helper). E2E framework: Playwright (`npm run test:e2e`).

**AC Analysis:** This AC has two parts: (1) a pure routing-table decision (`pipeline-state.json` stage + `completedStages` → next skill) which is unit-testable in isolation, and (2) a **UI-visible** part — "Stage selector menu is visible... backward navigation available to any earlier stage" and the story's NFR requiring keyboard accessibility (arrow keys, Enter). Menu visibility, keyboard interaction, and forward/backward navigation state cannot be verified by a DOM-simulation environment with confidence — this matches the same class of behaviour ep1-s1's own test plan flagged for its feature-list UI.

**Decision:**
✅ **E2E browser test required (Playwright)** for the stage-selector-menu portion of AC1. The routing-table decision itself is unit-tested separately (pure function, no DOM).

E2E tooling is already configured (Playwright is a devDependency, same as ep1-s1). No tooling gap.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved

**Mechanism:**
- Mock `pipeline-state.json` fixture features across every stage named in the routing table (ideation, discovery, spike, benefit-metric, definition, review, dor-gate)
- Mock a journey record with a fixed `completedStages` array
- E2E: seed a test feature at a known stage via the same fixture mechanism ep1-s1's E2E tests already use

**Sensitivity:** None — synthetic test data.

**Data Availability:** Ready.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap Type | Risk |
|----|---|---|---|---|---|---|---|
| AC1 | Routing table determines next skill and lands session there; stage selector menu visible with backward navigation | 6 | 1 | 3 | — | None | 🟢 |

---

## Unit Tests

### getNextSkill returns the correct next skill for every routing table entry
- **Verifies:** AC1
- **Precondition:** None (pure function)
- **Action:** Call `getNextSkill(stage)` for each of: ideation, discovery, spike, benefit-metric, definition, review, dor-gate
- **Expected result:** Matches the routing table in `design.md` Component 4 exactly (e.g. `ideation` → `discovery`; `review` → `test-plan` or `dor-gate` per the test-plan-optional branch)
- **Edge case:** No

### getNextSkill handles the discovery→spike-or-benefit-metric conditional branch
- **Verifies:** AC1
- **Precondition:** Fixture feature at `stage: 'discovery'` with a spike recorded with `recommendation: 'no-build'`
- **Action:** Call `getNextSkill(stage, spikeResult)`
- **Expected result:** Routes to terminal, not benefit-metric, when spike recommends no-build
- **Edge case:** Yes

### getNextSkill handles the review→test-plan-or-dor-gate conditional branch
- **Verifies:** AC1
- **Precondition:** Fixture feature at `stage: 'review'`, `surfaceType` not requiring test-plan
- **Action:** Call `getNextSkill(stage, surfaceType)`
- **Expected result:** Routes directly to `dor-gate`, skipping `test-plan`, when surface type doesn't require it
- **Edge case:** Yes

### getValidBackwardTargets returns every earlier stage, never a later one
- **Verifies:** AC1
- **Precondition:** Fixture feature at `stage: 'definition'` with `completedStages: [discovery, spike, benefit-metric, definition]`
- **Action:** Call `getValidBackwardTargets(completedStages, currentStage)`
- **Expected result:** Returns `[discovery, spike, benefit-metric]` — excludes `definition` itself and anything later
- **Edge case:** No

### getValidBackwardTargets excludes stages not in completedStages
- **Verifies:** AC1
- **Precondition:** Fixture feature with `completedStages` missing an intermediate stage (e.g. spike was skipped)
- **Action:** Call `getValidBackwardTargets(completedStages, currentStage)`
- **Expected result:** Skipped stage is not offered as a backward-navigation target
- **Edge case:** Yes

### Routing table covers every stage value present in pipeline-state.schema.json
- **Verifies:** AC1 (NFR: routing table deterministic and covers all valid transitions)
- **Precondition:** None
- **Action:** Compare routing table keys against schema-defined stage values
- **Expected result:** No stage value is missing a routing table entry
- **Edge case:** No

---

## Integration Tests

### Session lands on the correct skill after feature selection, using a real journey record
- **Verifies:** AC1
- **Components involved:** `backfillJourney` (ep1-s3), `getNextSkill`, session-start routing
- **Precondition:** Fixture feature at `stage: 'benefit-metric'` with a freshly backfilled journey record
- **Action:** Select the feature and start a session
- **Expected result:** Session opens on `/definition`, matching the routing table entry for `benefit-metric`
- **Edge case:** No

---

## E2E Tests (Playwright)

**Scenario 1: Stage selector menu visibility and backward navigation**
1. Continue a test feature at `stage: 'definition'`
2. **Verify:** A stage selector is visible showing the current stage and prior stages
3. Click an earlier stage (e.g. `discovery`)
4. **Verify:** A confirmation appears: "Move back to discovery? This will show you prior artefacts and any revisions since then."
5. Confirm the move
6. **Verify:** The session now shows the discovery skill's context

**Scenario 2: Forward navigation is disabled for stages not yet reached**
1. Continue the same test feature at `stage: 'definition'`
2. **Verify:** Stages later than `definition` (e.g. `dor-gate`) are shown as disabled/unavailable in the stage selector, not clickable

**Scenario 3: Stage selector is keyboard-accessible**
1. Continue a test feature; focus the stage selector using Tab
2. Use arrow keys to move between stage entries
3. Press Enter on an earlier stage
4. **Verify:** The same navigation confirmation from Scenario 1 appears, triggered by keyboard alone — no mouse used

---

## NFR Tests

### No UI block if a prior stage's artefact is missing
- **NFR addressed:** Reliability — "no UI blocks operator continuation if prior stage missing"
- **Measurement method:** Integration test: fixture feature with a gap in `completedStages` (e.g. spike skipped); assert stage selector still renders and session still starts
- **Pass threshold:** Session starts, no error, missing stage simply absent from the selector
- **Tool:** Node.js assert-based test helper

---

## Out of Scope for This Test Plan

- Materiality check display/approval flow triggered by backward navigation — explicitly out of scope per the story's own Out of Scope section (existing res-s1-s4 mechanism, reused not modified)
- Custom or squad-specific routing overrides — out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

---

*Written 2026-09-01 as part of getting the whole `new-feature-af17f555` feature to DoR-ready level.*
