#!/usr/bin/env node
'use strict';

/**
 * create-incident.js (iwf-s1)
 *
 * Records a production incident and prints its triage summary.
 *
 *   node scripts/create-incident.js --trigger <text> --summary <text> --tags <a,b,c> [--file <path>]
 *
 * Writes to workspace/incidents.json unless --file is given. Exits 1 with a
 * message on stderr, and writes nothing, when input is missing or invalid.
 */

const { recordIncident } = require('../src/modules/incident-recorder');

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
  process.stderr.write('create-incident: ' + message + '\n');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (!args.trigger) fail('missing required option --trigger');
if (!args.summary) fail('missing required option --summary');
if (!args.tags) fail('missing required option --tags (comma-separated)');

const tags = args.tags.split(',').map((t) => t.trim()).filter(Boolean);

try {
  const record = recordIncident({ trigger: args.trigger, summary: args.summary, tags: tags }, args.file);
  process.stdout.write('Recorded incident ' + record.id + '\n');
  process.stdout.write('Triage summary: ' + record.triageSummary + '\n');
} catch (err) {
  fail(err.message);
}
