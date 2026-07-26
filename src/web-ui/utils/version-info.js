'use strict';

// version-info.js -- reads the version.json stamp written by
// scripts/write-version-file.js before deploy (see that file for the
// staging incident this closes). Falls back to a clearly-labelled dev
// build identity when no version.json exists (local development, or any
// environment where the deploy workflow's stamp step didn't run).

const fs = require('fs');
const path = require('path');

const DEV_FALLBACK = {
  sha: null,
  shortSha: 'dev',
  prNumber: null,
  commitSubject: null,
  deployedAt: null
};

let _cached = null;

function getVersionInfo() {
  if (_cached) return _cached;
  const versionPath = path.resolve(__dirname, '..', '..', '..', 'version.json');
  try {
    _cached = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  } catch (_) {
    _cached = DEV_FALLBACK;
  }
  return _cached;
}

module.exports = { getVersionInfo };
