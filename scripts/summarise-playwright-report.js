#!/usr/bin/env node
'use strict';
// lpw-s1 (AC6, AC7) -- turns the Playwright JSON report and a c8 json-summary into Markdown tables for the
// GitHub job summary. Pure functions plus a small CLI; reads files, writes Markdown to stdout. Never fails the job:
// a missing or unreadable input prints a one-line note and exits 0.
//
//   node scripts/summarise-playwright-report.js report pw-report.json
//   node scripts/summarise-playwright-report.js coverage coverage-e2e/coverage-summary.json [topN]

const fs = require('fs');

/** Walk a Playwright JSON report and return one row per spec file. */
function collectSpecRows(report) {
  const by = {};
  function walk(suite, inheritedFile) {
    const file = suite.file || inheritedFile || '(unknown file)';
    (suite.specs || []).forEach(function (spec) {
      const key = spec.file || file;
      const row = by[key] = by[key] || { spec: key, passed: 0, failed: 0, flaky: 0, skipped: 0, seconds: 0 };
      (spec.tests || []).forEach(function (t) {
        const results = t.results || [];
        const last = results[results.length - 1] || {};
        if (t.status === 'expected') row.passed++;
        else if (t.status === 'skipped') row.skipped++;
        else if (t.status === 'flaky') row.flaky++;
        else row.failed++;
        row.seconds += (last.duration || 0) / 1000;
      });
    });
    (suite.suites || []).forEach(function (s) { walk(s, file); });
  }
  walk(report || {}, '');
  return Object.keys(by).map(function (k) { return by[k]; });
}

/** Markdown for the per-spec table: failing specs first, then slowest. */
function summariseReport(report) {
  const rows = collectSpecRows(report);
  if (rows.length === 0) return '### Playwright report\n\nNo tests were recorded in the report.\n';
  rows.sort(function (a, b) { return (b.failed - a.failed) || (b.flaky - a.flaky) || (b.seconds - a.seconds) || a.spec.localeCompare(b.spec); });
  const tot = rows.reduce(function (t, r) {
    t.passed += r.passed; t.failed += r.failed; t.flaky += r.flaky; t.skipped += r.skipped; t.seconds += r.seconds; return t;
  }, { passed: 0, failed: 0, flaky: 0, skipped: 0, seconds: 0 });
  const lines = [
    '### Playwright report',
    '',
    tot.passed + ' passed, ' + tot.failed + ' failed, ' + tot.flaky + ' flaky, ' + tot.skipped + ' skipped across ' + rows.length + ' spec files (' + Math.round(tot.seconds) + ' s of test time).',
    '',
    '| Spec | Passed | Failed | Flaky | Skipped | Seconds |',
    '|---|---|---|---|---|---|'
  ];
  rows.forEach(function (r) {
    lines.push('| ' + r.spec + ' | ' + r.passed + ' | ' + r.failed + ' | ' + r.flaky + ' | ' + r.skipped + ' | ' + Math.round(r.seconds) + ' |');
  });
  return lines.join('\n') + '\n';
}

/** Markdown for a c8 json-summary: totals and the least-covered files. */
function summariseCoverage(summary, topN) {
  if (!summary || !summary.total) return '### Server code coverage (browser suite)\n\nNo coverage summary was produced.\n';
  const n = topN || 15;
  const pct = function (m) { return (m && typeof m.pct === 'number') ? m.pct.toFixed(1) + '%' : 'n/a'; };
  const files = Object.keys(summary).filter(function (k) { return k !== 'total'; }).map(function (k) {
    return { file: k.replace(/\\/g, '/').replace(/^.*\/(src\/)/, '$1'), lines: summary[k].lines || {}, functions: summary[k].functions || {} };
  });
  if (files.length === 0) {
    return '### Server code coverage (browser suite)\n\nNo server coverage was recorded: the summary has no files. The server may not have shut down cleanly, so it never wrote its coverage.\n';
  }
  files.sort(function (a, b) { return (a.lines.pct || 0) - (b.lines.pct || 0) || a.file.localeCompare(b.file); });
  const out = [
    '### Server code coverage (browser suite)',
    '',
    'Lines ' + pct(summary.total.lines) + ', functions ' + pct(summary.total.functions) + ', statements ' + pct(summary.total.statements) + ', branches ' + pct(summary.total.branches) + ' across ' + files.length + ' files under src/web-ui. Informational only; it does not affect pass or fail.',
    '',
    '| Least-covered files | Lines | Functions |',
    '|---|---|---|'
  ];
  files.slice(0, n).forEach(function (f) { out.push('| ' + f.file + ' | ' + pct(f.lines) + ' | ' + pct(f.functions) + ' |'); });
  return out.join('\n') + '\n';
}

function main(argv) {
  const mode = argv[2];
  const file = argv[3];
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    process.stdout.write(mode === 'coverage' ? summariseCoverage(data, Number(argv[4]) || undefined) : summariseReport(data));
  } catch (e) {
    process.stdout.write('### ' + (mode === 'coverage' ? 'Server code coverage' : 'Playwright report') + '\n\nNo ' + (mode === 'coverage' ? 'coverage summary' : 'report') + ' to summarise (' + String(e.message).split('\n')[0] + ').\n');
  }
}

if (require.main === module) main(process.argv);

module.exports = { collectSpecRows, summariseReport, summariseCoverage };
