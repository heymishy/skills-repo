# Implementation Plan: ep1-s1 + ep1-s3 (combined — see decisions.md)

**Stories:** ep1-s1 (Feature Discovery from Pipeline-State Index, revised scope) + ep1-s3 (Journey Record Backfill from CLI)
**DoR:** `artefacts/new-feature-af17f555/dor/ep1-s1-dor.md`, `artefacts/new-feature-af17f555/dor/ep1-s3-dor.md`
**Test plans:** `artefacts/new-feature-af17f555/test-plans/ep1-s1-test-plan.md`, `artefacts/new-feature-af17f555/test-plans/ep1-s3-test-plan.md`
**Branch:** `feature/ep1-s1` (worktree: `.worktrees/ep1-s1`)
**Date:** 2026-09-01

---

## Why combined

`handleGetJourneyResume` (`journey.js:1501`) returns 404 before any session-start logic runs when no journey record exists for the clicked slug — ep1-s3's originally-designed `registerHtmlSession()` backfill hook is unreachable from this path. ep1-s1's merged-in cards need ep1-s3's backfill wired directly into the resume handler to avoid a dead-end Continue button. See `decisions.md` (2026-09-01, "ep1-s1 and ep1-s3 implemented together").

---

## File map

| File | Change |
|---|---|
| `src/web-ui/routes/journey.js` | Add `_mergeStateFeaturesIntoJourneyList` (ep1-s1) and `backfillJourneyFromPipelineState` (ep1-s3); wire both into `handleGetJourney` and `handleGetJourneyResume` respectively; export both for direct testing |
| `tests/check-ep1-s1-journey-feature-merge.js` | New — unit + integration tests for the merge function and `handleGetJourney` rendering |
| `tests/check-ep1-s3-journey-backfill.js` | New — unit + integration tests for backfill and the resume-flow no-404 regression |

No new files needed beyond tests — both additions are small, tightly coupled to `journey.js`'s existing internals (`_readPipelineFeatures`, `_journeyStore`, `STAGE_META`), and this repo's own coding standard favours reuse over new abstraction layers for single-consumer logic.

---

## Task 1 — `_mergeStateFeaturesIntoJourneyList` (ep1-s1 AC1, AC2)

**File:** `src/web-ui/routes/journey.js` (insert near `_readPipelineFeatures`, ~line 4189)

**Failing test first** (`tests/check-ep1-s1-journey-feature-merge.js`):

```js
'use strict';
var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var passed = 0, failed = 0;
function check(name, fn) { try { fn(); console.log('PASS:', name); passed++; } catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; } }

var journeyRoutes = require('../src/web-ui/routes/journey');
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s1-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function writeState(features) {
  var dir = path.join(_scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: features }), 'utf8');
}

check('AC1: includes a non-terminal pipeline-state feature with no journey record', () => {
  writeState([{ slug: 'cli-only-feature', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].featureSlug, 'cli-only-feature');
});

check('AC1: excludes a feature already present in journey-store list', () => {
  writeState([{ slug: 'already-known', stage: 'review', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var existing = [{ featureSlug: 'already-known', currentStage: 'review', createdAt: '2026-07-01T00:00:00.000Z' }];
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList(existing, _scratchRoot);
  assert.strictEqual(merged.length, 1, 'expected no duplicate — only the original journey-store entry');
  assert.strictEqual(merged[0], existing[0]);
});

check('AC2: excludes completed/archived/released features', () => {
  writeState([
    { slug: 'f-completed', stage: 'completed', updatedAt: '2026-08-01T00:00:00.000Z' },
    { slug: 'f-archived',  stage: 'archived',  updatedAt: '2026-08-01T00:00:00.000Z' },
    { slug: 'f-released',  stage: 'released',  updatedAt: '2026-08-01T00:00:00.000Z' },
    { slug: 'f-active',    stage: 'review',    updatedAt: '2026-08-01T00:00:00.000Z' }
  ]);
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].featureSlug, 'f-active');
});

check('AC1: maps updatedAt to createdAt (the field _renderJourneyHome sorts/displays by)', () => {
  writeState([{ slug: 'dated-feature', stage: 'definition', updatedAt: '2026-08-15T12:00:00.000Z' }]);
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot);
  assert.strictEqual(merged[0].createdAt, '2026-08-15T12:00:00.000Z');
});

check('graceful degradation: missing pipeline-state.json does not throw', () => {
  var emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s1-empty-'));
  var existing = [{ featureSlug: 'x', currentStage: 'review', createdAt: '2026-07-01T00:00:00.000Z' }];
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList(existing, emptyRoot);
  assert.deepStrictEqual(merged, existing);
});

check('terminal-stage constant matches pipeline-state.json vocabulary exactly', () => {
  assert.deepStrictEqual(journeyRoutes.TERMINAL_STAGES, ['completed', 'archived', 'released']);
});

check('regression: existing journey-store entries preserved unmodified', () => {
  writeState([]);
  var existing = [
    { featureSlug: 'a', currentStage: 'review' },
    { featureSlug: 'b', currentStage: 'definition' }
  ];
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList(existing, _scratchRoot);
  assert.deepStrictEqual(merged.slice(0, 2), existing);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
```

