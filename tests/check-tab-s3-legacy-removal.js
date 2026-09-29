'use strict';
// check-tab-s3-legacy-removal.js — tab-s3: AC5 (fresh grep for absence of the
// 4 legacy identifiers across src/web-ui/) and AC2 (resolveRoleForTenant's
// remaining default-fallback behaviour is unchanged: 'user', no legacy read).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

function listJsFiles(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(listJsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

(async function() {
  // AC5 — a fresh grep of the entire src/web-ui/ tree for the 4 legacy
  // identifiers returns zero production-code matches. This file itself is
  // the one permitted exception the AC names (it mentions the identifiers
  // as string literals below, deliberately, to search for them).
  try {
    const root = path.join(__dirname, '..', 'src', 'web-ui');
    const identifiers = ['ADMIN_GITHUB_LOGINS', 'getUserRole', 'setGetUserRole', '_backfillOne'];
    const files = listJsFiles(root);
    const matches = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const id of identifiers) {
        if (content.includes(id)) matches.push(file + ': ' + id);
      }
    }
    assert.deepStrictEqual(matches, [], 'Expected zero matches for the 4 legacy identifiers in src/web-ui/, found: ' + matches.join(', '));
    pass('a fresh grep of src/web-ui/ for ADMIN_GITHUB_LOGINS, getUserRole, setGetUserRole, and _backfillOne returns zero production-code matches (AC5)');
  } catch (e) { fail('a fresh grep of src/web-ui/ for ADMIN_GITHUB_LOGINS, getUserRole, setGetUserRole, and _backfillOne returns zero production-code matches (AC5)', e); }

  // AC2 — resolveRoleForTenant's remaining behaviour for a genuinely
  // unmigrated/unknown tenant is the plain 'user' default, not a thrown
  // error, and it never attempts a legacy-table read.
  try {
    const { resolveRoleForTenant } = require('../src/web-ui/modules/user-roles');
    const queries = [];
    const pool = {
      query: async function(sql, params) {
        queries.push(sql);
        return { rows: [] };
      }
    };
    const role = await resolveRoleForTenant(pool, 'never-seen-tenant');
    assert.strictEqual(role, 'user', 'Expected the plain default \'user\' for an unmigrated tenant, got: ' + role);
    const legacyQuery = queries.find(function(q) { return /user_roles/i.test(q); });
    assert.strictEqual(legacyQuery, undefined, 'resolveRoleForTenant must never query user_roles after tab-s3 (AC2), but found: ' + legacyQuery);
    pass('resolveRoleForTenant defaults to \'user\' for an unmigrated tenant with zero legacy-table reads (AC2)');
  } catch (e) { fail('resolveRoleForTenant defaults to \'user\' for an unmigrated tenant with zero legacy-table reads (AC2)', e); }

  console.log('\n[tab-s3] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
