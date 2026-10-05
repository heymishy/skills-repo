'use strict';
// fs-safe-write.js — wswda-s1: shared helper for the mkdirSync-before-write
// pattern already applied independently 3 times in this codebase
// (server.js:2750, modules/reference-validator.js:54,
// modules/dismissed-signals-store.js:88) -- extracted here for its 4th/5th
// occurrence rather than inlined again. See decisions.md, 2026-10-06.

const fs = require('fs');
const path = require('path');

function writeFileEnsuringDir(filePath, content, encoding) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, encoding);
}

module.exports = { writeFileEnsuringDir };
