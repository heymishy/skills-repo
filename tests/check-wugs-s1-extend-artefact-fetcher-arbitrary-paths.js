'use strict';
// check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js -- wugs-s1
//
// Tests the new fetchRepoPath adapter added to artefact-fetcher.js, which
// generalises the existing fetchArtefact() single-path fetch into an
// arbitrary file/folder read (needed by the guardrails/standards feature to
// read .github/architecture-guardrails.md and standards/ from a connected
// repo). This file grows task-by-task across wugs-s1's implementation plan:
// Task 1 covers only AC5 (unwired stub throws); later tasks add AC1-AC4/AC6.
const assert = require('assert');
let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

// Fresh require each time to reset the module's internal adapter state
function freshModule() {
  delete require.cache[require.resolve('../src/web-ui/adapters/artefact-fetcher')];
  return require('../src/web-ui/adapters/artefact-fetcher');
}

check('AC5: fetchRepoPath_unwired_throwsExplicitError', () => {
  const mod = freshModule();
  assert.throws(
    () => mod.fetchRepoPath('owner', 'repo', 'some/path', 'tok'),
    /Adapter not wired: fetchRepoPath/,
    'expected the unwired stub to throw immediately (synchronous), not return a rejected promise silently'
  );
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
