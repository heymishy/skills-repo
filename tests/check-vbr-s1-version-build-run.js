#!/usr/bin/env node
// check-vbr-s1-version-build-run.js -- AC verification for vbr-s1
// (version.json records the GitHub Actions run that built the image:
// buildRunId from GITHUB_RUN_ID, buildRunAttempt from GITHUB_RUN_ATTEMPT).
// Records the build run only, never a "tests passed" claim.
'use strict';

const { buildVersionInfo } = require('../scripts/write-version-file');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

// Run fn with the given env overrides, then restore the originals.
function withEnv(overrides, fn) {
  const saved = {};
  for (const k of Object.keys(overrides)) {
    saved[k] = process.env[k];
    if (overrides[k] === undefined) delete process.env[k];
    else process.env[k] = overrides[k];
  }
  try { return fn(); }
  finally {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

console.log('check-vbr-s1-version-build-run');

// T1 (AC1): GITHUB_RUN_ID becomes buildRunId
withEnv({ GITHUB_RUN_ID: '1234567890', GITHUB_RUN_ATTEMPT: '2', GITHUB_SHA: 'a'.repeat(40) }, () => {
  const info = buildVersionInfo();
  ok(info.buildRunId === '1234567890', 'T1 (AC1): buildRunId equals GITHUB_RUN_ID');
});

// T2 (AC2): GITHUB_RUN_ATTEMPT becomes buildRunAttempt
withEnv({ GITHUB_RUN_ID: '1234567890', GITHUB_RUN_ATTEMPT: '2', GITHUB_SHA: 'a'.repeat(40) }, () => {
  const info = buildVersionInfo();
  ok(info.buildRunAttempt === '2', 'T2 (AC2): buildRunAttempt equals GITHUB_RUN_ATTEMPT');
});

// T3 (AC3): both null when the variables are absent
withEnv({ GITHUB_RUN_ID: undefined, GITHUB_RUN_ATTEMPT: undefined, GITHUB_SHA: 'b'.repeat(40) }, () => {
  const info = buildVersionInfo();
  ok(info.buildRunId === null && info.buildRunAttempt === null,
    'T3 (AC3): buildRunId and buildRunAttempt are null when unset');
});

// T4 (AC4): existing fields keep their names and types
withEnv({ GITHUB_RUN_ID: '42', GITHUB_RUN_ATTEMPT: '1', GITHUB_SHA: 'c'.repeat(40) }, () => {
  const info = buildVersionInfo();
  const existing = typeof info.sha === 'string' && typeof info.shortSha === 'string' &&
    (info.prNumber === null || typeof info.prNumber === 'number') &&
    typeof info.commitSubject === 'string' && typeof info.deployedAt === 'string';
  ok(existing, 'T4 (AC4): sha, shortSha, prNumber, commitSubject and deployedAt are unchanged');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
