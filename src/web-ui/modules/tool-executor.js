'use strict';
// tool-executor.js — wucp.3
// Parses and executes tool markers emitted by the model in mid-session turns.
// Supports read_file and list_dir only. Path traversal is blocked (ADR-023).
// D37: default adapter stub MUST throw — not return null/empty.

var path = require('path');

// ---------------------------------------------------------------------------
// Injectable adapter — D37: stub must throw
// ---------------------------------------------------------------------------
var _execTool = function() {
  throw new Error('Adapter not wired: toolExecutor. Call setToolExecutor() before use.');
};

function setToolExecutor(fn) {
  _execTool = fn;
}

// ---------------------------------------------------------------------------
// In-memory tool log (cleared per-test via clearToolLog)
// ---------------------------------------------------------------------------
var _toolLog = [];

function getToolLog() {
  return _toolLog.slice();
}

function clearToolLog() {
  _toolLog = [];
}

// ---------------------------------------------------------------------------
// parseToolMarker(line) — returns {verb, path} or null
// ---------------------------------------------------------------------------
var MARKER_RE = /^<TOOL:(read_file|list_dir)\s+path="([^"]+)"\s*\/>$/;

function parseToolMarker(line) {
  if (!line) return null;
  var m = MARKER_RE.exec(line.trim());
  if (!m) return null;
  return { verb: m[1], path: m[2] };
}

// ---------------------------------------------------------------------------
// executeTool(verb, inputPath, repoRoot, sessionCtx) — run a single tool call
// ADR-023: validate resolved path stays within repoRoot before calling adapter
// ---------------------------------------------------------------------------
var ALLOWED_VERBS = ['read_file', 'list_dir'];

function executeTool(verb, inputPath, repoRoot, sessionCtx) {
  // Reject unknown verbs (AC4)
  if (ALLOWED_VERBS.indexOf(verb) === -1) {
    return 'Tool not available: ' + verb + '. Available tools: ' + ALLOWED_VERBS.join(', ');
  }

  // ADR-023: path traversal guard
  // Normalize repoRoot so that forward-slash paths (/tmp/repo) become platform-native.
  // Use path.resolve(repoRoot, inputPath) so an absolute inputPath (/etc/passwd) is not
  // silently made relative by path.join before resolution.
  var normalizedRoot = path.resolve(repoRoot);
  var resolvedPath = path.resolve(repoRoot, inputPath);
  if (!resolvedPath.startsWith(normalizedRoot + path.sep)) {
    return '[path not allowed: ' + inputPath + ' is out of bounds]';
  }

  // Call the adapter (may throw — e.g. ENOENT)
  var result;
  try {
    result = _execTool(verb, resolvedPath);
  } catch (err) {
    // D37: re-throw adapter configuration errors — do not swallow misconfiguration
    if (err && err.message && err.message.indexOf('Adapter not wired') !== -1) {
      throw err;
    }
    // AC9: I/O error (e.g. ENOENT) — return message, do not propagate
    return '[File not found: ' + inputPath + ']';
  }

  // AC5: append log entry
  _toolLog.push({
    sessionId:    (sessionCtx && sessionCtx.sessionId)  || null,
    skillName:    (sessionCtx && sessionCtx.skillName)  || null,
    toolVerb:     verb,
    pathRequested: inputPath,
    turnNumber:   (sessionCtx && sessionCtx.turnNumber) != null ? sessionCtx.turnNumber : null,
    timestamp:    new Date().toISOString()
  });

  return result;
}

// ---------------------------------------------------------------------------
// processModelOutput(text, repoRoot, sessionCtx) — scan model response for
// the FIRST tool marker line and execute it. Returns notification string.
// ---------------------------------------------------------------------------
function processModelOutput(text, repoRoot, sessionCtx) {
  if (!text) {
    return 'No tool executed — marker format not recognised';
  }
  var lines = text.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var parsed = parseToolMarker(lines[i].trim());
    if (parsed) {
      return executeTool(parsed.verb, parsed.path, repoRoot, sessionCtx);
    }
  }
  return 'No tool executed — marker format not recognised';
}

module.exports = {
  parseToolMarker,
  setToolExecutor,
  executeTool,
  processModelOutput,
  getToolLog,
  clearToolLog
};
