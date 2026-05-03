'use strict';
const path = require('path');

/**
 * validateArtefactPath(artefactPath) → boolean
 * PURE string check — NO filesystem I/O (no fs.existsSync).
 * Returns true ONLY for paths that:
 *   - Start with 'artefacts/' after normalisation
 *   - Contain no null bytes
 * Returns false for: path traversal, outside artefacts/, absolute paths.
 */
function validateArtefactPath(artefactPath) {
  if (typeof artefactPath !== 'string' || artefactPath.length === 0) return false;
  if (artefactPath.includes('\0')) return false;
  // Normalise (handles artefacts/../etc/passwd → etc/passwd)
  var normalised = path.normalize(artefactPath).replace(/\\/g, '/');
  // Must start with 'artefacts/'
  return normalised.startsWith('artefacts/');
}

module.exports = { validateArtefactPath };
