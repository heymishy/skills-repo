'use strict';
// tests/check-dsa-s1-token-values.js -- AC1, AC2 (token-value groundwork)
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const htmlShellSrc = fs.readFileSync(
  path.resolve(__dirname, '../src/web-ui/utils/html-shell.js'), 'utf8'
);

function testNewAliasesPresentBothModes() {
  assert.ok(/--success:\s*#\w{6}/.test(htmlShellSrc), '--success alias missing');
  assert.ok(/--warn:\s*#\w{6}/.test(htmlShellSrc), '--warn alias missing');
  assert.ok(/--danger:\s*#\w{6}/.test(htmlShellSrc), '--danger alias missing');
}
function testOldNamesStillPresent() {
  assert.ok(/--green:\s*#\w{6}/.test(htmlShellSrc), '--green must still exist (do not remove/rename)');
  assert.ok(/--amber:\s*#\w{6}/.test(htmlShellSrc), '--amber must still exist (do not remove/rename)');
  assert.ok(/--red:\s*#\w{6}/.test(htmlShellSrc), '--red must still exist (do not remove/rename)');
}
function testNewTokensSurfaceTwoAndMuted3Present() {
  assert.ok(/--surface-2:\s*#\w{6}/.test(htmlShellSrc), '--surface-2 missing (new token, did not exist before)');
  assert.ok(/--muted-3:\s*#\w{6}/.test(htmlShellSrc), '--muted-3 missing (new token, did not exist before)');
}
function testSansFontUpdatedToInterTight() {
  assert.ok(/--sans:\s*'Inter Tight'/.test(htmlShellSrc), "--sans must be updated to 'Inter Tight' per DESIGN.md");
}

testNewAliasesPresentBothModes();
testOldNamesStillPresent();
testNewTokensSurfaceTwoAndMuted3Present();
testSansFontUpdatedToInterTight();
console.log('  ok - all dsa-s1 token checks passed');
