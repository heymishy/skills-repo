#!/usr/bin/env node
'use strict';
// rvc-s1 -- lists the REVIEW.md entries a change's diff is likely to need. Advisory: it prints and exits 0 when
// entries match. --check validates REVIEW.md (every entry complete, every source tracked in git) and exits 1 when not.
//
//   node scripts/review-checklist.js [--base master]    entries that match base...HEAD
//   node scripts/review-checklist.js --check            validate REVIEW.md

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const REQUIRED = ['paths', 'check', 'source'];

// `*` stays within one path segment; `**/` matches zero or more directories; a trailing `**` matches anything.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; }
        else { re += '.*'; i += 1; }
      } else {
        re += '[^/]*';
      }
    } else {
      re += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp('^' + re + '$');
}

// Entries start at "## Title"; each field is a "- key: value" line under it.
function parseChecklist(text) {
  const items = [];
  const problems = [];
  let cur = null;
  text.split(/\r?\n/).forEach(function (raw) {
    const heading = raw.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      cur = { title: heading[1], paths: [], match: null, check: '', source: '', fields: {} };
      items.push(cur);
      return;
    }
    const field = raw.match(/^-\s+(paths|match|check|source):\s*(.*?)\s*$/);
    if (!field || !cur) return;
    const key = field[1];
    const value = field[2];
    cur.fields[key] = true;
    if (key === 'paths') cur.paths = value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    else if (key === 'match') {
      try { cur.match = new RegExp(value); }
      catch (e) { problems.push('"' + cur.title + '": match is not a valid pattern (' + e.message + ')'); }
    }
    else if (key === 'check') cur.check = value;
    else if (key === 'source') cur.source = value;
  });
  items.forEach(function (item) {
    REQUIRED.forEach(function (k) {
      if (!item.fields[k] || (k === 'paths' && item.paths.length === 0)) {
        problems.push('"' + item.title + '": missing ' + k);
      }
    });
  });
  return { items: items, problems: problems };
}

// Added lines of a unified-0 diff, per file. Deleted files (+++ /dev/null) and removed lines are not included.
function parseDiff(text) {
  const files = [];
  let cur = null;
  let newLine = 0;
  text.split(/\r?\n/).forEach(function (line) {
    if (line.indexOf('+++ ') === 0) {
      const p = line.slice(4);
      if (p === '/dev/null') { cur = null; return; }
      cur = { path: p.replace(/^b\//, ''), added: [] };
      files.push(cur);
      return;
    }
    if (line.indexOf('--- ') === 0) return;
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) { newLine = parseInt(hunk[1], 10); return; }
    if (!cur) return;
    if (line[0] === '+') { cur.added.push({ line: newLine, text: line.slice(1) }); newLine++; }
    else if (line[0] === ' ') newLine++;
  });
  return files;
}

// Entries whose paths match a changed file and, when the entry has a match, whose pattern matches an added line.
function triggeredItems(items, files) {
  const out = [];
  items.forEach(function (item) {
    const hits = [];
    files.forEach(function (f) {
      if (!item.paths.some(function (p) { return globToRegExp(p).test(f.path); })) return;
      if (!item.match) { hits.push({ path: f.path, lineNo: null, line: null }); return; }
      f.added.forEach(function (a) {
        if (item.match.test(a.text)) hits.push({ path: f.path, lineNo: a.line, line: a.text });
      });
    });
    if (hits.length) out.push({ item: item, hits: hits });
  });
  return out;
}

function validateChecklist(items, isTracked) {
  const problems = [];
  items.forEach(function (item) {
    if (item.source && !isTracked(item.source)) {
      problems.push('"' + item.title + '": source ' + item.source + ' is not tracked in git');
    }
  });
  return problems;
}

function formatListing(triggered) {
  if (triggered.length === 0) return 'No checklist entry applies to this diff.';
  const lines = [];
  triggered.forEach(function (t) {
    lines.push('- ' + t.item.title);
    lines.push('    check:  ' + t.item.check);
    lines.push('    source: ' + t.item.source);
    t.hits.forEach(function (h) {
      const where = h.lineNo ? h.path + ':' + h.lineNo : h.path;
      lines.push('    at ' + where + (h.line !== null ? '  ' + h.line.trim() : ''));
    });
  });
  return lines.join('\n');
}

function trackedSet() {
  const r = childProcess.spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('git ls-files failed: ' + (r.stderr || '').trim());
  return new Set(r.stdout.split(/\r?\n/).filter(Boolean));
}

function main(argv) {
  const checkOnly = argv.indexOf('--check') !== -1;
  const baseAt = argv.indexOf('--base');
  const base = baseAt !== -1 && argv[baseAt + 1] ? argv[baseAt + 1] : 'master';
  const reviewPath = path.join(root, 'REVIEW.md');
  let parsed;
  try { parsed = parseChecklist(fs.readFileSync(reviewPath, 'utf8')); }
  catch (e) { console.error('Cannot read REVIEW.md: ' + e.message); return 2; }

  if (checkOnly) {
    let tracked;
    try { tracked = trackedSet(); } catch (e) { console.error(e.message); return 2; }
    const problems = parsed.problems.concat(validateChecklist(parsed.items, function (p) { return tracked.has(p); }));
    if (problems.length) {
      problems.forEach(function (p) { console.error('REVIEW.md: ' + p); });
      return 1;
    }
    console.log('[rvc-s1] REVIEW.md: ' + parsed.items.length + ' entries, all complete and every source tracked');
    return 0;
  }

  const r = childProcess.spawnSync('git', ['diff', '--unified=0', base + '...HEAD'], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) { console.error('git diff ' + base + '...HEAD failed: ' + (r.stderr || '').trim()); return 2; }
  console.log(formatListing(triggeredItems(parsed.items, parseDiff(r.stdout))));
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { parseChecklist, parseDiff, triggeredItems, validateChecklist, formatListing, globToRegExp };
