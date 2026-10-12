# Connected emotion curve across stages — Implementation Plan

**Goal:** Make every test in the test plan pass (5 tests: 2 unit, 3 E2E). Add an inline SVG emotion curve to the Customer experience tab, reusing the already-shipped `emotion` field.
**Branch:** `feature/jcx-s3`
**Worktree:** `.worktrees/jcx-s3`
**Test command:** `npm test` (unit) / `NODE_ENV=test DATABASE_URL=... npx playwright test tests/e2e/jcx-s3-emotion-curve.spec.js` (E2E — now unblocked locally thanks to `ncdv-s2`)

---

## Design

`buildEmotionCurve(stages)` — a new function alongside `buildCustomerExperienceAnnotations`, called ONCE (not per-stage) and rendered at the top of the Customer experience view, before the per-stage cards.

- **Y-position mapping:** `positive` → near top (y=20), `neutral`/`mixed` → middle (y=60), `negative` → near bottom (y=100). SVG y increases downward, so smaller y = visually higher — matches AC1's "positive higher, negative lower."
- **AC2 (per-stage empty state):** a stage with no `emotion` still gets an X position and participates in the connecting line (so "the two set stages on either side still connect correctly around it" per the AC's own wording), but renders a distinct hollow/dashed marker + "No data yet" label instead of a filled, colored dot.
- **AC3 (whole-journey empty state):** if NO stage has any `emotion` set, skip the SVG entirely and render a friendly empty-state message instead — never a flat/broken-looking line.
- **AC4 (MC-A11Y-02):** every point carries a text `<text>` label with its emotion value, reusing the same convention as the existing emotion chip (colour + text, never colour alone).
- **AC5 (screen-reader structure):** the SVG itself is `aria-hidden="true"` (it's decorative/redundant once the text alternative exists); a sibling, visually-hidden `<ul>` lists every stage name + emotion value in document order — the real accessible structure a screen reader reaches.

No new npm dependency — pure inline SVG string building, matching every other piece of markup in this file.

---

## File map

```
Modify:
  src/web-ui/routes/journeys.js   — buildEmotionCurve function, CSS, wiring into the CX view

Create:
  tests/check-jcx-s3-emotion-curve.js   — unit tests (AC4, AC5)
  tests/e2e/jcx-s3-emotion-curve.spec.js   — E2E tests (AC1, AC2, AC3)
```

---

## Task 1: `buildEmotionCurve` + unit tests (AC4, AC5)

- [ ] **Step 1: Write the failing tests**

```javascript
'use strict';
// check-jcx-s3-emotion-curve.js -- TDD tests for jcx-s3 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s3.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function makeCanvasMockPool(journeyRow, stageRows) {
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, description FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0];
        return Promise.resolve({ rows: match ? [journeyRow] : [] });
      }
      if (/^SELECT id, name, position, description/.test(s)) {
        return Promise.resolve({ rows: stageRows });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}
function withMockedPipelineState(jsonString, fn) {
  var fs = require('fs');
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) { return jsonString; }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}
function makeMockReqRes() {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
  var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  return { req: req, res: res };
}

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  // -- AC4: curve points carry a text label alongside colour --
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Discover', position: 0, emotion: 'positive' },
        { id: 's2', name: 'Buy', position: 1, emotion: 'negative' },
        { id: 's3', name: 'Use', position: 2, emotion: 'mixed' },
        { id: 's4', name: 'Support', position: 3, emotion: 'neutral' }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/sw-emotion-curve-point--positive[\s\S]*?>positive</.test(out), 'expected a text label "positive" on the positive point');
    assert.ok(/sw-emotion-curve-point--negative[\s\S]*?>negative</.test(out), 'expected a text label "negative" on the negative point');
    assert.ok(/sw-emotion-curve-point--mixed[\s\S]*?>mixed</.test(out), 'expected a text label "mixed" on the mixed point');
    assert.ok(/sw-emotion-curve-point--neutral[\s\S]*?>neutral</.test(out), 'expected a text label "neutral" on the neutral point');
    pass('AC4: every curve point carries a text label matching its emotion value');
  } catch (e) { fail('AC4: every curve point carries a text label matching its emotion value', e); }

  // -- AC4 (empty-state marker): an unset stage shows "No data yet", not colour alone --
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Discover', position: 0, emotion: 'positive' },
        { id: 's2', name: 'Buy', position: 1, emotion: null }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/sw-emotion-curve-point--unset[\s\S]*?No data yet/.test(out), 'expected the unset stage to show a distinct "No data yet" marker, not a silent gap');
    pass('AC4 (empty-state marker): an unset stage shows a distinct text marker');
  } catch (e) { fail('AC4 (empty-state marker): an unset stage shows a distinct text marker', e); }

  // -- AC5: curve exposes an accessible linear structure --
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Discover', position: 0, emotion: 'positive' },
        { id: 's2', name: 'Buy', position: 1, emotion: 'negative' },
        { id: 's3', name: 'Use', position: 2, emotion: 'neutral' }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/<svg[^>]*aria-hidden="true"/.test(out), 'expected the SVG itself to be aria-hidden (decorative once the text alternative exists)');
    assert.ok(/class="sw-emotion-curve-a11y-list[^"]*"/.test(out), 'expected a visually-hidden accessible list alongside the SVG');
    assert.ok(/<li>Discover: positive<\/li>/.test(out), 'expected the a11y list to name each stage and its emotion in document order');
    assert.ok(/<li>Buy: negative<\/li>/.test(out), 'expected Buy/negative in the a11y list');
    assert.ok(/<li>Use: neutral<\/li>/.test(out), 'expected Use/neutral in the a11y list');
    pass('AC5: the curve exposes an accessible linear structure (aria-hidden SVG + a visually-hidden text list)');
  } catch (e) { fail('AC5: the curve exposes an accessible linear structure (aria-hidden SVG + a visually-hidden text list)', e); }

  // -- AC3: no stage has any emotion -> friendly empty state, no broken line --
  try {
    var pool = makeCanvasMockPool(
      { id: 'j1', name: 'J', description: null },
      [
        { id: 's1', name: 'Discover', position: 0, emotion: null },
        { id: 's2', name: 'Buy', position: 1, emotion: null }
      ]
    );
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/sw-emotion-curve-empty/.test(out), 'expected the whole-curve empty state to render');
    assert.ok(!/<svg[^>]*class="?[^"]*sw-emotion-curve/.test(out) || !/<polyline/.test(out), 'expected NO polyline/SVG curve to render when no stage has emotion data');
    pass('AC3: a journey with zero emotion data shows the full empty state, not a broken line');
  } catch (e) { fail('AC3: a journey with zero emotion data shows the full empty state, not a broken line', e); }

  console.log(`\n[jcx-s3-emotion-curve] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run test — must fail** (function doesn't exist / curve markup absent)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journeys.js`, add after `buildCustomerExperienceAnnotations`:

```javascript
  // jcx-s3 -- Y-position per emotion value: SVG y increases downward, so
  // SMALLER y = visually HIGHER. positive highest, negative lowest,
  // neutral/mixed in the middle -- matches AC1's own "conventional
  // emotion-curve shape" wording.
  var EMOTION_CURVE_Y = { positive: 20, neutral: 60, mixed: 60, negative: 100 };
  var EMOTION_CURVE_COLOR = { positive: 'var(--success)', negative: 'var(--danger)', mixed: 'var(--warn)', neutral: 'var(--ink-2)' };
  var EMOTION_CURVE_STEP_X = 120;
  var EMOTION_CURVE_HEIGHT = 140;

  // jcx-s3 -- a connected emotion curve spanning ALL stages, rendered ONCE
  // (not per-stage, unlike buildCustomerExperienceAnnotations). AC1-AC5.
  function buildEmotionCurve(stages) {
    var anyEmotionSet = stages.some(function(s) { return !!s.emotion; });
    if (!anyEmotionSet) {
      // AC3 -- the common case (confirmed via /clarify: existing emotion
      // data is mostly empty today), not a rare edge case.
      return '<div class="sw-emotion-curve-empty" role="status">' +
        '<p>No emotion data yet. Set each stage\'s emotion in the side panel to see the journey\'s emotional arc.</p>' +
      '</div>';
    }

    var padding = 40;
    var width = Math.max(400, padding * 2 + (stages.length - 1) * EMOTION_CURVE_STEP_X);
    var stepX = stages.length > 1 ? (width - padding * 2) / (stages.length - 1) : 0;

    var points = stages.map(function(s, idx) {
      return {
        x: padding + idx * stepX,
        y: s.emotion ? EMOTION_CURVE_Y[s.emotion] : EMOTION_CURVE_Y.neutral,
        emotion: s.emotion,
        name: s.name
      };
    });

    // AC2 -- the connecting line passes through EVERY stage's own x
    // position (including unset ones, at a neutral fallback y) so the two
    // set stages on either side of a gap still connect correctly around
    // it, per the AC's own wording -- never silently skipped.
    var polylinePoints = points.map(function(p) { return p.x + ',' + p.y; }).join(' ');

    var pointsHtml = points.map(function(p) {
      if (!p.emotion) {
        return '<g class="sw-emotion-curve-point sw-emotion-curve-point--unset">' +
          '<circle cx="' + p.x + '" cy="' + p.y + '" r="6" fill="none" stroke="var(--ink-2)" stroke-width="1.5" stroke-dasharray="2,2"/>' +
          '<text x="' + p.x + '" y="' + (p.y + 24) + '" text-anchor="middle" font-size="11" fill="var(--ink-2)">No data yet</text>' +
        '</g>';
      }
      return '<g class="sw-emotion-curve-point sw-emotion-curve-point--' + escHtml(p.emotion) + '">' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="6" fill="' + EMOTION_CURVE_COLOR[p.emotion] + '"/>' +
        '<text x="' + p.x + '" y="' + (p.y + 24) + '" text-anchor="middle" font-size="11" fill="var(--ink)">' + escHtml(p.emotion) + '</text>' +
      '</g>';
    }).join('');

    // AC5 -- the SVG is decorative once this text alternative exists.
    var a11yListHtml = '<ul class="sw-emotion-curve-a11y-list sw-visually-hidden">' +
      points.map(function(p) {
        return '<li>' + escHtml(p.name) + ': ' + (p.emotion ? escHtml(p.emotion) : 'No emotion data yet') + '</li>';
      }).join('') +
    '</ul>';

    return '<div class="sw-emotion-curve">' +
      '<svg width="' + width + '" height="' + EMOTION_CURVE_HEIGHT + '" viewBox="0 0 ' + width + ' ' + EMOTION_CURVE_HEIGHT + '" aria-hidden="true">' +
        '<polyline points="' + polylinePoints + '" fill="none" stroke="var(--line)" stroke-width="2"/>' +
        pointsHtml +
      '</svg>' +
      a11yListHtml +
    '</div>';
  }
```

Wire it into the Customer experience view, rendered ONCE before the per-stage loop. Find the `.sw-journey-canvas--view-customer-experience` container structure and insert `buildEmotionCurve(stages)`'s own output at its top -- the simplest integration point is prepending it to the FIRST stage's own `sw-stage-annotations--customer-experience` div is wrong (it's per-stage); instead add a new, separate top-level container alongside the stage list, inside the same view-toggle CSS rule.

Concretely: add a new element right before `stagesHtml` in the overall page template (search for where `stagesHtml` itself is embedded into the final page HTML, not just built) --

```javascript
  '<div class="sw-emotion-curve-container sw-stage-annotations--customer-experience">' +
    buildEmotionCurve(stages) +
  '</div>' +
```

placed immediately before the stage-list container in the final template string, matching the existing `.sw-journey-canvas--view-customer-experience .sw-stage-annotations--customer-experience{display:block}` CSS rule so it participates in the same view-toggle visibility logic as the per-stage annotations (no new CSS toggle rule needed -- reuses the existing class).

Add CSS:

```javascript
      '.sw-emotion-curve{overflow-x:auto}' +
      '.sw-emotion-curve-empty{padding:24px;text-align:center;color:var(--ink-2)}' +
      '.sw-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-jcx-s3-emotion-curve.js
```

Expected: `Results: 4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

---

## Task 2: E2E spec (AC1, AC2, AC3)

- [ ] **Step 1: Write the E2E spec**, following `ep1-s3`/`ic-s2`/`ic-s3`/`ic-s4`'s own established structure (`withAuth`, `seedJourneyWithStages` fixtures). File: `tests/e2e/jcx-s3-emotion-curve.spec.js`.

- [ ] **Step 2: Run against a real local Postgres** (now unblocked by `ncdv-s2`):

```bash
NODE_ENV=test DATABASE_URL=postgres://...@localhost:PORT/db npx playwright test tests/e2e/jcx-s3-emotion-curve.spec.js --repeat-each=1
```

- [ ] **Step 3: Commit**

---

## Final check

- [ ] All 4 unit tests pass (`node tests/check-jcx-s3-emotion-curve.js`)
- [ ] E2E spec passes against a real local Postgres (not just written — actually run, given `ncdv-s2` just unblocked this)
- [ ] Full suite green (`npm test`)
- [ ] Live-browser check: now that local Postgres SSL is fixed, attempt a REAL live-browser check via Chrome against the local dev server, not just jsdom/E2E — the dashboard CSRF gap may still block some flows, but the canvas page itself should render
- [ ] No scope beyond the 5 ACs — no charting library, no inline editing from the curve, no per-stage illustration
