'use strict';

// tfhc-s8: scans every tests/*.js file that calls handlePostTurnStreamHtml
// with an ARTEFACT-END-bearing fixture response, and flags any that doesn't
// also call setSkillTurnGitCommitAdapter -- the real risk mechanism found by
// tfhc-s6's spike (stis-s1's D37 adapter, gated by `done && _artefactText`
// in handlePostTurnStreamHtml). A file that calls the handler but never
// drives a turn reaching that gated branch (no ARTEFACT-END in its own
// fixtures) carries no real risk and must NOT be flagged -- this is the
// distinction that separates the 13 real-risk files from the other 28
// files tfhc-s6's spike already cleared (12 already-stubbed + 15 non-risk
// but still calling the handler + 1 removed from the original 14-file
// estimate at tfhc-s8's own /review -- see check-isc-s1-ideate-success-
// lens-cycling.js, which never calls the handler in executable code at all).
//
// Note: this is a PRESENCE check (does the file call
// setSkillTurnGitCommitAdapter anywhere), not a POSITION check (is it
// called before every relevant test). Position correctness for each of
// the 13 files fixed by this story is verified manually/by review during
// Tasks 2-3 -- this script's job is the repo-wide audit, not per-call-site
// ordering.

const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.resolve(__dirname, '..', 'tests');

function scanForUnstubbedFiles() {
  const files = fs.readdirSync(TESTS_DIR).filter(function(f) {
    return f.endsWith('.js') && f.indexOf('check-') === 0;
  });
  const unstubbed = [];
  files.forEach(function(file) {
    const fullPath = path.join(TESTS_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    // Strip comments before matching -- naive indexOf substring matching is
    // comment-blind and produced a false positive on
    // check-isc-s1-ideate-success-lens-cycling.js, which only mentions
    // handlePostTurnStreamHtml inside comments, never in executable code.
    const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const callsHandler = cleaned.indexOf('handlePostTurnStreamHtml') !== -1;
    if (!callsHandler) return;
    const hasArtefactEnd = cleaned.indexOf('ARTEFACT-END') !== -1;
    if (!hasArtefactEnd) return;
    const stubsAdapter = cleaned.indexOf('setSkillTurnGitCommitAdapter') !== -1;
    if (!stubsAdapter) {
      unstubbed.push(file);
    }
  });
  return unstubbed;
}

module.exports = { scanForUnstubbedFiles: scanForUnstubbedFiles };

if (require.main === module) {
  const unstubbed = scanForUnstubbedFiles();
  if (unstubbed.length === 0) {
    console.log('check-skill-turn-git-commit-stubbing PASS: 0 unstubbed files found');
    process.exit(0);
  }
  console.error('check-skill-turn-git-commit-stubbing FAIL: ' + unstubbed.length + ' file(s) call handlePostTurnStreamHtml with an artefact-completing fixture but never stub setSkillTurnGitCommitAdapter:');
  unstubbed.forEach(function(f) { console.error('  - tests/' + f); });
  process.exit(1);
}
