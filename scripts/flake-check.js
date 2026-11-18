#!/usr/bin/env node
'use strict';
// flk-s1 -- the flake ledger (tests/e2e/flake-ledger.json) and the rerun rule (tests/FLAKE-POLICY.md).
//
//   node scripts/flake-check.js --check                 validate the ledger (exit 1 on an incomplete or overdue entry)
//   node scripts/flake-check.js --report <report.json>  list the tests a Playwright JSON report marked flaky
//   node scripts/flake-check.js --report <report.json> --strict   also exit 1 for a flake with no ledger entry

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const LEDGER = path.join(root, 'tests', 'e2e', 'flake-ledger.json');
const MAX_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const REQUIRED = ['test', 'owner', 'issue', 'reviewBy'];

function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);
}

// `today` is an argument so the overdue rule can be tested without waiting for a date to pass.
function validateLedger(ledger, today) {
  const problems = [];
  ((ledger && ledger.entries) || []).forEach(function (e) {
    const name = e.test || '(no test name)';
    REQUIRED.forEach(function (k) {
      if (!e[k]) problems.push('"' + name + '": missing ' + k);
    });
    if (!e.firstSeen) problems.push('"' + name + '": missing firstSeen');
    if (e.firstSeen && e.reviewBy && daysBetween(e.firstSeen, e.reviewBy) > MAX_DAYS) {
      problems.push('"' + name + '": reviewBy is more than ' + MAX_DAYS + ' days after firstSeen');
    }
    if (e.reviewBy && today && e.reviewBy < today) {
      problems.push('"' + name + '": review date ' + e.reviewBy + ' has passed (overdue)');
    }
  });
  return problems;
}

function exitCodeForLedger(problems) {
  return problems.length ? 1 : 0;
}

// Playwright marks a test flaky when a retry passes; the id is the file and the title.
function flakyTests(report) {
  const out = [];
  function walk(suite, inheritedFile) {
    const file = suite.file || inheritedFile;
    (suite.specs || []).forEach(function (spec) {
      (spec.tests || []).forEach(function (t) {
        if (t.status === 'flaky') out.push((spec.file || file) + ' > ' + spec.title);
      });
    });
    (suite.suites || []).forEach(function (s) { walk(s, file); });
  }
  (report.suites || []).forEach(function (s) { walk(s, undefined); });
  return out;
}

function untrackedFlakes(flaky, ledger) {
  const tracked = new Set(((ledger && ledger.entries) || []).map(function (e) { return e.test; }));
  return flaky.filter(function (id) { return !tracked.has(id); });
}

function exitCodeForReport(untracked, strict) {
  return strict && untracked.length ? 1 : 0;
}

function readLedger() {
  return JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
}

function main(argv) {
  const today = new Date().toISOString().slice(0, 10);
  if (argv.indexOf('--check') !== -1) {
    const problems = validateLedger(readLedger(), today);
    problems.forEach(function (p) { console.error('flake-ledger: ' + p); });
    if (!problems.length) console.log('[flk-s1] flake ledger: ' + (readLedger().entries || []).length + ' entries, all complete and in date');
    return exitCodeForLedger(problems);
  }
  const at = argv.indexOf('--report');
  if (at !== -1) {
    const report = JSON.parse(fs.readFileSync(argv[at + 1], 'utf8'));
    const flaky = flakyTests(report);
    const untracked = untrackedFlakes(flaky, readLedger());
    if (!flaky.length) console.log('[flk-s1] no test was marked flaky in this run');
    flaky.forEach(function (id) {
      console.log((untracked.indexOf(id) === -1 ? 'flaky (tracked): ' : 'flaky (NOT IN LEDGER): ') + id);
    });
    return exitCodeForReport(untracked, argv.indexOf('--strict') !== -1);
  }
  console.error('usage: flake-check.js --check | --report <playwright-report.json> [--strict]');
  return 2;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { validateLedger, exitCodeForLedger, flakyTests, untrackedFlakes, exitCodeForReport };
