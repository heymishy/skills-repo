'use strict';

// check-tir-s6-schema-scale-validation.js — tir-s6 (schema scale validation)
//
// Confirms team-membership lookups (tir-s1's people/team_memberships schema,
// PRIMARY KEY (person_id, tenant_id)) stay indexed as a tenant approaches
// ~100 members, per decisions.md's 2026-07-13 RISK-ACCEPT:
//
//   AC1/AC2/AC4 require a REAL Postgres connection (EXPLAIN plans and
//   wall-clock timing cannot be produced by this repo's in-memory mocks) --
//   they run for real only when DATABASE_URL is set, and skip with an
//   explicit, visible message (never silently pass, never mock a canned
//   "used index" result) when it is absent.
//
//   AC3 (solo-tenant regression) runs unconditionally against a mocked pool,
//   following check-tir-s7-person-scoped-login-resolution.js's makeFakePool
//   convention (narrow, explicit query-shape branches, no generic SQL engine).
//
// Design note (see artefacts/2026-07-09-team-identity-roles/plans/tir-s6-plan.md):
// tir-s1's team_memberships table already declares PRIMARY KEY (person_id,
// tenant_id) -- Postgres always backs a PRIMARY KEY with a unique btree index
// over exactly its declared columns, in declared order. tir-s7's production
// lookup (resolveRoleForPerson) queries WHERE person_id = $1 AND tenant_id = $2
// -- an exact match on both key columns in the same order. No new index or
// schema change is introduced by this story; AC1/AC2/AC4 exist to produce
// real evidence that this holds at 100-row scale, not to add a new index.
//
// Follows this repo's hand-rolled test()/assert style -- no Jest/Mocha.

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;
var skipped = 0;
var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

function skip(name, message) {
  skipped++;
  console.log('  [SKIP]', name, '--', message);
}

