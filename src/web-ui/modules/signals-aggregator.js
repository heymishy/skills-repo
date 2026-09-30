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

function getSignals(repoPath) {
  return _fileReadAdapter(repoPath);
}

module.exports = { getSignals, setFileReadAdapter, _resetFileReadAdapterForTesting };
