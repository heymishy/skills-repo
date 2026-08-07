'use strict';
// check-idp-s1-persist-ideas-in-postgres.js — idp-s1: persist the kanban
// Ideas backlog in Postgres instead of an ephemeral file.
// artefacts/2026-07-29-ideas-postgres-persistence/stories/idp-s1-persist-ideas-in-postgres.md

var assert = require('assert');
var fs     = require('fs');
var os     = require('os');
var path   = require('path');

var IDEAS_STORE_PG_PATH = path.resolve(__dirname, '../src/web-ui/adapters/ideas-store-pg.js');
var FEATURES_PATH       = path.resolve(__dirname, '../src/web-ui/routes/features.js');

function freshRequire(modulePath) {
  try { delete require.cache[require.resolve(modulePath)]; } catch (_) {}
  return require(modulePath);
}

var passed = 0;
var failed = 0;
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
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

function makeRes() {
  var state = { status: 200, body: '' };
  return {
    writeHead: function(code) { state.status = code; },
    end: function(body) { state.body = body || ''; },
    _get: function() { return state; }
  };
}

function makeReq(bodyObj) {
  var chunks = bodyObj !== undefined ? [Buffer.from(JSON.stringify(bodyObj))] : [];
  var listeners = {};
  return {
    on: function(event, cb) {
      listeners[event] = cb;
      if (event === 'end') {
        chunks.forEach(function(c) { listeners.data && listeners.data(c); });
        cb();
      }
      return this;
    }
  };
}

function fakePool() {
  var calls = [];
  var rows  = [];
  return {
    calls: calls,
    rows: rows,
    query: async function(sql, params) {
      calls.push({ sql: sql, params: params });
      if (/^SELECT/.test(sql.trim())) return { rows: rows };
      if (/^DELETE/.test(sql.trim())) {
        var before = rows.length;
        var id = params[0];
        rows = rows.filter(function(r) { return r.id !== id; });
        return { rowCount: before - rows.length };
      }
      return { rows: [] };
    }
  };
}

