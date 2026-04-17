#!/usr/bin/env node
/**
 * check-p3.2b-attestation.js
 *
 * Automated tests for the tamper-evidence attestation publisher (p3.2b).
 *
 * Tests from the p3.2b test plan:
 *
 *   Unit (AC1 — hash computation):
 *   - computes-sha256-hash-of-trace-file-as-hex-string
 *
 *   Unit (AC2 — reproducibility):
 *   - sha256-hash-is-stable-across-sequential-computations-of-same-file
 *   - sha256-hash-differs-when-file-content-changes
 *
 *   Unit (AC4 — tamperEvidence object):
 *   - tamperEvidence-object-written-to-trace-file
 *   - tamperEvidence-registryType-is-github-artifact-attestation
 *   - tamperEvidence-registryRef-is-non-empty-string
 *   - tamperEvidence-publishedAt-is-ISO8601-timestamp
 *
 *   Integration (AC1 + AC4 — end-to-end with mocked publish):
 *   - post-merge-workflow-publishes-attestation-and-writes-tamperEvidence-to-trace
 *
 *   NFR (Security — OIDC, no PAT):
 *   - workflow-identity-uses-oidc-not-pat
 *
 * Run:  node tests/check-p3.2b-attestation.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, os, crypto) only.
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var os   = require('os');

var root = path.join(__dirname, '..');

var {
  computeTraceHash,
  writeBackTamperEvidence,
  publishAttestation,
} = require(path.join(root, 'scripts', 'attestation-publisher.js'));

// ── Test harness ──────────────────────────────────────────────────────────────

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name: name, reason: reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function assert(condition, name, reason) {
  if (condition) pass(name);
  else fail(name, reason);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p3.2b-test-'));

function writeTmpFile(name, content) {
  var p = path.join(tmpDir, name);
  fs.writeFileSync(p, content);
  return p;
}

// Pre-computed SHA-256 of "regulated trace content fixture\n"
// Used as a stable reference value for the hex format check.
var FIXTURE_CONTENT = 'regulated trace content fixture\n';

// ── Tests ─────────────────────────────────────────────────────────────────────

process.stdout.write('\ncheck-p3.2b-attestation\n\n');

// ── AC1 / AC2: Hash computation ───────────────────────────────────────────────

var fixturePath = writeTmpFile('fixture.jsonl', FIXTURE_CONTENT);

var hash1 = computeTraceHash(fixturePath);

assert(
  typeof hash1 === 'string' && /^[0-9a-f]{64}$/.test(hash1),
  'computes-sha256-hash-of-trace-file-as-hex-string',
  'Expected 64-char lowercase hex string, got: ' + hash1
);

// AC2: Stability — same file, same hash
var hash1b = computeTraceHash(fixturePath);
assert(
  hash1 === hash1b,
  'sha256-hash-is-stable-across-sequential-computations-of-same-file',
  'Hash changed between two calls on the same unmodified file'
);

// AC2: Sensitivity — different content → different hash
var fixturePathB = writeTmpFile('fixture-b.jsonl', FIXTURE_CONTENT + ' ');
var hashB = computeTraceHash(fixturePathB);
assert(
  hash1 !== hashB,
  'sha256-hash-differs-when-file-content-changes',
  'Expected different hash for different content; both returned: ' + hash1
);

// ── AC4: tamperEvidence write-back ────────────────────────────────────────────

var tracePath = writeTmpFile('story-trace.jsonl',
  '{"status":"completed","traceHash":"abc","verdict":"pass"}\n');

var mockEvidence = {
  registryType: 'github-artifact-attestation',
  registryRef:  'https://github.com/heymishy/skills-repo/attestations/1234',
  publishedAt:  '2026-04-19T10:00:00Z',
};

writeBackTamperEvidence(tracePath, mockEvidence);

var writtenContent = fs.readFileSync(tracePath, 'utf8');
var lines = writtenContent.trim().split('\n');
var lastLine = JSON.parse(lines[lines.length - 1]);

assert(
  lastLine.tamperEvidence !== undefined && lastLine.tamperEvidence !== null,
  'tamperEvidence-object-written-to-trace-file',
  'Expected tamperEvidence object in last JSONL line'
);

assert(
  lastLine.tamperEvidence && lastLine.tamperEvidence.registryType === 'github-artifact-attestation',
  'tamperEvidence-registryType-is-github-artifact-attestation',
  'Expected registryType "github-artifact-attestation", got: ' + (lastLine.tamperEvidence && lastLine.tamperEvidence.registryType)
);

assert(
  lastLine.tamperEvidence && typeof lastLine.tamperEvidence.registryRef === 'string' && lastLine.tamperEvidence.registryRef.length > 0,
  'tamperEvidence-registryRef-is-non-empty-string',
  'Expected non-empty registryRef string'
);

var parsedDate = new Date(lastLine.tamperEvidence && lastLine.tamperEvidence.publishedAt);
assert(
  !isNaN(parsedDate.getTime()),
  'tamperEvidence-publishedAt-is-ISO8601-timestamp',
  'Expected valid ISO 8601 timestamp in publishedAt, got: ' + (lastLine.tamperEvidence && lastLine.tamperEvidence.publishedAt)
);

// ── Integration: publishAttestation end-to-end (mocked) ─────────────────────

var intTracePath = writeTmpFile('integration-trace.jsonl',
  '{"status":"completed","traceHash":"def","verdict":"pass"}\n');

var MOCK_REGISTRY_REF = 'https://github.com/heymishy/skills-repo/attestations/mock-9999';
var MOCK_PUBLISHED_AT = '2026-04-19T12:00:00Z';
var publishCalled = false;

var result = publishAttestation(intTracePath, {
  publishedAt: MOCK_PUBLISHED_AT,
  publishFn: function(params) {
    publishCalled = true;
    assert(
      typeof params.traceFilePath === 'string' && params.traceFilePath === intTracePath,
      'publishAttestation-passes-correct-filePath-to-publishFn',
      'Expected publishFn to receive correct traceFilePath'
    );
    assert(
      typeof params.hash === 'string' && /^[0-9a-f]{64}$/.test(params.hash),
      'publishAttestation-passes-sha256-hash-to-publishFn',
      'Expected publishFn to receive valid 64-char hex hash'
    );
    return MOCK_REGISTRY_REF;
  },
});

writeBackTamperEvidence(intTracePath, {
  registryType: 'github-artifact-attestation',
  registryRef:  result.registryRef,
  publishedAt:  result.publishedAt,
});

var intContent = fs.readFileSync(intTracePath, 'utf8');
var intLines   = intContent.trim().split('\n');
var intLast    = JSON.parse(intLines[intLines.length - 1]);

assert(
  publishCalled,
  'post-merge-workflow-calls-publish-function',
  'Expected publishFn to have been called'
);

assert(
  intLast.tamperEvidence &&
  intLast.tamperEvidence.registryType === 'github-artifact-attestation' &&
  intLast.tamperEvidence.registryRef === MOCK_REGISTRY_REF &&
  intLast.tamperEvidence.publishedAt === MOCK_PUBLISHED_AT,
  'post-merge-workflow-publishes-attestation-and-writes-tamperEvidence-to-trace',
  'Integration test failed: tamperEvidence not written correctly'
);

// ── NFR: Workflow YAML does not reference PAT secrets ─────────────────────────

var workflowPath = path.join(root, '.github', 'workflows', 'attestation-publisher.yml');

if (!fs.existsSync(workflowPath)) {
  fail('workflow-identity-uses-oidc-not-pat', 'attestation-publisher.yml not found');
} else {
  var workflowContent = fs.readFileSync(workflowPath, 'utf8');

  assert(
    workflowContent.indexOf('id-token: write') !== -1,
    'workflow-identity-uses-oidc-not-pat',
    'attestation-publisher.yml must contain "id-token: write" in permissions block'
  );

  // Must NOT reference any PAT secret (secrets.PAT_* or secrets.GITHUB_PAT*)
  var patPattern = /secrets\.\s*(?:PAT|GITHUB_PAT)/i;
  assert(
    !patPattern.test(workflowContent),
    'workflow-does-not-reference-pat-secret',
    'attestation-publisher.yml must not reference a PAT secret — use OIDC only'
  );
}

// ── Cleanup ────────────────────────────────────────────────────────────────────

try {
  var tmpFiles = fs.readdirSync(tmpDir);
  for (var i = 0; i < tmpFiles.length; i++) {
    fs.unlinkSync(path.join(tmpDir, tmpFiles[i]));
  }
  fs.rmdirSync(tmpDir);
} catch (_) {
  // Best-effort cleanup
}

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n');
if (failed === 0) {
  process.stdout.write('  All ' + passed + ' tests passed.\n\n');
} else {
  process.stdout.write('  ' + failed + ' test(s) failed, ' + passed + ' passed.\n\n');
  process.exit(1);
}
