#!/usr/bin/env node
/**
 * check-instructions-drift.js
 *
 * Verifies that the four harness-agnostic instruction files produced by
 * `scripts/assemble-copilot-instructions.sh --all-harnesses` — CLAUDE.md,
 * AGENTS.md, .cursorrules, .github/copilot-instructions.md — still match
 * byte-for-byte. If any file has been hand-edited independently of the
 * others, this fails and names which file diverged.
 *
 * Distributed to every bootstrapped target repo via platform-init.js's
 * existing COPY_DIRS (which copies scripts/ wholesale) — lives under
 * scripts/, not .github/scripts/, so it travels with the bootstrap by
 * default rather than requiring a separate distribution step.
 *
 * Run: node scripts/check-instructions-drift.js [--dir <path>]
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HARNESS_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  '.cursorrules',
  path.join('.github', 'copilot-instructions.md'),
];

/**
 * Compares every present harness instruction file under `dir` against the
 * first one found (in HARNESS_FILES order), byte-for-byte.
 *
 * @param {string} [dir] — defaults to process.cwd()
 * @returns {{ ok: boolean, reference: string|null, divergent: string[], checked: string[] }}
 */
function checkDrift(dir) {
  dir = dir || process.cwd();

  const present = HARNESS_FILES
    .map(rel => ({ rel, full: path.join(dir, rel) }))
    .filter(f => fs.existsSync(f.full));

  if (present.length < 2) {
    return { ok: true, reference: present[0] ? present[0].rel : null, divergent: [], checked: present.map(p => p.rel) };
  }

  const reference = present[0];
  const referenceContent = fs.readFileSync(reference.full);
  const divergent = [];
  for (const f of present.slice(1)) {
    const content = fs.readFileSync(f.full);
    if (!content.equals(referenceContent)) {
      divergent.push(f.rel);
    }
  }

  return { ok: divergent.length === 0, reference: reference.rel, divergent, checked: present.map(p => p.rel) };
}

function main() {
  const args = process.argv.slice(2);
  const dirFlagIdx = args.indexOf('--dir');
  const dir = dirFlagIdx !== -1 && args[dirFlagIdx + 1] ? path.resolve(args[dirFlagIdx + 1]) : process.cwd();

  const result = checkDrift(dir);

  if (result.checked.length < 2) {
    console.log(`[instructions-drift] Only ${result.checked.length} harness instruction file(s) present under ${dir} — nothing to compare.`);
    process.exit(0);
  }

  if (result.ok) {
    console.log(`[instructions-drift] OK — all ${result.checked.length} harness instruction file(s) match "${result.reference}" byte-for-byte.`);
    process.exit(0);
  }

  console.error(`[instructions-drift] DRIFT DETECTED — the following file(s) no longer match "${result.reference}":`);
  for (const f of result.divergent) {
    console.error(`  ✗ ${f}`);
  }
  console.error('[instructions-drift] Re-run `bash scripts/assemble-copilot-instructions.sh --all-harnesses` to regenerate, or revert the hand-edit.');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { checkDrift, HARNESS_FILES };
