#!/usr/bin/env node
'use strict';

/**
 * register-deferral.js (ddft-s4)
 *
 * Registers a deferred-item record. Invoked from the State-update section of
 * /discovery, /decisions and /definition-of-done.
 *
 *   --hook discovery-out-of-scope --artefact <discovery.md> --feature <slug>
 *   --hook risk-accept --decision-ref <ref> --summary <text> [--revisit <text>] [--feature <slug>] [--story <id>]
 *   --hook unmeasured-benefit-metric --metric <name> --evidence <note> [--feature <slug>] [--story <id>]
 *
 * Writes to workspace/incidents.json unless --file is given. Exits 1 with a
 * message on stderr, and writes nothing, when input is missing or invalid.
 */

const fs = require('fs');
const { registerDeferral, parseOutOfScope } = require('./lib/deferral-hooks');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.indexOf('--') === 0) {
      args[a.slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function fail(message) {
  process.stderr.write('register-deferral: ' + message + '\n');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (!args.hook) fail('missing required option --hook');

const ctx = {
  feature: args.feature,
  story: args.story,
  decisionRef: args['decision-ref'],
  summary: args.summary,
  revisitCondition: args.revisit,
  metric: args.metric,
  evidence: args.evidence,
};

try {
  if (args.hook === 'discovery-out-of-scope') {
    if (!args.artefact) fail('missing required option --artefact');
    ctx.outOfScopeItems = parseOutOfScope(fs.readFileSync(args.artefact, 'utf8'));
  }
  const records = registerDeferral(args.hook, ctx, args.file);
  process.stdout.write('Registered ' + records.length + ' deferred-item record(s) from hook ' + args.hook + '\n');
} catch (err) {
  fail(err.message);
}
