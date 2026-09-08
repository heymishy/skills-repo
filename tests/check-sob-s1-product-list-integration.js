// tests/check-sob-s1-product-list-integration.js
'use strict';
const assert = require('assert');
const { getSessionOriginForJourneys } = require('../src/web-ui/adapters/journey-store-pg.js');
const { _getSessionOriginBulk, setGetSessionOriginBulk } = require('../src/web-ui/routes/products.js');

let passed = 0, failed = 0;
function test(name, fn) {
  const p = Promise.resolve().then(fn);
  return p.then(function() { console.log('  ✓ ' + name); passed++; })
    .catch(function(e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; });
}

async function main() {
  console.log('\n[sob-s1] getSessionOriginForJourneys -- no pool configured returns {}');
  await test('returns empty object with no DATABASE_URL/pool wired', async function() {
    const result = await getSessionOriginForJourneys(['j1', 'j2']);
    assert.deepStrictEqual(result, {});
  });
  await test('returns empty object for an empty journeyIds array', async function() {
    const result = await getSessionOriginForJourneys([]);
    assert.deepStrictEqual(result, {});
  });

  console.log('\n[sob-s1] _getSessionOriginBulk -- injectable seam calls the wired fn exactly once');
  await test('setGetSessionOriginBulk spy is called exactly once with the exact journeyIds array', async function() {
    let callCount = 0;
    let receivedArgs = null;
    setGetSessionOriginBulk(function(journeyIds) {
      callCount++;
      receivedArgs = journeyIds;
      return Promise.resolve({});
    });
    try {
      await _getSessionOriginBulk(['j1', 'j2', 'j3']);
      assert.strictEqual(callCount, 1);
      assert.deepStrictEqual(receivedArgs, ['j1', 'j2', 'j3']);
    } finally {
      setGetSessionOriginBulk(null);
    }
  });

  console.log('\n--- sob-s1 product-list integration results (partial) ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
}
main();
