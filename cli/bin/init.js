#!/usr/bin/env node
'use strict';

const path = require('path');
const { runInit } = require('../lib/init');

function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0];
  if (subcommand !== 'init') {
    process.stderr.write('[skills-repo] Usage: skills-repo init <target-dir> [--force]\n');
    process.exit(1);
  }
  const force = args.includes('--force');
  const positional = args.slice(1).filter(a => !a.startsWith('-'));
  const targetDir = positional[0] ? path.resolve(positional[0]) : process.cwd();
  runInit(targetDir, { force });
}

main();
