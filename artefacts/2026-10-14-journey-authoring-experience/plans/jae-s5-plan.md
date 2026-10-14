# Restructure the Delivery view from a per-stage card stack into a swimlane grid — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Replace `#sw-journey-stages`'s card stack with a swimlane grid for the Delivery view, reusing a canonical grid-shell builder shared with the existing Customer-experience grid (ADR-026/ADR-028) — no scope beyond the 8 ACs and the reorder/`list`-retargeting corrections already logged in `decisions.md` (2026-10-15).
**Branch:** `feature/jae-s5`
**Worktree:** `.worktrees/jae-s5`
**Test command:** `node scripts/run-all-tests.js` (unit/integration); `npx playwright test tests/e2e/jae-s5-delivery-swimlane-grid.spec.js` (E2E, not in the `npm test` chain, ADR-018)

---

## Important context for the implementing agent (zero prior context assumed)

- **One huge function.** Everything in this plan lives inside `handleGetJourneyCanvas` (`src/web-ui/routes/journeys.js`, lines 770–2427 approximately) — every helper (`buildCustomerExperienceSwimlaneGrid`, `buildDeliveryAnnotations`, `buildHealthIndicator`, the whole client `<script>` string) is a closure defined inside it, not a separate exported function. None of these are directly `require`-able from a test — every existing test (e.g. `tests/check-jcx-s6-swimlane-grid.js`) tests them indirectly, by calling `handleGetJourneyCanvas` with a mocked pool/req/res and inspecting the returned `bodyContent` HTML string. Follow that exact pattern — do not attempt to export new internal functions.
- **String-concatenation HTML.** This file builds HTML via `'<div>' + value + '</div>'` string concatenation throughout, not a templating library. Match this convention exactly — do not introduce template literals or a different style.
- **`escHtml`** is imported at the top of the file (`var { escHtml } = require('../utils/html-shell');`) and MUST wrap every interpolated value that isn't already a hardcoded string literal.
- **Two tasks must run in strict order — do not reorder or combine them:** Task 1 (the ADR-028 refactor) must be done, and its own regression check must pass, BEFORE Task 2 (building the new Delivery grid) begins. This is the DoR's own mandated sequencing (`dor/jae-s5-dor.md` Coding Agent Instructions).

---

## File map

```
Modify:
  src/web-ui/routes/journeys.js   — extract buildSwimlaneGridShell (ADR-028), add
                                     buildDeliverySwimlaneGrid, remove #sw-journey-stages
                                     and its stagesHtml card-loop and 2 dead CSS rules,
                                     rewrite the client-side reorder mechanism, re-target
                                     the `list`/`jcxList` client variables

Create:
  tests/check-jae-s5-delivery-swimlane-grid.js        — unit + integration tests (AC1–AC7, ADR-028)
  tests/e2e/jae-s5-delivery-swimlane-grid.spec.js      — E2E tests (AC1 alignment, AC8)
```

---

## Task 1: Extract `buildSwimlaneGridShell` — refactor `buildCustomerExperienceSwimlaneGrid` to use it (ADR-028)

**Files:**
- Modify: `src/web-ui/routes/journeys.js` (the `buildCustomerExperienceSwimlaneGrid` function, lines 968–1063)

This task has no NEW behaviour and therefore no new failing test — its own test IS the existing CX grid suite, which must stay green before and after. This is the behaviour-preserving refactor ADR-028 requires before Task 2 can safely build a second grid.

- [ ] **Step 1: Confirm the existing CX grid suite passes BEFORE any change (baseline)**

```bash
node tests/check-jcx-s6-swimlane-grid.js
```

