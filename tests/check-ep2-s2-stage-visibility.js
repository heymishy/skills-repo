'use strict';
// tests/check-ep2-s2-stage-visibility.js — Part 1
const assert = require('assert');
const stageVisibility = require('../src/web-ui/modules/stage-visibility');

function testEngineerDefaultView() {
  const visible = stageVisibility.getVisibleStages('engineer');
  assert.deepStrictEqual(visible, ['test-plan', 'review', 'definition-of-ready']);
}
testEngineerDefaultView();
console.log('  ok - engineer default view is test-plan/review/definition-of-ready');

function testProductDefaultView() {
  const visible = stageVisibility.getVisibleStages('product');
  assert.deepStrictEqual(visible, ['discovery', 'benefit-metric', 'definition']);
}
testProductDefaultView();
console.log('  ok - product default view is discovery/benefit-metric/definition');

function testConductorSeesAllStages() {
  const visible = stageVisibility.getVisibleStages('conductor');
  assert.deepStrictEqual(visible, stageVisibility.ALL_STAGES);
}
testConductorSeesAllStages();
console.log('  ok - conductor sees all 8 stages');

function testArchitectSeesAllStages() {
  const visible = stageVisibility.getVisibleStages('architect');
  assert.deepStrictEqual(visible, stageVisibility.ALL_STAGES);
}
testArchitectSeesAllStages();
console.log('  ok - architect sees all 8 stages');

function testUnknownRoleDefaultsToAllStages() {
  const visible = stageVisibility.getVisibleStages('some-unknown-role');
  assert.deepStrictEqual(visible, stageVisibility.ALL_STAGES);
}
testUnknownRoleDefaultsToAllStages();
console.log('  ok - unknown role defaults to all stages (fail-open, never fail-hidden)');
