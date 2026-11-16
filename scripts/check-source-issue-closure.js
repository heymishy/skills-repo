#!/usr/bin/env node
'use strict';
/**
 * check-source-issue-closure.js (icf-s1)
 *
 * A story that fixes a GitHub issue records it as `sourceIssue` (an integer) in pipeline-state.json. This script is how
 * the skills check that the fix PR will close that issue and, after the merge, that it did:
 *
 *   node scripts/check-source-issue-closure.js                    scan: merged stories whose source issue is still open
 *   node scripts/check-source-issue-closure.js --pr 123 --issue 45   is issue 45 in PR 123's closing references?
 *   --state <path>                                                 scan a different state file (tests)
 *
 * It only reads from GitHub (`gh issue view`, `gh pr view`) and never writes. The binary comes from GH_BIN (default
 * `gh`); when it cannot be run the script prints "skipped" and exits 0, so an offline or CI run is never broken. The
 * scan exits 0 whether or not it finds anything: an open source issue at DoD is a recorded deviation with an offer to
 * close it (operator decision, 2026-11-16), not a gate.
 *
 * Zero dependencies beyond Node and the gh CLI.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * True only when the PR body uses a GitHub closing keyword for this issue number. A sentence that merely mentions the
 * issue ("the operator can close issue #1121") does not count, and neither does a longer number that starts with the
 * same digits (#11210).
 * @param {string} body
 * @param {number|string} issueNumber
 * @returns {boolean}
 */
function closingKeywordPresent(body, issueNumber) {
  if (typeof body !== 'string' || !body) return false;
  const re = new RegExp('\\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\\s*:?\\s+#' + String(issueNumber).replace(/\D/g, '') + '(?!\\d)', 'i');
  return re.test(body);
}

function collectStories(state) {
  const out = [];
  (state.features || []).forEach((f) => {
    (f.stories || []).forEach((s) => out.push({ feature: f.slug, story: s }));
    (f.epics || []).forEach((e) => (e.stories || []).forEach((s) => out.push({ feature: f.slug, story: s })));
  });
  return out;
}

/**
 * Merged stories that name a source issue which is still open.
 * @param {object} state  parsed pipeline-state.json
 * @param {function(number): ('OPEN'|'CLOSED'|null)} lookup  injected issue-state lookup; null means unknown
 * @returns {Array<{feature:string, id:string, sourceIssue:number}>}
 */
function findOpenSourceIssues(state, lookup) {
  const open = [];
  collectStories(state).forEach((x) => {
    const s = x.story;
    if (s.prStatus !== 'merged' || !Number.isInteger(s.sourceIssue)) return;
    if (lookup(s.sourceIssue) === 'OPEN') open.push({ feature: x.feature, id: s.id || s.slug, sourceIssue: s.sourceIssue });
  });
  return open;
}

function gh(args) {
  const bin = process.env.GH_BIN || 'gh';
  const r = spawnSync(bin, args, { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return r.stdout;
}

function ghAvailable() {
  const bin = process.env.GH_BIN || 'gh';
  const r = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return !r.error && r.status === 0;
}

function issueState(n) {
  const out = gh(['issue', 'view', String(n), '--json', 'state', '--jq', '.state']);
  if (out === null) return null;
  const v = out.trim().toUpperCase();
  return v === 'OPEN' || v === 'CLOSED' ? v : null;
}

function prClosesIssue(pr, issue) {
  const out = gh(['pr', 'view', String(pr), '--json', 'closingIssuesReferences', '--jq', '[.closingIssuesReferences[].number] | join(",")']);
  if (out === null) return null;
  return out.trim().split(',').filter(Boolean).map(Number).indexOf(Number(issue)) !== -1;
}

function argValue(argv, name) { const i = argv.indexOf(name); return i !== -1 ? argv[i + 1] : undefined; }

function main(argv) {
  const skipped = '[check-source-issue-closure] skipped: the gh CLI is not available (set GH_BIN or install gh). Nothing was checked.';
  const pr = argValue(argv, '--pr');
  const issue = argValue(argv, '--issue');
  if (pr && issue) {
    if (!ghAvailable()) { console.log(skipped); return 0; }
    const closes = prClosesIssue(pr, issue);
    if (closes === null) { console.log('[check-source-issue-closure] skipped: could not read PR #' + pr + ' (no access or no network).'); return 0; }
    if (closes) { console.log('[check-source-issue-closure] OK: PR #' + pr + ' will close issue #' + issue + ' when it merges.'); return 0; }
    console.error('[check-source-issue-closure] PR #' + pr + ' does NOT list issue #' + issue + ' as a closing reference. Add "Fixes #' + issue + '" to the PR body.');
    return 1;
  }
  const statePath = argValue(argv, '--state') || path.join(__dirname, '..', '.github', 'pipeline-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const withIssue = collectStories(state).filter((x) => x.story.prStatus === 'merged' && Number.isInteger(x.story.sourceIssue));
  if (withIssue.length === 0) { console.log('[check-source-issue-closure] no merged story has a source issue; nothing to check.'); return 0; }
  if (!ghAvailable()) { console.log(skipped); return 0; }
  const open = findOpenSourceIssues(state, issueState);
  if (open.length === 0) { console.log('[check-source-issue-closure] OK: every merged story with a source issue has it closed (' + withIssue.length + ' checked).'); return 0; }
  open.forEach((o) => console.log('[check-source-issue-closure] DEVIATION: ' + o.feature + ' / ' + o.id + ' is merged but its source issue #' + o.sourceIssue + ' is still open. Record it in the DoD and offer the operator the closing action.'));
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { closingKeywordPresent, findOpenSourceIssues, collectStories };