var USER_ROLES_PATH = path.resolve(__dirname, '../src/web-ui/modules/user-roles.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── In-memory fake pool (AC3 only) ──────────────────────────────────────────
// Mirrors tests/check-tir-s7-person-scoped-login-resolution.js's makeFakePool:
// narrow, explicit query-shape branches, not a generic SQL engine.
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool(personIdentities, teamMemberships, userRoles) {
  var _personIdentities = (personIdentities || []).slice();
  var _teamMemberships = (teamMemberships || []).slice();
  var _userRoles = (userRoles || []).slice();
  var queryLog = [];

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];
    queryLog.push(s);

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var identityKey = p[0];
      var linked = _personIdentities.filter(function(r) { return r.identity_key === identityKey; });
      return Promise.resolve({ rows: linked.map(function(r) { return { person_id: r.person_id }; }) });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND TENANT_ID') === -1 && s.indexOf('AND PERSON_ID') === -1) {
      var fallbackTenantId = p[0];
      var match = _teamMemberships.filter(function(r) { return r.tenant_id === fallbackTenantId; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0 && s.indexOf('AND TENANT_ID') !== -1) {
      var scopedPersonId = p[0];
      var scopedTenantId = p[1];
      var scopedMatch = _teamMemberships.filter(function(r) { return r.person_id === scopedPersonId && r.tenant_id === scopedTenantId; });
      return Promise.resolve({ rows: scopedMatch.length ? [{ role: scopedMatch[0].role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var legacyScopeTenantId = p[0];
      var legacyScopeMatch = _teamMemberships.filter(function(r) { return r.tenant_id === legacyScopeTenantId; });
      return Promise.resolve({ rows: legacyScopeMatch.length ? [{ role: legacyScopeMatch[0].role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM USER_ROLES WHERE TENANT_ID') === 0) {
      var legacyTenantId = p[0];
      var legacyMatch = _userRoles.filter(function(r) { return r.tenant_id === legacyTenantId; });
      return Promise.resolve({ rows: legacyMatch.map(function(r) { return { role: r.role }; }) });
    }

    if (s.indexOf('SELECT 1 FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var checkTenantId = p[0];
      var exists = _teamMemberships.some(function(r) { return r.tenant_id === checkTenantId; });
      return Promise.resolve({ rows: exists ? [{ '?column?': 1 }] : [] });
    }

    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      return Promise.resolve({ rows: [{ id: 999 }] });
    }

    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      return Promise.resolve({ rows: [] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _queryLog: function() { return queryLog; }
  };
}

// ── AC3 — solo-tenant lookup is unaffected (unconditional, mocked) ──────────
function runAc3() {
  console.log('\n[tir-s6] AC3 -- single-member tenant lookup is unaffected by this story\'s scale validation work');
  return test('resolveRoleForPerson returns the correct (and only) role for a 1-member tenant', function() {
    var userRoles = freshRequire(USER_ROLES_PATH);
    var pool = makeFakePool(
      [],
      [{ person_id: 42, tenant_id: 'solo-acme', role: 'admin' }],
      []
    );
    return userRoles.resolveRoleForPerson(pool, 'solo-acme', 'solo-acme').then(function(role) {
      assert.strictEqual(role, 'admin', 'Expected the unchanged solo-tenant role (admin), got: ' + role);
    });
  });
}

// ── AC1/AC2/AC4 — real-Postgres, DATABASE_URL-gated ─────────────────────────
function runGatedTests() {
  if (!process.env.DATABASE_URL) {
    console.log('\n[tir-s6] AC1/AC2/AC4 -- real-Postgres query-plan and timing evidence');
    skip('AC1: role lookup at 100 members uses an index, not a full table scan', '[tir-s6] SKIPPED: DATABASE_URL not set, cannot verify query plan');
    skip('AC2: role lookup at 100 members completes under 50ms', '[tir-s6] SKIPPED: DATABASE_URL not set, cannot verify query timing');
    skip('AC4: batch-inserting 100 members does not degrade vs. sequential inserts', '[tir-s6] SKIPPED: DATABASE_URL not set, cannot verify batch-insert timing');
    return Promise.resolve();
  }

  var Pool = require('pg').Pool;
  var pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  var scaleTenant = 'tir-s6-scale-tenant-' + Date.now();
  var batchTenant = 'tir-s6-batch-tenant-' + Date.now();
  var sequentialTenant = 'tir-s6-seq-tenant-' + Date.now();
  var seededPersonIds = [];

  function insertPerson() {
    return pool.query('INSERT INTO people DEFAULT VALUES RETURNING id').then(function(r) {
      return r.rows[0].id;
    });
  }

  function seedMembers(tenantId, count) {
    var chain = Promise.resolve();
    var ids = [];
    for (var i = 0; i < count; i++) {
      chain = chain.then(function() {
        return insertPerson().then(function(id) {
          ids.push(id);
          return pool.query(
            'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ON CONFLICT (person_id, tenant_id) DO NOTHING',
            [id, tenantId, 'engineer']
          );
        });
      });
    }
    return chain.then(function() { return ids; });
  }

  return Promise.resolve()
    .then(function() {
      // migrateTeamSchema is idempotent (CREATE TABLE IF NOT EXISTS) -- safe to
      // call again here to guarantee the schema exists before seeding.
      var userRoles = freshRequire(USER_ROLES_PATH);
      return userRoles.migrateTeamSchema(pool, { info: function() {} });
    })
    .then(function() {
      console.log('\n[tir-s6] AC1 -- role lookup at 100 members uses an index, not a full table scan');
      return test('EXPLAIN shows an index scan (not a sequential scan) for the person+tenant lookup at 100 rows', function() {
        return seedMembers(scaleTenant, 100).then(function(ids) {
          seededPersonIds = seededPersonIds.concat(ids.map(function(id) { return { tenantId: scaleTenant, personId: id }; }));
          var lookupPersonId = ids[ids.length - 1];
          return pool.query(
            'EXPLAIN SELECT role FROM team_memberships WHERE person_id = $1 AND tenant_id = $2',
            [lookupPersonId, scaleTenant]
          ).then(function(result) {
            var planText = result.rows.map(function(r) { return r['QUERY PLAN']; }).join('\n');
            assert.ok(
              /Index (Only )?Scan/i.test(planText),
              'Expected an Index Scan (or Index Only Scan) in the query plan, got:\n' + planText
            );
            assert.ok(
              !/Seq Scan on team_memberships/i.test(planText),
              'Expected NO sequential scan on team_memberships in the query plan, got:\n' + planText
            );
          });
        });
      });
    })
    .then(function() {
      console.log('\n[tir-s6] AC2 -- role lookup at 100 members completes under 50ms');
      return test('lookup query executes in under 50ms at 100-row scale', function() {
        var lookupPersonId = seededPersonIds.filter(function(e) { return e.tenantId === scaleTenant; }).slice(-1)[0].personId;
        var start = Date.now();
        return pool.query(
          'SELECT role FROM team_memberships WHERE person_id = $1 AND tenant_id = $2',
          [lookupPersonId, scaleTenant]
        ).then(function() {
          var elapsed = Date.now() - start;
          assert.ok(elapsed < 50, 'Expected lookup under 50ms (operator-confirmed firm threshold), got ' + elapsed + 'ms');
        });
      });
    })
    .then(function() {
      console.log('\n[tir-s6] AC4 -- batch-inserting 100 members does not degrade vs. sequential inserts');
      return test('a single 100-row batch INSERT completes without timing out and is not an order-of-magnitude slower than 100 sequential inserts', function() {
        // Sequential baseline: 100 individual single-row inserts.
        var seqPersonIdsPromise = Promise.resolve();
        var seqIds = [];
        for (var i = 0; i < 100; i++) {
          seqPersonIdsPromise = seqPersonIdsPromise.then(function() { return insertPerson(); }).then(function(id) {
            seqIds.push(id);
            return id;
          });
        }

        var seqStart;
        return seqPersonIdsPromise
          .then(function() {
            seqStart = Date.now();
            var chain = Promise.resolve();
            seqIds.forEach(function(id) {
              chain = chain.then(function() {
                return pool.query(
                  'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ON CONFLICT (person_id, tenant_id) DO NOTHING',
                  [id, sequentialTenant, 'engineer']
                );
              });
            });
            return chain;
          })
          .then(function() {
            var sequentialElapsed = Date.now() - seqStart;
            seededPersonIds = seededPersonIds.concat(seqIds.map(function(id) { return { tenantId: sequentialTenant, personId: id }; }));

            // Batch path: 100 rows inserted as one multi-row INSERT statement.
            var batchPersonInserts = [];
            var chain = Promise.resolve();
            for (var j = 0; j < 100; j++) {
              chain = chain.then(function() { return insertPerson(); }).then(function(id) {
                batchPersonInserts.push(id);
              });
            }

            return chain.then(function() {
              seededPersonIds = seededPersonIds.concat(batchPersonInserts.map(function(id) { return { tenantId: batchTenant, personId: id }; }));

              var values = [];
              var params = [];
              batchPersonInserts.forEach(function(id, idx) {
                var base = idx * 3;
                values.push('($' + (base + 1) + ', $' + (base + 2) + ', $' + (base + 3) + ')');
                params.push(id, batchTenant, 'engineer');
              });
              var batchSql = 'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ' + values.join(', ') + ' ON CONFLICT (person_id, tenant_id) DO NOTHING';

              var batchStart = Date.now();
              var TIMEOUT_MS = 5000;
              return Promise.race([
                pool.query(batchSql, params),
                new Promise(function(_, reject) {
                  setTimeout(function() { reject(new Error('batch insert exceeded ' + TIMEOUT_MS + 'ms timeout budget')); }, TIMEOUT_MS);
                })
              ]).then(function() {
                var batchElapsed = Date.now() - batchStart;
                console.log('    (batch=' + batchElapsed + 'ms, sequential=' + sequentialElapsed + 'ms)');
                // No order-of-magnitude regression: batch must not exceed 10x
                // the sequential baseline (and, per the story, must not time out).
                assert.ok(
                  batchElapsed <= Math.max(sequentialElapsed * 10, 500),
                  'Expected batch insert (' + batchElapsed + 'ms) not to be an order of magnitude slower than the sequential baseline (' + sequentialElapsed + 'ms)'
                );
              });
            });
          });
      });
    })
    .catch(function(err) {
      failed++;
      failures.push({ name: 'AC1/AC2/AC4 setup', err: err });
      console.log('  [FAIL] AC1/AC2/AC4 setup --', err && err.message || err);
    })
    .then(function() {
      // Cleanup: remove every seeded team_memberships/people row this run created.
      var cleanup = Promise.resolve();
      [scaleTenant, batchTenant, sequentialTenant].forEach(function(tenantId) {
        cleanup = cleanup.then(function() {
          return pool.query('DELETE FROM team_memberships WHERE tenant_id = $1', [tenantId]).catch(function() {});
        });
      });
      seededPersonIds.forEach(function(entry) {
        cleanup = cleanup.then(function() {
          return pool.query('DELETE FROM people WHERE id = $1', [entry.personId]).catch(function() {});
        });
      });
      return cleanup;
    })
    .then(function() {
      return pool.end();
    });
}

async function main() {
  await runAc3();
  await runGatedTests();

  console.log('\n[tir-s6] Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s6] Unexpected error:', err);
  process.exit(1);
});
