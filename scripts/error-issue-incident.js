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
 * argument, and it is never printed, with one exception. A dry run prints the validated one-line code and
 * the pull request text inside a line that starts with the fixed prefix "error-issue-incident-dry-run: ",
 * so that it can never form a workflow command. Every run prints exactly one line that starts with
 * "error-issue-incident: ", and error messages are fixed text that never repeats input.
 */

const fs = require('fs');
const lib = require('./lib/error-issue-incident');
const { recordIncident } = require('../src/modules/incident-recorder');

const VALUE_OPTIONS = ['event', 'author', 'facts', 'incidents', 'github-output', 'out', 'plan-env'];
const SWITCHES = ['dry-run', 'rebuild'];

function fail(message) {
  process.stderr.write('error-issue-incident: ' + message + '\n');
  process.exit(1);
}

// Strict argument parsing: a fixed list of options, each given at most once, in null-prototype maps so that
// no option can overwrite another or reach an inherited property. The command is only the first positional.
function parseArgs(argv) {
  const command = argv[0];
  const opts = Object.create(null);
  const flags = Object.create(null);
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a.indexOf('--') !== 0) fail('unexpected argument');
    const name = a.slice(2);
    if (SWITCHES.indexOf(name) !== -1) {
      if (flags[name]) fail('unexpected argument');
      flags[name] = true;
      continue;
    }
    if (VALUE_OPTIONS.indexOf(name) === -1 || name in opts) fail('unexpected argument');
    const value = argv[i + 1];
    if (typeof value !== 'string' || value.indexOf('--') === 0) fail('unexpected argument');
    if (value === '' && name !== 'author') fail('unexpected argument');
    opts[name] = value;
    i++;
  }
  return { command: command, opts: opts, flags: flags };
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
  try { fs.appendFileSync(file, lines.join('\n') + '\n'); } catch (e) { fail('could not write outputs'); }
}

function writePlanFile(file, plan) {
  if (!file) return;
  try { fs.writeFileSync(file, JSON.stringify(plan, null, 2) + '\n'); } catch (e) { fail('could not write outputs'); }
}

function hasRecordFor(records, id) {
  const tag = 'posthog:' + id;
  return records.some((r) => r && Array.isArray(r.tags) && r.tags.some((t) => String(t).trim().toLowerCase() === tag));
}

function runPlan(args) {
  const o = args.opts;
  const event = lib.normaliseEvent(readJsonFile(o.event, 'event file'));
  const factsRaw = readJsonFile(o.facts, 'facts file') || {};
  const records = readIncidents(o.incidents);
  let plan;
  try {
    plan = lib.planRun({
      event: event,
      config: { bridgeAuthor: o.author },
      facts: { branches: factsRaw.branches, openPullRequests: factsRaw.openPullRequests, records: records },
      options: { rebuild: !!args.flags.rebuild, dryRun: !!args.flags['dry-run'] }
    });
  } catch (e) {
    fail('could not plan: the facts or the event are not acceptable');
  }
  // outputs first: a failed write must not leave a success line behind
  writeOutputs(o['github-output'], { action: plan.action, reason: plan.reason, branch: plan.branch || '', plan: JSON.stringify(plan) });
  writePlanFile(o.out, plan);
  process.stdout.write(resultLine(plan) + '\n');
  if (plan.action === 'dry-run') {
    process.stdout.write('error-issue-incident-dry-run: ' + JSON.stringify({ record: plan.record, pullRequest: plan.pullRequest, branch: plan.branch }) + '\n');
  }
}

function runBuild(args) {
  const o = args.opts;
  // explicit path first: the real recorder falls back to the real incident file when given none
  if (typeof o.incidents !== 'string' || o.incidents === '') fail('missing incident file path');
  const name = o['plan-env'];
  if (typeof name !== 'string' || !/^[A-Z_][A-Z0-9_]*$/.test(name)) fail('missing or invalid plan variable name');
  let plan;
  try { plan = JSON.parse(process.env[name] || ''); } catch (e) { fail('plan is not valid JSON'); }
  let checked;
  try { checked = lib.validatePlanForBuild(plan); } catch (e) { fail('plan is not acceptable'); }
  const records = readIncidents(o.incidents); // fails early on an unreadable or damaged file, before anything is written
  if (hasRecordFor(records, checked.id)) fail('a record for this id already exists');
  const record = lib.planRecord(checked);
  const pr = lib.buildPullRequest(checked);
  // outputs before the record: a bad output path then leaves nothing half done
  writeOutputs(o['github-output'], { branch: lib.branchNameFor(checked.id), pr_title: pr.title, pr_body: pr.body });
  try { recordIncident(record, o.incidents); } catch (e) { fail('could not record the incident'); }
  process.stdout.write('error-issue-incident: recorded ' + checked.action + ' issue #' + checked.issueNumber + '\n');
}

const args = parseArgs(process.argv.slice(2));
if (args.command === 'plan') runPlan(args);
else if (args.command === 'build') runBuild(args);
else fail('unknown command');
