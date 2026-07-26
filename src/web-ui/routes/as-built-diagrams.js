'use strict';

/**
 * as-built-diagrams.js — csd-s5: HTTP surface for as-built Data Model
 * diagram generation.
 *
 * Per ADR-027 ("live SaaS-user-facing mechanisms are ordinary application
 * code, not governed SKILL.md skills") this is a normal `src/web-ui/routes/`
 * handler — the same shape as every other route in this codebase — not a
 * SKILL.md instruction change. (Note: this story's own signed-off DoR
 * document text says the opposite of what ADR-027 itself states — see the
 * PR description for the flagged discrepancy.)
 *
 * Generation is delegated entirely to
 * `src/modules/migration-schema-parser.js` (the static parser/mermaid
 * generator) so this route stays a thin HTTP adapter: parse request ->
 * call the module -> write the versioned artefact -> return the SAME
 * canvas content-block shape the existing `/ideate` canvas mechanism
 * already renders (ADR-026 — no parallel rendering path).
 */

const path = require('path');
const _parser = require('../../modules/migration-schema-parser');

// Injectable adapter (tests only) — defaults to the real parser module.
// Lets tests exercise the malformed-migration-file error path (AC4,
// "malformedMigrationFileErrorSurfacedToOperatorNotSwallowed") through the
// real HTTP handler without needing a genuinely broken file inside this
// repo's own scripts/ directory.
let _parserAdapter = _parser;
function setMigrationSchemaParserAdapter(adapter) {
  _parserAdapter = adapter;
}

function _repoRoot() {
  // src/web-ui/routes -> src/web-ui -> src -> repo root
  return path.join(__dirname, '..', '..', '..');
}

/**
 * GET /api/as-built-diagrams/data-model?featureSlug=<slug>
 *
 * Statically parses this repo's real `scripts/migrate-schema-*.js` files
 * (AC1), writes the generated diagram to the given feature's artefact
 * folder as a versioned file (AC3), and returns the canvas content-block
 * (`{type:"data-model", title, content:{mermaid}}`) so any consumer already
 * able to render that shape (the `/ideate` canvas — ADR-026) can display it
 * without a separate manual trigger.
 *
 * A migration file that cannot be statically parsed produces a clear 500
 * response naming the file and the problem (AC4) — never a 200 with an
 * empty or incorrect diagram.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleGetAsBuiltDataModel(req, res) {
  const featureSlug = req.query && req.query.featureSlug;
  if (!featureSlug) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'featureSlug query parameter is required' }));
    return;
  }

  const repoRoot = _repoRoot();

  let result;
  try {
    result = _parserAdapter.generateAsBuiltDataModelDiagram({ repoRoot: repoRoot, featureSlug: featureSlug });
  } catch (e) {
    // AC4 — surfaced to the operator as a clear, specific error; never
    // caught-and-swallowed into a 200 with an empty/incorrect diagram.
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: e.message }));
    return;
  }

  let artefactPath;
  try {
    artefactPath = _parserAdapter.writeAsBuiltDiagramArtefact(featureSlug, result.canvasBlock, { repoRoot: repoRoot });
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
    sourceFiles: result.sourceFiles
  }));
}

module.exports = {
  handleGetAsBuiltDataModel,
  setMigrationSchemaParserAdapter
};
