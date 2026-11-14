#!/usr/bin/env node
'use strict';

/**
 * error-issue-incident.js (coha-s7)
 *
 *   node scripts/error-issue-incident.js plan  --event <file> --author <login> --facts <file> --incidents <file>
 *        [--dry-run] [--rebuild] [--github-output <file>] [--out <file>]
 *   node scripts/error-issue-incident.js build --plan-env <VAR> --incidents <file> [--github-output <file>]
 *
 * plan:  recognise the issue and decide what to do; writes nothing except the optional output files.
 * build: append one incident record to the given incident file (never a default path) through the real recorder.
 *
 * Issue text is untrusted data: it is read from a JSON file or an environment variable, never from an
 * argument, and never printed. Every run prints exactly one result line starting "error-issue-incident: ".
 */

const fs = require('fs');
const lib = require('./lib/error-issue-incident');
const { recordIncident } = require('../src/modules/incident-recorder');

const FLAGS = ['dry-run', 'rebuild'];

function fail(message) {
  process.stderr.write('error-issue-incident: ' + message + '\n');
  process.exit(1);
}

function parseArgs(argv) {
  const args = { command: argv[0], flags: {} };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (typeof a !== 'string' || a.indexOf('--') !== 0) fail('unexpected argument');
    const name = a.slice(2);
    if (FLAGS.indexOf(name) !== -1) { args.flags[name] = true; continue; }
    args[name] = argv[i + 1];
    i++;
  }
  return args;
}

function readJsonFile(file, what) {
  if (typeof file !== 'string' || file === '') fail('missing ' + what + ' path');
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { fail('could not read ' + what); }
  if (raw.trim() === '') return null;
  try { return JSON.parse(raw); } catch (e) { fail(what + ' is not valid JSON'); }
}

function readIncidents(file) {
  const data = readJsonFile(file, 'incident file');
  if (data === null) return [];
  if (!Array.isArray(data)) fail('incident file is not a list');
  return data;
}

function resultLine(plan) {
  return 'error-issue-incident: ' + plan.action + ' ' + plan.reason + (plan.issueNumber ? ' issue #' + plan.issueNumber : '');
}

function writeOutputs(file, pairs) {
  if (!file) return;
  const lines = Object.keys(pairs).map((k) => {
    const v = String(pairs[k]);
    if (/[\r\n]/.test(v)) fail('an output value has a line break');
    return k + '=' + v;
  });
  fs.appendFileSync(file, lines.join('\n') + '\n');
}

function runPlan(args) {
  const event = lib.normaliseEvent(readJsonFile(args.event, 'event file'));
  const factsRaw = readJsonFile(args.facts, 'facts file') || {};
  const records = readIncidents(args.incidents);
  let plan;
  try {
    plan = lib.planRun({
      event: event,
      config: { bridgeAuthor: args.author },
      facts: { branches: factsRaw.branches, openPullRequests: factsRaw.openPullRequests, records: records },
      options: { rebuild: !!args.flags.rebuild, dryRun: !!args.flags['dry-run'] }
    });
  } catch (e) {
    fail('could not plan: the facts or the event are not acceptable');
  }
  process.stdout.write(resultLine(plan) + '\n');
  if (plan.action === 'dry-run') {
    process.stdout.write('error-issue-incident-dry-run: ' + JSON.stringify({ record: plan.record, pullRequest: plan.pullRequest, branch: plan.branch }) + '\n');
  }
  writeOutputs(args['github-output'], { action: plan.action, reason: plan.reason, branch: plan.branch || '', plan: JSON.stringify(plan) });
  if (args.out) fs.writeFileSync(args.out, JSON.stringify(plan, null, 2) + '\n');
}

function runBuild(args) {
  const name = args['plan-env'];
  if (typeof name !== 'string' || !/^[A-Z_][A-Z0-9_]*$/.test(name)) fail('missing or invalid plan variable name');
  let plan;
  try { plan = JSON.parse(process.env[name] || ''); } catch (e) { fail('plan is not valid JSON'); }
  let checked;
  try { checked = lib.validatePlanForBuild(plan); } catch (e) { fail('plan is not acceptable'); }
  readIncidents(args.incidents); // fails early on an unreadable or damaged file, before anything is written
  const record = lib.planRecord(checked);
  const pr = lib.buildPullRequest(checked);
  try { recordIncident(record, args.incidents); } catch (e) { fail('could not record the incident'); }
  process.stdout.write('error-issue-incident: recorded ' + checked.action + ' issue #' + checked.issueNumber + '\n');
  writeOutputs(args['github-output'], { branch: lib.branchNameFor(checked.id), pr_title: pr.title, pr_body: pr.body });
}

const args = parseArgs(process.argv.slice(2));
if (args.command === 'plan') runPlan(args);
else if (args.command === 'build') runBuild(args);
else fail('unknown command');
