#!/usr/bin/env node
/**
 * scripts/improvement-agent-deliver.js -- ciw-s1
 *
 * The last step of .github/workflows/improvement-agent-schedule.yml. The scheduled improvement agent used to commit its
 * output and `git push` to master, which the repository ruleset refuses for the Actions bot (its only bypass actor is the
 * repository Admin role), so every scheduled run since 2026-10-19 failed. This script delivers the output as a draft pull
 * request instead.
 *
 *   - Only workspace/proposals/, workspace/state.json and workspace/dream-run-result.json are ever committed.
 *   - Whatever the traces fetch staged under workspace/traces/ is unstaged first.
 *   - Fails closed: any other staged path, or more than MAX_FILES files, stops the run before anything is pushed.
 *   - Nothing is pushed to master and nothing is force-pushed.
 *   - No change: no branch and no pull request ("No changes to commit").
 *   - An open dreaming pull request (head branch starting `improvement-agent/dream-`): one commit is added to its branch
 *     with an ordinary fast-forward push, and no second pull request is opened.
 *
 * Usage (CI): node scripts/improvement-agent-deliver.js        (needs GH_TOKEN for the gh command line tool)
 * Test seams: deliver({ cwd, gh: [exe, ...prefixArgs], now, base, log }); env GH_CMD_JSON overrides `gh` on the command line.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MAX_FILES = 25;
const BRANCH_PREFIX = 'improvement-agent/dream-';
const ALLOWED_PATHS = ['workspace/proposals', 'workspace/state.json', 'workspace/dream-run-result.json'];
const PROTECTED = /^(master|main)$/;

function isAllowed(p) {
  return p === 'workspace/state.json' || p === 'workspace/dream-run-result.json' || p.indexOf('workspace/proposals/') === 0;
}

/** Throw if branch is the base or a protected default branch: this script never writes to master. */
function assertSafeBranch(branch, base) {
  if (!branch || branch === base || PROTECTED.test(branch)) {
    throw new Error('refusing to push to the protected branch "' + branch + '" (the improvement agent only pushes ' + BRANCH_PREFIX + '* branches)');
  }
  if (branch.indexOf(BRANCH_PREFIX) !== 0) {
    throw new Error('refusing to push "' + branch + '": not an ' + BRANCH_PREFIX + '* branch');
  }
}