async function main() {
  // -- U1: createIdea issues the correct INSERT and returns the created row
  console.log('\n[idp-s1] U1 -- createIdea(pool, fields) issues INSERT, returns created row');
  {
    var ideasStorePg = freshRequire(IDEAS_STORE_PG_PATH);
    var pool = fakePool();
    await test('U1: createIdea issues INSERT and returns shaped row', async function() {
      var idea = await ideasStorePg.createIdea(pool, { title: 'Test idea', notes: 'Some notes' });
      assert.ok(pool.calls.some(function(c) { return /INSERT INTO ideas/.test(c.sql); }), 'expected an INSERT INTO ideas call');
      assert.ok(idea.id && idea.title === 'Test idea' && idea.notes === 'Some notes' && idea.createdAt);
    });
  }

  // -- U2: listIdeas issues a SELECT and returns all rows in the existing shape
  console.log('\n[idp-s1] U2 -- listIdeas(pool) issues SELECT, returns { ideas: [...] }');
  {
    var ideasStorePg = freshRequire(IDEAS_STORE_PG_PATH);
    var pool = fakePool();
    pool.rows.push(
      { id: 'idea-1', title: 'A', notes: '', created_at: new Date('2026-01-01T00:00:00Z') },
      { id: 'idea-2', title: 'B', notes: 'n', created_at: new Date('2026-01-02T00:00:00Z') }
    );
    await test('U2: listIdeas returns both fixture rows correctly shaped', async function() {
      var result = await ideasStorePg.listIdeas(pool);
      assert.ok(pool.calls.some(function(c) { return /SELECT.*FROM ideas/.test(c.sql); }));
      assert.strictEqual(result.ideas.length, 2);
      assert.strictEqual(result.ideas[0].id, 'idea-1');
      assert.strictEqual(result.ideas[1].title, 'B');
    });
  }

  // -- U3: deleteIdea issues a parameterised DELETE
  console.log('\n[idp-s1] U3 -- deleteIdea(pool, id) issues parameterised DELETE');
  {
    var ideasStorePg = freshRequire(IDEAS_STORE_PG_PATH);
    var pool = fakePool();
    pool.rows.push({ id: 'idea-123', title: 'X', notes: '', created_at: new Date() });
    await test('U3: deleteIdea issues DELETE with id as a parameter, not interpolated', async function() {
      var result = await ideasStorePg.deleteIdea(pool, 'idea-123');
      var deleteCall = pool.calls.find(function(c) { return /DELETE FROM ideas/.test(c.sql); });
      assert.ok(deleteCall, 'expected a DELETE FROM ideas call');
      assert.ok(!deleteCall.sql.includes('idea-123'), 'id must not be string-interpolated into the SQL text');
      assert.deepStrictEqual(deleteCall.params, ['idea-123']);
      assert.strictEqual(result.deleted, true);
    });
  }

  // -- U4/U5/U6: no-DB case -- file-based default behaviour unchanged
  console.log('\n[idp-s1] U4/U5/U6 -- no-DB case: file-based default unchanged (AC4)');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'idp-s1-'));
    var fakeIdeasPath = path.join(tmpDir, 'ideas.json');
    fs.writeFileSync(fakeIdeasPath, JSON.stringify({ ideas: [] }), 'utf8');

    // Point the module's file-based default at our temp file by requiring
    // fresh and overriding IDEAS_PATH is not exported -- instead, exercise
    // the real default adapter object directly (it is not exported either,
    // only reachable via the real handlers). We verify via the real
    // handlers + a fresh require, relying on the module's own real
    // workspace/ideas.json (safe: read-then-restore).
    var realIdeasPath = path.resolve(__dirname, '../workspace/ideas.json');
    var hadOriginal = fs.existsSync(realIdeasPath);
    var original = hadOriginal ? fs.readFileSync(realIdeasPath, 'utf8') : null;
    fs.mkdirSync(path.dirname(realIdeasPath), { recursive: true });
    fs.writeFileSync(realIdeasPath, JSON.stringify({ ideas: [] }), 'utf8');

    try {
      var routes = freshRequire(FEATURES_PATH); // fresh module -- default _ideasStore active, not overridden

      await test('U4: handlePostIdea (no setIdeasStore called) writes to workspace/ideas.json unchanged', async function() {
        var req = makeReq({ title: 'File-based idea', notes: 'n' });
        var res = makeRes();
        await routes.handlePostIdea(req, res);
        assert.strictEqual(res._get().status, 201);
        var body = JSON.parse(res._get().body);
        assert.strictEqual(body.title, 'File-based idea');
        var onDisk = JSON.parse(fs.readFileSync(realIdeasPath, 'utf8'));
        assert.strictEqual(onDisk.ideas.length, 1);
      });

      await test('U5: handleGetIdeas (no setIdeasStore called) reads workspace/ideas.json unchanged', async function() {
        var res = makeRes();
        await routes.handleGetIdeas({}, res);
        var body = JSON.parse(res._get().body);
        assert.strictEqual(body.ideas.length, 1);
        assert.strictEqual(body.ideas[0].title, 'File-based idea');
      });

      await test('U6: handleDeleteIdea (no setIdeasStore called) removes from workspace/ideas.json unchanged', async function() {
        var onDiskBefore = JSON.parse(fs.readFileSync(realIdeasPath, 'utf8'));
        var id = onDiskBefore.ideas[0].id;
        var res = makeRes();
        await routes.handleDeleteIdea({}, res, id);
        assert.strictEqual(res._get().status, 204);
        var onDiskAfter = JSON.parse(fs.readFileSync(realIdeasPath, 'utf8'));
        assert.strictEqual(onDiskAfter.ideas.length, 0);

        var res404 = makeRes();
        await routes.handleDeleteIdea({}, res404, 'not-a-real-id');
        assert.strictEqual(res404._get().status, 404);
      });
    } finally {
      if (hadOriginal) { fs.writeFileSync(realIdeasPath, original, 'utf8'); }
      else { try { fs.unlinkSync(realIdeasPath); } catch (_) {} }
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }
  }

  // -- IT1-IT3: real Postgres round-trip
  console.log('\n[idp-s1] IT1-IT3 -- real Postgres round-trip');
  if (!process.env.DATABASE_URL) {
    console.log('  [SKIP] IT1-IT3: DATABASE_URL not set -- integration tests require a real Postgres connection');
  } else {
    var { Pool } = require('pg');
    var ideasStorePg = freshRequire(IDEAS_STORE_PG_PATH);
    var poolA = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    var createdId = null;

    await test('IT1: real Postgres round-trip -- create then list', async function() {
      await ideasStorePg.migrateIdeasSchema(poolA);
      var idea = await ideasStorePg.createIdea(poolA, { title: 'idp-s1 integration idea', notes: 'from IT1' });
      createdId = idea.id;
      var listed = await ideasStorePg.listIdeas(poolA);
      var found = listed.ideas.find(function(i) { return i.id === createdId; });
      assert.ok(found, 'expected the created idea to appear in listIdeas()');
      assert.strictEqual(found.title, 'idp-s1 integration idea');
    });

    await test('IT2: real durability across a fresh pool instance (simulating a restart)', async function() {
      await poolA.end();
      var poolB = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
      try {
        var listed = await ideasStorePg.listIdeas(poolB);
        var found = listed.ideas.find(function(i) { return i.id === createdId; });
        assert.ok(found, 'expected the idea created via pool A to be visible via a fresh pool B');
      } finally {
        await poolB.end();
      }
    });

    var poolC = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    await test('IT3: real Postgres delete round-trip', async function() {
      await ideasStorePg.deleteIdea(poolC, createdId);
      var listed = await ideasStorePg.listIdeas(poolC);
      var found = listed.ideas.find(function(i) { return i.id === createdId; });
      assert.ok(!found, 'expected the deleted idea to no longer appear');
    });
    await poolC.end();
  }

  // -- IT4: wired handler round-trips two distinct real ideas correctly (D37 point 4)
  console.log('\n[idp-s1] IT4 -- wired handler round-trips two distinct real ideas (AC5)');
  if (!process.env.DATABASE_URL) {
    console.log('  [SKIP] IT4: DATABASE_URL not set -- integration test requires a real Postgres connection');
  } else {
    var { Pool: Pool2 } = require('pg');
    var ideasStorePg2 = freshRequire(IDEAS_STORE_PG_PATH);
    var poolD = new Pool2({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    var routes2 = freshRequire(FEATURES_PATH);
    var createdIds = [];

    await test('IT4: two distinct ideas created via the real wired handler both round-trip correctly', async function() {
      await ideasStorePg2.migrateIdeasSchema(poolD);
      routes2.setIdeasStore({
        listIdeas:  function()       { return ideasStorePg2.listIdeas(poolD); },
        createIdea: function(fields) { return ideasStorePg2.createIdea(poolD, fields); },
        deleteIdea: function(id)     { return ideasStorePg2.deleteIdea(poolD, id); }
      });

      var resA = makeRes();
      await routes2.handlePostIdea(makeReq({ title: 'Idea A', notes: 'first' }), resA);
      var ideaA = JSON.parse(resA._get().body);
      createdIds.push(ideaA.id);

      var resB = makeRes();
      await routes2.handlePostIdea(makeReq({ title: 'Idea B', notes: 'second' }), resB);
      var ideaB = JSON.parse(resB._get().body);
      createdIds.push(ideaB.id);

      var resList = makeRes();
      await routes2.handleGetIdeas({}, resList);
      var listed = JSON.parse(resList._get().body);
      var foundA = listed.ideas.find(function(i) { return i.id === ideaA.id; });
      var foundB = listed.ideas.find(function(i) { return i.id === ideaB.id; });
      assert.ok(foundA && foundA.title === 'Idea A' && foundA.notes === 'first', 'expected Idea A to round-trip correctly');
      assert.ok(foundB && foundB.title === 'Idea B' && foundB.notes === 'second', 'expected Idea B to round-trip correctly, distinct from Idea A');
    });

    for (var i = 0; i < createdIds.length; i++) {
      await poolD.query('DELETE FROM ideas WHERE id = $1', [createdIds[i]]).catch(function() {});
    }
    await poolD.end();
  }

  console.log('\n--- idp-s1 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
