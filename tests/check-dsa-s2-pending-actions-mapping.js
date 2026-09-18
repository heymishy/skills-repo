'use strict';
// tests/check-dsa-s2-pending-actions-mapping.js -- AC5 (unit: mapping shape)
const assert = require('assert');
const { _mapPendingActionsForDashboard } = require('../src/web-ui/routes/dashboard');

function testMapsRealShapeToRenderDashboardShape() {
  var raw = {
    items: [
      { featureName: 'interactive-kanban-boards', artefactType: 'discovery', daysPending: 2, artefactUrl: '/features/x/discovery' },
      { featureName: 'streaming-live-draft', artefactType: 'test-plan', daysPending: 0, artefactUrl: '/features/y/test-plan' }
    ],
    bannerMessage: null
  };
  var result = _mapPendingActionsForDashboard(raw);
  assert.strictEqual(result.pendingActionsCount, 2);
  assert.strictEqual(result.actions.length, 2);
  assert.ok(result.actions[0].what.toLowerCase().includes('discovery'));
  assert.strictEqual(result.actions[0].feature, 'interactive-kanban-boards');
  assert.strictEqual(result.actions[0].you, true);
  assert.ok(/2d|2 day/i.test(result.actions[0].age));
  assert.ok(/today|0d/i.test(result.actions[1].age));
}

function testEmptyItemsMapsToEmptyActions() {
  var result = _mapPendingActionsForDashboard({ items: [], bannerMessage: null });
  assert.strictEqual(result.pendingActionsCount, 0);
  assert.deepStrictEqual(result.actions, []);
}

testMapsRealShapeToRenderDashboardShape();
console.log('  ok - maps real getPendingActions shape to renderDashboard actions shape');
testEmptyItemsMapsToEmptyActions();
console.log('  ok - empty items maps to empty actions, 0 count');
