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
  var standards = [];    // { standard_id, product_id, org_id, name, content, visibility, created_at }
  var nextStandardSeq = 1;
  var people = [];       // { id, created_at } — tir-s1/bri-s3.3
  var nextPersonId = 1;
  var teamMemberships = [];    // { person_id, tenant_id, role, created_at } — tir-s1/bri-s3.3
  var personIdentities = [];   // { identity_key, person_id, provider, created_at } — tir-s2/bri-s3.3

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
    // bri-s3.4: added alongside the tenant-ownership fix in routes/products.js
    // (handleGetProductView) — narrow branches, mirroring the file's existing
    // extension pattern, not a general SQL engine.
    // rpc-s1: handleGetProductView's query now also selects repo_owner/
    // repo_name (Connect-repo UI affordance) — matched here first, before the
    // older/narrower NAME, TENANT_ID-only branch below, since exact-prefix
    // matching means the longer column list must be checked first.
    if (s.indexOf('SELECT NAME, TENANT_ID, REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pidRepo = p[0];
      var matchRepo = products.filter(function(r) { return r.product_id === pidRepo; }).map(function(r) {
        return { name: r.name, tenant_id: r.tenant_id, repo_owner: r.repo_owner || null, repo_name: r.repo_name || null };
      });
      return Promise.resolve({ rows: matchRepo });
    }
    if (s.indexOf('SELECT NAME, TENANT_ID FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pid2 = p[0];
      var match2 = products.filter(function(r) { return r.product_id === pid2; }).map(function(r) { return { name: r.name, tenant_id: r.tenant_id }; });
      return Promise.resolve({ rows: match2 });
    }
    // bri-s3.4: added alongside handleGetProductKanban / standardsPost's
    // tenant-ownership check.
    if (s.indexOf('SELECT TENANT_ID FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pid3 = p[0];
      var match3 = products.filter(function(r) { return r.product_id === pid3; }).map(function(r) { return { tenant_id: r.tenant_id }; });
      return Promise.resolve({ rows: match3 });
    }
    // rpc-s1: handlePostProductRepoCreate / handlePutProductEdit's shared
    // repo-association UPDATE — persists repo_provider/repo_owner/repo_name
    // onto the in-memory row so a subsequent GET (via the branch above)
    // reflects the connected repo, matching real Postgres's UPDATE semantics.
    if (s.indexOf('UPDATE PRODUCTS SET REPO_PROVIDER') === 0) {
      var updProvider = p[0];
      var updOwner = p[1];
      var updRepoName = p[2];
      var updProductId = p[3];
      var updTarget = products.find(function(r) { return r.product_id === updProductId; });
      if (updTarget) {
        updTarget.repo_provider = updProvider;
        updTarget.repo_owner = updOwner;
        updTarget.repo_name = updRepoName;
      }
      return Promise.resolve({ rows: [], rowCount: updTarget ? 1 : 0 });
    }

    // ── journeys (product_id-scoped lookups — bri-s3.2 keeps journeys on the
    // existing disk adapter, so this fake always reports zero linked journeys) ─
    if (s.indexOf('FROM JOURNEYS WHERE PRODUCT_ID') !== -1) {
      return Promise.resolve({ rows: [] });
    }

    // ── standards (bri-s3.4) ─────────────────────────────────────────────
    // Narrow support for exactly the query shapes routes/standards.js issues,
    // added to let the @mocked cross-tenant-isolation E2E spec exercise real
    // standards create/list/update flows without a live Postgres.
    if (s.indexOf('INSERT INTO STANDARDS') === 0) {
      var standardId = 'fake-standard-' + (nextStandardSeq++);
      var stdRow = {
        standard_id: standardId,
        product_id:  p[0],
        org_id:      p[1],
        name:        p[2],
        content:     p[3],
        visibility:  p[4],
        created_at:  new Date().toISOString()
      };
      standards.push(stdRow);
      return Promise.resolve({ rows: [{ standard_id: standardId }] });
    }
    if (s.indexOf('SELECT STANDARD_ID, NAME, VISIBILITY, CREATED_AT FROM STANDARDS WHERE PRODUCT_ID') === 0) {
      var stdProductId = p[0];
      var stdOrgId = p[1];
      var stdRows = standards
        .filter(function(r) { return r.product_id === stdProductId && r.org_id === stdOrgId; })
        .sort(function(a, b) { return b.created_at.localeCompare(a.created_at); })
        .map(function(r) { return { standard_id: r.standard_id, name: r.name, visibility: r.visibility, created_at: r.created_at }; });
      return Promise.resolve({ rows: stdRows });
    }
    if (s.indexOf('SELECT ORG_ID FROM STANDARDS WHERE STANDARD_ID') === 0) {
      var lookupStdId = p[0];
      var stdMatch = standards.filter(function(r) { return r.standard_id === lookupStdId; }).map(function(r) { return { org_id: r.org_id }; });
      return Promise.resolve({ rows: stdMatch });
    }
    if (s.indexOf('UPDATE STANDARDS SET NAME') === 0) {
      var updName = p[0];
      var updContent = p[1];
      var updStdId = p[2];
      var target = standards.find(function(r) { return r.standard_id === updStdId; });
      if (target) { target.name = updName; target.content = updContent; }
      return Promise.resolve({ rows: target ? [{ standard_id: target.standard_id }] : [], rowCount: target ? 1 : 0 });
    }

    // ── startup migrations (CREATE TABLE / ALTER TABLE) — idempotent no-op ──
    if (s.indexOf('CREATE TABLE') === 0 || s.indexOf('ALTER TABLE') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // ── people, team_memberships, person_identities (tir-s1/tir-s2/bri-s3.3) ─
    // tir-s1: people table bootstrap (idempotent)
    if (s.indexOf('CREATE TABLE IF NOT EXISTS PEOPLE') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // tir-s1: team_memberships table bootstrap (idempotent)
    if (s.indexOf('CREATE TABLE IF NOT EXISTS TEAM_MEMBERSHIPS') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // tir-s2: person_identities table bootstrap (idempotent)
    if (s.indexOf('CREATE TABLE IF NOT EXISTS PERSON_IDENTITIES') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // tir-s1: INSERT INTO people (used by migrateTeamSchema backfill)
    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++, created_at: new Date().toISOString() };
      people.push(person);
      return Promise.resolve({ rows: [{ id: person.id }] });
    }

    // tir-s1: INSERT INTO team_memberships (used by migrateTeamSchema backfill)
    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      var personId = p[0];
      var tenantId = p[1];
      var role = p[2];
      var tm = { person_id: personId, tenant_id: tenantId, role: role, created_at: new Date().toISOString() };
      teamMemberships.push(tm);
      return Promise.resolve({ rows: [] });
    }

    // tir-s2: INSERT INTO person_identities (used by account-linking routes)
    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      var identityKey = p[0];
      var personIdForLink = p[1];
      var provider = p[2];
      var pi = { identity_key: identityKey, person_id: personIdForLink, provider: provider, created_at: new Date().toISOString() };
      personIdentities.push(pi);
      return Promise.resolve({ rows: [] });
    }

    // tir-s2: SELECT PERSON_ID FROM person_identities (resolvePersonForIdentity lookup)
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var lookupIdentityKey = p[0];
      var piMatch = personIdentities.filter(function(r) { return r.identity_key === lookupIdentityKey; });
      return Promise.resolve({ rows: piMatch.length ? [{ person_id: piMatch[0].person_id }] : [] });
    }

    // tir-s1 / tir-s2: SELECT PERSON_ID FROM team_memberships (resolvePersonForIdentity fallback)
    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') === -1 && s.indexOf('AND TENANT_ID') === -1) {
      var fallbackTenantId = p[0];
      var tmFallback = teamMemberships.filter(function(r) { return r.tenant_id === fallbackTenantId; });
      return Promise.resolve({ rows: tmFallback.length ? [{ person_id: tmFallback[0].person_id }] : [] });
    }

    // tir-s7: SELECT ROLE FROM team_memberships (resolveRoleForPerson, person-scoped)
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0 && s.indexOf('AND TENANT_ID') !== -1) {
      var scopedPersonId = p[0];
      var scopedTenantId = p[1];
      var tmScoped = teamMemberships.filter(function(r) { return r.person_id === scopedPersonId && r.tenant_id === scopedTenantId; });
      return Promise.resolve({ rows: tmScoped.length ? [{ role: tmScoped[0].role }] : [] });
    }

    // tir-s1: SELECT ROLE FROM team_memberships (resolveRoleForTenant, legacy tenant-only lookup)
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') === -1) {
      var legacyTenantId = p[0];
      var tmLegacy = teamMemberships.filter(function(r) { return r.tenant_id === legacyTenantId; });
      return Promise.resolve({ rows: tmLegacy.length ? [{ role: tmLegacy[0].role }] : [] });
    }

    // tir-s1: SELECT 1 FROM team_memberships (migration check in migrateTeamSchema)
    if (s.indexOf('SELECT 1 FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var checkTenantId = p[0];
      var tmExists = teamMemberships.some(function(r) { return r.tenant_id === checkTenantId; });
      return Promise.resolve({ rows: tmExists ? [{ '?column?': 1 }] : [] });
    }

    // Unknown statement — resolve empty rather than throw, so an unanticipated
    // startup-time query never crashes the test server. Logged for visibility.
    console.warn('[fake-test-db] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _reset: function() {
      users = []; nextUserId = 1;
      products = []; nextProductSeq = 1;
      standards = []; nextStandardSeq = 1;
      people = []; nextPersonId = 1;
      teamMemberships = [];
      personIdentities = [];
    }
  };
}

module.exports = { createFakeTestDb };
