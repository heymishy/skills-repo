'use strict';

// tests/check-pr-s1-primitives-doc.js
// pr-s1 AC3 -- docs/concepts/README.md lists "Product" as an eighth primitive,
// documenting the existing products table/UI, not a new schema.

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err.message);
  }
}

var README_PATH = path.resolve(__dirname, '../docs/concepts/README.md');
var PRODUCT_DOC_PATH = path.resolve(__dirname, '../docs/concepts/primitives/product.md');

console.log('\n[pr-s1] AC3 -- primitives list contains Product as an eighth entry');

test('README.md exists and is readable', function() {
  assert.ok(fs.existsSync(README_PATH), 'docs/concepts/README.md not found');
});

var readme = fs.existsSync(README_PATH) ? fs.readFileSync(README_PATH, 'utf8') : '';

test('README.md primitives list contains a Product entry', function() {
  assert.ok(/\[Product\]\(primitives\/product\.md\)/.test(readme),
    'Expected a "[Product](primitives/product.md)" bullet in the primitives list');
});

test('README.md primitives count updated from seven to eight', function() {
  var primitivesSection = readme.slice(readme.indexOf('## Primitives'));
  assert.ok(/eight primitives/i.test(primitivesSection),
    'Expected "eight primitives" wording in the Primitives section');
});

test('README.md primitives list still contains all seven original entries', function() {
  var originals = ['Assurance gate', 'Eval suite', 'Learnings log', 'Model evaluation', 'Pipeline state', 'Skill', 'Surface adapter'];
  originals.forEach(function(name) {
    assert.ok(readme.indexOf('[' + name + ']') !== -1, 'Expected original primitive still present: ' + name);
  });
});

test('product.md exists', function() {
  assert.ok(fs.existsSync(PRODUCT_DOC_PATH), 'docs/concepts/primitives/product.md not found');
});

var productDoc = fs.existsSync(PRODUCT_DOC_PATH) ? fs.readFileSync(PRODUCT_DOC_PATH, 'utf8') : '';

test('product.md describes the existing products table, not a new schema', function() {
  assert.ok(/products.*table/i.test(productDoc), 'Expected product.md to reference the existing products table');
  assert.ok(!/new (database )?schema/i.test(productDoc), 'product.md must not describe introducing a new schema');
});

console.log('\n[pr-s1-primitives-doc] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
