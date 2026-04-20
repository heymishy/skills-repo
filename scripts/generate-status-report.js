#!/usr/bin/env node
// generate-status-report.js
// Generates daily and weekly pipeline status reports from pipeline-state.json data.
// No external dependencies — Node.js built-ins only.
// Security (MC-SEC-02): no credentials, no hardcoded org names.
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────────────

function weekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(isoA, isoB) {
  return Math.floor(Math.abs(new Date(isoB) - new Date(isoA)) / (1000 * 60 * 60 * 24));
}

function allStories(state) {
  const out = [];
  for (const f of (state.features || [])) {
    for (const s of (f.stories || [])) {
      out.push(Object.assign({ featureSlug: f.slug }, s));
    }
  }
  return out;
}

function allSignals(state) {
  const out = [];
  for (const f of (state.features || [])) {
    for (const m of (f.benefitMetrics || [])) {
      out.push(m);
    }
  }
  return out;
}

// ── generateDailyReport ──────────────────────────────────────────

function generateDailyReport(state, opts) {
  opts = opts || {};
  const now = new Date();
  const stories = allStories(state);

  const inFlight = stories.filter(s => s.dodStatus !== 'complete' && s.stage && s.stage !== 'definition-of-done');
  const blocked  = stories.filter(s => s.health === 'red');
  const pending  = stories.filter(s => s.stage === 'definition-of-ready' || s.stage === 'branch-setup');
  const recent   = stories.filter(s => {
    const ts = s.updatedAt || s.stageEnteredAt;
    return ts && (now - new Date(ts)) < 3 * 24 * 60 * 60 * 1000;
  });

  let totalTests = 0;
  let passing    = 0;
  for (const s of stories) {
    if (s.testPlan) {
      totalTests += s.testPlan.totalTests || 0;
      passing    += s.testPlan.passing    || 0;
    }
  }

  const lines = [];
  lines.push('# Daily Pipeline Status Report');
  lines.push('\nGenerated: ' + now.toISOString() + '\n');

  lines.push('## In-Flight Stories');
  if (inFlight.length === 0) {
    lines.push('_None_');
  } else {
    lines.push('| Story | Stage | Days in phase |');
    lines.push('|-------|-------|--------------|');
    for (const s of inFlight) {
      const entered = s.stageEnteredAt || s.updatedAt || now.toISOString();
      const days    = daysBetween(entered, now.toISOString());
      lines.push('| ' + (s.id || s.slug || '') + ' | ' + (s.stage || '') + ' | ' + days + ' |');
    }
  }

  lines.push('\n## Blocked Items');
  if (blocked.length === 0) {
    lines.push('_None_');
  } else {
    for (const s of blocked) {
      lines.push('- ' + (s.id || s.slug || '') + ': ' + (s.blocker || 'blocked'));
    }
  }

  lines.push('\n## Pending Human Actions');
  if (pending.length === 0) {
    lines.push('_None_');
  } else {
    for (const s of pending) {
      lines.push('- ' + (s.id || s.slug || '') + ': ' + s.stage);
    }
  }

  lines.push('\n## Recent Activity');
  if (recent.length === 0) {
    lines.push('_No activity in the last 3 days_');
  } else {
    for (const s of recent) {
      lines.push('- ' + (s.id || s.slug || '') + ': ' + (s.stage || ''));
    }
  }

  lines.push('\n## Test Count');
  lines.push('- Total tests: ' + totalTests);
  lines.push('- Passing: ' + passing);

  const report = lines.join('\n');
  if (opts.output) {
    const dir = path.dirname(opts.output);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(opts.output, report, 'utf8');
    return null;
  }
  return report;
}

// ── generateWeeklyReport ─────────────────────────────────────────