function git(cwd, args, opts) {
  const r = spawnSync('git', args, { cwd: cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 && !(opts && opts.allowFail)) {
    throw new Error('git ' + args.join(' ') + ' failed (exit ' + r.status + '): ' + ((r.stderr || r.stdout || '').trim()));
  }
  return { status: r.status, out: (r.stdout || '').trim() };
}

function runGh(cwd, gh, args) {
  const r = spawnSync(gh[0], gh.slice(1).concat(args), { cwd: cwd, encoding: 'utf8', env: process.env });
  if (r.error || r.status !== 0) {
    throw new Error('gh ' + args.slice(0, 2).join(' ') + ' failed' + (r.status != null ? ' (exit ' + r.status + ')' : '') + ': ' + ((r.error && r.error.message) || (r.stderr || r.stdout || '').trim()));
  }
  return (r.stdout || '').trim();
}

function stamp(now) {
  const iso = now.toISOString(); // 2026-11-23T03:17:00.000Z
  return iso.slice(0, 10) + '-' + iso.slice(11, 13) + iso.slice(14, 16);
}

/** Stage only the allowed paths (those that exist or are tracked), after unstaging the traces. */
function stageAllowed(cwd) {
  git(cwd, ['reset', '-q', '--', 'workspace/traces'], { allowFail: true });
  ALLOWED_PATHS.forEach(function(p) {
    const exists = fs.existsSync(path.join(cwd, p));
    const tracked = git(cwd, ['ls-files', '--', p], { allowFail: true }).out !== '';
    if (exists || tracked) git(cwd, ['add', '-A', '--', p]);
  });
}

function stagedEntries(cwd) {
  const out = git(cwd, ['diff', '--cached', '--name-status']).out;
  return out ? out.split('\n').map(function(l) { const parts = l.split('\t'); return { status: parts[0].charAt(0), file: parts[parts.length - 1] }; }) : [];
}

function deliver(opts) {
  const cwd = opts.cwd || process.cwd();
  const gh = opts.gh || ['gh'];
  const base = opts.base || 'master';
  const log = opts.log || function(m) { console.log(m); };
  const now = opts.now || new Date();
  const maxFiles = opts.maxFiles || MAX_FILES;

  stageAllowed(cwd);
  const entries = stagedEntries(cwd);
  if (entries.length === 0) {
    log('No changes to commit');
    return { status: 'no-changes' };
  }

  const outside = entries.filter(function(e) { return !isAllowed(e.file); }).map(function(e) { return e.file; });
  if (outside.length > 0) {
    throw new Error('refusing to commit: staged path(s) outside the allowed paths (' + ALLOWED_PATHS.join(', ') + '): ' + outside.slice(0, 5).join(', ') + (outside.length > 5 ? ' ...' : ''));
  }
  if (entries.length > maxFiles) {
    throw new Error('refusing to commit: ' + entries.length + ' files staged, more than ' + maxFiles + ' (a dreaming run adds a handful of proposals)');
  }

  // Is there already an open dreaming pull request? Then add to its branch instead of opening another.
  const listed = JSON.parse(runGh(cwd, gh, ['pr', 'list', '--state', 'open', '--json', 'number,headRefName', '--limit', '100']) || '[]');
  const open = listed.filter(function(p) { return p.headRefName && p.headRefName.indexOf(BRANCH_PREFIX) === 0; })[0];

  const message = 'chore: improvement agent dream run (' + entries.length + ' file' + (entries.length === 1 ? '' : 's') + ' for review)';

  if (open) {
    const branch = open.headRefName;
    assertSafeBranch(branch, base);
    // Keep the new content, move onto the open branch, lay the content over it, commit, push (fast-forward).
    const keep = entries.map(function(e) {
      return { status: e.status, file: e.file, content: e.status === 'D' ? null : fs.readFileSync(path.join(cwd, e.file)) };
    });
    git(cwd, ['fetch', '-q', 'origin', branch]);
    git(cwd, ['reset', '-q']);
    git(cwd, ['checkout', '-q', '-f', '-B', branch, 'origin/' + branch]);
    keep.forEach(function(k) {
      const abs = path.join(cwd, k.file);
      if (k.content === null) { try { fs.unlinkSync(abs); } catch (_) { /* already gone */ } }
      else { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, k.content); }
    });
    ALLOWED_PATHS.forEach(function(p) {
      if (fs.existsSync(path.join(cwd, p)) || git(cwd, ['ls-files', '--', p], { allowFail: true }).out !== '') git(cwd, ['add', '-A', '--', p]);
    });
    if (git(cwd, ['diff', '--cached', '--quiet'], { allowFail: true }).status === 0) {
      log('The open dreaming pull request (#' + open.number + ') already has these outputs; nothing to add');
      return { status: 'up-to-date', branch: branch, number: open.number };
    }
    git(cwd, ['commit', '-q', '-m', message]);
    git(cwd, ['push', 'origin', branch]);
    log('Added a commit to ' + branch + ' (open pull request #' + open.number + ')');
    return { status: 'updated', branch: branch, number: open.number };
  }

  const branch = BRANCH_PREFIX + stamp(now);
  assertSafeBranch(branch, base);
  git(cwd, ['checkout', '-q', '-b', branch]);
  git(cwd, ['commit', '-q', '-m', message]);
  git(cwd, ['push', '-u', 'origin', branch]);
  const body = [
    'Opened by the scheduled improvement agent (' + entries.length + ' file' + (entries.length === 1 ? '' : 's') + ': proposals, state and the dream-run result only).',
    '',
    'This pull request was opened with the default workflow token, so the required checks do not run on it and show as "expected". It only changes workspace files; read the proposals, then merge it with the admin bypass (or close it).'
  ].join('\n');
  const url = runGh(cwd, gh, ['pr', 'create', '--draft', '--base', base, '--head', branch, '--title', 'chore: improvement agent dream run ' + stamp(now), '--body', body]);
  log('Opened a draft pull request from ' + branch + (url ? ': ' + url : ''));
  return { status: 'delivered', branch: branch, url: url };
}

function main() {
  const gh = process.env.GH_CMD_JSON ? JSON.parse(process.env.GH_CMD_JSON) : ['gh'];
  try {
    deliver({ cwd: process.cwd(), gh: gh, base: process.env.GITHUB_BASE_BRANCH || 'master' });
    return 0;
  } catch (e) {
    console.error('[improvement-agent-deliver] ' + e.message);
    return 1;
  }
}

if (require.main === module) process.exit(main());

module.exports = { deliver, assertSafeBranch, MAX_FILES, BRANCH_PREFIX, ALLOWED_PATHS };
