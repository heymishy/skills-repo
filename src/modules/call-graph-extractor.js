'use strict';

/**
 * call-graph-extractor.js — csd-s5: minimal, real static require()-edge
 * extraction for a given entry file, used to satisfy AC2's "reflects real
 * merged code structure, not a re-prompted agent's memory" requirement for
 * Program Design diagrams.
 *
 * Scope note: this story's dispatch explicitly narrows csd-s5's primary
 * deliverable to the Data Model diagram (decisions.md's only resolved ARCH
 * entry for as-built generation covers static migration-file parsing, not a
 * system-architecture/program-design extraction method). This module is a
 * deliberately small, real (never agent-memory-based) proof that the same
 * "read real files directly" principle applies to call-graph extraction —
 * not a full production System Architecture/Program Design generation
 * pipeline. See this story's PR description for the flagged scope note.
 *
 * Method: regex-based extraction of relative `require('./x')` /
 * `require('../x')` specifiers from a file's real source text, resolved to
 * real files on disk. This is static analysis of the file exactly as
 * committed — never a prompt asking a model to describe what it built.
 */

const fs = require('fs');
const path = require('path');

const REQUIRE_RE = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;

function _resolveRequirePath(fromFile, specifier) {
  const dir = path.dirname(fromFile);
  let resolved = path.resolve(dir, specifier);
  if (fs.existsSync(resolved)) {
    if (fs.statSync(resolved).isDirectory()) {
      const indexPath = path.join(resolved, 'index.js');
      if (fs.existsSync(indexPath)) return indexPath;
    }
    return resolved;
  }
  if (fs.existsSync(resolved + '.js')) return resolved + '.js';
  return resolved; // best-effort — not resolvable on disk, returned as-is
}

/**
 * Extract every relative-require edge that appears literally in
 * `entryFilePath`'s real source text.
 * @param {string} entryFilePath
 * @param {{repoRoot?: string}} [options]
 * @returns {Array<{from:string, to:string}>} repo-root-relative, forward-slash paths
 */
function extractRequireEdges(entryFilePath, options) {
  options = options || {};
  const repoRoot = options.repoRoot || process.cwd();
  const source = fs.readFileSync(entryFilePath, 'utf8');
  const edges = [];
  const fromRel = path.relative(repoRoot, entryFilePath).split(path.sep).join('/');

  let m;
  REQUIRE_RE.lastIndex = 0;
  while ((m = REQUIRE_RE.exec(source)) !== null) {
    const resolved = _resolveRequirePath(entryFilePath, m[1]);
    const toRel = path.relative(repoRoot, resolved).split(path.sep).join('/');
    edges.push({ from: fromRel, to: toRel });
  }
  return edges;
}

function _sanitizeId(p) {
  return p.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Render a require-edge list as a mermaid flowchart, in a plain
 * `content.mermaid` shape consistent with the same canvas content-block
 * convention the data-model diagram uses (ADR-026).
 * @param {Array<{from:string, to:string}>} edges
 * @returns {string}
 */
function generateFlowchartDiagram(edges) {
  const lines = ['flowchart TD'];
  const seen = {};
  function declareNode(p) {
    if (seen[p]) return;
    seen[p] = true;
    lines.push('  ' + _sanitizeId(p) + '["' + p + '"]');
  }
  edges.forEach(function(e) { declareNode(e.from); declareNode(e.to); });
  edges.forEach(function(e) {
    lines.push('  ' + _sanitizeId(e.from) + ' --> ' + _sanitizeId(e.to));
  });
  return lines.join('\n');
}

/**
 * Top-level orchestrator: extract require edges for one real entry file and
 * produce a Program Design canvas content-block.
 * @param {string} entryFilePath
 * @param {{repoRoot?: string, title?: string}} [options]
 * @returns {{canvasBlock: object, edges: Array}}
 */
function generateAsBuiltProgramDesignDiagram(entryFilePath, options) {
  options = options || {};
  const edges = extractRequireEdges(entryFilePath, { repoRoot: options.repoRoot });
  const mermaid = generateFlowchartDiagram(edges);
  return {
    canvasBlock: {
      type: 'program-design',
      title: options.title || 'As-built: Program design',
      content: { mermaid: mermaid }
    },
    edges: edges
  };
}

module.exports = {
  extractRequireEdges,
  generateFlowchartDiagram,
  generateAsBuiltProgramDesignDiagram
};