Expected output: all checks `[PASS]`, ending `0 failed` (this was already confirmed once during `/branch-setup`; re-confirm here immediately before editing, since other stories may have merged to this branch's base since then).

- [ ] **Step 2: Replace `buildCustomerExperienceSwimlaneGrid` with the extracted-shell version**

Find this exact function in `src/web-ui/routes/journeys.js` (starts at the comment block beginning `// jcx-s6 -- replaces ep3-s1's own buildCustomerExperienceAnnotations`) and replace the ENTIRE function (from `function buildCustomerExperienceSwimlaneGrid(stagesForGrid) {` through its closing `}`) with:

```javascript
  // jcx-s6 -- replaces ep3-s1's own buildCustomerExperienceAnnotations
  // (which rendered one stage's CX data as a plain stacked box, per-stage,
  // inside the shared #sw-journey-stages list). Per the post-release CX
  // visual-gap spike (spikes/post-release-cx-visual-gap-outcome.md), the
  // original spike's own swimlane/timeline finding was never actually
  // built -- this is that build. Renders the WHOLE grid at once (stage
  // columns + 5 swimlane rows: emotion, customer actions, touchpoints,
  // pain points, opportunities), not per-stage, so it replaces the old
  // function entirely rather than being called per-stage inside the list.
  // AC1, AC2, AC4, AC5, AC6, AC7.
  //
  // jae-s5 -- the column-template/data-row/track/pinned-label/accessible-
  // list mechanics below are now shared with the new Delivery grid via
  // buildSwimlaneGridShell (ADR-028: one canonical builder, two callers,
  // not two independent derivations of the same grid mechanics). This
  // function's own rendered output is byte-identical to before this
  // refactor -- confirmed by tests/check-jcx-s6-swimlane-grid.js passing
  // unchanged.
  function buildCustomerExperienceSwimlaneGrid(stagesForGrid) {
    function buildHeaderCell(s) {
      var nameHtml = (s.name && s.name.trim())
        ? '<span class="sw-stage-name">' + escHtml(s.name) + '</span>'
        : '<span class="sw-stage-name sw-stage-name--empty">—</span>';
      return '<div class="sw-cx-grid-cell sw-cx-grid-cell--header" data-stage-id="' + escHtml(s.id) + '" tabindex="0">' +
        nameHtml +
        (s.moment_of_truth ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>' : '') +
        // jcx-s6 -- .sw-stage-edit is already document-delegated (confirmed
        // by reading its own click handler), added specifically because it
        // already needed to work from inside drawflow canvas nodes -- a
        // context exactly as structurally distant from #sw-journey-stages
        // as this grid is. Reused here with zero new JS. "Map feature"/
        // "Add placeholder" are deliberately NOT included -- genuinely
        // delivery-chrome (AC6), still reachable from the Delivery tab.
        // jcx-s7 AC3 -- the cell itself is now also a single-click/keyboard
        // target for opening the same panel (tabindex above; click/keydown
        // delegation below) -- this link stays as a clear, visible label
        // for what the larger target does, not the only way to reach it.
        '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit</a>' +
      '</div>';
    }

    function buildTextCellsRow(field) {
      return stagesForGrid.map(function(s) {
        // jcx-s7 AC4 -- empty values get a muted, visually-dulled em-dash
        // treatment (sw-cx-grid-cell--empty), distinct from a real value --
        // .trim() matters: a whitespace-only value must still count as
        // empty, matching this codebase's own existing emptiness convention.
        return (s[field] && s[field].trim())
          ? '<div class="sw-cx-grid-cell" data-stage-id="' + escHtml(s.id) + '">' + escHtml(s[field]) + '</div>'
          : '<div class="sw-cx-grid-cell sw-cx-grid-cell--empty" data-stage-id="' + escHtml(s.id) + '">—</div>';
      }).join('');
    }

    // The curve is ONE element (not N per-stage cells like the other rows),
    // so it must explicitly span every column -- CSS grid auto-placement
    // would otherwise drop it into just the first column, leaving its own
    // width:100% stretch only the narrowest possible space.
    var rows = [
      { rowClass: 'emotion', label: 'Emotion', cellsHtml: '<div style="grid-column:1 / -1">' + buildEmotionCurve(stagesForGrid) + '</div>' },
      { rowClass: 'actions', label: 'Customer actions', cellsHtml: buildTextCellsRow('customer_actions') },
      { rowClass: 'touchpoints', label: 'Touchpoints', cellsHtml: buildTextCellsRow('touchpoints') },
      { rowClass: 'pain-points', label: 'Pain points', cellsHtml: buildTextCellsRow('pain_points') },
      { rowClass: 'opportunities', label: 'Opportunities', cellsHtml: buildTextCellsRow('opportunities') }
    ];

    // jcx-s6 AC5 -- ONE grid-wide accessible linear structure covering
    // every field, in document order -- supersedes jcx-s3's own
    // emotion-only a11y list (removed from buildEmotionCurve above).
    function buildA11yEntry(s) {
      return escHtml(s.name) + ': ' +
        'Emotion: ' + (s.emotion ? escHtml(s.emotion) : 'No emotion data yet') + '. ' +
        'Customer actions: ' + (s.customer_actions ? escHtml(s.customer_actions) : 'Not set') + '. ' +
        'Touchpoints: ' + (s.touchpoints ? escHtml(s.touchpoints) : 'Not set') + '. ' +
        'Pain points: ' + (s.pain_points ? escHtml(s.pain_points) : 'Not set') + '. ' +
        'Opportunities: ' + (s.opportunities ? escHtml(s.opportunities) : 'Not set');
    }

    // No outer wrapping div here -- the caller's own
    // .sw-stage-annotations--customer-experience.sw-cx-swimlane-grid div
    // IS the grid container, matching the persona-card/emotion-curve-container
    // convention of applying an extra class directly to that one shared
    // wrapper rather than nesting a second div inside it.
    return buildSwimlaneGridShell(stagesForGrid, {
      buildHeaderCell: buildHeaderCell,
      rows: rows,
      a11yListClass: 'sw-cx-a11y-list',
      buildA11yEntry: buildA11yEntry
    });
  }

  // jae-s5 -- ADR-028 canonical builder. The ONLY place that computes the
  // shared column template, builds a data row (pinned label + scrollable
  // track + grid cells), and assembles the visually-hidden accessible
  // list. buildCustomerExperienceSwimlaneGrid (above) and
  // buildDeliverySwimlaneGrid (below) both call this -- neither re-derives
  // these mechanics independently. opts: { buildHeaderCell(s) -> html,
  // rows: [{rowClass, label, cellsHtml}], a11yListClass: string,
  // buildA11yEntry(s) -> html (used as one <li> per stage) }.
  function buildSwimlaneGridShell(stagesForGrid, opts) {
    // jcx-s6 AC1/AC2/AC7 -- one shared column template drives every row
    // (header + all data rows), so stage columns stay vertically aligned
    // whether or not the track is scrolled. minmax(200px,1fr): columns
    // grow via 1fr to fill the track when it fits (AC3's ≥80%-fill case);
    // columns floor at 200px and the track overflows/scrolls once
    // stageCount*200px exceeds the track's own width (AC7).
    var gridTemplateColumns = 'repeat(' + stagesForGrid.length + ', minmax(200px, 1fr))';

    function buildDataRow(rowClass, label, cellsHtml) {
      return '<div class="sw-cx-grid-row sw-cx-grid-row--' + rowClass + '">' +
        '<div class="sw-cx-row-label">' + escHtml(label) + '</div>' +
        '<div class="sw-cx-grid-row-track" tabindex="0">' +
          '<div class="sw-cx-grid-row-cells" style="grid-template-columns:' + gridTemplateColumns + '">' + cellsHtml + '</div>' +
        '</div>' +
      '</div>';
    }

    var headerCellsHtml = stagesForGrid.map(opts.buildHeaderCell).join('');
    var rowsHtml = opts.rows.map(function(row) {
      return buildDataRow(row.rowClass, row.label, row.cellsHtml);
    }).join('');
    var a11yListHtml = '<ul class="' + opts.a11yListClass + ' sw-visually-hidden">' +
      stagesForGrid.map(function(s) { return '<li>' + opts.buildA11yEntry(s) + '</li>'; }).join('') +
    '</ul>';

    return '<div class="sw-cx-grid-row sw-cx-grid-row--header">' +
        '<div class="sw-cx-row-label"></div>' +
        '<div class="sw-cx-grid-row-track" tabindex="0">' +
          '<div class="sw-cx-grid-row-cells" style="grid-template-columns:' + gridTemplateColumns + '">' + headerCellsHtml + '</div>' +
        '</div>' +
      '</div>' +
      rowsHtml +
      a11yListHtml;
  }
```

- [ ] **Step 3: Run the CX grid suite again — must still pass, byte-identical**

```bash
node tests/check-jcx-s6-swimlane-grid.js
```

Expected output: identical PASS result to Step 1 — same checks, same count, `0 failed`. If any check fails here, the refactor changed CX's own output; stop and fix before proceeding to Task 2.

- [ ] **Step 4: Run the Customer-experience grid's own E2E spec — must still pass**

```bash
npx playwright test tests/e2e/jcx-s6-swimlane-grid.spec.js
```

Expected output: all 4 tests passing (AC1, AC2, AC3, AC7).

- [ ] **Step 5: Run full suite — no regressions elsewhere**

```bash
node scripts/run-all-tests.js
```

Expected output: same pass count as the `/branch-setup` baseline (752/753 — `check-pcr-s1-test-runner.js`'s own full-suite-only flake is pre-existing and acknowledged in `decisions.md`, not a new failure this task introduced).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js
git commit -m "refactor: extract buildSwimlaneGridShell from the CX grid (ADR-028)"
```

---

## Task 2: Build `buildDeliverySwimlaneGrid` and wire it into the Delivery view

**Files:**
- Modify: `src/web-ui/routes/journeys.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-jae-s5-delivery-swimlane-grid.js`:

```javascript
'use strict';
// check-jae-s5-delivery-swimlane-grid.js -- TDD tests for jae-s5 (Epic:
// journey-authoring-delivery-view-grid, 2026-10-14-journey-authoring-experience).
// Story: artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
// Mirrors check-jcx-s6-swimlane-grid.js's own test harness exactly (same
// mock pool shape, same withMockedPipelineState/renderCanvas helpers) --
// not a new pattern.
const assert = require('assert');
const fs = require('fs');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function withMockedPipelineState(jsonString, fn) {
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) { return jsonString; }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}

function stageRow(id, name, extra) {
  return Object.assign({
    id: id, name: name, position: 0, description: null,
    customer_actions: null, touchpoints: null, channel: null,
    emotion: null, pain_points: null, opportunities: null,
    moment_of_truth: false, position_x: null, position_y: null
  }, extra || {});
}

function makeCanvasMockPool(journeyRow, stageRows, mappingRows) {
  mappingRows = mappingRows || [];
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0];
        return Promise.resolve({ rows: match ? [journeyRow] : [] });
      }
      if (/^SELECT id, name, position, description/.test(s)) {
        return Promise.resolve({ rows: stageRows });
      }
      if (/^SELECT .* FROM feature_customer_journey_stage_mappings WHERE mapping_state = 'placeholder'/.test(s)) {
        return Promise.resolve({ rows: [] });
      }
      if (/^SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings/.test(s)) {
        var jMatch = journeyRow && params[0] === journeyRow.id;
        return Promise.resolve({ rows: jMatch ? mappingRows : [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

async function renderCanvas(journeyRow, stageRows, mappingRows) {
  const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
  const canvasPool = makeCanvasMockPool(journeyRow, stageRows, mappingRows);
  return withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
    const req = { session: { tenantId: 't1' }, params: { id: journeyRow.id } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleGetJourneyCanvas(req, res, null, canvasPool);
    return res._b.bodyContent;
  });
}

// Scopes a regex match to the Delivery grid's own wrapper only -- the page
// also embeds a full JSON.stringify(stages) blob elsewhere (stageDataJson,
// for the edit side panel), so an unscoped html.indexOf() on stage text is
// a false-positive trap (same one check-jcx-s6-swimlane-grid.js's own
// comment names for the CX grid).
function extractDeliveryGridHtml(html) {
  var startMarker = 'sw-stage-annotations--delivery sw-delivery-swimlane-grid';
  var start = html.indexOf(startMarker);
  assert.ok(start !== -1, 'expected to find the Delivery grid wrapper in the rendered HTML');
  // The wrapper div's own closing point isn't trivially findable by string
  // search alone across nested divs; return from the marker to the next
  // sibling's own id to bound the search window generously.
  var end = html.indexOf('id="sw-stage-reorder-error"', start);
  assert.ok(end !== -1, 'expected to find the sw-stage-reorder-error sibling after the Delivery grid');
  return html.slice(start, end);
}

(async function() {
  // -- AC1: one column per stage, header + 2 data rows share one
  //    grid-template-columns --
  try {
    const stages = [
      stageRow('s1', 'Evaluate'),
      stageRow('s2', 'Discover'),
      stageRow('s3', 'Purchase')
    ];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    const gridHtml = extractDeliveryGridHtml(html);
    const expectedTemplate = 'grid-template-columns:repeat(3, minmax(200px, 1fr))';
    const occurrences = gridHtml.split(expectedTemplate).length - 1;
    assert.strictEqual(occurrences, 3, 'expected the header row + 2 data rows to each carry the identical grid-template-columns string (3 occurrences)');
    assert.ok(gridHtml.indexOf('Coverage status') !== -1, 'expected a "Coverage status" row label');
    assert.ok(gridHtml.indexOf('Mapped features') !== -1, 'expected a "Mapped features" row label');
    pass('AC1: header + 2 data rows share one grid-template-columns, 3 stage columns');
  } catch (e) { fail('AC1: header + 2 data rows share one grid-template-columns, 3 stage columns', e); }

  // -- AC2: zero-mapping stage shows the existing empty-state text --
  try {
    const stages = [stageRow('s1', 'Evaluate')];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(gridHtml.indexOf('<p class="sw-stage-annotations-empty">No features mapped</p>') !== -1,
      'expected the exact existing empty-state markup, byte-identical to buildDeliveryAnnotations\'s own output');
    pass('AC2: zero-mapping stage shows the existing "No features mapped" empty state');
  } catch (e) { fail('AC2: zero-mapping stage shows the existing "No features mapped" empty state', e); }

  // -- AC3: Map feature button reachable and identically wired --
  try {
    const stages = [stageRow('s1', 'Evaluate')];
    const mappings = [{ id: 'm1', journey_stage_id: 's1', feature_slug: 'f1', metric_keys: [], mapping_state: 'active' }];
    // featuresBySlug is populated from pipeline-state.json features -- the
    // mocked empty {features:[]} means f1 resolves to "not found", which is
    // fine here: we're only asserting the button's own markup/wiring, not
    // the mapping-resolution behaviour (already covered by
    // check-ep2-s2-feature-mapping-save.js).
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, mappings);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(gridHtml.indexOf('<button type="button" class="sw-stage-map-feature" data-stage-id="s1">Map feature</button>') !== -1,
      'expected the exact existing Map feature button markup inside the grid cell');
    pass('AC3: Map feature button reachable and identically wired inside the grid cell');
  } catch (e) { fail('AC3: Map feature button reachable and identically wired inside the grid cell', e); }

  // -- AC4: Add placeholder form reachable and identically wired --
  try {
    const stages = [stageRow('s1', 'Evaluate')];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(gridHtml.indexOf('<button type="button" class="sw-stage-add-placeholder" data-stage-id="s1">Add placeholder</button>') !== -1,
      'expected the exact existing Add placeholder button markup inside the grid cell');
    assert.ok(gridHtml.indexOf('<form class="sw-placeholder-add-form" data-stage-id="s1">') !== -1,
      'expected the exact existing placeholder-add-form markup inside the grid cell');
    pass('AC4: Add placeholder form reachable and identically wired inside the grid cell');
  } catch (e) { fail('AC4: Add placeholder form reachable and identically wired inside the grid cell', e); }

  // -- AC5: reorder buttons render in the header cell, unchanged wiring,
  //    including the single-stage edge case --
  try {
    const stages = [stageRow('s1', 'Evaluate'), stageRow('s2', 'Discover')];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(/data-stage-id="s1" data-direction="up" disabled aria-label="Move stage up"/.test(gridHtml),
      'expected the first stage\'s own "up" button to be disabled');
    assert.ok(/data-stage-id="s2" data-direction="down" disabled aria-label="Move stage down"/.test(gridHtml),
      'expected the last stage\'s own "down" button to be disabled');
    pass('AC5: reorder buttons render in the header cell with correct disabled state');

    const singleStage = [stageRow('s1', 'Evaluate')];
    const singleHtml = await renderCanvas({ id: 'j1', name: 'J', description: null }, singleStage, []);
    const singleGridHtml = extractDeliveryGridHtml(singleHtml);
    assert.ok(singleGridHtml.indexOf('sw-stage-reorder-controls') === -1,
      'expected NO reorder controls at all for a single-stage journey');
    pass('AC5 (edge case): single-stage journey renders no reorder controls');
  } catch (e) { fail('AC5: reorder buttons render in the header cell with correct disabled state', e); }

  // -- AC6: 0-stage journey shows the existing empty-state fallback --
  try {
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, [], []);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(gridHtml.indexOf('No stages yet. Add your first stage.') !== -1,
      'expected the existing 0-stage fallback message');
    assert.ok(gridHtml.indexOf('sw-cx-grid-row') === -1,
      'expected NO grid-row markup at all for a 0-stage journey');
    pass('AC6: 0-stage journey shows the existing empty-state fallback, no empty grid shell');
  } catch (e) { fail('AC6: 0-stage journey shows the existing empty-state fallback, no empty grid shell', e); }

  // -- AC7: one shared accessible list covers every stage --
  try {
    const stages = [
      stageRow('s1', 'Evaluate'),
      stageRow('s2', 'Discover')
    ];
    const mappings = [{ id: 'm1', journey_stage_id: 's1', feature_slug: 'f1', metric_keys: ['k1'], mapping_state: 'active' }];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, mappings);
    const gridHtml = extractDeliveryGridHtml(html);
    const listMatch = gridHtml.match(/<ul class="sw-delivery-a11y-list sw-visually-hidden">([\s\S]*?)<\/ul>/);
    assert.ok(listMatch, 'expected exactly one sw-delivery-a11y-list');
    const liCount = (listMatch[1].match(/<li>/g) || []).length;
    assert.strictEqual(liCount, 2, 'expected exactly one <li> per stage');
    assert.ok(listMatch[1].indexOf('Evaluate') !== -1 && listMatch[1].indexOf('Discover') !== -1,
      'expected both stage names present in document order');
    pass('AC7: one shared accessible list covers every stage, one <li> each');
  } catch (e) { fail('AC7: one shared accessible list covers every stage, one <li> each', e); }

  // -- ADR-028 compliance: both grids call the same canonical shell
  //    builder (source-level assertion, matching architecture-guardrails.md's
  //    own named "Shared-mechanism proof via source assertion" pattern) --
  try {
    const source = fs.readFileSync(require.path && require.path || require.resolve('../src/web-ui/routes/journeys.js'), 'utf8');
    const shellDefCount = (source.match(/function buildSwimlaneGridShell\(/g) || []).length;
    assert.strictEqual(shellDefCount, 1, 'expected exactly ONE buildSwimlaneGridShell definition');
    const formulaCount = (source.match(/'repeat\(' \+ stagesForGrid\.length \+ ', minmax\(200px, 1fr\)\)'/g) || []).length;
    assert.strictEqual(formulaCount, 1, 'expected the grid-template-columns formula computed in exactly ONE place in the source, not independently re-derived by a second grid function');
    const deliveryCallsShell = /function buildDeliverySwimlaneGrid[\s\S]*?buildSwimlaneGridShell\(/.test(source);
    const cxCallsShell = /function buildCustomerExperienceSwimlaneGrid[\s\S]*?buildSwimlaneGridShell\(/.test(source);
    assert.ok(deliveryCallsShell, 'expected buildDeliverySwimlaneGrid to call buildSwimlaneGridShell');
    assert.ok(cxCallsShell, 'expected buildCustomerExperienceSwimlaneGrid to call buildSwimlaneGridShell');
    pass('ADR-028: both grid functions call the one canonical buildSwimlaneGridShell, formula computed once');
  } catch (e) { fail('ADR-028: both grid functions call the one canonical buildSwimlaneGridShell, formula computed once', e); }

  console.log(`\n[jae-s5-delivery-swimlane-grid] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-jae-s5-delivery-swimlane-grid.js
```

Expected output: every check fails (`FAIL`), because `buildDeliverySwimlaneGrid` and the `sw-stage-annotations--delivery sw-delivery-swimlane-grid` wrapper do not exist yet — the Delivery view still renders the old `#sw-journey-stages` card stack. Confirms the test is actually exercising new behaviour, not passing by accident.

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/journeys.js`, immediately after the `buildSwimlaneGridShell` function added in Task 1, add:

```javascript
  // jae-s5 -- replaces the per-stage .sw-stage-card/.sw-stage-annotations
  // --delivery card-stack loop (removed in Task 5 of this story's own
  // implementation plan) with a swimlane grid, reusing
  // buildSwimlaneGridShell (ADR-028) -- the same shared mechanics the CX
  // grid uses. 2 data rows: Coverage status (computed, via
  // buildHealthIndicator) and Mapped features (buildDeliveryAnnotations's
  // own existing per-stage output, plus the existing Map feature/Add
  // placeholder/placeholder-add-form markup, moved in unchanged --
  // decisions.md 2026-10-15). Reorder controls render in the header cell
  // (unlike the CX grid's header cell, which deliberately omits them --
  // see jcx-s6's own comment) since this is the only view with a reorder
  // surface.
  function buildDeliverySwimlaneGrid(stagesForGrid) {
    function buildHeaderCell(s) {
      var nameHtml = (s.name && s.name.trim())
        ? '<span class="sw-stage-name">' + escHtml(s.name) + '</span>'
        : '<span class="sw-stage-name sw-stage-name--empty">—</span>';
      var isFirst = stagesForGrid[0] === s;
      var isLast = stagesForGrid[stagesForGrid.length - 1] === s;
      var reorderControls = stagesForGrid.length > 1
        ? '<span class="sw-stage-reorder-controls">' +
            '<button type="button" class="sw-stage-move" data-stage-id="' + escHtml(s.id) + '" data-direction="up"' + (isFirst ? ' disabled' : '') + ' aria-label="Move stage up">' + ARROW_UP_ICON + '</button>' +
            '<button type="button" class="sw-stage-move" data-stage-id="' + escHtml(s.id) + '" data-direction="down"' + (isLast ? ' disabled' : '') + ' aria-label="Move stage down">' + ARROW_DOWN_ICON + '</button>' +
          '</span>'
        : '';
      return '<div class="sw-cx-grid-cell sw-cx-grid-cell--header" data-stage-id="' + escHtml(s.id) + '" tabindex="0">' +
        nameHtml +
        (s.moment_of_truth ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>' : '') +
        reorderControls +
        '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit</a>' +
      '</div>';
    }

    var coverageCellsHtml = stagesForGrid.map(function(s) {
      return '<div class="sw-cx-grid-cell" data-stage-id="' + escHtml(s.id) + '">' + buildHealthIndicator(s.id) + '</div>';
    }).join('');

    // buildDeliveryAnnotations's own existing 4-case output (no mappings /
    // placeholder / missing-feature / normal-mapping-with-metrics) is moved
    // in unchanged, followed by the existing Map feature/Add placeholder
    // buttons and the inline placeholder-add-form -- all 4 pieces of
    // markup byte-identical to today's card-stack version (decisions.md
    // 2026-10-15). The "No features mapped" case already carries its own
    // muted styling (.sw-stage-annotations-empty, existing CSS rule) --
    // no new empty-cell class needed here.
    var mappedFeaturesCellsHtml = stagesForGrid.map(function(s) {
      return '<div class="sw-cx-grid-cell" data-stage-id="' + escHtml(s.id) + '">' +
        buildDeliveryAnnotations(s.id) +
        '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>' +
        '<button type="button" class="sw-stage-add-placeholder" data-stage-id="' + escHtml(s.id) + '">Add placeholder</button>' +
        '<form class="sw-placeholder-add-form" data-stage-id="' + escHtml(s.id) + '">' +
          '<label for="sw-placeholder-name-' + escHtml(s.id) + '">Placeholder name</label>' +
          '<input type="text" id="sw-placeholder-name-' + escHtml(s.id) + '" class="sw-placeholder-name-input" required>' +
          '<button type="submit" class="sw-placeholder-add-submit">Create</button>' +
          '<button type="button" class="sw-placeholder-add-cancel">Cancel</button>' +
        '</form>' +
      '</div>';
    }).join('');

    var rows = [
      { rowClass: 'coverage-status', label: 'Coverage status', cellsHtml: coverageCellsHtml },
      { rowClass: 'mapped-features', label: 'Mapped features', cellsHtml: mappedFeaturesCellsHtml }
    ];

    function buildA11yEntry(s) {
      var health = HEALTH_META[computeStageHealth(s.id)].label;
      var mappings = mappingsByStage[s.id] || [];
      var mappedSummary = mappings.length === 0 ? 'No features mapped' : mappings.length + ' feature mapping(s)';
      return escHtml(s.name) + '. Coverage status: ' + escHtml(health) + '. Mapped features: ' + escHtml(mappedSummary);
    }

    return buildSwimlaneGridShell(stagesForGrid, {
      buildHeaderCell: buildHeaderCell,
      rows: rows,
      a11yListClass: 'sw-delivery-a11y-list',
      buildA11yEntry: buildA11yEntry
    });
  }
```

Then find the `bodyContent` assembly (the block containing `'<div class="sw-journey-stages" id="sw-journey-stages">' + stagesHtml + '</div>'`) and replace ONLY that one line with:

```javascript
      '<div class="sw-stage-annotations sw-stage-annotations--delivery sw-delivery-swimlane-grid">' +
        (stages.length
          ? buildDeliverySwimlaneGrid(stages)
          : '<p class="sw-journey-stages-empty">No stages yet. Add your first stage.</p>') +
      '</div>' +
```

Do NOT remove the `stagesHtml` variable or the old card-stack loop yet — that is Task 5, done only after the client-script reorder rewrite (Task 4) no longer depends on it.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-jae-s5-delivery-swimlane-grid.js
```

Expected output: `[jae-s5-delivery-swimlane-grid] Results: 9 passed, 0 failed` (AC1, AC2, AC3, AC4, AC5 + its edge case, AC6, AC7, ADR-028 — 9 assertions across the test blocks above).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 753 + 1 new file run (754 total), only the pre-existing `check-pcr-s1-test-runner.js` flake (if it recurs) failing — no new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-jae-s5-delivery-swimlane-grid.js
git commit -m "feat: add buildDeliverySwimlaneGrid, wire the Delivery view to it"
```

---

## Task 3: Rewrite the client-side reorder mechanism and re-target `list`/`jcxList`

**Files:**
- Modify: `src/web-ui/routes/journeys.js` (the client `<script>` string inside `handleGetJourneyCanvas`)

This task has no separate new automated test of its own beyond what Task 2's AC5 tests already assert (markup/wiring) — the reload behaviour itself is asserted via the source-text check below, since a real page reload cannot be meaningfully asserted via the jsdom-free string-based test harness this file already uses for its own client-script content. See the AC5 (added at `/implementation-plan`) entry in `test-plans/jae-s5-test-plan.md`.

- [ ] **Step 1: Write the failing test**

Add to `tests/check-jae-s5-delivery-swimlane-grid.js`, immediately before the ADR-028 compliance block near the end of the file's IIFE:

```javascript
  // -- AC5 (added at /implementation-plan): reorder success reloads,
  //    failure does not (decisions.md 2026-10-15) --
  try {
    const source = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys.js'), 'utf8');
    assert.ok(source.indexOf('document.getElementById("sw-journey-stages")') === -1,
      'expected NO remaining reference to the removed #sw-journey-stages id');
    assert.ok(/querySelector\(".sw-stage-annotations--delivery.sw-delivery-swimlane-grid"\)/.test(source),
      'expected list/jcxList to be re-targeted at the new Delivery grid wrapper');
    assert.ok(/window\.location\.reload\(\)/.test(source),
      'expected a reload call in the reorder success handler');
    assert.ok(source.indexOf('function reorderDom(') === -1,
      'expected the old DOM-move reorderDom function to be removed, not left dead');
    assert.ok(source.indexOf('function getStageIds(') === -1,
      'expected the old getStageIds function to be removed, not left dead');
    assert.ok(source.indexOf('addEventListener("dragstart"') === -1,
      'expected drag-and-drop reordering to be removed from the Delivery grid (out of scope, decisions.md 2026-10-15)');
    pass('AC5: reorder mechanism rewritten -- reload on success, no dead DOM-move code, no drag-and-drop');
  } catch (e) { fail('AC5: reorder mechanism rewritten -- reload on success, no dead DOM-move code, no drag-and-drop', e); }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-jae-s5-delivery-swimlane-grid.js
```

Expected output: this new check fails — `#sw-journey-stages` is still referenced, the old functions still exist, drag-and-drop is still wired.

- [ ] **Step 3: Write the implementation**

In the client `<script>` string, find and replace these 4 exact lines:

```javascript
      'var list=document.getElementById("sw-journey-stages");' +
```

→

```javascript
      'var list=document.querySelector(".sw-stage-annotations--delivery.sw-delivery-swimlane-grid");' +
```

(This is the ONLY occurrence in the drag/reorder IIFE — do not touch the separate `jcxList` declaration yet, handled next.)

Find and replace the entire block from `'var reorderError=document.getElementById("sw-stage-reorder-error");'` through the matching closing `'}'` of the `if(list){...}` block that contains `dragstart`/`dragover`/`drop`/the `.sw-stage-move` click handler (this spans from the `getStageIds`/`reorderDom`/`submitOrder` function definitions through the end of that `if(list){...}` block) with:

```javascript
      'var reorderError=document.getElementById("sw-stage-reorder-error");' +
      // jae-s5 -- the old reorderDom/getStageIds/submitOrder (DOM-order-
      // is-source-of-truth, list.appendChild(card) as the move primitive)
      // assumed one .sw-stage-card element per stage. That no longer
      // holds: a stage's content now spans 3 separate row containers
      // (header, coverage-status, mapped-features), with no single
      // per-stage element to move. Corrected per decisions.md (2026-10-15):
      // on success, reload (the server rebuilds the whole grid from the
      // newly-ordered stages); on failure, the SAME existing error banner,
      // no reload. Drag-and-drop is out of scope for this grid (AC5 never
      // required it) -- only the up/down buttons remain.
      'if(list){' +
        'list.addEventListener("click",function(ev){' +
          'var btn=ev.target.closest&&ev.target.closest(".sw-stage-move");' +
          'if(!btn||btn.disabled)return;' +
          'var id=btn.getAttribute("data-stage-id");' +
          'var direction=btn.getAttribute("data-direction");' +
          'var ids=Array.prototype.slice.call(list.querySelectorAll(".sw-cx-grid-cell--header")).map(function(c){return c.getAttribute("data-stage-id");});' +
          'var idx=ids.indexOf(id);' +
          'if(idx===-1)return;' +
          'var swapIdx=direction==="up"?idx-1:idx+1;' +
          'if(swapIdx<0||swapIdx>=ids.length)return;' +
          'var tmp=ids[idx];ids[idx]=ids[swapIdx];ids[swapIdx]=tmp;' +
          'submitJson("/journeys/"+journeyId+"/stages-order","PATCH",{stageIds:ids,_csrf:csrfToken})' +
            '.then(function(){window.location.reload();})' +
            '.catch(function(){' +
              'if(reorderError){' +
                'reorderError.textContent="Stage order not saved — please try again";' +
                'reorderError.classList.add("sw-stage-reorder-error--visible");' +
                'setTimeout(function(){reorderError.classList.remove("sw-stage-reorder-error--visible");},3000);' +
              '}' +
            '});' +
        '});' +
      '}' +
```

Then find the second, separate `jcxList` declaration (in the feature-picker IIFE) and replace:

```javascript
      'var jcxList=document.getElementById("sw-journey-stages");' +
```

→

```javascript
      'var jcxList=document.querySelector(".sw-stage-annotations--delivery.sw-delivery-swimlane-grid");' +
```

Everything else in that second IIFE (the `.sw-placeholder-add-cancel`/`.sw-placeholder-trigger` delegated handler on `jcxList`) is unchanged — only its target element changes.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-jae-s5-delivery-swimlane-grid.js
```

Expected output: `[jae-s5-delivery-swimlane-grid] Results: 10 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same pass profile as Task 2's own Step 5 (only the pre-existing flake, if it recurs).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-jae-s5-delivery-swimlane-grid.js
git commit -m "fix: rewrite stage reorder as reload-on-success, retarget list/jcxList to the new grid"
```

---

## Task 4: Remove `#sw-journey-stages`, its `stagesHtml` card-loop, and its 2 dead CSS rules

**Files:**
- Modify: `src/web-ui/routes/journeys.js`

- [ ] **Step 1: Write the failing test**

Add to `tests/check-jae-s5-delivery-swimlane-grid.js`, immediately after the AC5 reorder-mechanism block:

```javascript
  // -- Architecture Constraints: #sw-journey-stages and its dead CSS are
  //    actually deleted, not left as unused markup (decisions.md 2026-10-15) --
  try {
    const source = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys.js'), 'utf8');
    assert.ok(source.indexOf('id="sw-journey-stages"') === -1,
      'expected the #sw-journey-stages element itself to be removed from bodyContent');
    assert.ok(source.indexOf('var stagesHtml') === -1,
      'expected the stagesHtml card-loop variable to be removed, not left unused');
    assert.ok(source.indexOf('.sw-journey-canvas--view-canvas #sw-journey-stages{display:none}') === -1,
      'expected the first dead display:none CSS rule to be removed');
    assert.ok(source.indexOf('.sw-journey-canvas--view-customer-experience #sw-journey-stages{display:none}') === -1,
      'expected the second dead display:none CSS rule to be removed');
    pass('Architecture Constraints: #sw-journey-stages and its 2 dead CSS rules are fully removed');
  } catch (e) { fail('Architecture Constraints: #sw-journey-stages and its 2 dead CSS rules are fully removed', e); }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-jae-s5-delivery-swimlane-grid.js
```

Expected output: this new check fails — the old element, variable, and CSS rules are all still present.

- [ ] **Step 3: Write the implementation**

Delete the entire `stagesHtml` variable assignment (from the comment `// AC4: each saved stage renders with its name...` through the closing `: '<p class="sw-journey-stages-empty">No stages yet. Add your first stage.</p>';` — this is the block at approximately lines 1226–1270 of the pre-Task-1 file; line numbers will have shifted after Tasks 1–3's edits, so locate it by its own unique content, not a line number).

Delete this one line from `bodyContent`:

```javascript
      '<div class="sw-journey-stages" id="sw-journey-stages">' +
        stagesHtml +
      '</div>' +
```

(This was already replaced by the new Delivery-grid wrapper div in Task 2 — if Task 2 already removed it, skip this step. Confirm by searching for `id="sw-journey-stages"` in the current file state before editing.)

Delete these 2 exact CSS lines (and their own explanatory comment lines immediately above the second one, since the comment only makes sense while the rule exists):

```javascript
      '.sw-journey-canvas--view-canvas #sw-journey-stages{display:none}' +
```

```javascript
      // jcx-s6 -- #sw-journey-stages is now also hidden in the
      // customer-experience view (mirrors the canvas-view rule above): the
      // per-stage CX annotation blocks it used to carry are gone, replaced
      // entirely by the swimlane grid below.
      '.sw-journey-canvas--view-customer-experience #sw-journey-stages{display:none}' +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-jae-s5-delivery-swimlane-grid.js
```

Expected output: `[jae-s5-delivery-swimlane-grid] Results: 11 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same pass profile as before — specifically re-confirm `check-jcx-s6-swimlane-grid.js` and the full CX E2E suite still pass (the CX grid shares no markup with what was just deleted, but this is the final confirmation after every edit in this story).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-jae-s5-delivery-swimlane-grid.js
git commit -m "chore: remove #sw-journey-stages, stagesHtml, and its 2 dead CSS rules"
```

---

## Task 5: E2E spec — AC1 column alignment and AC8 pinned-label scroll

**Files:**
- Create: `tests/e2e/jae-s5-delivery-swimlane-grid.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
// jae-s5-delivery-swimlane-grid.spec.js -- E2E coverage for AC1 (column
// alignment) and AC8 (pinned-label horizontal scroll) of story
// artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
//
// NOT in npm test chain (ADR-018, matching jcx-s6/jcx-s3/ic-s2/ic-s3/ic-s4's
// own precedent) -- run with:
//   npx playwright test tests/e2e/jae-s5-delivery-swimlane-grid.spec.js
//
// Modelled directly on tests/e2e/jcx-s6-swimlane-grid.spec.js's own AC1/AC7
// tests -- same fixture, same assertions, different view toggle and row
// selectors.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'jae-s5-' + label + '-' + Date.now();
}

function extractCsrfToken(html) {
  const hiddenInput = html.match(/name="_csrf" value="([^"]*)"/);
  if (hiddenInput) return hiddenInput[1];
  const jsVar = html.match(/var csrfToken=("(?:[^"\\]|\\.)*")/);
  return jsVar ? JSON.parse(jsVar[1]) : null;
}

async function seedJourneyWithStages(request, journeyName, stageNames) {
  const homeHtml = await (await request.get('/')).text();
  const homeCsrf = extractCsrfToken(homeHtml);
  expect(homeCsrf, 'the authenticated home page must embed a usable CSRF token').toBeTruthy();

  const journeyRes = await request.post('/journeys', {
    data: { name: journeyName, _csrf: homeCsrf },
    headers: { 'Content-Type': 'application/json' },
    maxRedirects: 0
  });
  const journeyId = journeyRes.headers()['location'].split('/journeys/')[1];
  const canvasHtml = await (await request.get('/journeys/' + journeyId)).text();
  const canvasCsrf = extractCsrfToken(canvasHtml);
  const stageIds = [];
  for (const name of stageNames) {
    const stageRes = await request.post('/journeys/' + journeyId + '/stages', {
      data: { name: name, _csrf: canvasCsrf },
      headers: { 'Content-Type': 'application/json' }
    });
    const stageBody = await stageRes.json();
    stageIds.push(stageBody.id);
  }
  return { journeyId, csrfToken: canvasCsrf, stageIds };
}

async function openDeliveryView(page, journeyId) {
  await page.goto('/journeys/' + journeyId);
  await page.locator('.sw-canvas-view-toggle-btn[data-view="delivery"]').click();
}

withAuth('Delivery grid stages render left-to-right as columns, aligned across rows (AC1)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId } = await seedJourneyWithStages(request, uniqueName('journey'), ['Evaluate', 'Discover', 'Purchase']);

  await openDeliveryView(page, journeyId);
  await page.waitForSelector('.sw-delivery-swimlane-grid');

  const headers = page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-cell--header');
  await expect(headers).toHaveCount(3);
  const xs = [];
  for (let i = 0; i < 3; i++) {
    const box = await headers.nth(i).boundingBox();
    xs.push(box.x);
  }
  expect(xs[0], 'expected Evaluate to render left of Discover').toBeLessThan(xs[1]);
  expect(xs[1], 'expected Discover to render left of Purchase').toBeLessThan(xs[2]);

  const coverageCells = page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-row--coverage-status .sw-cx-grid-cell');
  await expect(coverageCells).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const headerBox = await headers.nth(i).boundingBox();
    const coverageBox = await coverageCells.nth(i).boundingBox();
    expect(Math.abs(headerBox.x - coverageBox.x), 'expected stage ' + i + "'s own coverage-status cell to share its header column's X position").toBeLessThan(2);
  }
});

withAuth('many-stage Delivery grid scrolls horizontally with row labels pinned, keyboard-operable (AC8)', async ({ page }) => {
  const request = page.context().request;
  const stageNames = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
  const { journeyId } = await seedJourneyWithStages(request, uniqueName('journey'), stageNames);

  await page.setViewportSize({ width: 1280, height: 800 });
  await openDeliveryView(page, journeyId);
  await page.waitForSelector('.sw-delivery-swimlane-grid');

  const track = page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-row--mapped-features .sw-cx-grid-row-track');
  const scrollWidth = await track.evaluate(el => el.scrollWidth);
  const clientWidth = await track.evaluate(el => el.clientWidth);
  expect(scrollWidth, 'expected an 8-stage journey to overflow its track at a 1280px viewport').toBeGreaterThan(clientWidth);

  const labelBefore = await page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-row--mapped-features .sw-cx-row-label').boundingBox();
  await track.evaluate(el => { el.scrollLeft = 300; });
  const labelAfter = await page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-row--mapped-features .sw-cx-row-label').boundingBox();
  expect(Math.abs(labelBefore.x - labelAfter.x), 'expected the row label to stay pinned after scrolling the track').toBeLessThan(2);

  await track.focus();
  await expect(track).toBeFocused();
});
```

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/jae-s5-delivery-swimlane-grid.spec.js
```

Expected output: both tests fail — `.sw-delivery-swimlane-grid` does not exist until Task 2 ships (if run before Task 2) or `.sw-cx-grid-row--coverage-status`/`--mapped-features` row classes don't match yet (if the row-class naming differs from what Task 2 actually implemented — reconcile naming before this step, don't silently rename in the test to make it pass).

- [ ] **Step 3: No new implementation — this task validates Tasks 1–4's own work**

This spec exercises code already written in Tasks 1–4. No source changes in this step; if the test fails for a reason OTHER than "not implemented yet" (e.g. a selector typo, a row-class name mismatch), fix the spec or the source to match whichever is actually correct per the story's ACs — do not change an AC's own meaning to make a test pass.

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/jae-s5-delivery-swimlane-grid.spec.js
```

Expected output: 2 passed.

- [ ] **Step 5: Run the full E2E suite for this feature — no regressions**

```bash
npx playwright test tests/e2e/jcx-s6-swimlane-grid.spec.js tests/e2e/jae-s5-delivery-swimlane-grid.spec.js
```

Expected output: 6 passed (4 from `jcx-s6`, 2 from `jae-s5`).

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/jae-s5-delivery-swimlane-grid.spec.js
git commit -m "test: add E2E coverage for jae-s5's column alignment and pinned-label scroll"
```

---

## After all tasks: `/verify-completion`

Run the full test command, walk through `verification-scripts/jae-s5-verification.md` end to end (all 8 scenarios + the single-stage edge case), and confirm every AC against the story before `/branch-complete` opens the draft PR.
