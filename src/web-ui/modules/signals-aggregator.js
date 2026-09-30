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
  return _sortSignals(_aggregateAllSources(repoPath, adapter));
}

// Stable descending sort by timestamp; entries with no timestamp sort last,
// preserving their relative order (Array.prototype.sort is stable per spec
// since Node 12 -- no secondary key needed).
function _sortSignals(signals) {
  return signals.slice().sort(function(a, b) {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return b.timestamp.localeCompare(a.timestamp);
  });
}

function _safeParse(sourceName, fn) {
  try {
    return fn();
  } catch (err) {
    return [_makeSignal('parse-error', 'parse-error', sourceName + ': ' + err.message, new Date().toISOString())];
  }
}

function _aggregateAllSources(repoPath, adapter) {
  let signals = [];

  signals = signals.concat(_safeParse('capture-log', function() {
    return _parseCaptureLog(adapter.readFile(path.join(repoPath, 'workspace', 'capture-log.md')));
  }));
  signals = signals.concat(_safeParse('learnings', function() {
    return _parseMarkdownHeadings(adapter.readFile(path.join(repoPath, 'workspace', 'learnings.md')), 'learnings');
  }));
  signals = signals.concat(_safeParse('estimation-norms', function() {
    return _parseEstimationNorms(adapter.readFile(path.join(repoPath, 'workspace', 'estimation-norms.md')));
  }));
  signals = signals.concat(_safeParse('architecture-guardrails', function() {
    return _parseMarkdownHeadings(adapter.readFile(path.join(repoPath, '.github', 'architecture-guardrails.md')), 'architecture-guardrails');
  }));
  signals = signals.concat(_safeParse('suite', function() {
    return _parseSuiteJson(adapter.readFile(path.join(repoPath, 'workspace', 'suite.json')));
  }));
  signals = signals.concat(_safeParse('pipeline-state', function() {
    return _parsePipelineState(adapter.readFile(path.join(repoPath, '.github', 'pipeline-state.json')));
  }));
  signals = signals.concat(_safeParse('results', function() {
    return _parseResultsTsv(adapter.readFile(path.join(repoPath, 'workspace', 'results.tsv')));
  }));
  signals = signals.concat(_safeParse('proposals', function() {
    return _parseProposalsDir(adapter.readDir(path.join(repoPath, 'workspace', 'proposals')));
  }));
  signals = signals.concat(_safeParse('traces', function() {
    const dir = path.join(repoPath, 'workspace', 'traces');
    const files = adapter.readDir(dir);
    let out = [];
    files.forEach(function(f) {
      out = out.concat(_safeParse('traces/' + f, function() { return _parseTracesFile(adapter.readFile(path.join(dir, f))); }));
    });
    return out;
  }));
  signals = signals.concat(_safeParse('decisions', function() {
    // decisions.md lives per-feature under artefacts/*/decisions.md -- this
    // source scans every feature's own file, tolerant of any single one
    // being absent (most features have none).
    let out = [];
    let featureDirs = [];
    try { featureDirs = adapter.readDir(path.join(repoPath, 'artefacts')); } catch (_) { return []; }
    featureDirs.forEach(function(dir) {
      out = out.concat(_safeParse('decisions/' + dir, function() {
        return _parseDecisions(adapter.readFile(path.join(repoPath, 'artefacts', dir, 'decisions.md')));
      }));
    });
    return out;
  }));
  signals = signals.concat(_safeParse('dod', function() {
    let out = [];
    let featureDirs = [];
    try { featureDirs = adapter.readDir(path.join(repoPath, 'artefacts')); } catch (_) { return []; }
    featureDirs.forEach(function(dir) {
      out = out.concat(_safeParse('dod/' + dir, function() {
        const dodDir = path.join(repoPath, 'artefacts', dir, 'dod');
        const files = adapter.readDir(dodDir);
        let inner = [];
        files.forEach(function(f) {
          inner = inner.concat(_safeParse('dod/' + dir + '/' + f, function() {
            return _parseDodFile(adapter.readFile(path.join(dodDir, f)), path.join(dir, 'dod', f));
          }));
        });
        return inner;
      }));
    });
    return out;
  }));
  signals = signals.concat(_safeParse('reference', function() {
    let out = [];
    let featureDirs = [];
    try { featureDirs = adapter.readDir(path.join(repoPath, 'artefacts')); } catch (_) { return []; }
    featureDirs.forEach(function(dir) {
      out = out.concat(_safeParse('reference/' + dir, function() {
        const refDir = path.join(repoPath, 'artefacts', dir, 'reference');
        const files = adapter.readDir(refDir);
        let inner = [];
        files.forEach(function(f) {
          inner = inner.concat(_safeParse('reference/' + dir + '/' + f, function() {
            return _parseMarkdownHeadings(adapter.readFile(path.join(refDir, f)), 'archived-ref');
          }));
        });
        return inner;
      }));
    });
    return out;
  }));

  return signals;
}

function _makeSignal(source, type, text, timestamp, cta) {
  return {
    id: source + '-' + (timestamp || 'no-ts') + '-' + Math.random().toString(36).slice(2, 8),
    source: source,
    type: type,
    text: text,
    timestamp: timestamp || null,
    cta: cta || { label: 'Review', skill: '/improve' },
  };
}

