'use strict';
const path = require('path');
const ARTEFACTS_PREFIX = 'artefacts/';

function validateArtefactPath(inputPath) {
  if (typeof inputPath !== 'string' || !inputPath) { return false; }
  if (path.isAbsolute(inputPath)) { return false; }
  const normalised = path.posix.normalize(inputPath.replace(/\\/g, '/'));
  return normalised.startsWith(ARTEFACTS_PREFIX);
}

module.exports = { validateArtefactPath };