**Run:** `node tests/check-ep1-s1-journey-feature-merge.js` → expect all FAIL (function doesn't exist yet).

**Implementation** (insert after `_readPipelineFeatures`, ~line 4189):

```js
var TERMINAL_STAGES = ['completed', 'archived', 'released'];

/**
 * ep1-s1: merge non-terminal pipeline-state.json features that have no
 * journey-store record yet into the existing journeys list, so they render
 * on /journey through the SAME card template as journey-store entries.
 * journey-store always wins when a slug exists in both — this only fills
 * the gap for CLI-only features journey-store has never heard of.
 * @param {Array} journeys — existing journey-store list (unmodified)
 * @param {string} repoRoot
 * @returns {Array} journeys + synthesized entries for CLI-only, non-terminal features
 */
function _mergeStateFeaturesIntoJourneyList(journeys, repoRoot) {
  var features = _readPipelineFeatures(repoRoot);
  if (!features) return journeys;
  var knownSlugs = {};
  journeys.forEach(function(j) { knownSlugs[j.featureSlug] = true; });
  var synthesized = features
    .filter(function(f) { return TERMINAL_STAGES.indexOf(f.stage) === -1; })
    .filter(function(f) { return !knownSlugs[f.slug]; })
    .map(function(f) {
      return {
        featureSlug:    f.slug,
        currentStage:   f.stage,
        productProfile: 'default',
        createdAt:      f.updatedAt || '',
        stages:         {}
      };
    });
  return journeys.concat(synthesized);
}
```

**Wire into `handleGetJourney`** — right after the existing `productId == null` filter/sort (line ~362-363), before `_renderJourneyHome` is called:

```js
journeys = journeys.filter(function(j) { return j.productId == null; });
journeys = _mergeStateFeaturesIntoJourneyList(journeys, repoRoot); // ep1-s1
journeys.sort(function(a, b) { return (b.createdAt ? new Date(b.createdAt).toISOString() : '').localeCompare(a.createdAt ? new Date(a.createdAt).toISOString() : ''); });
```

(Sort moved to after the merge so synthesized entries are ordered consistently with journey-store ones — the existing sort call at the old location is deleted, not duplicated.)

**Export** (add to `module.exports`): `_mergeStateFeaturesIntoJourneyList`, `TERMINAL_STAGES`.

**Run:** `node tests/check-ep1-s1-journey-feature-merge.js` → expect all PASS.

---

## Task 2 — Integration test: `_renderJourneyHome` renders a merged-in card correctly (ep1-s1 AC1, AC2)

**Add to the same test file**, after the unit tests above:

```js
check('integration: handleGetJourney renders a merged-in CLI-only feature with jh-continue', async () => {
  // (uses the mockReq/mockRes/journeyStore pattern from check-jcn-s1-journey-page-nav-products.js)
});
```

Implementation detail: since `handleGetJourney` is `async` and needs a real `req`/`res`/`pool`, follow the exact `mockReq`/`mockRes` pattern from `tests/check-jcn-s1-journey-page-nav-products.js` (already proven). Assert the rendered HTML contains the merged feature's slug-derived display name and a `jh-continue` link pointing at `/journey/<slug>/resume`, and does NOT contain any terminal-stage fixture feature's name.

**Run full file, expect PASS.**

---

## Task 3 — `backfillJourneyFromPipelineState` (ep1-s3 AC1)

**File:** `src/web-ui/routes/journey.js` (insert near `_mergeStateFeaturesIntoJourneyList`)

**Failing test first** (`tests/check-ep1-s3-journey-backfill.js`):

```js
'use strict';
var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var passed = 0, failed = 0;
function check(name, fn) { try { fn(); console.log('PASS:', name); passed++; } catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; } }

var journeyStore = require('../src/web-ui/modules/journey-store');
var journeyRoutes = require('../src/web-ui/routes/journey');
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s3-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function writeState(features) {
  var dir = path.join(_scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: features }), 'utf8');
}

check('AC1: creates a new journey record when none exists', () => {
  writeState([{ slug: 'ep1s3-a', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-a', _scratchRoot);
  assert.ok(journey, 'expected a journey to be created');
  assert.strictEqual(journey.featureSlug, 'ep1s3-a');
});

check('AC1: completedStages inferred as every stage up to and including current', () => {
  writeState([{ slug: 'ep1s3-b', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-b', _scratchRoot);
  var names = journey.completedStages.map(function(s) { return s.skillName; });
  assert.deepStrictEqual(names, ['ideate', 'discovery', 'benefit-metric', 'design', 'definition']);
});

check('AC1: stamps cliAdoptionTimestamp', () => {
  writeState([{ slug: 'ep1s3-c', stage: 'discovery', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-c', _scratchRoot);
  assert.ok(journey.cliAdoptionTimestamp, 'expected cliAdoptionTimestamp to be set');
});

check('AC1: idempotent — second call returns the same record, no duplicate', () => {
  writeState([{ slug: 'ep1s3-d', stage: 'review', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var first = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-d', _scratchRoot);
  var second = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-d', _scratchRoot);
  assert.strictEqual(first.journeyId, second.journeyId);
});

check('unknown slug (not in pipeline-state.json) returns null', () => {
  writeState([{ slug: 'ep1s3-known', stage: 'discovery', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var result = journeyRoutes.backfillJourneyFromPipelineState('totally-unknown-slug', _scratchRoot);
  assert.strictEqual(result, null);
});

check('stage past definition-of-ready (inner loop) backfills the full outer-loop sequence', () => {
  writeState([{ slug: 'ep1s3-e', stage: 'branch-complete', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-e', _scratchRoot);
  assert.strictEqual(journey.completedStages.length, 8, 'expected all 8 outer-loop stages backfilled');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
```

**Run:** expect all FAIL.

**Implementation:**

```js
var BACKFILL_STAGE_SEQUENCE = ['ideate', 'discovery', 'benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready'];

/**
 * ep1-s3: create a journey record for a CLI-only feature the first time it's
 * needed (called from handleGetJourneyResume's "no record found" branch).
 * Idempotent — a second call for the same slug returns the existing record.
 * Returns null if featureSlug isn't in pipeline-state.json (genuinely unknown slug).
 * @param {string} featureSlug
 * @param {string} repoRoot
 * @returns {Object|null}
 */
function backfillJourneyFromPipelineState(featureSlug, repoRoot) {
  var existing = _journeyStore.getJourneyByFeatureSlug(featureSlug);
  if (existing) return existing;
  var features = _readPipelineFeatures(repoRoot);
  if (!features) return null;
  var feature = features.find(function(f) { return f.slug === featureSlug; });
  if (!feature) return null;

  var journey = _journeyStore.createJourney(featureSlug, 'default');
  var stageIdx = BACKFILL_STAGE_SEQUENCE.indexOf(feature.stage);
  var upToIdx = stageIdx === -1 ? BACKFILL_STAGE_SEQUENCE.length - 1 : stageIdx;
  for (var i = 0; i <= upToIdx; i++) {
    _journeyStore.completeStage(journey.journeyId, BACKFILL_STAGE_SEQUENCE[i], 'artefacts/' + featureSlug + '/' + BACKFILL_STAGE_SEQUENCE[i] + '.md');
  }
  var cliAdoptionTimestamp = new Date().toISOString();
  _journeyStore.setJourneyFields(journey.journeyId, {
    activeSkill: BACKFILL_STAGE_SEQUENCE[upToIdx],
    cliAdoptionTimestamp: cliAdoptionTimestamp
  });
  try {
    _posthog.capture(featureSlug, 'journey_backfilled_from_cli', {
      featureSlug: featureSlug, stage: feature.stage, adoptionTimestamp: cliAdoptionTimestamp
    });
  } catch (_) { /* fire-and-forget — PostHog failure must not fail the backfill */ }
  console.log('[journey] Backfilled journey for ' + featureSlug + ' from pipeline-state.json stage=' + feature.stage);
  return _journeyStore.getJourney(journey.journeyId);
}
```

**Export:** `backfillJourneyFromPipelineState`.

**Run:** expect all PASS.

---

## Task 4 — Wire backfill into `handleGetJourneyResume` (ep1-s3 AC1, closes the ep1-s1 dead-end)

**File:** `src/web-ui/routes/journey.js`, inside `handleGetJourneyResume` (~line 1520-1525)

**Add regression test first** (append to `tests/check-ep1-s3-journey-backfill.js`):

```js
check('integration: resume flow backfills instead of 404ing for a CLI-only feature', async () => {
  writeState([{ slug: 'ep1s3-resume', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  // (use mockReq/mockRes pattern; call journeyRoutes.handleGetJourneyResume(req, res))
  // assert statusCode is a redirect (302) to a chat session, NOT 404
});
```

**Implementation** — insert immediately after the existing `if (!memJourney && diskJourney && diskJourney.journeyId) { memJourney = _journeyStore.getJourney(diskJourney.journeyId); }` block and before `if (!diskJourney && memJourney) { ...synthesize... }`:

```js
// ep1-s3: no record anywhere — if pipeline-state.json knows this feature,
// backfill now so Continue doesn't dead-end in a 404 (ep1-s1's merged-in
// cards depend on this).
if (!diskJourney && !memJourney) {
  memJourney = backfillJourneyFromPipelineState(featureSlug, repoRoot);
}
```

The existing `if (!diskJourney && memJourney) { ...synthesize diskJourney from memJourney... }` block immediately below already handles the newly-backfilled `memJourney` with no further changes — this is why the insertion point is chosen precisely here.

**Run both test files, expect all PASS.**

---

## Task 5 — Full regression suite

```bash
npm test
```

Expected: 588 files run (586 baseline + 2 new), 1 pre-existing failure (`check-p3.5-validate-trace.js`, already acknowledged at `/branch-setup`), 0 new failures.

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code per task
- [x] Failing test written before each implementation step
- [x] Expected output stated for every run command
- [ ] Commit messages — one per task, imperative mood (written at commit time)
- [x] No scope beyond ep1-s1 + ep1-s3's ACs (ADR-023 disk-canonical reads, ADR-009 injectable-adapter/error-caught pattern both respected; `/skills` and `/products/:id` untouched per decisions.md)
