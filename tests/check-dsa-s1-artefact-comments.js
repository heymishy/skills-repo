'use strict';
// tests/check-dsa-s1-artefact-comments.js -- AC7, AC8 (data layer)
const assert = require('assert');
const {
  migrateArtefactCommentsSchema,
  createComment,
  listCommentsForResource
} = require('../src/web-ui/modules/artefact-comments');

// Minimal in-memory fake pool -- mirrors this repo's own fake-test-db.js
// convention (bri-s3.2/rbg-s1), scoped just to this module's own 2 queries.
function makeFakePool() {
  var rows = [];
  var idCounter = 0;
  return {
    query: async function (sql, params) {
      if (/CREATE TABLE/.test(sql)) return { rows: [] };
      if (/INSERT INTO artefact_comments/.test(sql)) {
        idCounter++;
        var row = {
          comment_id: 'comment-test-' + idCounter,
          resource_type: params[1],
          resource_id: params[2],
          user_id: params[3],
          body: params[4],
          created_at: new Date(Date.now() + idCounter).toISOString()
        };
        rows.push(row);
        return { rows: [row] };
      }
      if (/SELECT .* FROM artefact_comments WHERE/.test(sql)) {
        var matched = rows.filter(function (r) {
          return r.resource_type === params[0] && r.resource_id === params[1];
        }).sort(function (a, b) { return a.created_at < b.created_at ? -1 : (a.created_at > b.created_at ? 1 : 0); });
        return { rows: matched };
      }
      throw new Error('Unhandled query in fake pool: ' + sql);
    }
  };
}

async function testCreateCommentPersistsRow() {
  var pool = makeFakePool();
  await migrateArtefactCommentsSchema(pool);
  var comment = await createComment(pool, 'artefact', 'test-feature/discovery', 'e2e-tester', 'A real comment body');
  assert.ok(comment.comment_id, 'expected a real comment_id');
  assert.strictEqual(comment.body, 'A real comment body');
  assert.strictEqual(comment.user_id, 'e2e-tester');
}

async function testListCommentsReturnsOldestFirst() {
  var pool = makeFakePool();
  await migrateArtefactCommentsSchema(pool);
  await createComment(pool, 'artefact', 'test-feature/discovery', 'user-a', 'First comment');
  await createComment(pool, 'artefact', 'test-feature/discovery', 'user-b', 'Second comment');
  await createComment(pool, 'artefact', 'test-feature/discovery', 'user-c', 'Third comment');

  var list = await listCommentsForResource(pool, 'artefact', 'test-feature/discovery');
  assert.strictEqual(list.length, 3);
  assert.strictEqual(list[0].body, 'First comment');
  assert.strictEqual(list[1].body, 'Second comment');
  assert.strictEqual(list[2].body, 'Third comment');
}

async function testListCommentsEmptyStateReturnsEmptyArray() {
  var pool = makeFakePool();
  await migrateArtefactCommentsSchema(pool);
  var list = await listCommentsForResource(pool, 'artefact', 'no-comments-here/discovery');
  assert.deepStrictEqual(list, []);
}

async function testListCommentsIsolatesByResource() {
  var pool = makeFakePool();
  await migrateArtefactCommentsSchema(pool);
  await createComment(pool, 'artefact', 'feature-a/discovery', 'user-a', 'Comment on feature A');
  await createComment(pool, 'artefact', 'feature-b/discovery', 'user-b', 'Comment on feature B');
  await createComment(pool, 'artefact', 'feature-a/discovery', 'user-c', 'Second comment on feature A');

  var listA = await listCommentsForResource(pool, 'artefact', 'feature-a/discovery');
  assert.strictEqual(listA.length, 2, 'expected only feature-a comments, got cross-resource contamination');
  assert.ok(listA.every(function (c) { return c.resource_id === 'feature-a/discovery'; }));

  var listB = await listCommentsForResource(pool, 'artefact', 'feature-b/discovery');
  assert.strictEqual(listB.length, 1, 'expected only feature-b comments, got cross-resource contamination');
  assert.strictEqual(listB[0].body, 'Comment on feature B');
}

async function main() {
  await testCreateCommentPersistsRow();
  console.log('  ok - createComment persists row');
  await testListCommentsReturnsOldestFirst();
  console.log('  ok - listCommentsForResource returns oldest first');
  await testListCommentsEmptyStateReturnsEmptyArray();
  console.log('  ok - listCommentsForResource empty state returns []');
  await testListCommentsIsolatesByResource();
  console.log('  ok - listCommentsForResource isolates by resource_id');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
