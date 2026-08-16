#!/usr/bin/env node
// check-extract-pr-slug.js — regression test for scripts/extract-pr-slug.js's
// extractPRSlug(). Locks in the date-prefix requirement fix: a PR body that
// mentions a non-dated artefacts/ path (e.g. artefacts/feedback/beta-001.md)
// before its own real dated story path must not have that non-dated path
// mistaken for the feature slug.

'use strict';

const assert = require('assert');
const { extractPRSlug } = require('../scripts/extract-pr-slug');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

check('extractPRSlug: finds a real dated slug when it is the only match', () => {
  const body = '## Story\nartefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1.md\n';
  assert.strictEqual(extractPRSlug(body), '2026-08-16-billing-portal-error-handling');
});

check('extractPRSlug: skips a non-dated artefacts/ path mentioned earlier in the body', () => {
  const body =
    '## Summary\n' +
    'Fixes a defect (`artefacts/feedback/beta-001.md`, signals #1/#6).\n\n' +
    '## Story artefacts\n' +
    '- Story: `artefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1.md`\n';
  assert.strictEqual(extractPRSlug(body), '2026-08-16-billing-portal-error-handling');
});

check('extractPRSlug: returns empty string when no dated slug is present', () => {
  const body = 'See `artefacts/feedback/beta-001.md` for details.';
  assert.strictEqual(extractPRSlug(body), '');
});

check('extractPRSlug: returns empty string for null/empty body', () => {
  assert.strictEqual(extractPRSlug(null), '');
  assert.strictEqual(extractPRSlug(''), '');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
