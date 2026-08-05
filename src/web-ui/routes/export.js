'use strict';

// export.js — Route handler for GET /api/export/:slug (rb-s4)
//
// Exposes a DoR-approved feature's artefact content + pipeline-state entry
// to an authenticated external caller (the bootstrap CLI's --from-saas
// flow). This is a machine-to-machine call gated by a per-request Bearer
// credential -- never a browser session (unlike artefact.js's in-app
// viewer, which reads req.session.accessToken).
//
// D37 (CLAUDE.md Injectable adapter rule): the data-access adapter is
// injectable, mirroring artefact.js's setFetcher pattern (same module
// location for the setter), but per D37 the stub default MUST throw rather
// than silently returning empty data -- see rb-s4 AC5. The "real"
// implementation lives in adapters/export-data-source.js and is wired here
// via setExportDataSource() as a separate production-wiring task (D37 rule 3).

let _exportDataSource = function () {
  throw new Error('Adapter not wired: exportDataSource. Call setExportDataSource() with a real implementation before use.');
};

let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

/** Replace the export data-source adapter (for testing and production startup). */
function setExportDataSource(fn) { _exportDataSource = fn; }

/** Retrieve the currently wired adapter function (tests call getExportDataSource()() directly to prove the unwired stub throws -- AC5). */
function getExportDataSource() { return _exportDataSource; }

/** Replace the audit logger (for testing and production startup). */
function setLogger(logger) { _logger = logger; }

const ERROR_STATUS = {
  ExportNotDorApprovedError: 409,
  ExportAccessDeniedError: 403,
  ExportNotFoundError: 404
};

/**
 * Handle a request for a DoR-approved feature's exportable bundle.
 * @param {object} req
 * @param {object} res
 * @param {string} slug - feature slug, e.g. '2026-01-01-example-feature'
 */
async function handleExportRoute(req, res, slug) {
  const authHeader = (req.headers && req.headers.authorization) || '';
  const credential = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

  if (!credential) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing credential — supply Authorization: Bearer <token>' }));
    return;
  }

  try {
    const result = await _exportDataSource(slug, credential);

    // Audit log: featureSlug + timestamp; never log the credential (NFR-Security).
    _logger.info('export_fetch', {
      featureSlug: slug,
      timestamp: new Date().toISOString()
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      artefactContent: result.artefactContent,
      pipelineStateEntry: result.pipelineStateEntry
    }));
  } catch (err) {
    const status = ERROR_STATUS[err.name];
    if (!status) {
      _logger.warn('export_fetch_error', { featureSlug: slug, error: err.message });
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Export failed — please try again' }));
      return;
    }
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = { handleExportRoute, setExportDataSource, getExportDataSource, setLogger };
