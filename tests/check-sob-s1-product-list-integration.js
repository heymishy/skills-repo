// tests/check-sob-s1-product-list-integration.js
'use strict';
const assert = require('assert');
const { getSessionOriginForJourneys } = require('../src/web-ui/adapters/journey-store-pg.js');

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

  console.log('\n--- sob-s1 product-list integration results (partial) ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
}
main();
