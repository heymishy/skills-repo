'use strict';
// sep-s1 -- Scenario A and B end-to-end jobs test the pull request's own build, and promotion waits for the post-deploy run.
// Reads the workflow files as text; no network. Plain Node script. Run: node tests/check-sep-s1-scenarios-on-pr-build.js
// Story: artefacts/2026-11-17-scenario-e2e-on-pr-build/stories/sep-s1-scenario-e2e-on-the-pr-build.md
// Test plan: artefacts/2026-11-17-scenario-e2e-on-pr-build/test-plans/sep-s1-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const e2e = fs.readFileSync(path.join(root, '.github', 'workflows', 'e2e.yml'), 'utf8');
const deploy = fs.readFileSync(path.join(root, '.github', 'workflows', 'staging-deploy.yml'), 'utf8');

// The text of one top-level job: from "  <id>:" to the next two-space-indented key (comments dropped).
function jobText(source, id) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex(function (l) { return l === '  ' + id + ':'; });
  assert.ok(start !== -1, 'job ' + id + ' not found');
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).filter(function (l) { return !/^\s*#/.test(l); }).join('\n');
}
const jobIds = (e2e.match(/^  [A-Za-z0-9_-]+:\s*$/gm) || []).map(function (s) { return s.trim().slice(0, -1); });
function jobByName(name) {
  const id = jobIds.find(function (j) { return new RegExp('^    name: ' + name.replace(/[()]/g, '\\$&') + '\\s*$', 'm').test(jobText(e2e, j)); });
  assert.ok(id, 'no job in e2e.yml is named "' + name + '"');
  return jobText(e2e, id);
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const A = 'Scenario A E2E (staging)';
const B = 'Scenario B E2E (staging)';

test('T1 both jobs keep their names and boot the PR\'s own server with the hermetic setup (AC1)', function () {
  [A, B].forEach(function (name) {
    const j = jobByName(name);
    assert.ok(/^    services:/m.test(j) && /image: postgres/.test(j), name + ': no postgres service container');
    assert.ok(/node src\/web-ui\/server\.js/.test(j), name + ': does not start the PR\'s server');
    assert.ok(/MOCK_LLM_GATEWAY:\s*'?true'?|MOCK_LLM_GATEWAY=true/.test(j), name + ': mock gateway is not switched on');
    assert.ok(/openssl rand|randomBytes/.test(j), name + ': no per-run generated stub secret');
    assert.ok(/E2E_STAGING_BASE_URL[:=]\s*'?http:\/\/localhost/.test(j), name + ': base url is not http://localhost (the Secure session cookie is only sent back to a localhost name)');
  });
});

test('T2 neither job touches shared staging: no staging secret, no deploy-group; B does not wait for A (AC2)', function () {
  [A, B].forEach(function (name) {
    const j = jobByName(name);
    ['secrets.E2E_STAGING_BASE_URL', 'secrets.STAGING_DATABASE_URL', 'secrets.E2E_STAGING_AUTH_STUB_SECRET', 'secrets.E2E_STAGING_ADMIN_PASSWORD', 'deploy-group'].forEach(function (needle) {
      assert.ok(j.indexOf(needle) === -1, name + ' still references ' + needle);
    });
  });
  assert.ok(!/^    needs:/m.test(jobByName(B)), 'Scenario B still has a needs: line');
});

test('T3 the spec lists and the opt-in flags are unchanged (AC3)', function () {
  const a = jobByName(A);
  const aCmd = (a.match(/npx playwright test ([^\n]*)/) || [])[1] || '';
  const aSpecs = (aCmd.match(/tests\/e2e\/[\w.-]+\.spec\.js/g) || []).sort();
  assert.deepStrictEqual(aSpecs, ['tests/e2e/a1-staging-auth-stub.spec.js', 'tests/e2e/a2-stripe-test-mode-plan-selection.spec.js', 'tests/e2e/a3-product-feature-ideate-canvas.spec.js', 'tests/e2e/a4-ideate-session-resume.spec.js', 'tests/e2e/dsh-s4-resume-conversation-survives-restart.spec.js']);
  assert.ok(/--workers=1/.test(aCmd), 'Scenario A lost --workers=1');
  const b = jobByName(B);
  const bCmd = (b.match(/npx playwright test ([^\n]*)/) || [])[1] || '';
  assert.deepStrictEqual((bCmd.match(/tests\/e2e\/[\w.-]+\.spec\.js/g) || []), ['tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js']);
  assert.ok(a.indexOf('staging_e2e_scenario_a') !== -1 && b.indexOf('staging_e2e_scenario_b') !== -1, 'the context.yml flags are no longer read');
});

test('T4 promotion needs smoke-test and the post-deploy confirmation, with no override; the guards still pass (AC4)', function () {
  const p = jobText(deploy, 'promote-to-prod');
  const needs = (p.match(/^    needs:\s*((?:\n      - \S+|[^\n]+)+)/m) || [])[1] || '';
  assert.ok(/smoke-test/.test(needs) && /post-deploy-e2e-confirm/.test(needs), 'promote-to-prod needs: ' + needs);
  assert.ok(!/^    if:/m.test(p), 'promote-to-prod has an if: override');
  ['scripts/check-no-prod-deploy-on-push.js', 'tests/check-bri-s2.6-smoke-test-promote-gate.js'].forEach(function (f) {
    const r = spawnSync(process.execPath, [path.join(root, f)], { cwd: root, encoding: 'utf8' });
    assert.strictEqual(r.status, 0, f + ' exited ' + r.status + ': ' + String(r.stdout + r.stderr).slice(-400));
  });
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[sep-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[sep-s1] FAIL: ' + t.name + '\n    ' + String(e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[sep-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
