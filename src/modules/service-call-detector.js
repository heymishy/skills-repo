'use strict';

/**
 * service-call-detector.js — csd-s7: static detection of require() calls to
 * a fixed allowlist of external-service packages, producing an as-built
 * System Architecture diagram in the exact mermaid `flowchart` edge-only
 * shape src/modules/drift-comparator.js's parseFlowchartMermaid()/
 * compareSystemArchitecture() already expect — no changes to that module
 * (AC5).
 *
 * Ground truth method is fixed by decisions.md's 2026-07-26 ARCH entry: a
 * static require() allowlist scan across this repo's real committed src/
 * tree — never live network calls, APM instrumentation, or deep transitive
 * D37-adapter-wiring resolution (all explicitly out of scope for this
 * story). This follows the same "read real source text directly via fs,
 * regex-extract require() specifiers" approach as
 * src/modules/call-graph-extractor.js (csd-s5's Program Design extractor),
 * extended with an external-package allowlist match instead of
 * relative-path resolution.
 *
 * Per NFR-Security, the generated diagram only ever carries service labels
 * and requiring-file paths — never surrounding code content, environment
 * variable names, or credential-shaped strings.
 */

const fs = require('fs');
const path = require('path');

// Fixed external-service allowlist (decisions.md, 2026-07-26 ARCH entry).
// This list is deliberately NOT auto-extended (see this story's Out of
// Scope) — a package must be added here explicitly, as its own decision, if
// a real gap is found.
const EXACT_ALLOWLIST = {
  stripe: 'Stripe',
  pg: 'Postgres',
  ioredis: 'Redis',
  redis: 'Redis',
  '@anthropic-ai/sdk': 'Anthropic',
  'posthog-node': 'PostHog'
};
const PREFIX_ALLOWLIST = [
  { prefix: '@octokit/', label: 'GitHub' }
];

/**
 * Resolve a require() specifier to a named service label, or null if it is
 * not on the fixed allowlist (AC1). Internal/relative specifiers and any
 * package not on the allowlist correctly resolve to null — detecting those
 * is Program Design's job (call-graph-extractor.js), not this story's.
 * @param {string} specifier
 * @returns {string|null}
 */
function resolveServiceLabel(specifier) {
  if (!specifier || typeof specifier !== 'string') return null;
  if (Object.prototype.hasOwnProperty.call(EXACT_ALLOWLIST, specifier)) {
    return EXACT_ALLOWLIST[specifier];
  }
  for (let i = 0; i < PREFIX_ALLOWLIST.length; i++) {
    if (specifier.indexOf(PREFIX_ALLOWLIST[i].prefix) === 0) {
      return PREFIX_ALLOWLIST[i].label;
    }
  }
  return null;
}

// Strip `//` line comments and `/* ... */` block comments before scanning.
// Without this, a JSDoc example or commented-out snippet showing
// require('stripe') as a WORKED EXAMPLE (not a real wiring call — e.g.
// src/web-ui/modules/stripe-client.js's own doc comment demonstrating how a
// caller should build the injected adapter) would be mis-detected as a
// genuine service edge. Judgment call, flagged in this story's PR
// description: a narrow precision improvement over
// call-graph-extractor.js's simpler regex (whose relative-path use case has
// no equivalent false-positive-from-comments risk in this repo's real
// files).
function _stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const REQUIRE_RE = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * Extract every allowlisted external-service require() edge that appears
 * literally in `filePath`'s real source text (comments stripped first).
 * Internal/relative requires ('./x', '../x') and non-allowlisted packages
 * are correctly ignored — never produce an edge (AC1 edge case).
 * @param {string} filePath
 * @param {{repoRoot?: string}} [options]
 * @returns {Array<{from:string, service:string}>}
 */
function extractServiceRequires(filePath, options) {
  options = options || {};
  const repoRoot = options.repoRoot || process.cwd();
  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    throw new Error('Could not read file "' + filePath + '" for service-call detection: ' + e.message);
  }
  const cleaned = _stripComments(source);
  const fromRel = path.relative(repoRoot, filePath).split(path.sep).join('/');

  const edges = [];
  let m;
  REQUIRE_RE.lastIndex = 0;
  while ((m = REQUIRE_RE.exec(cleaned)) !== null) {
    const specifier = m[1];
    if (specifier.charAt(0) === '.' || specifier.charAt(0) === '/') continue; // relative — Program Design's job, not ours
    const service = resolveServiceLabel(specifier);
    if (service) {
      edges.push({ from: fromRel, service: service });
    }
  }
  return edges;
}

/**
 * Recursively find every real `.js` file under `dir` (skipping
 * node_modules/.git), sorted for deterministic output.
 * @param {string} dir
 * @returns {string[]} absolute file paths
 */
function _walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return [];
  }
  let files = [];
  entries.forEach(function(entry) {
    if (entry.name === 'node_modules' || entry.name === '.git') return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(_walk(full));
    } else if (entry.isFile() && /\.js$/.test(entry.name)) {
      files.push(full);
    }
  });
  return files;
}

