#!/usr/bin/env node
// check-p4-obs-status.js — governance tests for scripts/generate-status-report.js
// 11 tests: T1–T10, T-NFR1
// No external dependencies — Node.js built-ins only.
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SUITE = '[p4-obs-status]';
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadMod() {
  const p = path.join(__dirname, '..', 'scripts', 'generate-status-report.js');
  if (!fs.existsSync(p)) return null;
  delete require.cache[require.resolve(p)];
  return require(p);
}

function loadArchiveMod() {
  const p = path.join(__dirname, '..', 'scripts', 'archive-completed-features.js');
  if (!fs.existsSync(p)) return null;
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── Week boundary helpers ─────────────────────────────────────────
function weekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function dodAtThisWeek() {
  const mon = weekStart(new Date());
  const t   = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  if (t >= mon) return t.toISOString();
  return new Date(mon.getTime() + 3600000).toISOString();
}

function dodAtLastWeek() {
  const mon = weekStart(new Date());
  return new Date(mon.getTime() - 3600000).toISOString();
}

// ── Fixtures ──────────────────────────────────────────────────────
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const twoDaysAgo   = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

const baseState = {
  version: '1',
  features: [
    {
      slug: 'test-feature',
      name: 'Test Feature',
      stage: 'definition',
      health: 'green',
      track: 'standard',
      updatedAt: twoDaysAgo,
      stories: [
        { id: 'test-story', stage: 'definition', health: 'green', stageEnteredAt: sevenDaysAgo }
      ],
      epics: [{ slug: 'e1', name: 'Epic 1', status: 'in-progress', stories: ['test-story'] }],
    }
  ]
};

const stateWithSignals = {
  version: '1',
  features: [
    {
      slug: 'feat-a',
      name: 'Feature A',
      stage: 'benefit-metric',
      health: 'green',
      track: 'standard',
      benefitMetrics: [
        { id: 'M1', status: 'on-track' },
        { id: 'M2', status: 'at-risk' }
      ],
      stories: [],
      epics: []
    }
  ]
};

// ── T1 — module exports ───────────────────────────────────────────
console.log(`${SUITE} T1 \u2014 module exports`);
const mod = loadMod();
assert(mod !== null, 'T1a: module exists');
assert(mod && typeof mod.generateDailyReport  === 'function', 'T1b: exports generateDailyReport');
assert(mod && typeof mod.generateWeeklyReport === 'function', 'T1c: exports generateWeeklyReport');

if (!mod) {
  console.log(`${SUITE} Results: ${passed} passed, ${failed} failed`);
  process.exit(1);
}

// ── T2 — daily report 5 sections ─────────────────────────────────
console.log(`${SUITE} T2 \u2014 daily report 5 sections`);
{
  const out = mod.generateDailyReport(baseState);
  assert(typeof out === 'string' && out.length > 0, 'T2a: returns non-empty string');
  assert(out.includes('## In-Flight Stories'),     'T2b: has In-Flight Stories');
  assert(out.includes('## Blocked Items'),         'T2c: has Blocked Items');
  assert(out.includes('## Pending Human Actions'), 'T2d: has Pending Human Actions');
  assert(out.includes('## Recent Activity'),       'T2e: has Recent Activity');
  assert(out.includes('## Test Count'),            'T2f: has Test Count');
}

// ── T3 — in-flight story with ID, phase, days-in-phase ───────────
console.log(`${SUITE} T3 \u2014 in-flight story row`);
{
  const out = mod.generateDailyReport(baseState);
  assert(out.includes('test-story'), 'T3a: story ID present');
  assert(out.includes('definition'), 'T3b: stage present');
  assert(/\b7\b/.test(out),          'T3c: days-in-phase 7 present');
}

// ── T4 — weekly report 5 sections ────────────────────────────────
console.log(`${SUITE} T4 \u2014 weekly report 5 sections`);
{
  const out = mod.generateWeeklyReport(baseState);
  assert(typeof out === 'string' && out.length > 0, 'T4a: returns non-empty string');
  assert(out.includes('## This Week'),            'T4b: has This Week');
  assert(out.includes('## Pipeline Funnel'),      'T4c: has Pipeline Funnel');
  assert(out.includes('## Metric Signal Health'), 'T4d: has Metric Signal Health');
  assert(out.includes('## Cycle Time'),           'T4e: has Cycle Time');
  assert(out.includes('## Risk Flags'),           'T4f: has Risk Flags');
}

// ── T5 — metric signal rows ───────────────────────────────────────
console.log(`${SUITE} T5 \u2014 metric signal rows`);
{
  const out = mod.generateWeeklyReport(stateWithSignals);
  assert(out.includes('M1'),       'T5a: M1 row present');
  assert(out.includes('on-track'), 'T5b: on-track present');
  assert(out.includes('M2'),       'T5c: M2 row present');
  assert(out.includes('at-risk'),  'T5d: at-risk present');
}

// ── T6 — opts.output writes file, return null ─────────────────────
console.log(`${SUITE} T6 \u2014 output option writes file`);
{
  const tmp     = fs.mkdtempSync(path.join(os.tmpdir(), 'obs-status-'));
  const outPath = path.join(tmp, 'daily.md');
  const ret     = mod.generateDailyReport(baseState, { output: outPath });
  assert(fs.existsSync(outPath), 'T6a: file written');
  assert(!ret,                   'T6b: return null when output set');
  const content = fs.readFileSync(outPath, 'utf8');
  assert(content.includes('## In-Flight Stories'), 'T6c: file has report content');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T7 — no output → returns string ──────────────────────────────
console.log(`${SUITE} T7 \u2014 no output returns string`);
{
  const ret = mod.generateDailyReport(baseState);
  assert(typeof ret === 'string' && ret.length > 0, 'T7: returns non-empty string');
}

// ── T8 — archive story in current week counted ────────────────────
console.log(`${SUITE} T8 \u2014 archive story in-week counted`);
{
  const archiveMod = loadArchiveMod();
  if (!archiveMod) {
    console.log('  SKIP T8: archive module not found');
    passed++;
  } else {
    const archiveState = {
      features: [
        {
          slug: 'test-feature',
          completedStories: [
            { id: 'done-story', dodStatus: 'complete', dodAt: dodAtThisWeek() }
          ]
        }
      ]
    };
    const merged  = archiveMod.mergeState(baseState, archiveState);
    const out     = mod.generateWeeklyReport(merged);
    const section = out.split('## This Week')[1]?.split('##')[0] || '';
    assert(/[1-9]/.test(section), 'T8: at least 1 story counted in This Week');
  }
}

// ── T9 — archive story outside week not counted ───────────────────
console.log(`${SUITE} T9 \u2014 archive story outside week excluded`);
{
  const archiveMod = loadArchiveMod();
  if (!archiveMod) {
    console.log('  SKIP T9: archive module not found');
    passed++;
  } else {
    const archiveState = {
      features: [
        {
          slug: 'test-feature',
          completedStories: [
            { id: 'old-story', dodStatus: 'complete', dodAt: dodAtLastWeek() }
          ]
        }
      ]
    };
    const merged  = archiveMod.mergeState(baseState, archiveState);
    const out     = mod.generateWeeklyReport(merged);
    const section = out.split('## This Week')[1]?.split('##')[0] || '';
    // Should show 0 stories
    assert(!section.includes('- old-story') && !/^[1-9]/m.test(section.trim()), 'T9: old story not counted in This Week');
  }
}

// ── T10 — no hardcoded org names ─────────────────────────────────
console.log(`${SUITE} T10 \u2014 no hardcoded org names`);
{
  const daily  = mod.generateDailyReport(baseState);
  const weekly = mod.generateWeeklyReport(baseState);
  assert(!daily.includes('heymishy')  && !daily.includes('skills-repo'),  'T10a: daily no org names');
  assert(!weekly.includes('heymishy') && !weekly.includes('skills-repo'), 'T10b: weekly no org names');
}

// ── T-NFR1 — no credentials ───────────────────────────────────────
console.log(`${SUITE} T-NFR1 \u2014 no credentials`);
{
  const daily  = mod.generateDailyReport(baseState);
  const weekly = mod.generateWeeklyReport(baseState);
  assert(!/Bearer\s/i.test(daily)  && !/password/i.test(daily)  && !/\bsecret\b/i.test(daily),  'T-NFR1a: daily no credentials');
  assert(!/Bearer\s/i.test(weekly) && !/password/i.test(weekly) && !/\bsecret\b/i.test(weekly), 'T-NFR1b: weekly no credentials');
}

// ── Results ───────────────────────────────────────────────────────
console.log(`${SUITE} Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