function generateWeeklyReport(state, opts) {
  opts = opts || {};
  const now  = new Date();
  const wMon = weekStart(now);
  const wSun = new Date(wMon);
  wSun.setDate(wMon.getDate() + 6);
  wSun.setHours(23, 59, 59, 999);

  const stories = allStories(state);
  const signals = allSignals(state);

  const thisWeek = stories.filter(s => {
    if (!s.dodAt) return false;
    const d = new Date(s.dodAt);
    return d >= wMon && d <= wSun;
  });

  const counts = { discovery: 0, definition: 0, review: 0, inner: 0, done: 0 };
  const innerStages = ['branch-setup', 'implementation-plan', 'subagent-execution', 'verify-completion', 'branch-complete'];
  const reviewStages = ['review', 'test-plan', 'definition-of-ready'];
  for (const s of stories) {
    const st = s.stage || '';
    if (st === 'discovery')               counts.discovery++;
    else if (st === 'definition')         counts.definition++;
    else if (reviewStages.includes(st))   counts.review++;
    else if (innerStages.includes(st))    counts.inner++;
    else if (st === 'definition-of-done' || s.dodStatus === 'complete') counts.done++;
  }

  const doneWithTiming = stories.filter(s => s.dodStatus === 'complete' && s.dodAt && s.createdAt);
  const avgCycle = doneWithTiming.length > 0
    ? Math.round(doneWithTiming.reduce((acc, s) => acc + daysBetween(s.createdAt, s.dodAt), 0) / doneWithTiming.length)
    : null;

  const risks = stories.filter(s => s.health === 'red' || s.stage === 'stalled');

  const lines = [];
  lines.push('# Weekly Pipeline Report');
  lines.push('\nGenerated: ' + now.toISOString());
  lines.push('Week: ' + wMon.toISOString().slice(0, 10) + ' \u2013 ' + wSun.toISOString().slice(0, 10) + '\n');

  lines.push('## This Week');
  lines.push(thisWeek.length + ' stor' + (thisWeek.length === 1 ? 'y' : 'ies') + ' completed this week.');
  for (const s of thisWeek) lines.push('- ' + (s.id || s.slug || ''));

  lines.push('\n## Pipeline Funnel');
  lines.push('| Stage | Count |');
  lines.push('|-------|-------|');
  lines.push('| Discovery | '     + counts.discovery  + ' |');
  lines.push('| Definition | '    + counts.definition + ' |');
  lines.push('| Review / DoR | '  + counts.review     + ' |');
  lines.push('| Inner loop | '    + counts.inner      + ' |');
  lines.push('| Done | '          + counts.done       + ' |');

  lines.push('\n## Metric Signal Health');
  if (signals.length === 0) {
    lines.push('_No metric signals recorded._');
  } else {
    lines.push('| Metric | Status |');
    lines.push('|--------|--------|');
    for (const m of signals) {
      lines.push('| ' + m.id + ' | ' + (m.status || 'unknown') + ' |');
    }
  }

  lines.push('\n## Cycle Time');
  if (avgCycle !== null) {
    lines.push('Average cycle time: ' + avgCycle + ' days');
  } else {
    lines.push('_No completed stories with full timing data._');
  }

  lines.push('\n## Risk Flags');
  if (risks.length === 0) {
    lines.push('_No risk flags._');
  } else {
    for (const s of risks) {
      lines.push('- ' + (s.id || s.slug || '') + ': ' + (s.stage || '') + ' (' + (s.health || 'unknown') + ')');
    }
  }

  const report = lines.join('\n');
  if (opts && opts.output) {
    const dir = path.dirname(opts.output);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(opts.output, report, 'utf8');
    return null;
  }
  return report;
}

// ── CLI ──────────────────────────────────────────────────────────

if (require.main === module) {
  const rootDir   = path.join(__dirname, '..');
  const statePath = path.join(rootDir, '.github', 'pipeline-state.json');
  const args      = process.argv.slice(2);
  const isWeekly  = args.includes('--weekly');
  const outIdx    = args.indexOf('--output');
  const outPath   = outIdx !== -1 ? args[outIdx + 1] : null;

  if (!fs.existsSync(statePath)) {
    console.error('Error: .github/pipeline-state.json not found');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const opts  = outPath ? { output: outPath } : {};
  const fn    = isWeekly ? generateWeeklyReport : generateDailyReport;
  const result = fn(state, opts);
  if (result) console.log(result);
}

module.exports = { generateDailyReport, generateWeeklyReport };
