'use strict';
var fs   = require('fs');
var path = require('path');

var CHAR_LIMIT  = 10000;
var TOKEN_BUDGET = 12000;

/**
 * Read a single reference file from disk.
 * Returns {fileName, content, charCount} on success, null on any validation failure.
 * Logs [WARN] for missing file, invalid UTF-8, or oversized content.
 * @param {string} filePath
 * @returns {{ fileName: string, content: string, charCount: number } | null}
 */
function readReferenceFile(filePath) {
  var buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (err) {
    console.warn('[WARN] Reference file not found: ' + filePath);
    return null;
  }

  var content;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch (_) {
    console.warn('[WARN] Reference file ' + filePath + ' is not valid UTF-8; skipping');
    return null;
  }

  if (content.length > CHAR_LIMIT) {
    console.warn('[WARN] Reference file ' + filePath + ' exceeds 10,000 char limit; file will not be injected');
    return null;
  }

  return {
    fileName:  path.basename(filePath),
    content:   content,
    charCount: content.length
  };
}

/**
 * Read a batch of reference files. Returns only the successfully-read entries.
 * Never throws even if all files fail validation.
 * @param {string[]} filePaths
 * @returns {Array<{fileName: string, content: string, charCount: number}>}
 */
function readReferenceFiles(filePaths) {
  var results = [];
  (filePaths || []).forEach(function(fp) {
    var r = readReferenceFile(fp);
    if (r !== null) results.push(r);
  });
  return results;
}

/**
 * Log the assembled system prompt token budget breakdown.
 * Uses a 4-chars-per-token heuristic for the soft 12,000-token budget.
 * @param {{ skillTokens: number, referenceTokens: number, priorTokens: number }} opts
 */
function logTokenBudget(opts) {
  var skill     = (opts && opts.skillTokens)     || 0;
  var reference = (opts && opts.referenceTokens) || 0;
  var prior     = (opts && opts.priorTokens)     || 0;
  var total     = skill + reference + prior;
  console.log('[INFO] System prompt tokens: SKILL=' + skill + ' + reference=' + reference + ' + prior=' + prior + ' = ' + total + '/' + TOKEN_BUDGET);
  if (total > TOKEN_BUDGET) {
    console.warn('[WARN] System prompt exceeds soft token budget (actual: ' + total + '/' + TOKEN_BUDGET + ')');
  }
}

module.exports = { readReferenceFile, readReferenceFiles, logTokenBudget };
