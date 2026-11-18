#!/usr/bin/env node
'use strict';
// vfy-s1 -- one command for the core browser lane. Runs the same specs, with the same single worker and test
// environment, that the Core browser tests job runs in CI; Playwright starts the test server itself (its webServer
// setting in playwright.config.js). Prints a short digest of what failed from Playwright's JSON report. The full
// output, including the server log, is written to a file whose path is printed.
//
//   node scripts/verify.js                         the core lane
//   node scripts/verify.js tests/e2e/x.spec.js     only the files given

const childProcess = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const { listCoreSpecs } = require('./list-core-specs');
const PLAYWRIGHT_CLI = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const PORT = 3999; // playwright.config.js webServer url
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

function coreSpecs() {
  const matrix = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'e2e', 'capability-matrix.json'), 'utf8'));
  const list = listCoreSpecs(matrix);
  if (list.length === 0) throw new Error('No spec has lane "core" in tests/e2e/capability-matrix.json; refusing to run an empty core.');
  return list;
}

function parseArgs(argv) {
  return { specs: argv.length ? argv : coreSpecs() };
}

function buildPlaywrightArgs(specs) {
  return [PLAYWRIGHT_CLI, 'test', ...specs, '--workers=1', '--reporter=json'];
}

function buildEnv(base, jsonPath) {
  return Object.assign({}, base, { NODE_ENV: 'test', PLAYWRIGHT_JSON_OUTPUT_NAME: jsonPath });
}

function firstLine(message) {
  const lines = String(message || '').replace(ANSI, '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  return lines[0] || '';
}

// The file as the repository names it (Playwright reports it relative to the test directory).
function displayFile(report, file) {
  const project = report.config && report.config.projects && report.config.projects[0];
  if (!project || !project.testDir || !file) return file;
  return path.relative(root, path.join(project.testDir, file)).split(path.sep).join('/');
}

// The first attempt's error is the one to read: a retry usually repeats it.
function readFailures(report) {
  const out = [];
  function walk(suite, inheritedFile) {
    const file = suite.file || inheritedFile;
    (suite.specs || []).forEach(function (spec) {
      (spec.tests || []).forEach(function (t) {
        if (t.status !== 'unexpected') return;
        const results = t.results || [];
        const withError = results.find(function (r) { return r.errors && r.errors.length; });
        const message = withError ? withError.errors[0].message : '';
        out.push({
          title: spec.title,
          file: displayFile(report, spec.file || file),
          line: spec.line,
          error: firstLine(message),
        });
      });
    });
    (suite.suites || []).forEach(function (s) { walk(s, file); });
  }
  (report.suites || []).forEach(function (s) { walk(s, undefined); });
  return out;
}

function formatDigest(failures, stats) {
  if (!stats) return 'FAILED: no report was written, so the result of the run is unknown. Read the full output file.';
  const counts = stats.expected + ' passed' + (stats.flaky ? ', ' + stats.flaky + ' flaky' : '') + (stats.skipped ? ', ' + stats.skipped + ' skipped' : '');
  if (failures.length === 0) return 'PASS: ' + counts + '.';
  const lines = ['FAILED: ' + failures.length + ' test' + (failures.length === 1 ? '' : 's') + ' failed (' + counts + ').'];
  failures.forEach(function (f, i) {
    lines.push('  ' + (i + 1) + ') ' + f.title);
    lines.push('     ' + f.file + (f.line ? ':' + f.line : ''));
    if (f.error) lines.push('     ' + f.error);
  });
  return lines.join('\n');
}

function exitCodeFor(code, failures) {
  return failures.length > 0 ? (code || 1) : code;
}

// A port is busy when something accepts a connection on it. Probing both loopback addresses matters: on Windows a
// listener bound to 127.0.0.1 does not stop a bind on all interfaces, so a bind test reports a busy port as free.
function accepts(host, port) {
  return new Promise(function (resolve) {
    const sock = net.connect({ host: host, port: port });
    const done = function (answer) { sock.destroy(); resolve(answer); };
    sock.setTimeout(500, function () { done(false); });
    sock.once('connect', function () { done(true); });
    sock.once('error', function () { done(false); });
  });
}

async function portIsFree(port) {
  const busy = (await accepts('127.0.0.1', port)) || (await accepts('::1', port));
  return !busy;
}

async function main(argv) {
  let specs;
  try { specs = parseArgs(argv).specs; }
  catch (e) { console.error(e.message); return 2; }

  if (!(await portIsFree(PORT))) {
    console.error('Port ' + PORT + ' is already in use, so Playwright cannot start the test server there. Stop what is using it and run again.');
    return 2;
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-'));
  const jsonPath = path.join(dir, 'report.json');
  const logPath = path.join(dir, 'run.log');
  console.log('Running ' + specs.length + ' spec file' + (specs.length === 1 ? '' : 's') + ' with one worker. Full output: ' + logPath);

  const logFd = fs.openSync(logPath, 'w');
  const child = childProcess.spawnSync(process.execPath, buildPlaywrightArgs(specs), {
    cwd: root, env: buildEnv(process.env, jsonPath), stdio: ['ignore', logFd, logFd],
  });
  fs.closeSync(logFd);

  let report = null;
  try { report = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) { report = null; }
  const failures = report ? readFailures(report) : [];
  console.log(formatDigest(failures, report ? report.stats : null));

  let code = child.status === null ? 1 : child.status;
  if (!report) code = code || 1;
  return exitCodeFor(code, failures);
}

if (require.main === module) {
  main(process.argv.slice(2)).then(function (code) { process.exitCode = code; });
}

module.exports = { parseArgs, buildPlaywrightArgs, buildEnv, readFailures, formatDigest, exitCodeFor, portIsFree, PORT };
