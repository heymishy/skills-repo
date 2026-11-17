#!/usr/bin/env node
'use strict';
// gic-s1 (AC1) -- prints "true" or "false": the value of one opt-in flag in .github/context.yml AS IT IS ON THE BASE
// BRANCH, read with `git show <ref>:<path>`, never from the working tree. A required check that reads its on/off switch
// from the pull request's own checkout can be turned into a pass by editing that one line; reading it from the base means
// flipping a flag first needs its own merge to master. (Audit: artefacts/2026-11-17-testing-cicd-audit/spikes/gate-integrity-audit.md)
//
//   node scripts/read-base-flag.js audit.staging_e2e_scenario_a [--ref origin/master] [--file .github/context.yml]
//
// Default ref: origin/$GITHUB_BASE_REF (origin/master when unset). A flag that is absent, or a file that does not exist
// on the base, is "false" (a fork of this template without the flag keeps its opt-in behaviour). A base ref that cannot
// be resolved exits 2 and prints no value: the caller fails closed instead of treating a fetch problem as "off".
//
// The project has no YAML parser, so this reads the one shape the flag lives in: a top-level section and, indented
// under it, `key: value` lines. Only the literal value `true` (before any trailing comment) is true.

const { spawnSync } = require('child_process');

/** Value of `section.key` in a context.yml text: true only when the value is exactly the word true. */
function parseFlag(text, dotted) {
  const parts = String(dotted).split('.');
  if (parts.length !== 2) return false;
  const section = parts[0]; const key = parts[1];
  const lines = String(text).split(/\r?\n/);
  let inSection = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(#.*)?$/.test(line)) continue;
    if (!/^\s/.test(line)) { inSection = new RegExp('^' + section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*(#.*)?$').test(line); continue; }
    if (!inSection) continue;
    const m = new RegExp('^\\s+' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*([^\\s#]*)').exec(line);
    if (m) return m[1] === 'true';
  }
  return false;
}

function git(args) { return spawnSync('git', args, { encoding: 'utf8' }); }

function main(argv) {
  const key = argv[0];
  if (!key || key.charAt(0) === '-') { console.error('usage: read-base-flag.js <section.key> [--ref <ref>] [--file <path>]'); return 2; }
  const opt = function (name, dflt) { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] ? argv[i + 1] : dflt; };
  const ref = opt('--ref', 'origin/' + (process.env.GITHUB_BASE_REF || 'master'));
  const file = opt('--file', '.github/context.yml');
  if (git(['rev-parse', '--verify', '--quiet', ref + '^{commit}']).status !== 0) {
    console.error('read-base-flag: cannot resolve the base ref "' + ref + '"; refusing to guess (fetch it first).');
    return 2;
  }
  if (git(['cat-file', '-e', ref + ':' + file]).status !== 0) { console.log('false'); return 0; }
  const shown = git(['show', ref + ':' + file]);
  if (shown.status !== 0) { console.error('read-base-flag: git show failed: ' + shown.stderr); return 2; }
  console.log(parseFlag(shown.stdout, key) ? 'true' : 'false');
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { parseFlag };
