'use strict';
// csd-s5 test fixture (NOT a real migration) -- one half of a two-file
// feature for AC1's staticParsingHandlesMultipleMigrationFilesForOneFeature
// (the multi-file aggregation edge case).
async function migrate(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS authors (
    author_id TEXT PRIMARY KEY,
    name      TEXT NOT NULL
  )`);
}

module.exports = { migrate };
