'use strict';
/**
 * signals-aggregator.js -- ep1-s1: reads all 12 workspace/framework signal
 * sources and normalizes them into a single, sorted Signal[] array.
 * Canonical builder (ADR-028): the sole source of truth for this
 * aggregation -- no other module re-derives this logic.
 */
const path = require('path');
const fs = require('fs');

// D37: default stub MUST throw, never return empty/null.
let _fileReadAdapter = function() {
  throw new Error('Adapter not wired: file-read. Call setFileReadAdapter() with a real implementation before use.');
};

function setFileReadAdapter(adapter) { _fileReadAdapter = adapter; }
function _resetFileReadAdapterForTesting() {
  _fileReadAdapter = function() {
    throw new Error('Adapter not wired: file-read. Call setFileReadAdapter() with a real implementation before use.');
  };
}

// The real, production file-read adapter -- wired in server.js at startup.
// Shape: { readFile(absPath) -> string, readDir(absPath) -> string[] }
// Both throw on missing path; callers (the per-source parsers) catch and
// convert to parse-error signals -- this adapter itself stays dumb.
function createFsFileReadAdapter() {
  return {
    readFile: function(absPath) { return fs.readFileSync(absPath, 'utf8'); },
    readDir:  function(absPath) { return fs.readdirSync(absPath); },
  };
}

function getSignals(repoPath) {
  const adapter = _fileReadAdapter;
  if (typeof adapter === 'function') {
    // The Task 1 throwing-stub shape (a bare function) -- calling it
    // triggers the D37 "not wired" error exactly as before.
    return adapter(repoPath);
  }
  return _aggregateAllSources(repoPath, adapter);
}

function _aggregateAllSources(repoPath, adapter) {
  return []; // populated task by task below
}

module.exports = { getSignals, setFileReadAdapter, _resetFileReadAdapterForTesting, createFsFileReadAdapter };
