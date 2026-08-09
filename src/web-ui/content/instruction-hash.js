'use strict';

// instruction-hash.js (ccrh-s1) -- computes the real, live SHA-256 hash of
// skills/review/SKILL.md for the landing page's crypto-verification hero
// card. Unlike workspace/learnings.md, skills/ IS copied into the deployed
// Docker image (see Dockerfile), so this hash is genuinely computable at
// runtime in every environment -- no build-time-injection tier is needed
// here, unlike lcdf-s1's learnings-count fix.

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

function getInstructionHash() {
  try {
    var filePath = path.join(__dirname, '..', '..', '..', 'skills', 'review', 'SKILL.md');
    var raw = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(raw).digest('hex');
  } catch (e) {
    // skills/ is deployed in every environment today, but fail open rather
    // than crash the landing page if that ever changes.
    return null;
  }
}

module.exports = { getInstructionHash: getInstructionHash };
