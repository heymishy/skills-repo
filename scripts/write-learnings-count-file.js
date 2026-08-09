'use strict';

/**
 * write-learnings-count-file.js -- generates learnings-count.json at the
 * repo root before a deploy, so the running app can display the real
 * "learnings captured" count on the landing page without depending on
 * workspace/learnings.md being present in the deployed image (it never is
 * -- see Dockerfile, which only ever copies src/, not workspace/).
 *
 * Written 2026-08-09 (lcdf-s1) after finding, during /definition-of-done
 * for lphf-s4, that the live landing page showed "0 and counting" -- the
 * lccf-s1 fail-open fallback, correctly preventing a crash, but never
 * intended as the permanent value. Mirrors write-version-file.js's exact
 * shape: a pure, testable buildLearningsCountInfo() function plus a main()
 * that performs the actual file I/O.
 */

const fs = require('fs');
const path = require('path');

/**
 * Pure count computation, reusing the exact same regex
 * src/web-ui/content/learnings-count.js already uses -- not a duplicated,
 * independently-drifting counting rule.
 * @param {string} learningsMdContent
 * @returns {{ count: number, computedAt: string }}
 */
function buildLearningsCountInfo(learningsMdContent) {
  const matches = String(learningsMdContent || '').match(/^## /gm) || [];
  return {
    count: matches.length,
    computedAt: new Date().toISOString()
  };
}

function main() {
  const learningsPath = path.resolve(__dirname, '..', 'workspace', 'learnings.md');
  const raw = fs.readFileSync(learningsPath, 'utf8');
  const info = buildLearningsCountInfo(raw);
  const outPath = path.resolve(__dirname, '..', 'learnings-count.json');
  fs.writeFileSync(outPath, JSON.stringify(info, null, 2) + '\n', 'utf8');
  console.log('Wrote ' + outPath + ':', info);
}

module.exports = { buildLearningsCountInfo };

if (require.main === module) {
  main();
}
