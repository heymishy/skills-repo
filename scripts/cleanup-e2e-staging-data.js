'use strict';

/**
 * scripts/cleanup-e2e-staging-data.js — b3-staging-test-data-cleanup
 *
 * Manually-triggered purge script for staging test data created by this
 * feature's E2E scenarios (real signups, product/feature creation, Stripe
 * test-mode customers on real `wuce-staging`). Mechanism chosen at /review
 * (see artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md,
 * "Staging test-data accumulation" RISK entry, resolved 2026-07-23):
 * naming-convention tag (`e2e-test-` prefix, established by story A3) +
 * this manually-triggered script — NOT a scheduled/nightly job. That
 * mechanism choice was made at /review and is not revisited here.
 *
 * AC1: e2e-test--tagged users/products/Stripe test-mode customers older
 *      than a retention window (default 7 days) are removed; everything
 *      else is left untouched.
 * AC2: matching is a strict positive-allowlist on the EXACT `e2e-test-`
 *      prefix (see isTaggedForE2E below) — never a fuzzy/heuristic match.
 *      A record whose identifying field does not literally start with
 *      `e2e-test-` is never eligible, no matter how much it resembles test
 *      data (e.g. containing "test" elsewhere in the string).
 * AC3: this story also updates decisions.md's RISK entry to confirm the
 *      mechanism is implemented and running — see that file directly.
 *
 * NFR-Security: this script requires explicit, injected credentials (D37
 * pattern) — it never falls back to a default/ambient connection, and the
 * CLI entrypoint below wires only the minimum needed: a Postgres pool for
 * DELETE/SELECT on users/products/journeys/standards/
 * standard_product_optouts, and (optionally) a Stripe secret key scoped to
 * test mode. No broader admin scope is requested anywhere in this file.
 * NFR-Audit: every deleted record is logged (record type, id, createdAt)
 * via the returned summary and console output — see logDeletion().
 *
 * Safety default: dry-run. Nothing is deleted unless the caller passes
 * `dryRun: false` (library usage) or `--execute` (CLI usage). A delete
 * script should default to safe.
 */

const DEFAULT_RETENTION_DAYS = 7;
const TAG_PREFIX = 'e2e-test-';

// ---------------------------------------------------------------------------
// D37 injectable adapters. Stub defaults throw (D37 rule #1) — never a
// silent no-op that could mask a missing credential and mislead an operator
// into thinking a cleanup run actually did something.
// ---------------------------------------------------------------------------
let _dbConnection = null;
function setDbConnection(adapter) { _dbConnection = adapter; }
function _requireDb(adapter) {
  const db = adapter || _dbConnection;
  if (!db) {
    throw new Error('Adapter not wired: dbConnection. Call setDbConnection() with a real implementation before use.');
  }
  return db;
}

let _stripeClient = null;
function setStripeAdapter(adapter) { _stripeClient = adapter; }
function _requireStripe(adapter) {
  const stripe = adapter || _stripeClient;
  if (!stripe) {
    throw new Error('Adapter not wired: stripeClient. Call setStripeAdapter() with a real implementation before use, or pass { skipStripe: true } to deliberately skip Stripe cleanup for this run.');
  }
  return stripe;
}

/**
 * AC2 — the ONLY place eligibility is decided. A strict, anchored,
 * case-sensitive positive-allowlist match on the exact `e2e-test-` prefix.
 * Never a substring/contains check, never case-insensitive, never a regex
 * that could false-positive on real data that merely resembles test data
 * (e.g. "faketest-e2e-test-lookalike" does NOT start with the prefix and is
 * therefore never eligible).
 * @param {*} value
 * @returns {boolean}
 */
function isTaggedForE2E(value) {
  return typeof value === 'string' && value.indexOf(TAG_PREFIX) === 0;
}

