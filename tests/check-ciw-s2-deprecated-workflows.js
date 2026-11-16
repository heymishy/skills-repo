'use strict';
// ciw-s2 -- the Fleet Aggregation and GitHub Pages workflows are deprecated: manual trigger only, clearly marked.
// Plain Node script. Run: node tests/check-ciw-s2-deprecated-workflows.js
// Story: artefacts/2026-11-16-ci-regression-review/stories/ciw-s2-disable-fleet-aggregation-and-resolve-pages.md
// Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/ciw-s2-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const FLEET = read('.github/workflows/fleet-aggregation.yml');
const PAGES = read('.github/workflows/pages.yml');
const DASH_README = read('dashboards/README.md');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// The trigger names under the top-level `on:` key (no YAML dependency: the block runs until the next column-0 key).
function triggers(yaml) {
  const lines = yaml.split('\n');
  const start = lines.findIndex((l) => /^on:\s*$/.test(l));
  if (start === -1) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i]) && !/^#/.test(lines[i])) break;
    const m = lines[i].match(/^  ([A-Za-z_]+):/);
    if (m) out.push(m[1]);
  }
  return out;
}
// The leading comment block (comments and blank lines before the first key).
function header(yaml) {
  const out = [];
  for (const l of yaml.split('\n')) { if (/^#/.test(l) || l.trim() === '') out.push(l); else break; }
  return out.join('\n');
}
const usesOf = (yaml) => yaml.split('\n').map((l) => (l.match(/^\s*(?:-\s*)?uses:\s*(\S+)/) || [])[1]).filter(Boolean);
const secretsOf = (yaml) => Array.from(new Set((yaml.match(/secrets\.[A-Z0-9_]+/g) || []))).sort();

test('T0 the trigger extractor reads a current-style and a synthetic file correctly', () => {
  assert.deepStrictEqual(triggers('name: x\non:\n  push:\n    branches: [a]\n  schedule:\n    - cron: "0 * * * *"\n  workflow_dispatch:\njobs:\n  a:\n'), ['push', 'schedule', 'workflow_dispatch']);
  assert.deepStrictEqual(triggers('# c\non:\n  workflow_dispatch:\n\njobs:\n'), ['workflow_dispatch']);
  assert.strictEqual(triggers('name: no on key\n'), null);
});

test('T1 Fleet Aggregation is manual-only and marked DEPRECATED with the reason (AC1)', () => {
  const t = triggers(FLEET);
  assert.ok(t && t.indexOf('workflow_dispatch') !== -1, 'workflow_dispatch missing: ' + JSON.stringify(t));
  assert.ok(t.indexOf('push') === -1, 'push trigger still present');
  assert.ok(t.indexOf('schedule') === -1, 'schedule trigger still present');
  const h = header(FLEET);
  ['DEPRECATED', 'FLEET_PUSH_TOKEN', '2026-11-16'].forEach((w) => assert.ok(h.indexOf(w) !== -1, 'header lacks ' + w));
});

test('T2 the Pages deploy is manual-only and marked DEPRECATED with the reason (AC2)', () => {
  const t = triggers(PAGES);
  assert.ok(t && t.indexOf('workflow_dispatch') !== -1, 'workflow_dispatch missing: ' + JSON.stringify(t));
  assert.ok(t.indexOf('push') === -1, 'push trigger still present');
  const h = header(PAGES);
  ['DEPRECATED', 'Pages is not enabled', 'pipeline-state.json', '2026-11-16'].forEach((w) => assert.ok(h.indexOf(w) !== -1, 'header lacks ' + w));
});

test('T3 dashboards/README.md opens with a DEPRECATED banner about Pages (AC3)', () => {
  const top = DASH_README.split('\n').slice(0, 6).join('\n');
  assert.ok(top.indexOf('DEPRECATED') !== -1 && top.indexOf('Pages') !== -1, 'no banner in the first 6 lines: ' + top.slice(0, 120));
});

test('T4 no tabs, same jobs, same uses lines and same secret references (AC4)', () => {
  [FLEET, PAGES].forEach((y) => assert.ok(!/\t/.test(y), 'tab character found'));
  assert.ok(/^jobs:\n  aggregate:/m.test(FLEET), 'fleet job changed');
  assert.ok(/^jobs:\n  deploy:/m.test(PAGES), 'pages job changed');
  assert.deepStrictEqual(usesOf(FLEET), ['actions/checkout@v4', 'actions/setup-node@v4']);
  assert.deepStrictEqual(usesOf(PAGES), ['actions/checkout@v4', 'actions/configure-pages@v5', 'actions/upload-pages-artifact@v3', 'actions/deploy-pages@v4']);
  assert.deepStrictEqual(secretsOf(FLEET), ['secrets.FLEET_PUSH_TOKEN']);
  assert.deepStrictEqual(secretsOf(PAGES), []);
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[ciw-s2-deprecated-workflows] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
