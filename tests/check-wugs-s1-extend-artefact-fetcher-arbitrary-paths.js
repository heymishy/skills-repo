'use strict';
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
