#!/usr/bin/env node
/**
 * trace-interface.js
 *
 * Canonical trace data access point for the improvement agent (p2.11).
 *
 * This is the ONLY module that reads workspace/traces/ directly.
 * All other modules that need trace data must call queryTraces() here.
 *
 * Exports:
 *   queryTraces(filters, tracesDir)  — filter and return traces
 *   readAllTraces(tracesDir)         — read all trace records from a directory
 *   redactTrace(trace)               — redact sensitive fields (MC-SEC-02)
 *
 * Supported file formats: .json, .jsonl, .yml, .yaml
 * Filter fields: storySlug (exact), patternLabel (kebab-case, case-insensitive),
 *                dateRange ({from, to} ISO strings, inclusive)
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var DEFAULT_TRACES_DIR = path.join(__dirname, '..', '..', 'workspace', 'traces');

// Credential-like field name patterns to redact (MC-SEC-02)
var SENSITIVE_FIELD_PATTERNS = [
  /^password$/i,
  /^secret$/i,
  /^token$/i,
  /^api_?key$/i,
  /^credential(s)?$/i,
  /^auth_?token$/i,
  /^operator_email$/i,
  /_token$/i,
  /_key$/i,
  /_secret$/i,
  /_password$/i,
];

/**
 * Redact sensitive fields from a trace record (MC-SEC-02).
 * Returns a new object with sensitive field values replaced by '[REDACTED]'.
 *
 * @param {object} trace
 * @returns {object}
 */
function redactTrace(trace) {
  if (!trace || typeof trace !== 'object' || Array.isArray(trace)) return trace;
  var result = {};
  var keys = Object.keys(trace);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var sensitive = false;
    for (var j = 0; j < SENSITIVE_FIELD_PATTERNS.length; j++) {
      if (SENSITIVE_FIELD_PATTERNS[j].test(key)) {
        sensitive = true;
        break;
      }
    }
    result[key] = sensitive ? '[REDACTED]' : trace[key];
  }
  return result;
}

/**
 * Parse JSONL content (newline-delimited JSON objects).
 * Each non-empty line is expected to be a valid JSON object.
 *
 * @param {string} content
 * @returns {object[]}
 */
function parseJsonl(content) {
  var traces = [];
  var lines = content.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    try {
      var obj = JSON.parse(line);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        traces.push(obj);
      }
    } catch (e) { /* skip invalid lines */ }
  }
  return traces;
}

/**
 * Parse JSON content (single object or array of objects).
 *
 * @param {string} content
 * @returns {object[]}
 */
function parseJson(content) {
  try {
    var obj = JSON.parse(content);
    if (Array.isArray(obj)) {
      return obj.filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); });
    }
    if (obj && typeof obj === 'object') {
      return [obj];
    }
  } catch (e) { /* skip */ }
  return [];
}

/**
 * Minimal flat YAML parser for trace records.
 * Handles top-level key: value pairs only (no nested objects).
 * Simple arrays (list items starting with -) are captured as string arrays.
 *
 * @param {string} content
 * @returns {object[]}
 */
