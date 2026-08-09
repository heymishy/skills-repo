'use strict';

// learnings-count.js (lphf-s4, build-time fallback added by lcdf-s1) -- counts
// real entries in workspace/learnings.md for the self-improving-harness hero
// card. Computed at module init from the actual file, not hardcoded -- per
// review finding 1-M1 on the story's own AC1, a hardcoded number would go
// stale the moment a new entry is logged.
//
// workspace/learnings.md is a repo-management file, never part of the
// deployed application bundle (Dockerfile only ever copies src/) -- so in
// every deployed environment the direct read below always fails. lcdf-s1
// adds a second tier: scripts/write-learnings-count-file.js computes the
// real count at build/deploy time and bakes it into learnings-count.json,
// which IS copied into the image (see Dockerfile's optional bracket-glob
// copy, mirroring version.json's existing precedent). Only if BOTH the
// live file and the baked file are unavailable does this fail all the way
// open to 0 -- lccf-s1's original safety net, preserved as defense in depth.

var fs = require('fs');
var path = require('path');

function getLearningsCount() {
  try {
    var filePath = path.join(__dirname, '..', '..', '..', 'workspace', 'learnings.md');
    var raw = fs.readFileSync(filePath, 'utf8');
    var matches = raw.match(/^## /gm) || [];
    return matches.length;
  } catch (e) {
    try {
      var bakedPath = path.join(__dirname, '..', '..', '..', 'learnings-count.json');
      var baked = JSON.parse(fs.readFileSync(bakedPath, 'utf8'));
      if (typeof baked.count === 'number') return baked.count;
      return 0;
    } catch (e2) {
      return 0;
    }
  }
}

module.exports = { getLearningsCount: getLearningsCount };
