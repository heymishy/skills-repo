'use strict';
// tests/check-sar1-slug-resolution.js
// Failing stub for sar.1 — audit record slug resolution fix
// All tests must FAIL before implementation.

const assert = require('assert');
const path   = require('path');
const { spawnSync } = require('child_process');

const ROOT       = path.join(__dirname, '..');
const SCRIPT     = path.join(ROOT, 'scripts', 'extract-pr-slug.js');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  PASS  ${label}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL  ${label}`);
    console.log(`        ${e.message}`);
    failed++;
  }
}

// ── Load module under test ──
let extractPRSlug, buildSlugSourceNote;
try {
  const mod = require(SCRIPT);
  extractPRSlug      = mod.extractPRSlug;
  buildSlugSourceNote = mod.buildSlugSourceNote;
} catch (_) {
  // Module doesn't exist yet — all tests will fail naturally
}

// ── T1: extracts slug from standard chain-references table row ──
test('T1 — extracts slug from standard PR template chain references table', () => {
  assert(typeof extractPRSlug === 'function', 'extractPRSlug must be a function (scripts/extract-pr-slug.js not found or not exported)');
  const body = [
    '## Chain references',
    '',
    '| Artefact | Link |',
    '|----------|------|',
    '| Discovery | `artefacts/2026-04-29-audit-slug-resolution/discovery.md` |',
    '| Epic | `artefacts/2026-04-29-audit-slug-resolution/epics/sar-epic.md` |',
  ].join('\n');
  const result = extractPRSlug(body);
  assert.strictEqual(result, '2026-04-29-audit-slug-resolution', `expected "2026-04-29-audit-slug-resolution", got "${result}"`);
});

// ── T2: returns first slug when multiple artefact paths appear ──
test('T2 — extracts first slug when multiple artefact paths in body', () => {
  assert(typeof extractPRSlug === 'function', 'extractPRSlug must be a function');
  const body = [
    '| Discovery | `artefacts/2026-04-29-audit-slug-resolution/discovery.md` |',
    '| Reference | `artefacts/2026-04-28-inflight-learning-capture/reference/ref.md` |',
  ].join('\n');
  const result = extractPRSlug(body);
  assert.strictEqual(result, '2026-04-29-audit-slug-resolution', `expected first slug, got "${result}"`);
});

// ── T3: handles backtick-wrapped paths ──
test('T3 — handles backtick-wrapped artefact paths (standard PR template format)', () => {
  assert(typeof extractPRSlug === 'function', 'extractPRSlug must be a function');
  const body = 'Implements story. See `artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1.md` for details.';
  const result = extractPRSlug(body);
  assert.strictEqual(result, '2026-04-23-ci-artefact-attachment', `expected "2026-04-23-ci-artefact-attachment", got "${result}"`);
});

// ── T4: returns empty string when no artefact paths in body ──
test('T4 — returns empty string for body with no artefact paths', () => {
  assert(typeof extractPRSlug === 'function', 'extractPRSlug must be a function');
  const body = 'Implements story p11.4\n\nSee issue #206';
  const result = extractPRSlug(body);
  assert.strictEqual(result, '', `expected "", got "${result}"`);
});

// ── T5: returns empty string for null / empty input without crashing ──
test('T5 — returns empty string for null and empty string inputs', () => {
  assert(typeof extractPRSlug === 'function', 'extractPRSlug must be a function');
  const r1 = extractPRSlug(null);
  const r2 = extractPRSlug('');
  assert.strictEqual(r1, '', `null input: expected "", got "${r1}"`);
  assert.strictEqual(r2, '', `empty string input: expected "", got "${r2}"`);
});

// ── T6: CLI invocable — node scripts/extract-pr-slug.js reads PR_BODY env var ──
test('T6 — CLI invocable: reads PR_BODY env var and prints slug to stdout', () => {
  const body = '| Discovery | `artefacts/2026-04-29-audit-slug-resolution/discovery.md` |';
  const result = spawnSync(process.execPath, [SCRIPT], {
    env: { ...process.env, PR_BODY: body },
    encoding: 'utf8',
  });
  assert.strictEqual(result.status, 0, `process exited with code ${result.status}; stderr: ${result.stderr}`);
  assert.strictEqual(result.stdout.trim(), '2026-04-29-audit-slug-resolution',
    `expected "2026-04-29-audit-slug-resolution", got "${result.stdout.trim()}"`);
});

// ── T7: buildSlugSourceNote — fallback notice for auto-resolved slug ──
test('T7 — buildSlugSourceNote("auto-resolved") contains warning and pipeline-state reference', () => {
  assert(typeof buildSlugSourceNote === 'function', 'buildSlugSourceNote must be a function');
  const note = buildSlugSourceNote('auto-resolved');
  assert(note.includes('⚠️'), `expected "⚠️" in note, got: "${note}"`);
  assert(note.toLowerCase().includes('auto-resolved') || note.toLowerCase().includes('pipeline-state'),
    `expected "auto-resolved" or "pipeline-state" in note, got: "${note}"`);
});

// ── T8: buildSlugSourceNote — PR body confirmation with slug shown ──
test('T8 — buildSlugSourceNote("pr-body", slug) contains Source: PR body and Chain references', () => {
  assert(typeof buildSlugSourceNote === 'function', 'buildSlugSourceNote must be a function');
  const note = buildSlugSourceNote('pr-body', '2026-04-29-audit-slug-resolution');
  assert(note.includes('PR body'), `expected "PR body" in note, got: "${note}"`);
  assert(note.includes('Chain references'), `expected "Chain references" in note, got: "${note}"`);
  assert(note.includes('2026-04-29-audit-slug-resolution'), `expected slug in note, got: "${note}"`);
});

// ── Results ──
console.log(`\n[check-sar1-slug-resolution] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
