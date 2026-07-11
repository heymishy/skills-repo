#!/usr/bin/env node
/**
 * check-pcr-s1-decisions-merge.js
 *
 * Tests for pcr-s1 AC5 — `.gitattributes` declares `merge=union` for
 * `decisions.md` files under `artefacts/`, so two branches that each
 * independently append a new decision entry auto-merge instead of
 * producing a conflict on the shared append log.
 *
 * Covers: U6, IT5.
 *
 * Run: node tests/check-pcr-s1-decisions-merge.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execFileSync } = require('child_process');

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

// ── U6 — .gitattributes declares merge=union for decisions.md ────────────

{
  const T = 'U6-gitattributes-declares-merge-union';
  const gitattrPath = path.join(root, '.gitattributes');
  const exists = fs.existsSync(gitattrPath);
  assert(T + '-exists', exists, '.gitattributes does not exist at repo root');
  if (exists) {
    const content = fs.readFileSync(gitattrPath, 'utf8');
    const hasLine = /artefacts\/\*\*\/decisions\.md\s+merge=union/.test(content);
    assert(T + '-line-present', hasLine,
      `.gitattributes does not contain a line matching 'artefacts/**/decisions.md merge=union'. Content: ${content}`);
  }
}

// ── IT5 — decisions.md union merge auto-resolves two independent appends ──

{
  const T = 'IT5-decisions-union-merge-auto-resolves';
  const scratchRoot = makeTempDir('pcr-s1-it5-repo');
  try {
    function git(args, cwd) {
      return execFileSync('git', args, { cwd, encoding: 'utf8' });
    }
    git(['init', '-q'], scratchRoot);
    git(['config', 'user.email', 'test@example.com'], scratchRoot);
    git(['config', 'user.name', 'Test'], scratchRoot);

    writeFile(scratchRoot, '.gitattributes', 'artefacts/**/decisions.md merge=union\n');
    writeFile(scratchRoot, 'artefacts/feat/decisions.md', [
      '# Decision Log',
      '',
      '## Log entries',
      '',
      '---',
      '**2026-07-01 | SCOPE | discovery**',
      '**Decision:** Base entry N.',
      '---',
      '',
    ].join('\n'));
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'base'], scratchRoot);
    git(['branch', '-q', '-M', 'master'], scratchRoot);
    git(['checkout', '-q', '-b', 'branch-a'], scratchRoot);
    git(['checkout', '-q', 'master'], scratchRoot);
    git(['checkout', '-q', '-b', 'branch-b'], scratchRoot);

    const decisionsPath = path.join(scratchRoot, 'artefacts', 'feat', 'decisions.md');

    // Branch A appends entry A
    git(['checkout', '-q', 'branch-a'], scratchRoot);
    fs.appendFileSync(decisionsPath, [
      '**2026-07-11 | RISK-ACCEPT | story-a**',
      '**Decision:** Entry A appended independently by story A.',
      '---',
      '',
    ].join('\n'));
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'branch-a appends decision A'], scratchRoot);

    // Branch B appends entry B (from the same base, independent text)
    git(['checkout', '-q', 'branch-b'], scratchRoot);
    fs.appendFileSync(decisionsPath, [
      '**2026-07-11 | GAP | story-b**',
      '**Decision:** Entry B appended independently by story B.',
      '---',
      '',
    ].join('\n'));
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'branch-b appends decision B'], scratchRoot);

    // Merge branch-a into master
    git(['checkout', '-q', 'master'], scratchRoot);
    git(['merge', '-q', 'branch-a', '--no-edit'], scratchRoot);

    // Merge master into branch-b — real merge, real .gitattributes in effect
    git(['checkout', '-q', 'branch-b'], scratchRoot);
    let mergeThrew = false;
    let mergeOutput = '';
    try {
      mergeOutput = git(['merge', 'master', '--no-edit'], scratchRoot);
    } catch (e) {
      mergeThrew = true;
      mergeOutput = (e.stdout || '') + (e.stderr || '');
    }
    assert(T + '-merge-succeeds', !mergeThrew, `Expected merge to succeed with zero conflict, got: ${mergeOutput}`);

    const finalContent = fs.readFileSync(decisionsPath, 'utf8');
    assert(T + '-no-conflict-markers',
      !/<<<<<<<|=======|>>>>>>>/.test(finalContent),
      'Merged decisions.md contains conflict markers');
    assert(T + '-entry-a-present', finalContent.includes('Entry A appended independently by story A.'),
      'Merged decisions.md is missing entry A');
    assert(T + '-entry-b-present', finalContent.includes('Entry B appended independently by story B.'),
      'Merged decisions.md is missing entry B');
    assert(T + '-base-entry-present', finalContent.includes('Base entry N.'),
      'Merged decisions.md is missing the original base entry');
  } finally { rmDir(scratchRoot); }
}

