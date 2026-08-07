'use strict';
// csd-s5 test fixture (NOT a real migration) -- deliberately malformed for
// AC4's malformedMigrationFileFailsWithClearErrorNotSilentEmptyDiagram /
// malformedMigrationFileErrorSurfacedToOperatorNotSwallowed. The CREATE
// TABLE's parentheses are balanced (so the table-block scan succeeds), but
// the second line inside it is not a recognisable "name TYPE" column
// definition -- it must fail loudly, naming this file, rather than silently
// producing an empty or partial diagram.
async function migrate(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS broken_table (
    id TEXT PRIMARY KEY,
    ???not a real column definition???
  )`);
}

module.exports = { migrate };
