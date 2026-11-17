#!/usr/bin/env node
'use strict';
// gic-s1 (AC2, AC4) -- which files changed by a pull request decide whether a check passes (workflows, gate scripts, flags,
// baselines, the guard tests, the capability matrix)? Pure functions plus a small CLI used by
// .github/workflows/gate-files-changed.yml, which runs on pull_request_target (so this script and the list always come
// from master) and never executes pull-request code: it is handed the changed paths as text and prints Markdown.
//
//   node scripts/gate-files-changed.js --list .github/gate-files.json --files changed-paths.txt
//
// Observe mode (the list's "mode"): report only, never fail. Enforcing is a later, separate, reviewed change.

const fs = require('fs');

function patternToRegex(pattern) {
  const esc = function (s) { return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'); };
  const source = String(pattern).split('**').map(function (part) { return esc(part).replace(/\*/g, '[^/]*'); }).join('.*');
  return new RegExp('^' + source + '$');
}

/** The changed paths that match any protected pattern, in input order, without duplicates. */
function findGateFileChanges(changedPaths, patterns) {
  const regexes = (patterns || []).map(patternToRegex);
  const seen = new Set(); const out = [];
  (changedPaths || []).forEach(function (p) {
    if (seen.has(p)) return;
    if (regexes.some(function (r) { return r.test(p); })) { seen.add(p); out.push(p); }
  });
  return out;
}

/** A path is shown as plain text: no markup, no new lines, no backticks. */
function safePath(p) { return String(p).replace(/[`<>\r\n|]/g, '?'); }

function renderSummary(matched, mode) {
  if (!matched || matched.length === 0) return '';
  const lines = [];
  lines.push('### Gate files changed');
  lines.push('');
  lines.push('This pull request changes ' + matched.length + ' file' + (matched.length === 1 ? '' : 's') + ' that decide whether a check passes or runs. Read these diffs as part of the review; a gate edited by the change it judges proves nothing.');
  lines.push('');
  matched.forEach(function (p) { lines.push('- `' + safePath(p) + '`'); });
  lines.push('');
  lines.push('Mode: ' + (mode || 'observe') + '. In observe mode this check reports only and does not fail.');
  return lines.join('\n');
}

function main(argv) {
  const opt = function (name) { const i = argv.indexOf(name); return i !== -1 ? argv[i + 1] : null; };
  const listPath = opt('--list'); const filesPath = opt('--files');
  if (!listPath || !filesPath) { console.error('usage: gate-files-changed.js --list <gate-files.json> --files <paths.txt>'); return 2; }
  const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
  const changed = fs.readFileSync(filesPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const out = renderSummary(findGateFileChanges(changed, list.patterns), list.mode);
  if (out) process.stdout.write(out + '\n');
  return 0; // observe mode: never a failure
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { findGateFileChanges, renderSummary, patternToRegex };