// ── IT5b — reverse merge order (B into master, then master into A) also clean ─

{
  const T = 'IT5b-reverse-merge-order-also-clean';
  const scratchRoot = makeTempDir('pcr-s1-it5b-repo');
  try {
    function git(args, cwd) {
      return execFileSync('git', args, { cwd, encoding: 'utf8' });
    }
    git(['init', '-q'], scratchRoot);
    git(['config', 'user.email', 'test@example.com'], scratchRoot);
    git(['config', 'user.name', 'Test'], scratchRoot);

    writeFile(scratchRoot, '.gitattributes', 'artefacts/**/decisions.md merge=union\n');
    writeFile(scratchRoot, 'artefacts/feat/decisions.md', '# Decision Log\n\n## Log entries\n\n---\n**Base entry.**\n---\n');
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'base'], scratchRoot);
    git(['branch', '-q', '-M', 'master'], scratchRoot);
    git(['checkout', '-q', '-b', 'branch-a'], scratchRoot);
    git(['checkout', '-q', 'master'], scratchRoot);
    git(['checkout', '-q', '-b', 'branch-b'], scratchRoot);

    const decisionsPath = path.join(scratchRoot, 'artefacts', 'feat', 'decisions.md');

    git(['checkout', '-q', 'branch-a'], scratchRoot);
    fs.appendFileSync(decisionsPath, '**Entry A.**\n---\n');
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'a'], scratchRoot);

    git(['checkout', '-q', 'branch-b'], scratchRoot);
    fs.appendFileSync(decisionsPath, '**Entry B.**\n---\n');
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'b'], scratchRoot);

    // Merge branch-b into master FIRST this time (reverse order)
    git(['checkout', '-q', 'master'], scratchRoot);
    git(['merge', '-q', 'branch-b', '--no-edit'], scratchRoot);

    git(['checkout', '-q', 'branch-a'], scratchRoot);
    let mergeThrew = false;
    let mergeOutput = '';
    try {
      mergeOutput = git(['merge', 'master', '--no-edit'], scratchRoot);
    } catch (e) {
      mergeThrew = true;
      mergeOutput = (e.stdout || '') + (e.stderr || '');
    }
    assert(T + '-merge-succeeds', !mergeThrew, `Expected merge to succeed with zero conflict, got: ${mergeOutput}`);
    const finalContent = fs.readFileSync(decisionsPath, 'utf8');
    assert(T + '-no-conflict-markers', !/<<<<<<<|=======|>>>>>>>/.test(finalContent), 'Merged decisions.md contains conflict markers');
    assert(T + '-entry-a-present', finalContent.includes('Entry A.'), 'Merged decisions.md is missing entry A');
    assert(T + '-entry-b-present', finalContent.includes('Entry B.'), 'Merged decisions.md is missing entry B');
  } finally { rmDir(scratchRoot); }
}

// ── Report ─────────────────────────────────────────────────────────────────

if (totalFailed > 0) {
  console.error(`[pcr-s1-decisions-merge] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[pcr-s1-decisions-merge] ${totalPassed} check(s) OK ✓`);
}
