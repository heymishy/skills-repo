#!/usr/bin/env node
/**
 * src/trace-registry/getTraces.js
 *
 * Cross-team trace registry query module (p3.7).
 *
 * Exports:
 *   getTraces({ squadId, filter })
 *     Returns matching trace entries from platform/traces/[squadId]/.
 *     Returns [] (empty array) when no match or registry not seeded — never throws.
 *
 * Supported filter fields:
 *   squadId   — (top-level, not inside filter) filter by squad directory name
 *   filter.dateFrom    — ISO 8601 string; exclude entries before this date
 *   filter.dateTo      — ISO 8601 string; exclude entries after this date
 *   filter.storySlug   — exact match on storySlug field (or JSONL filename stem)
 *   filter.passRate    — string like ">= 90" or "< 80"; filters on passRate field
 *
 * Registry layout:
 *   platform/traces/[squadId]/[storySlug].jsonl
 *   Each JSONL file contains one JSON object per line (trace entry).
 *
 * Performance NFR: must return within 3 seconds for up to 500 trace entries.
 * Availability NFR: returns [] (not error) when registry directory absent.
 * ADR-009: no write access assumed; this module is read-only.
 *
 * Zero external npm dependencies — plain Node.js (fs, path) only.
 *
 * Reference: artefacts/2026-04-14-skills-platform-phase3/stories/p3.7-cross-team-trace-registry.md
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var ROOT                = path.join(__dirname, '..', '..');
var DEFAULT_REGISTRY_DIR = path.join(ROOT, 'platform', 'traces');

// ── JSONL parser ──────────────────────────────────────────────────────────────

/**
 * Parse a JSONL file (newline-delimited JSON objects).
 * Lines that are not valid JSON objects are silently skipped.
 *
 * @param {string} filePath
 * @returns {object[]}
 */
function readJsonlFile(filePath) {
  var entries = [];
  var content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return entries;
  }
  var lines = content.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    try {
      var obj = JSON.parse(line);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        entries.push(obj);
      }
    } catch (_) { /* skip invalid lines */ }
  }
  return entries;
}

// ── Pass-rate filter parser ───────────────────────────────────────────────────

/**
 * Test whether a numeric value satisfies a pass-rate filter string.
 * Supported comparisons: ">= N", "<= N", "> N", "< N", "= N"
 *
 * @param {number} value
 * @param {string} filterStr - e.g. ">= 90"
 * @returns {boolean}
 */
function testPassRate(value, filterStr) {
  if (typeof value !== 'number') return false;
  var m = String(filterStr).trim().match(/^([><=!]+)\s*(\d+(?:\.\d+)?)$/);
  if (!m) return false;
  var op  = m[1];
  var num = parseFloat(m[2]);
  switch (op) {
    case '>=': return value >= num;
    case '<=': return value <= num;
    case '>':  return value > num;
    case '<':  return value < num;
    case '=':
    case '==': return value === num;
    case '!=': return value !== num;
    default:   return false;
  }
}

// ── Date comparison helper ────────────────────────────────────────────────────

/**
 * Extract an ISO date string from a trace entry for date filtering.
 * Tries common date fields: aggregatedAt, storyCompletedAt, createdAt, date.
 *
 * @param {object} entry
 * @returns {string|null}
 */
function getEntryDate(entry) {
  return entry.aggregatedAt || entry.storyCompletedAt || entry.createdAt || entry.date || null;
}

// ── Main query function ───────────────────────────────────────────────────────

/**
 * Query the cross-team trace registry.
 *
 * @param {object} [params]
 * @param {string}  [params.squadId]     - filter to a specific squad directory
 * @param {object}  [params.filter]      - optional filter criteria
 * @param {string}  [params.filter.dateFrom]  - ISO date string (inclusive lower bound)
 * @param {string}  [params.filter.dateTo]    - ISO date string (inclusive upper bound)
 * @param {string}  [params.filter.storySlug] - exact story slug match
 * @param {string}  [params.filter.passRate]  - pass-rate comparison string e.g. ">= 90"
 * @param {string}  [params.registryDir]      - override registry root (default platform/traces)
 * @returns {object[]} matching trace entries; always [] on no match, never throws
 */
function getTraces(params) {
  var p           = params || {};
  var squadId     = p.squadId || null;
  var filter      = p.filter  || {};
  var registryDir = p.registryDir || DEFAULT_REGISTRY_DIR;

  var results = [];

  // Bail early if registry root does not exist — never throw (availability NFR)
  if (!fs.existsSync(registryDir)) {
    return results;
  }

  // Enumerate squad directories
  var squadDirs = [];
  try {
    var entries = fs.readdirSync(registryDir, { withFileTypes: true });
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (!e.isDirectory()) continue;
      if (squadId && e.name !== squadId) continue;
      squadDirs.push(path.join(registryDir, e.name));
    }
  } catch (_) {
    return results;
  }

  for (var s = 0; s < squadDirs.length; s++) {
    var squadDir = squadDirs[s];
    var squadName = path.basename(squadDir);

    var files;
    try {
      files = fs.readdirSync(squadDir);
    } catch (_) {
      continue;
    }

    for (var f = 0; f < files.length; f++) {
      var file = files[f];
      if (!file.endsWith('.jsonl')) continue;

      // Story slug filter (pre-pass on filename before reading file)
      var fileStem = file.replace(/\.jsonl$/, '');
      if (filter.storySlug && fileStem !== filter.storySlug) continue;

      var fileEntries = readJsonlFile(path.join(squadDir, file));

      for (var j = 0; j < fileEntries.length; j++) {
        var entry = fileEntries[j];

        // Apply storySlug filter on entry field too
        if (filter.storySlug) {
          var entrySlug = entry.storySlug || fileStem;
          if (entrySlug !== filter.storySlug) continue;
        }

        // Apply date range filters
        if (filter.dateFrom || filter.dateTo) {
          var entryDate = getEntryDate(entry);
          if (!entryDate) continue; // skip entries without date when filtering by date
          if (filter.dateFrom && entryDate < filter.dateFrom) continue;
          if (filter.dateTo   && entryDate > filter.dateTo)   continue;
        }

        // Apply passRate filter
        if (filter.passRate !== undefined && filter.passRate !== null) {
          if (!testPassRate(entry.passRate, filter.passRate)) continue;
        }

        // Enrich with squadId if not already present
        var enriched = Object.assign({ _squadId: squadName }, entry);
        results.push(enriched);
      }
    }
  }

  return results;
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  getTraces:      getTraces,
  // exposed for testing
  _readJsonlFile: readJsonlFile,
  _testPassRate:  testPassRate,
};
