#!/usr/bin/env node
/**
 * check-wsd-s1-advance-core-extraction.js
 *
 * Tests for wsd-s1 — extract cli-advance.js's field-parsing/validation and
 * state-mutation logic into a reusable, state-object-based applyAdvance()
 * function, with advance() becoming a thin file-I/O wrapper around it.
 *
 * Covers: T3-T9 (T1/T2 are regression re-runs of the pre-existing
 * check-pcr-s1-pipeline-state-scope.js and check-shr1-schema-harness.js
 * files against the refactored cli-advance.js, not duplicated here).
 *
 * Run: node tests/check-wsd-s1-advance-core-extraction.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const { advance, applyAdvance } = require('../src/enforcement/cli-advance');

const root = path.join(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok() { totalPassed++; }
function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}
function assert(label, condition, message) {
  if (condition) { ok(); } else { fail(label, message); }
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix + '-'));
}
function rmDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}
function writeFile(dir, relPath, content) {
  const abs = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function makeFixtureState() {
  return {
    schemaVersion: '1',
    features: [
      {
        slug: 'test-feat',
        id: 'test-feat',
        updatedAt: 'T0',
        stories: [
          { id: 's1', slug: 's1', dorStatus: 'not-started', updatedAt: 'T0' },
        ],
      },
      {
        slug: 'test-feat-epics',
        id: 'test-feat-epics',
        updatedAt: 'T0',
        epics: [
          {
            slug: 'ep1',
            stories: [
              { id: 'ep1-s1', slug: 'ep1-s1', dorStatus: 'not-started', updatedAt: 'T0' },
            ],
          },
        ],
      },
    ],
  };
}

console.log('\n[wsd-s1] applyAdvance() core extraction tests\n');

// ── T3: applyAdvance() mutates an in-memory fixture and returns { exitCode, state } ──
(function T3() {
  const state = makeFixtureState();
  const result = applyAdvance(state, 'test-feat', 's1', ['dorStatus=signed-off']);
  assert('T3-exitcode', result.exitCode === 0, `expected exitCode 0, got ${result.exitCode}`);
  const story = result.state.features[0].stories[0];
  assert('T3-mutation', story.dorStatus === 'signed-off', `expected dorStatus=signed-off, got ${story.dorStatus}`);
  assert('T3-same-ref', result.state === state, 'expected returned state to be the same object reference as the input (in-place mutation)');
})();

// ── T4: invalid enum value rejected, state left unmutated ──
(function T4() {
  const state = makeFixtureState();
  const before = JSON.stringify(state);
  const result = applyAdvance(state, 'test-feat', 's1', ['dorStatus=not-a-real-status']);
  assert('T4-exitcode', result.exitCode === 8, `expected exitCode 8, got ${result.exitCode}`);
  assert('T4-stderr', /Invalid value/.test(result.stderr), `expected descriptive stderr, got "${result.stderr}"`);
  assert('T4-no-mutation', JSON.stringify(state) === before, 'expected state to be unmutated after a rejected update');
})();

// ── T5: epic-nested story resolution ──
(function T5() {
  const state = makeFixtureState();
  const result = applyAdvance(state, 'test-feat-epics', 'ep1-s1', ['dorStatus=signed-off']);
  assert('T5-exitcode', result.exitCode === 0, `expected exitCode 0, got ${result.exitCode}`);
  const story = result.state.features[1].epics[0].stories[0];
  assert('T5-mutation', story.dorStatus === 'signed-off', `expected epic-nested story dorStatus=signed-off, got ${story.dorStatus}`);
})();

// ── T6: prototype-pollution guard ──
(function T6() {
  const state = makeFixtureState();
  const result = applyAdvance(state, 'test-feat', 's1', ['__proto__=pwned']);
  assert('T6-exitcode', result.exitCode === 8, `expected exitCode 8, got ${result.exitCode}`);
  assert('T6-stderr', /prototype pollution/.test(result.stderr), `expected prototype pollution message, got "${result.stderr}"`);
})();

// ── T7: boolean coercion ──
(function T7() {
  const state = makeFixtureState();
  const result = applyAdvance(state, 'test-feat', 's1', ['releaseReady=true']);
  assert('T7-exitcode', result.exitCode === 0, `expected exitCode 0, got ${result.exitCode}`);
  const story = result.state.features[0].stories[0];
  assert('T7-boolean-type', story.releaseReady === true, `expected releaseReady to be boolean true, got ${typeof story.releaseReady} ${story.releaseReady}`);
})();

// ── T8: no-match storyId creates a new story record, storyWasCreated is a real field ──
(function T8() {
  const state = makeFixtureState();
  const result = applyAdvance(state, 'test-feat', 'brand-new-story', ['dorStatus=signed-off']);
  assert('T8-exitcode', result.exitCode === 0, `expected exitCode 0, got ${result.exitCode}`);
  assert('T8-created-flag', result.storyWasCreated === true, `expected storyWasCreated === true on the result object, got ${result.storyWasCreated}`);
  const created = result.state.features[0].stories.find((s) => s.id === 'brand-new-story');
  assert('T8-created-story', !!created, 'expected a new story record to be pushed into feature.stories');
})();

// ── T9: advance() end-to-end against a real temp file — thin-wrapper behaviour ──
(function T9() {
  const dir = makeTempDir('wsd-s1-advance-e2e');
  try {
    writeFile(dir, '.github/pipeline-state.json', JSON.stringify(makeFixtureState(), null, 2) + '\n');
    const result = advance('test-feat', 's1', ['dorStatus=signed-off'], dir);
    assert('T9-exitcode', result.exitCode === 0, `expected exitCode 0, got ${result.exitCode}`);
    assert('T9-stdout', /Advanced: test-feat\/s1/.test(result.stdout), `expected stdout to describe the advance, got "${result.stdout}"`);
    const onDisk = JSON.parse(fs.readFileSync(path.join(dir, '.github', 'pipeline-state.json'), 'utf8'));
    const story = onDisk.features[0].stories[0];
    assert('T9-disk-mutation', story.dorStatus === 'signed-off', `expected on-disk dorStatus=signed-off, got ${story.dorStatus}`);

    // Invalid field: advance() must still return exitCode 8, and must NOT write anything.
    writeFile(dir, '.github/pipeline-state.json', JSON.stringify(makeFixtureState(), null, 2) + '\n');
    const beforeRaw = fs.readFileSync(path.join(dir, '.github', 'pipeline-state.json'), 'utf8');
    const badResult = advance('test-feat', 's1', ['dorStatus=bogus'], dir);
    assert('T9-invalid-exitcode', badResult.exitCode === 8, `expected exitCode 8 for invalid field, got ${badResult.exitCode}`);
    const afterRaw = fs.readFileSync(path.join(dir, '.github', 'pipeline-state.json'), 'utf8');
    assert('T9-invalid-no-write', beforeRaw === afterRaw, 'expected no disk write when applyAdvance rejects the update');
  } finally {
    rmDir(dir);
  }
})();

console.log(`[wsd-s1] ${totalPassed} passed, ${totalFailed} failed\n`);
if (issues.length > 0) {
  console.log(issues.join('\n'));
  console.log('');
}
process.exit(totalFailed === 0 ? 0 : 1);
