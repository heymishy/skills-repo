'use strict';
const assert = require('assert');
const { execSync } = require('child_process');

// Helper: read pipeline-state story
function getStory(slug) {
  const ps = JSON.parse(require('fs').readFileSync('.github/pipeline-state.json', 'utf8'));
  for (const f of ps.features) {
    const all = f.stories || [];
    const inEpics = (f.epics || []).flatMap(e => e.stories || []);
    const found = [...all, ...inEpics].find(s => s.slug === slug);
    if (found) return found;
  }
  return null;
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// T1 — server.js contains CREATE TABLE IF NOT EXISTS products
try {
  const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
  assert(/CREATE TABLE IF NOT EXISTS products/i.test(src), 'products table migration not in server.js');
  pass('server.js contains CREATE TABLE IF NOT EXISTS products');
} catch(e) { fail('server.js contains CREATE TABLE IF NOT EXISTS products', e); }

// T2 — products table has all required columns
try {
  const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
  const idx = src.indexOf('CREATE TABLE IF NOT EXISTS products');
  assert(idx !== -1, 'products table not found');
  const block = src.slice(idx, idx + 600);
  assert(/product_id.*UUID.*PRIMARY KEY/i.test(block) || /UUID PRIMARY KEY/i.test(block), 'product_id UUID PRIMARY KEY missing');
  assert(/tenant_id/i.test(block), 'tenant_id column missing');
  assert(/name/i.test(block), 'name column missing');
  assert(/created_at/i.test(block), 'created_at column missing');
  assert(/created_by/i.test(block), 'created_by column missing');
  assert(/updated_at/i.test(block), 'updated_at column missing');
  pass('products table has product_id UUID PK, tenant_id, name, created_at, created_by, updated_at');
} catch(e) { fail('products table has product_id UUID PK, tenant_id, name, created_at, created_by, updated_at', e); }

// T3 — standards table present with correct columns
try {
  const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
  assert(/CREATE TABLE IF NOT EXISTS standards/i.test(src), 'standards table migration not in server.js');
  const idx = src.indexOf('CREATE TABLE IF NOT EXISTS standards');
  const block = src.slice(idx, idx + 800);
  assert(/standard_id.*UUID.*PRIMARY KEY/i.test(block) || /UUID PRIMARY KEY/i.test(block), 'standard_id UUID PK missing');
  assert(/product_id.*UUID.*REFERENCES products/i.test(block) || /REFERENCES products.*product_id/i.test(block), 'product_id FK to products missing');
  assert(/ON DELETE CASCADE/i.test(block), 'ON DELETE CASCADE missing on standards.product_id FK');
  assert(/org_id/i.test(block), 'org_id column missing');
  assert(/content.*TEXT/i.test(block) || /TEXT/i.test(block), 'content TEXT column missing');
  assert(/visibility.*VARCHAR/i.test(block) || /visibility/i.test(block), 'visibility column missing');
  assert(/CHECK.*visibility.*IN/i.test(block) || /product.*org.*public/i.test(block), 'visibility CHECK constraint missing');
  pass('standards table has standard_id PK, product_id FK with CASCADE, org_id, content TEXT, visibility CHECK');
} catch(e) { fail('standards table has standard_id PK, product_id FK with CASCADE, org_id, content TEXT, visibility CHECK', e); }

// T4 — journeys.product_id FK column present
try {
  const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
  assert(/ADD COLUMN IF NOT EXISTS.*product_id.*UUID/i.test(src) || /ADD COLUMN.*product_id/i.test(src), 'journeys.product_id ADD COLUMN missing');
  assert(/REFERENCES products.*product_id/i.test(src) || /product_id.*REFERENCES products/i.test(src), 'journeys.product_id FK reference missing');
  assert(/ON DELETE SET NULL/i.test(src), 'ON DELETE SET NULL missing on journeys.product_id');
  pass('journeys table has ADD COLUMN IF NOT EXISTS product_id UUID FK with ON DELETE SET NULL');
} catch(e) { fail('journeys table has ADD COLUMN IF NOT EXISTS product_id UUID FK with ON DELETE SET NULL', e); }

// T5 — migration inside DATABASE_URL block
try {
  const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
  const dbIdx = src.indexOf("process.env.DATABASE_URL");
  const productsMigIdx = src.indexOf('CREATE TABLE IF NOT EXISTS products');
  const standardsMigIdx = src.indexOf('CREATE TABLE IF NOT EXISTS standards');
  assert(dbIdx !== -1, 'DATABASE_URL block not found');
  assert(productsMigIdx > dbIdx, 'products migration must be inside DATABASE_URL block');
  assert(standardsMigIdx > dbIdx, 'standards migration must be inside DATABASE_URL block');
  pass('migrations are inside the existing DATABASE_URL conditional block');
} catch(e) { fail('migrations are inside the existing DATABASE_URL conditional block', e); }

// T6 — visibility default is 'product'
try {
  const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
  const idx = src.indexOf('CREATE TABLE IF NOT EXISTS standards');
  const block = src.slice(idx, idx + 900);
  assert(/DEFAULT\s+'product'/i.test(block) || /DEFAULT 'product'/i.test(block), "visibility DEFAULT 'product' missing");
  pass("standards.visibility DEFAULT 'product'");
} catch(e) { fail("standards.visibility DEFAULT 'product'", e); }

// T7 — products uses gen_random_uuid() for product_id default
try {
  const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
  const idx = src.indexOf('CREATE TABLE IF NOT EXISTS products');
  const block = src.slice(idx, idx + 500);
  assert(/gen_random_uuid/i.test(block) || /DEFAULT gen_random_uuid/i.test(block), 'gen_random_uuid() default missing on product_id');
  pass('products.product_id uses gen_random_uuid() as default');
} catch(e) { fail('products.product_id uses gen_random_uuid() as default', e); }

// T8 — pipeline-state psh-s1 is in inner loop (stage updated)
try {
  const story = getStory('psh-s1');
  assert(story, 'psh-s1 not found in pipeline-state');
  const innerStages = ['subagent-execution', 'implementation-plan', 'branch-setup', 'branch-complete', 'verify-completion', 'definition-of-done'];
  assert(innerStages.includes(story.stage), `psh-s1 stage is '${story.stage}', expected inner loop stage`);
  pass('psh-s1 pipeline-state stage is in inner loop');
} catch(e) { fail('psh-s1 pipeline-state stage is in inner loop', e); }

console.log(`\n[psh-s1] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
