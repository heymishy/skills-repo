/**
 * check-dcfx-s1-dockerfile-copies-artefacts-and-github.js
 *
 * dcfx-s1 - the Dockerfile's production stage must explicitly COPY
 * artefacts/ and .github/ into the image (daga-s1's own .dockerignore fix
 * was necessary but not sufficient -- this stage uses an explicit COPY
 * allowlist, not "copy everything the build context allows"). Both new
 * COPY lines must land in the production stage, not the builder stage, and
 * neither the new lines nor any other COPY in the file may target .git.
 *
 * Run: node tests/check-dcfx-s1-dockerfile-copies-artefacts-and-github.js
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-dcfx-s1-dockerfile-copies-artefacts-and-github]';
let failures = 0;

function pass(id, msg) {
  console.log(`${SUITE} PASS ${id}: ${msg}`);
}

function fail(id, msg) {
  failures++;
  console.error(`${SUITE} FAIL ${id}: ${msg}`);
}

const content = fs.readFileSync(path.join(__dirname, '..', 'Dockerfile'), 'utf8');

const productionStageStart = content.indexOf('FROM node:20-alpine AS production');
if (productionStageStart === -1) {
  fail('SETUP', 'could not locate "FROM node:20-alpine AS production" in Dockerfile -- test cannot proceed');
  console.log(`${SUITE} ${failures} FAILURE(S)`);
  process.exit(1);
}
const productionStage = content.slice(productionStageStart);
const builderStage = content.slice(0, productionStageStart);

// T1 - AC1: artefacts/ is copied
(function t1() {
  if (/COPY --chown=node:node artefacts\/ \.\/artefacts\//.test(productionStage)) {
    pass('T1', 'Dockerfile copies artefacts/ into the production stage');
  } else {
    fail('T1', 'Dockerfile is missing "COPY --chown=node:node artefacts/ ./artefacts/" in the production stage');
  }
})();

// T2 - AC2: .github/ is copied
(function t2() {
  if (/COPY --chown=node:node \.github\/ \.\/\.github\//.test(productionStage)) {
    pass('T2', 'Dockerfile copies .github/ into the production stage');
  } else {
    fail('T2', 'Dockerfile is missing "COPY --chown=node:node .github/ ./.github/" in the production stage');
  }
})();

// T3 - AC1/AC2: both new lines are in the production stage, not the builder stage
(function t3() {
  const inBuilder =
    /COPY --chown=node:node artefacts\/ \.\/artefacts\//.test(builderStage) ||
    /COPY --chown=node:node \.github\/ \.\/\.github\//.test(builderStage);
  if (inBuilder) {
    fail('T3', 'one or both new COPY lines were found in the builder stage, not the production stage');
  } else {
    pass('T3', 'both new COPY lines are correctly scoped to the production stage only');
  }
})();

// T4 - AC3: no COPY line anywhere in the file targets .git
(function t4() {
  const copyLines = content.split('\n').filter((line) => /^\s*COPY\b/.test(line));
  const gitCopy = copyLines.find((line) => /\.git\/?\s|\.git\/?"/.test(line) && !/\.github/.test(line));
  if (gitCopy) {
    fail('T4', `found a COPY line that appears to target .git: ${gitCopy.trim()}`);
  } else {
    pass('T4', 'no COPY line in the Dockerfile targets .git');
  }
})();

console.log(`${SUITE} ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
