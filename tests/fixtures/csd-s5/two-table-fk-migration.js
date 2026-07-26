'use strict';
// csd-s5 test fixture (NOT a real migration) -- modelled on this repo's
// real scripts/migrate-schema-*.js format. Two tables with an explicit
// foreign-key relationship, for AC1's
// staticParsingExtractsTableColumnRelationshipFromRealMigrationFileFormat.
async function migrate(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT        PRIMARY KEY,
    name        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS orders (
    order_id    TEXT        PRIMARY KEY,
    customer_id TEXT        REFERENCES customers(customer_id),
    amount      INTEGER     NOT NULL DEFAULT 0,
    placed_at   TIMESTAMPTZ DEFAULT now()
  )`);
}

module.exports = { migrate };
