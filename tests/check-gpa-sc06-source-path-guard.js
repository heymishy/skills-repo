'use strict';
const assert = require('assert');
const path = require('path');
const { sourceIntegrity } = require('../scripts/ci-audit-comment.js');

const repoRoot = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  PASS:', name);
    passed++;
  } catch (e) {
    console.error('  FAIL:', name);
    console.error('       ', e.message);
    failed++;
  }
}

// T1 — Basic traversal path returns guard object
test('T1 — traversal path ../../etc/passwd returns guard object', () => {
  const result = sourceIntegrity('../../etc/passwd', 'someHash');
  assert.deepStrictEqual(result, { traversal: true, sanitisedPath: '[REDACTED]' });
});

// T2 — Multiple adversarial vectors all return guard object
const vectors = [
  '../../etc/passwd',
  '../../../etc/passwd',
  '..\\..\\.\\Windows\\System32\\config\\SAM',
  '/etc/passwd',
  'C:\\Windows\\System32\\config\\SAM',
  'artefacts/../../../etc/passwd',
];

test('T2 — all 6 adversarial vectors return { traversal: true, sanitisedPath: "[REDACTED]" }', () => {
  for (const v of vectors) {
    const result = sourceIntegrity(v, null);
    assert.strictEqual(typeof result, 'object', `Expected object for vector: ${v}`);
    assert.strictEqual(result.traversal, true, `Expected traversal:true for vector: ${v}`);
    assert.strictEqual(result.sanitisedPath, '[REDACTED]', `Expected sanitisedPath:[REDACTED] for vector: ${v}`);
  }
});

// T3 — Source code guard: startsWith appears before readFileSync in sourceIntegrity
test('T3 — guard (startsWith) precedes readFileSync in sourceIntegrity source', () => {
  const src = require('fs').readFileSync(path.join(repoRoot, 'scripts/ci-audit-comment.js'), 'utf8');
  // Find the sourceIntegrity function body
  const fnStart = src.indexOf('function sourceIntegrity(');
  assert.ok(fnStart !== -1, 'sourceIntegrity function not found in source');
  // Find the closing brace of the function (next top-level closing brace after fnStart)
  const fnBody = src.slice(fnStart, fnStart + 600); // enough chars to cover the function
  const startsWithIdx = fnBody.indexOf('startsWith(');
  const readFileSyncIdx = fnBody.indexOf('readFileSync(');
  assert.ok(startsWithIdx !== -1, 'startsWith not found in sourceIntegrity');
  assert.ok(readFileSyncIdx !== -1, 'readFileSync not found in sourceIntegrity');
  assert.ok(startsWithIdx < readFileSyncIdx, 
    `Guard (startsWith at ${startsWithIdx}) must appear before readFileSync (at ${readFileSyncIdx})`);
});

// T4 — Valid path inside repo returns '—' (null hash short-circuit)
test('T4 — valid path README.md with null hash returns em-dash (no regression)', () => {
  const result = sourceIntegrity('README.md', null);
  assert.strictEqual(result, '\u2014', `Expected em-dash, got: ${JSON.stringify(result)}`);
});

// T5 — Valid subdirectory path inside repo not rejected
test('T5 — valid subdirectory path scripts/ci-audit-comment.js not rejected by guard', () => {
  const result = sourceIntegrity('scripts/ci-audit-comment.js', null);
  assert.strictEqual(result, '\u2014', `Expected em-dash for valid subdir path, got: ${JSON.stringify(result)}`);
});

// T6 — Raw adversarial path not present in return value
test('T6 — raw adversarial path not leaked in return value JSON', () => {
  let result;
  try {
    result = sourceIntegrity('../../etc/passwd', 'abc');
  } catch (e) {
    assert.ok(!e.message.includes('etc/passwd'), 'Raw path leaked in thrown error message');
    return;
  }
  const serialised = JSON.stringify(result);
  assert.ok(!serialised.includes('etc/passwd'), `Raw path leaked in return value: ${serialised}`);
  assert.ok(!serialised.includes('passwd'), `Raw path leaked in return value: ${serialised}`);
});

// IT1 — Guard integrates with artefact enrichment loop (traversal path returns no file content)
test('IT1 — artefact enrichment loop: traversal entry has traversal:true, valid entry returns string', () => {
  const entries = [
    { sourcePath: '../../etc/passwd', sha256: 'abc123' },
    { sourcePath: 'README.md',        sha256: null },
  ];
  const enriched = entries.map(e => ({
    ...e,
    integrityStatus: sourceIntegrity(e.sourcePath, e.sha256),
  }));
  // Traversal entry must have traversal:true object
  assert.strictEqual(typeof enriched[0].integrityStatus, 'object');
  assert.strictEqual(enriched[0].integrityStatus.traversal, true);
  assert.strictEqual(enriched[0].integrityStatus.sanitisedPath, '[REDACTED]');
  // Valid entry must return a string (em-dash for null hash)
  assert.strictEqual(typeof enriched[1].integrityStatus, 'string');
  assert.strictEqual(enriched[1].integrityStatus, '\u2014');
});

console.log(`\n[gpa-sc06] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
