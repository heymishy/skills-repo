'use strict';

/**
 * fake-test-db.js — bri-s3.2
 *
 * In-memory, Postgres-`Pool`-shaped stand-in used ONLY when NODE_ENV=test and
 * no DATABASE_URL is configured. Lets the REAL email/password signup handler
 * (routes/auth-email.js, lab-s2.2) and the REAL product-creation/dashboard
 * handlers (routes/products.js, psh-s1/s3) run end-to-end in the @mocked
 * Playwright suite (bri-s3.2) without needing a live Postgres instance.
 *
 * Scope: this fake supports exactly the query shapes those two call sites
 * issue against the `users` and `products` tables (see grep of `FROM users`,
 * `INTO users`, `FROM products`, `INTO products` across src/web-ui at the
 * time this was written). Any other statement (CREATE TABLE / ALTER TABLE
 * startup migrations) is treated as a no-op that resolves with empty rows —
 * safe because every caller of those wraps the promise in .catch().
 *
 * NOT a general SQL engine — do not extend this to arbitrary queries. If a
 * future story needs more table coverage, add a narrow, explicit branch here
 * (mirroring the ones below) rather than trying to make this "generic".
 */

function _normalise(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function createFakeTestDb() {
  var users = [];        // { id, email, password_hash }
  var nextUserId = 1;
  var products = [];     // { product_id, tenant_id, name, ...}
  var nextProductSeq = 1;

  function query(sql, params) {
    var s = _normalise(sql);
    var p = params || [];

    // ── users ────────────────────────────────────────────────────────────
    if (s.indexOf('INSERT INTO USERS') === 0) {
      var email = p[0];
      var passwordHash = p[1];
      var dup = users.some(function(u) { return u.email === email; });
      if (dup) {
        var err = new Error('duplicate key value violates unique constraint "users_email_key"');
        err.code = '23505';
        return Promise.reject(err);
      }
      var user = { id: nextUserId++, email: email, password_hash: passwordHash };
      users.push(user);
      return Promise.resolve({ rows: [{ id: user.id }] });
    }
    if (s.indexOf('SELECT ID, EMAIL, PASSWORD_HASH FROM USERS') === 0) {
      var lookupEmail = p[0];
      var found = users.filter(function(u) { return u.email === lookupEmail; });
      return Promise.resolve({ rows: found });
    }

    // ── products ─────────────────────────────────────────────────────────
    if (s.indexOf('INSERT INTO PRODUCTS') === 0) {
      var productId = 'fake-product-' + (nextProductSeq++);
      var row = {
        product_id:  productId,
        tenant_id:   p[0],
        name:        p[1],
        description: p[2],
        mission:     p[3],
        tech_stack:  p[4],
        constraints: p[5],
        roadmap:     p[6],
        architecture_guardrails: p[7],
        created_by:  p[8],
        created_at:  new Date().toISOString()
      };
      products.push(row);
      return Promise.resolve({ rows: [{ product_id: productId }] });
    }
    if (s.indexOf('SELECT PRODUCT_ID FROM PRODUCTS WHERE TENANT_ID') === 0) {
      var tenantIdOnly = p[0];
      return Promise.resolve({ rows: products.filter(function(r) { return r.tenant_id === tenantIdOnly; }).map(function(r) { return { product_id: r.product_id }; }) });
    }
    if (s.indexOf('SELECT PRODUCT_ID, NAME, CREATED_AT FROM PRODUCTS WHERE TENANT_ID') === 0) {
      var tenantIdList = p[0];
      var rows = products
        .filter(function(r) { return r.tenant_id === tenantIdList; })
        .sort(function(a, b) { return b.created_at.localeCompare(a.created_at); })
        .map(function(r) { return { product_id: r.product_id, name: r.name, created_at: r.created_at }; });
      return Promise.resolve({ rows: rows });
    }
    if (s.indexOf('SELECT NAME FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pid = p[0];
      var match = products.filter(function(r) { return r.product_id === pid; }).map(function(r) { return { name: r.name }; });
      return Promise.resolve({ rows: match });
    }

    // ── journeys (product_id-scoped lookups — bri-s3.2 keeps journeys on the
    // existing disk adapter, so this fake always reports zero linked journeys) ─
    if (s.indexOf('FROM JOURNEYS WHERE PRODUCT_ID') !== -1) {
      return Promise.resolve({ rows: [] });
    }

    // ── startup migrations (CREATE TABLE / ALTER TABLE) — idempotent no-op ──
    if (s.indexOf('CREATE TABLE') === 0 || s.indexOf('ALTER TABLE') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // Unknown statement — resolve empty rather than throw, so an unanticipated
    // startup-time query never crashes the test server. Logged for visibility.
    console.warn('[fake-test-db] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _reset: function() { users = []; nextUserId = 1; products = []; nextProductSeq = 1; }
  };
}

module.exports = { createFakeTestDb };
