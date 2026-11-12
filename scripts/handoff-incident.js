#!/usr/bin/env node
'use strict';

/**
 * handoff-incident.js (itar-s4)
 *
 * Hands an incident's triage context into a short-track story and links the
 * incident record to that story's slug.
 *
 *   node scripts/handoff-incident.js --incident <id> --story <slug> [--file <incidents.json>] [--artefacts-dir <dir>]
 *
 * Writes <artefacts-dir>/<slug>/incident-handoff.md (default dir: artefacts/)
 * for /test-plan and /definition-of-ready to read, then sets linkedStory on
 * the record. Exits 1 with a message on stderr and changes nothing on error.
 */

const path = require('path');
const { linkIncidentToStory } = require('./lib/incident-handoff');
const { DEFAULT_INCIDENTS_FILE } = require('../src/modules/incident-recorder');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].indexOf('--') === 0) { args[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return args;
}

function fail(message) {
  process.stderr.write('handoff-incident: ' + message + '\n');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (!args.incident) fail('missing required option --incident');
if (!args.story) fail('missing required option --story');

try {
  const res = linkIncidentToStory(
    args.incident,
    args.story,
    args.file || DEFAULT_INCIDENTS_FILE,
    args['artefacts-dir'] || path.join(__dirname, '..', 'artefacts')
  );
  process.stdout.write('Linked incident ' + args.incident + ' to story ' + args.story + '\n');
  process.stdout.write('Handoff context: ' + res.contextFile + '\n');
} catch (err) {
  fail(err.message);
}
