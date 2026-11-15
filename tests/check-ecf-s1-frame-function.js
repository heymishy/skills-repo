'use strict';
// ecf-s1 -- every scrubbed stack frame carries a string function (and filename), because PostHog rejects a frame without one.
// Plain Node script. Run: node tests/check-ecf-s1-frame-function.js
// Story: artefacts/2026-11-16-exception-frame-function/stories/ecf-s1-frame-function.md
// Test plan: artefacts/2026-11-16-exception-frame-function/test-plans/ecf-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const ec = require('../src/web-ui/modules/error-capture');
const fixture = require('./fixtures/ecf-s1-posthog-frames.json');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const seed = 'ecf' + Math.random().toString(16).slice(2, 10);

function eventWithFrames(frames) {
  return { event: '$exception', distinctId: 'someone@example.com', properties: {
    $exception_list: [{ type: 'Error', value: 'boom ' + seed, mechanism: { handled: true }, stacktrace: { type: 'raw', frames } }],
    $exception_level: 'error', $lib: 'posthog-node', $lib_version: '5.40.0', $is_server: true, $geoip_disable: true,
    code: 'request_error', route: '/x' } };
}
const scrub = (frames) => ec.scrubEvent(eventWithFrames(frames), 'production');
const outFrames = (frames) => scrub(frames).properties.$exception_list[0].stacktrace.frames;

// The two consumer rules PostHog itself reported in $cymbal_errors: a string filename (sff-s1) and a string function (ecf-s1).
function everyFrameHasFilenameAndFunction(ev) {
  const list = ev && ev.properties && ev.properties.$exception_list;
  if (!Array.isArray(list) || !list.length) return false;
  return list.every(x => x && x.stacktrace && Array.isArray(x.stacktrace.frames) && x.stacktrace.frames.length > 0 &&
    x.stacktrace.frames.every(f => f && typeof f === 'object' && typeof f.filename === 'string' && typeof f.function === 'string'));
}

test('T1 an anonymous frame gets <anonymous> and keeps its other fields (AC1)', () => {
  const f = outFrames([{ colno: 39, filename: '/app/src/web-ui/server.js', in_app: true, lineno: 3775, platform: 'node:javascript' }])[0];
  assert.strictEqual(f.function, '<anonymous>');
  assert.strictEqual(f.filename, 'src/web-ui/server.js');
  assert.strictEqual(f.lineno, 3775); assert.strictEqual(f.colno, 39);
  assert.strictEqual(f.in_app, true); assert.strictEqual(f.platform, 'node:javascript');
});

test('T2 identifier-shaped names are kept unchanged (AC2)', () => {
  for (const name of ['handleGetResultHtml', 'Object.handle', 'process.processTicksAndRejections', 'res.writeHead', '_report5xx']) {
    assert.strictEqual(outFrames([{ filename: 'a.js', function: name }])[0].function, name, name);
  }
});

test('T3 other names become <anonymous> and the original text never appears (AC3)', () => {
  const c = 'canary-' + seed;
  const bad = ['a b', 'a@b', 'f for tenant ' + c, '/tenants/' + c + '/x.js', 'fn\n"' + c + '"', c + ' !'];
  for (const name of bad) {
    const ev = scrub([{ filename: 'a.js', function: name }]);
    assert.strictEqual(ev.properties.$exception_list[0].stacktrace.frames[0].function, '<anonymous>', JSON.stringify(name));
    assert.ok(!JSON.stringify(ev).includes(c), 'canary leaked for ' + JSON.stringify(name));
  }
});

test('T4 frames of any shape never throw and always yield string filename and function (AC4)', () => {
  const frames = [null, 'str', 42, [], {}, { function: 123 }, { function: null }, { function: '' }, { filename: 7 }, undefined];
  let ev;
  assert.doesNotThrow(() => { ev = scrub(frames); });
  assert.ok(ev, 'event must survive');
  assert.strictEqual(ev.properties.$exception_list[0].stacktrace.frames.length, frames.length);
  assert.strictEqual(everyFrameHasFilenameAndFunction(ev), true);
});

test('T5 the real captured shapes pass the consumer check; the previous logic fails it (AC5)', () => {
  assert.ok(fixture.frames.length >= 5);
  const scrubbed = scrub(fixture.frames.map(x => Object.assign({}, x)));
  assert.strictEqual(everyFrameHasFilenameAndFunction(scrubbed), true);
  // Negative control: the previous frame logic kept a function only when identifier-shaped and otherwise left the key out.
  const RE_IDENT = /^[A-Za-z_$][\w$.<>]{0,80}$/;
  const oldFrames = fixture.frames.map(f => {
    const g = { filename: typeof f.filename === 'string' ? f.filename : '[redacted]' };
    if (typeof f.function === 'string' && RE_IDENT.test(f.function)) g.function = f.function;
    return g;
  });
  const old = { properties: { $exception_list: [{ stacktrace: { frames: oldFrames } }] } };
  assert.strictEqual(everyFrameHasFilenameAndFunction(old), false, 'the old logic must fail the check on the real shapes');
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[ecf-s1-frame-function] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
