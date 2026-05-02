'use strict';
const path = require('path');

/**
 * isWithinBase(testPath, baseDir) -> boolean
 *
 * Returns true only if the resolved testPath starts with the resolved baseDir.
 * Prevents path traversal attacks in cleanupSession.
 */
function isWithinBase(testPath, baseDir) {
  var resolvedTest = path.resolve(testPath);
  var resolvedBase = path.resolve(baseDir);
  // Ensure trailing sep so /tmp/basedir2 doesn't match /tmp/basedir prefix
  var baseSep = resolvedBase.endsWith(path.sep) ? resolvedBase : resolvedBase + path.sep;
  return resolvedTest === resolvedBase || resolvedTest.startsWith(baseSep);
}

module.exports = { isWithinBase };
