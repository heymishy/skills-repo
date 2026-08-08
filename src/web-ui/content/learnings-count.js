'use strict';

// learnings-count.js (lphf-s4) -- counts real entries in workspace/learnings.md
// for the self-improving-harness hero card. Computed at module init from the
// actual file, not hardcoded -- per review finding 1-M1 on the story's own
// AC1, a hardcoded number would go stale the moment a new entry is logged.

var fs = require('fs');
var path = require('path');

function getLearningsCount() {
  try {
    var filePath = path.join(__dirname, '..', '..', '..', 'workspace', 'learnings.md');
    var raw = fs.readFileSync(filePath, 'utf8');
    var matches = raw.match(/^## /gm) || [];
    return matches.length;
  } catch (e) {
    // workspace/learnings.md is a repo-management file, not part of the deployed
    // application bundle -- it will never exist in production. Fail open rather
    // than crash the whole process at module load time.
    return 0;
  }
}

module.exports = { getLearningsCount: getLearningsCount };