/**
 * Discover every real `.js` file under `<repoRoot>/src`, sorted for
 * deterministic output.
 * @param {string} repoRoot
 * @returns {string[]} absolute file paths
 */
function discoverSourceFiles(repoRoot) {
  const srcDir = path.join(repoRoot, 'src');
  if (!fs.existsSync(srcDir)) return [];
  return _walk(srcDir).sort();
}

function _sanitizeId(label) {
  return label.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Render a from-file -> service-label edge list as a mermaid flowchart, in
 * the exact edge-only shape src/modules/drift-comparator.js's
 * parseFlowchartMermaid()/compareSystemArchitecture() already expect (AC2)
 * — same node/edge declaration convention as
 * call-graph-extractor.js's generateFlowchartDiagram(), so both as-built
 * generators produce mutually-parseable output with no new comparator
 * logic needed. A single service required from multiple files produces ONE
 * service node with multiple incoming edges, never duplicate service nodes
 * (dedup keyed on the sanitised node id).
 * @param {Array<{from:string, service:string}>} edges
 * @returns {string}
 */
function generateFlowchartDiagram(edges) {
  const lines = ['flowchart TD'];
  const seen = {};
  function declareNode(label) {
    const id = _sanitizeId(label);
    if (!seen[id]) {
      seen[id] = true;
      lines.push('  ' + id + '["' + label + '"]');
    }
    return id;
  }
  const edgeLines = [];
  (edges || []).forEach(function(e) {
    const fromId = declareNode(e.from);
    const toId = declareNode(e.service);
    edgeLines.push('  ' + fromId + ' --> ' + toId);
  });
  edgeLines.forEach(function(l) { lines.push(l); });
  return lines.join('\n');
}

// Audit logger (NFR — as-built generation events are logged), same
// injectable convention as migration-schema-parser.js's setLogger()/
// drift-comparator.js's setLogger(). Defaults to a no-op so importing this
// module never has a side effect on its own.
let _logger = { info: function() {}, warn: function() {} };
function setLogger(logger) {
  _logger = logger;
}
function _logEvent(eventName, data) {
  try {
    _logger.info(eventName, data);
  } catch (e) {
    // Logging must never break diagram generation.
  }
}

/**
 * Top-level orchestrator (AC1-AC3): scan real committed files for
 * allowlisted require() calls, resolve each to a named service label, and
 * produce the as-built System Architecture canvas content-block — the SAME
 * marker shape /design already emits for the as-designed side
 * (skills/design/SKILL.md, "Canvas markers — System Architecture diagram",
 * ADR-026 — no parallel rendering path).
 *
 * Zero allowlisted requires found is a valid outcome (AC3): produces an
 * empty-edges flowchart, never an error. A genuine read failure (e.g. an
 * explicitly-supplied source file that does not exist) logs a failure event
 * and re-throws, mirroring migration-schema-parser.js's AC4 convention.
 * @param {{repoRoot?: string, sourceFiles?: string[], title?: string, featureSlug?: string}} [options]
 * @returns {{canvasBlock: object, edges: Array, services: string[], sourceFiles: string[]}}
 */
function generateAsBuiltSystemArchitectureDiagram(options) {
  options = options || {};
  const repoRoot = options.repoRoot || process.cwd();
  const filePaths = options.sourceFiles || discoverSourceFiles(repoRoot);

  let edges;
  try {
    edges = [];
    filePaths.forEach(function(fp) {
      edges = edges.concat(extractServiceRequires(fp, { repoRoot: repoRoot }));
    });
  } catch (e) {
    _logEvent('as-built-diagram-generation-failed', {
      diagramType: 'system-architecture',
      featureSlug: options.featureSlug || null,
      error: e.message
    });
    throw e;
  }

  const mermaid = generateFlowchartDiagram(edges);
  const canvasBlock = {
    type: 'system-architecture',
    title: options.title || 'As-built: System architecture',
    content: { mermaid: mermaid }
  };

  const services = [];
  edges.forEach(function(e) { if (services.indexOf(e.service) === -1) services.push(e.service); });
  const sourceFiles = filePaths.map(function(f) { return path.relative(repoRoot, f).split(path.sep).join('/'); });

  _logEvent('as-built-diagram-generation-succeeded', {
    diagramType: 'system-architecture',
    featureSlug: options.featureSlug || null,
    serviceCount: services.length,
    edgeCount: edges.length,
    sourceFileCount: sourceFiles.length
  });

  return { canvasBlock: canvasBlock, edges: edges, services: services, sourceFiles: sourceFiles };
}

module.exports = {
  resolveServiceLabel,
  extractServiceRequires,
  discoverSourceFiles,
  generateFlowchartDiagram,
  generateAsBuiltSystemArchitectureDiagram,
  setLogger
};
