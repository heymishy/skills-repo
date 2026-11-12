#!/usr/bin/env node
'use strict';

/**
 * confirm-incident-fix.js (itar-s4)
 *
 * Post-fix confirmation for an incident whose linked story has reached
 * dodStatus: complete in pipeline-state.json.
 *
 *   node scripts/confirm-incident-fix.js --incident <id> [--result pass|fail]
 *        [--file <incidents.json>] [--pipeline-state <path>] [--registry <module.js>]
 *
 * Automated branch: a check registered for the incident's trigger is run
 * (--registry points at a module exporting { trigger: fn }; the built-in
 * registry is empty until initiative 2 ships).
 * Manual branch: no check exists, so a person supplies --result. Without it
 * the prompt is printed, nothing is written, and the exit code is 2.
 * Exit codes: 0 recorded, 1 error (nothing written), 2 manual result needed.
 */

const path = require('path');
const { confirmIncidentFix } = require('./lib/incident-handoff');
const { DEFAULT_INCIDENTS_FILE } = require('../src/modules/incident-recorder');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].indexOf('--') === 0) { args[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return args;
}

function fail(message) {
  process.stderr.write('confirm-incident-fix: ' + message + '\n');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (!args.incident) fail('missing required option --incident');
if (args.result !== undefined && args.result !== 'pass' && args.result !== 'fail') {
  fail('--result must be pass or fail');
}

try {
  const registry = args.registry ? require(path.resolve(args.registry)) : undefined;
  const res = confirmIncidentFix(
    args.incident,
    args.file || DEFAULT_INCIDENTS_FILE,
    args['pipeline-state'] || path.join(__dirname, '..', '.github', 'pipeline-state.json'),
    { registry: registry, manualResult: args.result }
  );
  if (!res.done) {
    process.stdout.write('Manual confirmation needed. ' + res.prompt + '\n');
    process.exit(2);
  }
  process.stdout.write('Incident ' + args.incident + ' ' + res.record.confirmationStatus + ' (' + res.confirmationMethod + ')\n');
  if (res.record.confirmationStatus === 'not-confirmed') {
    process.stdout.write('Incident stays open (flagged); the failed fix attempt is logged.\n');
  }
} catch (err) {
  fail(err.message);
}