function _cutoffDate(retentionDays) {
  const days = typeof retentionDays === 'number' ? retentionDays : DEFAULT_RETENTION_DAYS;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
async function findEligibleUsers(db, cutoff) {
  const result = await db.query(
    'SELECT id, email, created_at FROM users WHERE created_at < $1',
    [cutoff]
  );
  return result.rows.filter(function(row) { return isTaggedForE2E(row.email); });
}

async function deleteUser(db, user) {
  await db.query('DELETE FROM users WHERE id = $1', [user.id]);
}

// ---------------------------------------------------------------------------
// products (+ cascade, mirroring the existing handleDeleteProduct pattern in
// src/web-ui/routes/products.js — explicit DELETEs, not ON DELETE CASCADE
// alone, so the deletion is directly assertable)
// ---------------------------------------------------------------------------
async function findEligibleProducts(db, cutoff) {
  const result = await db.query(
    'SELECT product_id, tenant_id, name, created_at FROM products WHERE created_at < $1',
    [cutoff]
  );
  return result.rows.filter(function(row) {
    return isTaggedForE2E(row.tenant_id) || isTaggedForE2E(row.name);
  });
}

async function deleteProduct(db, product) {
  await db.query('DELETE FROM journeys WHERE product_id = $1', [product.product_id]);
  await db.query('DELETE FROM standard_product_optouts WHERE product_id = $1', [product.product_id]);
  await db.query('DELETE FROM standards WHERE product_id = $1', [product.product_id]);
  await db.query('DELETE FROM products WHERE product_id = $1', [product.product_id]);
}

// ---------------------------------------------------------------------------
// Stripe test-mode customers. No local table persists a tenant->customer
// mapping (confirmed by reading src/web-ui/routes/billing.js and
// src/web-ui/modules/stripe-client.js — stripeCustomerId lives only in
// req.session), so eligibility is determined directly against the Stripe
// API: customer.email must carry the exact e2e-test- prefix (set at
// checkout time by the E2E spec's own tagged tenant email) and
// customer.created (Stripe's own creation timestamp, seconds since epoch)
// must be older than the retention cutoff.
// ---------------------------------------------------------------------------
async function findEligibleStripeCustomers(stripe, cutoff) {
  const cutoffSeconds = Math.floor(cutoff.getTime() / 1000);
  const eligible = [];
  let startingAfter;
  /* eslint-disable no-await-in-loop */
  do {
    const listParams = { limit: 100 };
    if (startingAfter) { listParams.starting_after = startingAfter; }
    const page = await stripe.customers.list(listParams);
    const data = (page && page.data) || [];
    for (let i = 0; i < data.length; i++) {
      const customer = data[i];
      if (isTaggedForE2E(customer.email) && typeof customer.created === 'number' && customer.created < cutoffSeconds) {
        eligible.push(customer);
      }
    }
    startingAfter = (page && page.has_more && data.length > 0) ? data[data.length - 1].id : null;
  } while (startingAfter);
  /* eslint-enable no-await-in-loop */
  return eligible;
}

async function deleteStripeCustomer(stripe, customer) {
  await stripe.customers.del(customer.id);
}

// ---------------------------------------------------------------------------
// NFR-Audit — one log entry per deleted record (record type, id, creation
// timestamp). Emitted both to console (so a manual run has a visible trail)
// and collected into the returned summary (so a caller/test can assert on
// it without scraping stdout).
// ---------------------------------------------------------------------------
function _logDeletion(recordType, id, createdAt) {
  const line = '[cleanup-e2e-staging-data] Deleted ' + recordType + ' id=' + id + ' createdAt=' + createdAt;
  console.log(line);
  return { recordType: recordType, id: id, createdAt: createdAt };
}

/**
 * Core entrypoint (directly testable, and used by the CLI block below).
 * @param {object} options
 * @param {object} [options.db] - injectable Postgres-like adapter (async query(sql, params))
 * @param {object} [options.stripe] - injectable Stripe-like adapter (customers.list/del)
 * @param {boolean} [options.skipStripe] - deliberately skip Stripe cleanup this run (e.g. no STRIPE_SECRET_KEY configured)
 * @param {number} [options.retentionDays] - defaults to 7
 * @param {boolean} [options.dryRun] - defaults to true (safe) — pass false to actually delete
 * @returns {Promise<object>} summary of what was (or would be) deleted
 */
async function run(options) {
  options = options || {};
  const dryRun = options.dryRun !== false; // default true — a delete script defaults to safe
  const cutoff = _cutoffDate(options.retentionDays);
  const db = _requireDb(options.db);

  const eligibleUsers = await findEligibleUsers(db, cutoff);
  const eligibleProducts = await findEligibleProducts(db, cutoff);

  let eligibleStripeCustomers = [];
  if (!options.skipStripe) {
    const stripe = _requireStripe(options.stripe);
    eligibleStripeCustomers = await findEligibleStripeCustomers(stripe, cutoff);
  }

  const deletedUsers = [];
  const deletedProducts = [];
  const deletedStripeCustomers = [];

  if (!dryRun) {
    for (const user of eligibleUsers) {
      await deleteUser(db, user);
      deletedUsers.push(_logDeletion('user', user.id, user.created_at));
    }
    for (const product of eligibleProducts) {
      await deleteProduct(db, product);
      deletedProducts.push(_logDeletion('product', product.product_id, product.created_at));
    }
    if (!options.skipStripe) {
      const stripe = _requireStripe(options.stripe);
      for (const customer of eligibleStripeCustomers) {
        await deleteStripeCustomer(stripe, customer);
        deletedStripeCustomers.push(_logDeletion('stripeCustomer', customer.id, new Date(customer.created * 1000).toISOString()));
      }
    }
  }

  return {
    dryRun: dryRun,
    retentionDays: typeof options.retentionDays === 'number' ? options.retentionDays : DEFAULT_RETENTION_DAYS,
    cutoff: cutoff.toISOString(),
    eligible: {
      users: eligibleUsers,
      products: eligibleProducts,
      stripeCustomers: eligibleStripeCustomers
    },
    deleted: {
      users: deletedUsers,
      products: deletedProducts,
      stripeCustomers: deletedStripeCustomers
    }
  };
}

module.exports = {
  run,
  isTaggedForE2E,
  findEligibleUsers,
  findEligibleProducts,
  findEligibleStripeCustomers,
  deleteUser,
  deleteProduct,
  deleteStripeCustomer,
  setDbConnection,
  setStripeAdapter,
  TAG_PREFIX,
  DEFAULT_RETENTION_DAYS
};

// ---------------------------------------------------------------------------
// CLI entrypoint. Real Postgres/Stripe wiring lives ONLY here (separate from
// the D37 setter logic above, per CLAUDE.md's injectable-adapter rule #3).
// Usage:
//   node scripts/cleanup-e2e-staging-data.js                  (dry-run, 7-day retention)
//   node scripts/cleanup-e2e-staging-data.js --execute         (actually deletes)
//   node scripts/cleanup-e2e-staging-data.js --retention-days=14
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async function() {
    try {
      const args = process.argv.slice(2);
      const execute = args.indexOf('--execute') !== -1;
      const retentionArg = args.find(function(a) { return a.indexOf('--retention-days=') === 0; });
      const retentionDays = retentionArg ? parseInt(retentionArg.split('=')[1], 10) : DEFAULT_RETENTION_DAYS;

      if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
      }
      // eslint-disable-next-line global-require
      const { Pool } = require('pg');
      setDbConnection(new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }));

      let skipStripe = false;
      if (process.env.STRIPE_SECRET_KEY) {
        // eslint-disable-next-line global-require
        setStripeAdapter(require('stripe')(process.env.STRIPE_SECRET_KEY));
      } else {
        console.warn('[cleanup-e2e-staging-data] STRIPE_SECRET_KEY not set — skipping Stripe test-mode customer cleanup this run');
        skipStripe = true;
      }

      const summary = await run({ dryRun: !execute, retentionDays: retentionDays, skipStripe: skipStripe });
      const counts = {
        mode: summary.dryRun ? 'dry-run' : 'executed',
        retentionDays: summary.retentionDays,
        cutoff: summary.cutoff,
        eligible: {
          users: summary.eligible.users.length,
          products: summary.eligible.products.length,
          stripeCustomers: summary.eligible.stripeCustomers.length
        },
        deleted: {
          users: summary.deleted.users.length,
          products: summary.deleted.products.length,
          stripeCustomers: summary.deleted.stripeCustomers.length
        }
      };
      console.log(JSON.stringify(counts, null, 2));
      process.exit(0);
    } catch (err) {
      console.error('cleanup-e2e-staging-data failed:', err.message);
      process.exit(1);
    }
  })();
}
