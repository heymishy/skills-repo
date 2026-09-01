# Implementation Plan: ep1-s4

**Story:** ep1-s4 — Stage-Based Skill Routing and Navigation
**DoR:** `artefacts/new-feature-af17f555/dor/ep1-s4-dor.md` (+ `dor-contract.md`, corrected 2026-09-02)
**Test plan:** `artefacts/new-feature-af17f555/test-plans/ep1-s4-test-plan.md`
**Branch:** `feature/ep1-s4` (worktree: `.worktrees/ep1-s4`)
**Date:** 2026-09-02

---

## Scope decision (safety-conscious)

Investigation found `handleGetJourneyResume` lands a fresh session on `diskJourney.currentStage` directly. For natively-progressed web-UI journeys this is already correct (`activeSkill` is incrementally tracked as work happens). For **CLI-backfilled journeys** (`ep1-s3`'s `backfillJourneyFromPipelineState`), `activeSkill` is set to the pipeline-state.json `stage` field's own value — which represents the **last completed** stage, not the next one to work on. This is a real, subtle bug: a CLI-only feature at pipeline-state `stage: 'definition'` would land back on `/definition` instead of advancing to `/review`.

**Scope:** Fix `getNextSkill` into the CLI-backfill path only (`backfillJourneyFromPipelineState`) — low-risk, directly builds on `ep1-s3`'s own code, matches the epic's actual motivating use case. Native web-UI journey flow (`handleGetJourneyResume`'s `diskJourney.currentStage` for non-backfilled journeys) is left unchanged — already correct, and changing it risks regressing an established, tested flow beyond this story's actual need.

Plus: the stage-selector UI on `/journey`'s cards, a new confirm-before-navigate interstitial, and keyboard accessibility — all genuinely new, per the corrected DoR contract.

---

## File map

| File | Change |
|---|---|
| `src/web-ui/routes/journey.js` | New `getNextSkill(pipelineStage, contextFlags)`, `getValidBackwardTargets(completedStages, currentStage)`; wire `getNextSkill` into `backfillJourneyFromPipelineState`'s `activeSkill` computation; add stage-selector markup to `_renderJourneyHome`'s cards; new `handleGetStageConfirmReopen`/`handlePostStageConfirmReopen` route pair for the confirm interstitial; keyboard accessibility JS |
| `tests/check-ep1-s4-stage-routing.js` | New — unit tests for `getNextSkill`/`getValidBackwardTargets`, integration test for the backfill fix |
| `tests/e2e/ep1-s4-stage-selector.spec.js` | New — E2E: selector visibility, backward nav + confirm, forward-nav disabled, keyboard access |

---

## Task 1 — `getNextSkill` routing table (AC1)

**Failing test first** (`tests/check-ep1-s4-stage-routing.js`):

```js
'use strict';
var assert = require('assert');
var passed = 0, failed = 0;
function check(name, fn) { try { fn(); console.log('PASS:', name); passed++; } catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; } }

var journeyRoutes = require('../src/web-ui/routes/journey');

check('routes ideation to discovery', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('ideation', {}), 'discovery');
});
check('routes discovery to benefit-metric by default (no spike result)', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('discovery', {}), 'benefit-metric');
});
check('routes discovery to benefit-metric when spike recommends build', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('discovery', { spikeRecommendation: 'build' }), 'benefit-metric');
});
check('routes discovery to terminal when spike recommends no-build', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('discovery', { spikeRecommendation: 'no-build' }), 'terminal');
});
check('routes benefit-metric to definition by default', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('benefit-metric', {}), 'definition');
});
check('routes definition to review', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('definition', {}), 'review');
});
check('routes review to test-plan by default (engineering surface)', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('review', {}), 'test-plan');
});
check('routes review to dor-gate when surface type does not require test-plan', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('review', { requiresTestPlan: false }), 'dor-gate');
});
check('routes test-plan to definition-of-ready', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('test-plan', {}), 'definition-of-ready');
});
check('routes definition-of-ready to dor-gate', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('definition-of-ready', {}), 'dor-gate');
});
check('routes dor-gate to release (terminal)', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('dor-gate', {}), 'release');
});
check('unrecognized stage returns null, does not throw', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('nonsense-stage', {}), null);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
```

**Run:** expect all FAIL.

**Implementation** (insert near `BACKFILL_STAGE_SEQUENCE`, `journey.js`):

```js
var ROUTING_TABLE = {
  'ideation':             function() { return 'discovery'; },
  'discovery':            function(ctx) { return ctx.spikeRecommendation === 'no-build' ? 'terminal' : 'benefit-metric'; },
  'spike':                function() { return 'benefit-metric'; },
  'benefit-metric':       function() { return 'definition'; },
  'definition':           function() { return 'review'; },
  'review':               function(ctx) { return ctx.requiresTestPlan === false ? 'dor-gate' : 'test-plan'; },
  'test-plan':            function() { return 'definition-of-ready'; },
  'definition-of-ready':  function() { return 'dor-gate'; },
  'dor-gate':             function() { return 'release'; }
};

/**
 * ep1-s4: pure routing-table lookup -- given a pipeline-state.json stage
 * value and optional context flags, returns the next appropriate skill (or
 * 'terminal'/'release' for end states, or null for an unrecognized stage).
 * @param {string} pipelineStage
 * @param {{spikeRecommendation?: string, requiresTestPlan?: boolean}} contextFlags
 * @returns {string|null}
 */
function getNextSkill(pipelineStage, contextFlags) {
  var handler = ROUTING_TABLE[pipelineStage];
  if (!handler) return null;
  return handler(contextFlags || {});
}
```

**Run:** expect all PASS.

## Task 2 — `getValidBackwardTargets` (AC1)

**Add to same test file:**

```js
check('returns every stage strictly earlier than current', () => {
  var result = journeyRoutes.getValidBackwardTargets(['discovery', 'benefit-metric', 'definition'], 'definition');
  assert.deepStrictEqual(result, ['discovery', 'benefit-metric']);
});
check('excludes stages not in completedStages even if earlier in sequence', () => {
  var result = journeyRoutes.getValidBackwardTargets(['discovery', 'definition'], 'definition');
  assert.deepStrictEqual(result, ['discovery']);
});
check('empty completedStages returns empty array', () => {
  assert.deepStrictEqual(journeyRoutes.getValidBackwardTargets([], 'definition'), []);
});
```

**Implementation:**

```js
var STAGE_ORDER_FOR_BACKWARD_NAV = ['ideate', 'discovery', 'spike', 'benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready'];

/**
 * ep1-s4: every stage strictly earlier than currentStage that also appears
 * in completedStages -- the set of valid backward-navigation targets.
 * @param {string[]} completedStages
 * @param {string} currentStage
 * @returns {string[]}
 */
function getValidBackwardTargets(completedStages, currentStage) {
  var currentIdx = STAGE_ORDER_FOR_BACKWARD_NAV.indexOf(currentStage);
  if (currentIdx === -1) return [];
  return STAGE_ORDER_FOR_BACKWARD_NAV.slice(0, currentIdx).filter(function(s) {
    return completedStages.indexOf(s) !== -1;
  });
}
```

**Export both** (`module.exports`): `getNextSkill`, `getValidBackwardTargets`.

**Run:** expect all PASS.

## Task 3 — Fix the CLI-backfill "lands on last-completed, not next" bug

**Add integration test:**

```js
var fs = require('fs'), os = require('os'), path = require('path');
var journeyStore = require('../src/web-ui/modules/journey-store');
check('backfillJourneyFromPipelineState sets activeSkill to the NEXT stage, not the last completed one', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s4-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var dir = path.join(scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: [{ slug: 'ep1s4-next', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }] }), 'utf8');
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s4-next', scratchRoot);
  assert.strictEqual(journey.activeSkill, 'review', 'expected activeSkill to be the NEXT stage after definition, not definition itself');
});
```

**Run:** expect FAIL (currently sets `activeSkill` to `BACKFILL_STAGE_SEQUENCE[upToIdx]`, i.e. `'definition'` itself).

**Implementation** — in `backfillJourneyFromPipelineState`, replace:

```js
_journeyStore.setJourneyFields(journey.journeyId, {
  activeSkill: BACKFILL_STAGE_SEQUENCE[upToIdx],
  ...
```

with:

```js
var _nextSkill = getNextSkill(feature.stage, {}) || BACKFILL_STAGE_SEQUENCE[upToIdx];
_journeyStore.setJourneyFields(journey.journeyId, {
  activeSkill: _nextSkill,
  ...
```

(`getNextSkill(feature.stage, {})` returns `null` for a stage outside `ROUTING_TABLE`, e.g. an inner-loop stage like `branch-complete` — falls back to the existing `BACKFILL_STAGE_SEQUENCE[upToIdx]` behaviour unchanged for that case, so no regression for the "past DoR" scenario the existing test already covers.)

**Run:** expect PASS. Re-run all `ep1-s3` backfill tests (`tests/check-ep1-s3-journey-backfill.js`) to confirm no regression.

## Task 4 — Stage selector on `/journey`'s cards + confirm interstitial

**New E2E spec** (`tests/e2e/ep1-s4-stage-selector.spec.js`) — scenarios per the test plan: selector visibility, backward nav shows confirm text and navigates on confirm, forward stages non-clickable, arrow-key + Enter keyboard access.

**Implementation:**
- Extend `_renderJourneyHome`'s `progressDots()` (or a sibling function) so each dot for a **done** stage becomes an `<a>` linking to a new confirm-interstitial route `GET /journey/:featureSlug/stage/:stageName/confirm-back`, keeping non-done dots as plain `<span>` (matching `sn-bar`'s clickable/non-clickable pattern).
- New `handleGetStageConfirmBack(req, res)`: renders a minimal page — "Move back to [stage label]? This will show you prior artefacts and any revisions since then." with Confirm (POST to the existing `/journey/:journeyId/stage/:skillName/reopen`) and Cancel (link back to `/journey`) actions.
- Keyboard accessibility: `tabindex="0"` on each stage entry, a small inline script handling `ArrowLeft`/`ArrowRight` to move focus and `Enter` to activate the focused entry's link.

## Task 5 — Full regression suite + E2E

```bash
npm test
npx playwright test tests/e2e/ep1-s4-stage-selector.spec.js --repeat-each=1
```

Expected: unit suite 592 files (589 baseline-after-ep1-s2 + 3 new... exact count confirmed at run time), 1 pre-existing known flake, 0 new failures; new E2E spec passing locally.

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code per task
- [x] Failing test written before each implementation step
- [x] Expected output stated for every run command
- [x] No scope beyond the corrected DoR contract (native web-UI journey flow deliberately left untouched — see Scope decision above)
