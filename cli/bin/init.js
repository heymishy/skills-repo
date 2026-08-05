#!/usr/bin/env node
'use strict';

const path = require('path');
const { runInit } = require('../lib/init');

async function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0];
  if (subcommand !== 'init') {
    process.stderr.write(
      '[skills-repo] Usage: skills-repo init <target-dir> [--force] [--from-saas <feature-slug>] [--with-outer-loop]\n' +
      '[skills-repo]   --with-outer-loop  Enable the outer loop (discovery through decisions) at session start.\n' +
      '[skills-repo]                      Every skill file is always installed either way -- this only flips\n' +
      '[skills-repo]                      outerLoop.enabled in context.yml and how the generated instruction\n' +
      '[skills-repo]                      file presents outer-loop skills (active vs. installed-but-not-enabled).\n' +
      '[skills-repo]                      Add-on mode: re-run init later against the same directory with just\n' +
      '[skills-repo]                      --with-outer-loop (no --force needed) to enable it after the fact --\n' +
      '[skills-repo]                      this is the supported path and never touches any other bootstrapped file.\n'
    );
    process.exit(1);
  }
  const force = args.includes('--force');
  const withOuterLoop = args.includes('--with-outer-loop');

  // --from-saas takes a value (the feature slug) -- both the flag token and
  // its value must be excluded from positional-argument parsing below, so
  // the slug is never mistaken for the target directory.
  const fromSaasIdx = args.indexOf('--from-saas');
  const fromSaas = fromSaasIdx !== -1 ? args[fromSaasIdx + 1] : undefined;
  if (fromSaasIdx !== -1 && !fromSaas) {
    process.stderr.write('[skills-repo] --from-saas requires a feature slug argument\n');
    process.exit(1);
  }
  const consumedIndices = new Set(fromSaasIdx !== -1 ? [fromSaasIdx, fromSaasIdx + 1] : []);

  const positional = args
    .slice(1)
    .map((value, i) => ({ value, argvIndex: i + 1 }))
    .filter(({ value, argvIndex }) => !value.startsWith('-') && !consumedIndices.has(argvIndex))
    .map(({ value }) => value);

  const targetDir = positional[0] ? path.resolve(positional[0]) : process.cwd();
  await runInit(targetDir, { force, fromSaas, withOuterLoop });
}

main().catch((err) => {
  process.stderr.write(`[skills-repo-init] ${err.message}\n`);
  process.exit(1);
});