// capture-log.md: "- date: YYYY-MM-DD" blocks, 5 required fields (this
// repo's own /capture schema). Tolerant of quoted or bare signal-text.
function _parseCaptureLog(content) {
  const signals = [];
  const blocks = content.split(/\n(?=- date:)/);
  blocks.forEach(function(block) {
    const dateM = block.match(/date:\s*(\S+)/);
    const typeM = block.match(/signal-type:\s*(\S+)/);
    const textM = block.match(/signal-text:\s*"?([^\n"]+)"?/);
    if (!dateM || !typeM || !textM) return;
    signals.push(_makeSignal('capture-log', typeM[1], textM[1].trim(), dateM[1]));
  });
  return signals;
}

// decisions.md / any markdown file: one signal per top-level "## " heading.
function _parseMarkdownHeadings(content, sourceName) {
  const signals = [];
  const headings = content.split(/\n(?=## )/);
  headings.forEach(function(section) {
    const m = section.match(/^## (.+)$/m);
    if (!m) return;
    signals.push(_makeSignal(sourceName, 'note', m[1].trim(), null));
  });
  return signals;
}

function _parseDecisions(content) { return _parseMarkdownHeadings(content, 'decisions'); }

// estimation-norms.md: markdown table, first column is a date.
function _parseEstimationNorms(content) {
  const signals = [];
  const lines = content.split('\n').filter(function(l) { return l.trim().startsWith('|'); });
  lines.forEach(function(line) {
    const cells = line.split('|').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
    if (cells.length < 2) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cells[0])) return; // skip header/separator rows
    signals.push(_makeSignal('estimation', 'actuals', cells.slice(1).join(' / '), cells[0]));
  });
  return signals;
}

function _parseSuiteJson(content) {
  const data = JSON.parse(content); // throws on invalid JSON -- caller catches
  const scenarios = Array.isArray(data.scenarios) ? data.scenarios : [];
  return scenarios.map(function(s) {
    return _makeSignal('suite', 'eval-scenario', s.description || s.taskId || 'unnamed scenario', null,
      { label: 'View scenario', skill: '/improve' });
  });
}

function _parsePipelineState(content) {
  const data = JSON.parse(content); // throws on invalid JSON -- caller catches
  const features = Array.isArray(data.features) ? data.features : [];
  return features.map(function(f) {
    const sig = _makeSignal('pipeline-state', 'feature-status',
      (f.name || f.slug) + ' -- stage: ' + (f.stage || 'unknown'),
      f.updatedAt || null,
      { label: 'Open feature', skill: '/workflow' });
    sig.context = { relatedStory: null, featureSlug: f.slug, severity: null, metadata: null };
    return sig;
  });
}

function _parseProposalsDir(fileNames) {
  return fileNames.filter(function(f) { return f.endsWith('.md'); }).map(function(f) {
    const dateM = f.match(/^(\d{4}-\d{2}-\d{2})-/);
    return _makeSignal('proposals', 'improve-proposal', f.replace(/\.md$/, ''), dateM ? dateM[1] : null,
      { label: 'Review proposal', skill: '/improve' });
  });
}

// One signal per JSONL line -- malformed lines are skipped (not thrown),
// matching this story's own no-single-bad-line-blocks-others contract.
function _parseTracesFile(content) {
  const signals = [];
  content.split('\n').forEach(function(line) {
    if (!line.trim()) return;
    try {
      const entry = JSON.parse(line);
      signals.push(_makeSignal('traces', 'trace', (entry.skill || 'unknown') + ': ' + (entry.status || 'unknown'), null,
        { label: 'View trace', skill: '/trace' }));
    } catch (_) { /* malformed line -- skip, do not throw */ }
  });
  return signals;
}

function _parseDodFile(content, filePath) {
  return _parseMarkdownHeadings(content, 'dod-follow-up').map(function(sig) {
    sig.context = { relatedStory: null, featureSlug: null, severity: null, metadata: { file: filePath } };
    return sig;
  });
}

// results.tsv is a raw, historically ragged TSV -- row shapes vary across
// this file's own history (confirmed by direct inspection: first row has 6
// columns, later rows have up to 13). Tolerant: every non-empty row becomes
// exactly one signal, regardless of column count.
function _parseResultsTsv(content) {
  const signals = [];
  content.split('\n').forEach(function(line) {
    if (!line.trim()) return;
    const cols = line.split('\t');
    const first = cols[0];
    const timestamp = /^\d{4}-\d{2}-\d{2}/.test(first) ? first.slice(0, 10) : null;
    signals.push(_makeSignal('results', 'watermark-row', cols.slice(1, 4).join(' / ') || cols[0], timestamp));
  });
  return signals;
}

module.exports = {
  getSignals, setFileReadAdapter, _resetFileReadAdapterForTesting, createFsFileReadAdapter,
  _parseCaptureLog, _parseDecisions, _parseMarkdownHeadings, _parseEstimationNorms,
  _parseSuiteJson, _parsePipelineState, _parseProposalsDir, _parseTracesFile, _parseDodFile,
  _parseResultsTsv,
};