function parseYaml(content) {
  var trace = {};
  var currentKey = null;
  var currentArray = null;
  var lines = content.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var raw = lines[i].replace(/\s*#.*$/, '').trimRight();
    if (!raw.trim()) continue;

    // List item under current key
    var listMatch = raw.match(/^(\s*)-\s+(.*)$/);
    if (listMatch && currentKey && currentArray) {
      var listVal = listMatch[2].trim().replace(/^['"]|['"]$/g, '');
      currentArray.push(listVal);
      continue;
    }

    // Key: value pair at top level (no leading indent for a trace file)
    var kvMatch = raw.match(/^([\w][\w.-]*)\s*:\s*(.*)$/);
    if (!kvMatch) continue;

    currentKey = kvMatch[1];
    var rawVal = kvMatch[2].trim();

    if (rawVal === '') {
      // Potential start of a list or nested block
      currentArray = [];
      trace[currentKey] = currentArray;
    } else {
      currentArray = null;
      var cleanVal = rawVal.replace(/^['"]|['"]$/g, '');
      if (cleanVal === 'true') {
        trace[currentKey] = true;
      } else if (cleanVal === 'false') {
        trace[currentKey] = false;
      } else if (cleanVal === 'null' || cleanVal === '~') {
        trace[currentKey] = null;
      } else if (!isNaN(cleanVal) && cleanVal !== '') {
        trace[currentKey] = Number(cleanVal);
      } else {
        trace[currentKey] = cleanVal;
      }
    }
  }

  if (Object.keys(trace).length > 0) return [trace];
  return [];
}

/**
 * Read and parse a single trace file.
 * Tries JSONL first for .json files (real traces are JSONL).
 *
 * @param {string} filePath
 * @returns {object[]}
 */
function parseTraceFile(filePath) {
  var content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return [];
  }

  var ext = path.extname(filePath).toLowerCase();
  var traces;

  if (ext === '.jsonl') {
    traces = parseJsonl(content);
  } else if (ext === '.json') {
    // Try JSONL first (real assurance-gate traces are JSONL format)
    traces = parseJsonl(content);
    if (traces.length === 0) {
      traces = parseJson(content);
    }
  } else if (ext === '.yml' || ext === '.yaml') {
    traces = parseYaml(content);
  } else {
    traces = [];
  }

  return traces.map(redactTrace);
}

/**
 * Read all trace records from a directory.
 * This is the canonical trace data access point — no other module reads
 * workspace/traces/ directly.
 *
 * @param {string} [tracesDir] - override default workspace/traces/ directory
 * @returns {object[]}
 */
function readAllTraces(tracesDir) {
  var dir = tracesDir || DEFAULT_TRACES_DIR;
  var traces = [];

  if (!fs.existsSync(dir)) return traces;

  var entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    return traces;
  }

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var ext = path.extname(entry).toLowerCase();
    if (ext !== '.json' && ext !== '.jsonl' && ext !== '.yml' && ext !== '.yaml') continue;

    var filePath = path.join(dir, entry);
    try {
      var stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
    } catch (e) {
      continue;
    }

    var fileTraces = parseTraceFile(filePath);
    traces = traces.concat(fileTraces);
  }

  return traces;
}

/**
 * Parse a date-only string (YYYY-MM-DD) to start of day UTC.
 *
 * @param {string} dateStr
 * @returns {Date}
 */
function parseDateFrom(dateStr) {
  if (!dateStr) return null;
  // If it's already a full ISO datetime, parse directly
  if (dateStr.indexOf('T') !== -1) return new Date(dateStr);
  // Date-only: treat as start of day UTC
  return new Date(dateStr + 'T00:00:00.000Z');
}

/**
 * Parse a date-only string (YYYY-MM-DD) to end of day UTC.
 *
 * @param {string} dateStr
 * @returns {Date}
 */
function parseDateTo(dateStr) {
  if (!dateStr) return null;
  if (dateStr.indexOf('T') !== -1) return new Date(dateStr);
  // Date-only: treat as end of day UTC
  return new Date(dateStr + 'T23:59:59.999Z');
}

/**
 * Query traces with optional filters.
 * All specified filters are applied with AND logic — a trace must satisfy
 * every provided filter to appear in the result.
 *
 * @param {object} filters
 * @param {string}  [filters.storySlug]   - exact match on trace.storySlug
 * @param {string}  [filters.patternLabel] - case-insensitive match on trace.failurePattern
 * @param {{from?: string, to?: string}} [filters.dateRange] - inclusive ISO date range
 * @param {string}  [tracesDir]           - directory override (default: workspace/traces/)
 * @returns {object[]}
 */
function queryTraces(filters, tracesDir) {
  var traces = readAllTraces(tracesDir);

  if (!filters) return traces;

  var result = traces;

  if (filters.storySlug) {
    var slug = filters.storySlug;
    result = result.filter(function (t) {
      return t.storySlug === slug;
    });
  }

  if (filters.patternLabel) {
    var labelLower = filters.patternLabel.toLowerCase();
    result = result.filter(function (t) {
      return typeof t.failurePattern === 'string' &&
             t.failurePattern.toLowerCase() === labelLower;
    });
  }

  if (filters.dateRange) {
    var fromDate = parseDateFrom(filters.dateRange.from) || null;
    var toDate   = parseDateTo(filters.dateRange.to)     || null;

    result = result.filter(function (t) {
      if (!t.createdAt) return false;
      var d = new Date(t.createdAt);
      if (isNaN(d.getTime())) return false;
      if (fromDate && d < fromDate) return false;
      if (toDate   && d > toDate)   return false;
      return true;
    });
  }

  return result;
}

module.exports = {
  queryTraces:    queryTraces,
  readAllTraces:  readAllTraces,
  redactTrace:    redactTrace,
};
