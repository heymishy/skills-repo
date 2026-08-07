'use strict';
// csd-s5 test fixture (NOT a real migration) -- second half of the two-file
// feature fixture (see multi-file-authors.js). References the `authors`
// table created by the other file, so the aggregated as-built diagram must
// show one coherent relationship across both files' output.
async function migrate(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS books (
    book_id   TEXT PRIMARY KEY,
    author_id TEXT REFERENCES authors(author_id),
    title     TEXT NOT NULL
  )`);
}

module.exports = { migrate };
