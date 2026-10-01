#!/usr/bin/env node
/**
 * check-ep2-s1-signals-panel.js -- AC verification for ep2-s1
 * (signals panel: render real signals in a web UI page).
 *
 * Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
 * Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s1-test-plan.md
 *
 * Run: node tests/check-ep2-s1-signals-panel.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const assert = require('assert');
const { renderSignalsPanel } = require('../src/web-ui/views/signals-panel-view');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

const FIXTURE_SIGNALS = [
  { id: 's1', source: 'capture-log', type: 'decision', text: 'Use flat stories array', timestamp: '2026-09-30', cta: { label: 'Review', skill: '/improve' } },
  { id: 's2', source: 'pipeline-state', type: 'feature-status', text: 'ep2 -- stage: definition', timestamp: '2026-10-01', cta: { label: 'Open feature', skill: '/workflow' } },
];

const PARSE_ERROR_FIXTURE = { id: 's3', source: 'parse-error', type: 'parse-error', text: 'learnings.md: unexpected token', timestamp: '2026-10-01T00:00:00.000Z', cta: { label: 'Review', skill: '/improve' } };

(async function main() {

  await test('AC1: every real signal field (text/source/type) renders', function() {
    const html = renderSignalsPanel(FIXTURE_SIGNALS, 'csrf-abc');
    FIXTURE_SIGNALS.forEach(function(s) {
      assert.ok(html.includes(s.text), 'expected signal text "' + s.text + '" in output');
      assert.ok(html.includes(s.source), 'expected signal source "' + s.source + '" in output');
      assert.ok(html.includes(s.type), 'expected signal type "' + s.type + '" in output');
    });
  });

  await test('AC2: each signal\'s own cta.label renders, not a hardcoded string', function() {
    const html = renderSignalsPanel(FIXTURE_SIGNALS, 'csrf-abc');
    assert.ok(html.includes('>Review<'), 'expected default cta label "Review"');
    assert.ok(html.includes('>Open feature<'), 'expected non-default cta label "Open feature" (not hardcoded to "Review")');
    assert.ok(html.includes('action="/api/skills/improve/sessions"'), 'expected form action targeting the default cta.skill');
    assert.ok(html.includes('action="/api/skills/workflow/sessions"'), 'expected form action targeting the non-default cta.skill (real call site value, not invented)');
  });

  await test('AC2: hidden fields carry the signal\'s own full content for ep2-s2\'s own seeding bridge', function() {
    const html = renderSignalsPanel(FIXTURE_SIGNALS, 'csrf-abc');
    assert.ok(html.includes('name="signalSource" value="capture-log"'));
    assert.ok(html.includes('name="signalType" value="decision"'));
    assert.ok(html.includes('name="signalText" value="Use flat stories array"'));
    assert.ok(html.includes('name="signalTimestamp" value="2026-09-30"'));
  });

  await test('AC3: empty signal list shows a clear empty state, not a blank page', function() {
    const html = renderSignalsPanel([], 'csrf-abc');
    assert.ok(html.includes('No signals yet'), 'expected empty-state message');
    assert.ok(!html.includes('<form'), 'expected no list-item/form markup when there are no signals');
  });

  await test('AC4: parse-error signals carry a distinguishing marker; normal signals do not', function() {
    const html = renderSignalsPanel(FIXTURE_SIGNALS.concat([PARSE_ERROR_FIXTURE]), 'csrf-abc');
    assert.ok(html.includes('data-signal-type="parse-error"'), 'expected the parse-error item to carry its own distinguishing data attribute');
    const normalSignalBlock = html.split('data-signal-type="parse-error"')[0];
    assert.ok(!normalSignalBlock.includes('border-left:3px solid'), 'expected the parse-error-only inline style to not appear before the parse-error item itself');
  });

  await test('Security: signal text is escaped via escHtml (no raw HTML injection)', function() {
    const malicious = [{ id: 's4', source: 'test', type: 'note', text: '<script>alert(1)</script>', timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    const html = renderSignalsPanel(malicious, 'csrf-abc');
    assert.ok(!html.includes('<script>alert(1)</script>'), 'expected signal text to be HTML-escaped, not injected raw');
    assert.ok(html.includes('&lt;script&gt;'), 'expected the escaped form to be present');
  });

  await test('NFR-Performance: renderSignalsPanel renders well within the stated <100ms budget (server-side render time, not full browser navigation)', function() {
    const start = process.hrtime.bigint();
    renderSignalsPanel(FIXTURE_SIGNALS, 'csrf-abc');
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    assert.ok(elapsedMs < 100, 'expected renderSignalsPanel to complete in <100ms, took ' + elapsedMs.toFixed(2) + 'ms');
  });

  await test('NFR-Security: no new runtime dependency added (new source files require only already-listed deps or Node builtins)', function() {
    const fs = require('fs');
    const path = require('path');
    const builtins = new Set(require('module').builtinModules);
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const allowedDeps = new Set(Object.keys(pkg.dependencies || {}));

    const newFiles = [
      path.join(__dirname, '..', 'src', 'web-ui', 'views', 'signals-panel-view.js'),
      path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'signals-panel.js'),
    ];

    newFiles.forEach(function(filePath) {
      if (!fs.existsSync(filePath)) return; // not yet implemented (later task) -- nothing to verify yet
      const content = fs.readFileSync(filePath, 'utf8');
      const requireRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
      let match;
      while ((match = requireRe.exec(content))) {
        const moduleName = match[1];
        if (moduleName.startsWith('.') || moduleName.startsWith('/')) continue; // relative/local import, not a dependency
        const normalized = moduleName.startsWith('node:') ? moduleName.slice(5) : moduleName;
        const pkgName = normalized.startsWith('@') ? normalized.split('/').slice(0, 2).join('/') : normalized.split('/')[0];
        assert.ok(
          builtins.has(pkgName) || allowedDeps.has(pkgName),
          'expected no new runtime dependency; found require("' + moduleName + '") not in package.json dependencies and not a Node builtin'
        );
      }
    });
  });

  console.log('\n[ep2-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[ep2-s1] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
