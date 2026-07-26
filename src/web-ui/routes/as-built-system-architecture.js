'use strict';

/**
 * as-built-system-architecture.js — csd-s7: HTTP surface for as-built System
 * Architecture diagram generation.
 *
 * Per ADR-027 ("live SaaS-user-facing mechanisms are ordinary application
 * code, not governed SKILL.md skills") this is a normal `src/web-ui/routes/`
 * handler — the same thin-adapter shape as `as-built-diagrams.js` (csd-s5).
 * Generation is delegated entirely to
 * `src/modules/service-call-detector.js` (the static require()-allowlist
 * scanner/mermaid generator) and the versioned-artefact write is delegated
 * to `src/modules/migration-schema-parser.js`'s existing
 * `writeAsBuiltDiagramArtefact()` (reused directly, not reimplemented) so
 * this route stays a thin HTTP adapter: parse request -> call the detector
 * -> write the versioned artefact -> return the SAME canvas content-block
 * shape the existing `/ideate` canvas mechanism already renders (ADR-026 —
 * no parallel rendering path).
 */

const path = require('path');
const _detector = require('../../modules/service-call-detector');
const _writer = require('../../modules/migration-schema-parser');

// Injectable adapters (tests only) — default to the real modules. D37-style
// seams so tests can exercise the error path (a detection failure, or a
// write failure) through the real HTTP handler without needing a genuinely
// broken repo state.
let _detectorAdapter = _detector;
let _writerAdapter = _writer;
function setServiceCallDetectorAdapter(adapter) {
  _detectorAdapter = adapter;
}
function setDiagramWriterAdapter(adapter) {
  _writerAdapter = adapter;
}

function _repoRoot() {
  // src/web-ui/routes -> src/web-ui -> src -> repo root
  return path.join(__dirname, '..', '..', '..');
}

/**
 * GET /api/as-built-diagrams/system-architecture?featureSlug=<slug>
 *
 * Statically scans this repo's real `src/` tree for require() calls to the
 * fixed external-service allowlist (AC1), writes the generated diagram to
 * the given feature's artefact folder as a versioned file (AC4), and
 * returns the canvas content-block (`{type:"system-architecture", title,
 * content:{mermaid}}`) so any consumer already able to render that shape
 * (the `/ideate` canvas — ADR-026) can display it without a separate manual
 * trigger.
 *
 * A repo with zero allowlisted service requires is a valid 200 response
 * with an empty-edges flowchart (AC3) — never an error.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleGetAsBuiltSystemArchitecture(req, res) {
  const featureSlug = req.query && req.query.featureSlug;
  if (!featureSlug) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'featureSlug query parameter is required' }));
    return;
  }

  const repoRoot = _repoRoot();

  let result;
  try {
    result = _detectorAdapter.generateAsBuiltSystemArchitectureDiagram({ repoRoot: repoRoot, featureSlug: featureSlug });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: e.message }));
    return;
  }

  let artefactPath;
  try {
    artefactPath = _writerAdapter.writeAsBuiltDiagramArtefact(featureSlug, result.canvasBlock, { repoRoot: repoRoot });
  } catch (e) {
    // Security: path traversal (alrf-s5) -> 400, never 500, and never log the
    // raw featureSlug value in production (CLAUDE.md path-traversal guard rule).
    if (e && e.name === 'ArtefactPathTraversalError') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'invalid featureSlug' }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Diagram generated but could not be saved: ' + e.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    ok: true,
    canvasBlock: result.canvasBlock,
    artefactPath: path.relative(repoRoot, artefactPath).split(path.sep).join('/'),
    services: result.services,
    sourceFiles: result.sourceFiles
  }));
}

module.exports = {
  handleGetAsBuiltSystemArchitecture,
  setServiceCallDetectorAdapter,
  setDiagramWriterAdapter
};
