# Implementation Plan — psh-s10: Standards injection into skill sessions

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s10.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s10-dor.md
**Test file:** `tests/check-psh-s10-standards-injection.js`
**Model class:** deep-reasoning (D37 + buildSystemPromptWithProductContext extension + active-standards SQL)
**Upstream dependency:** psh-s1, psh-s5, psh-s8, psh-s9.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/standards-adapter.js` | Create | D37 injectable adapter for active-standards DB lookup |
| `src/web-ui/routes/skills.js` | Modify | Extend `buildSystemPromptWithProductContext` to inject `## Standards and Patterns` section |
| `src/web-ui/server.js` | Modify | D37 wiring: call `setStandardsAdapter` with real Postgres fn |
| `tests/check-psh-s10-standards-injection.js` | Create | 6 unit + 2 NFR tests |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s10-standards-injection.js`

```js
'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// T1 — D37 stub throws on first call (before wiring)
try {
  delete require.cache[require.resolve('../src/web-ui/standards-adapter')];
  const { getActiveStandards } = require('../src/web-ui/standards-adapter');
  let threw = false;
  try { getActiveStandards('any-id', 'any-org'); } catch(e) {
    threw = (e.message === 'Adapter not wired: standards. Call setStandardsAdapter() before use.');
  }
  assert(threw, 'D37 stub did not throw with exact message');
  pass('getActiveStandards throws adapter-not-wired error before setStandardsAdapter called');
} catch(e) { fail('getActiveStandards throws adapter-not-wired error before setStandardsAdapter called', e); }

function getPromptBuilder() {
  delete require.cache[require.resolve('../src/web-ui/standards-adapter')];
  delete require.cache[require.resolve('../src/web-ui/routes/skills')];
  return {
    buildSystemPromptWithProductContext: require('../src/web-ui/routes/skills').buildSystemPromptWithProductContext,
    setStandardsAdapter: require('../src/web-ui/standards-adapter').setStandardsAdapter,
    setProductContextAdapter: require('../src/web-ui/product-context-adapter').setProductContextAdapter
  };
}

(async function() {
  // T2 — standards section injected after product context and before empty skill content
  try {
    const { buildSystemPromptWithProductContext, setStandardsAdapter, setProductContextAdapter } = getPromptBuilder();
    setProductContextAdapter(async function() {
      return { mission: 'M', techStack: '', constraints: '', roadmap: '', architectureGuardrails: '' };
    });
    setStandardsAdapter(async function(productId, orgId) {
      return [
        { name: 'Use camelCase', content: 'All variables must use camelCase.' },
        { name: 'No console.log in production', content: 'Use structured logger.' }
      ];
    });
    const result = await buildSystemPromptWithProductContext({ productId: 'prod-1', orgId: 'org-1', skillContent: '# SKILL' });
    assert(result.includes('## Standards and Patterns'), 'Standards section missing');
    const stdIdx = result.indexOf('## Standards and Patterns');
    const skillIdx = result.indexOf('# SKILL');
    const missionIdx = result.indexOf('## Product Context — Mission');
    assert(missionIdx < stdIdx, 'Standards section must appear after product context sections');
    assert(stdIdx < skillIdx, `Standards section (${stdIdx}) must appear before SKILL content (${skillIdx})`);
    assert(result.includes('Use camelCase'), 'Standard name not in output');
    assert(result.includes('All variables must use camelCase'), 'Standard content not in output');
    pass('standards section injected between product context sections and SKILL.md content');
  } catch(e) { fail('standards section injected between product context sections and SKILL.md content', e); }

  // T3 — empty standards list: no section written
  try {
    const { buildSystemPromptWithProductContext, setStandardsAdapter, setProductContextAdapter } = getPromptBuilder();
    setProductContextAdapter(async function() { return { mission: 'M', techStack: '', constraints: '', roadmap: '', architectureGuardrails: '' }; });
    setStandardsAdapter(async function() { return []; });
    const result = await buildSystemPromptWithProductContext({ productId: 'prod-1', orgId: 'org-1', skillContent: '# SKILL' });
    assert(!result.includes('## Standards and Patterns'), 'Standards section written for empty list');
    pass('empty standards list: ## Standards and Patterns section not written');
  } catch(e) { fail('empty standards list: ## Standards and Patterns section not written', e); }

  // T4 — null productId: adapter not called, no section
  try {
    const { buildSystemPromptWithProductContext, setStandardsAdapter, setProductContextAdapter } = getPromptBuilder();
    setProductContextAdapter(async function() { return {}; });
    const calls = [];
    setStandardsAdapter(async function(pid, org) { calls.push({ pid, org }); return []; });
    const result = await buildSystemPromptWithProductContext({ productId: null, orgId: null, skillContent: '# SKILL' });
    assert(calls.length === 0, `Adapter called ${calls.length} times for null productId`);
    assert(!result.includes('## Standards and Patterns'), 'Standards section written for null productId');
    pass('null productId: standards adapter not called, no section written');
  } catch(e) { fail('null productId: standards adapter not called, no section written', e); }

  // T5 — D37 production wiring in server.js
  try {
    const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
    assert(src.includes('setStandardsAdapter'), 'setStandardsAdapter not found in server.js');
    pass('server.js wires setStandardsAdapter before HTTP server starts');
  } catch(e) { fail('server.js wires setStandardsAdapter before HTTP server starts', e); }

  // T6 — adapter error propagates (not silently swallowed)
  try {
    const { buildSystemPromptWithProductContext, setStandardsAdapter, setProductContextAdapter } = getPromptBuilder();
    setProductContextAdapter(async function() { return { mission: 'M', techStack: '', constraints: '', roadmap: '', architectureGuardrails: '' }; });
    setStandardsAdapter(async function() { throw new Error('Standards DB offline'); });
    let threw = false;
    try { await buildSystemPromptWithProductContext({ productId: 'prod-1', orgId: 'org-1', skillContent: '' }); }
    catch(e) { threw = (e.message === 'Standards DB offline'); }
    assert(threw, 'Standards adapter error not propagated');
    pass('standards adapter DB error propagates — not silently swallowed');
  } catch(e) { fail('standards adapter DB error propagates — not silently swallowed', e); }

  // T-NFR1 — adapter called with correct productId and orgId
  try {
    const { buildSystemPromptWithProductContext, setStandardsAdapter, setProductContextAdapter } = getPromptBuilder();
    setProductContextAdapter(async function() { return { mission: '', techStack: '', constraints: '', roadmap: '', architectureGuardrails: '' }; });
    const calls = [];
    setStandardsAdapter(async function(productId, orgId) { calls.push({ productId, orgId }); return []; });
    await buildSystemPromptWithProductContext({ productId: 'prod-X', orgId: 'org-Y', skillContent: '' });
    assert(calls.length === 1, `Expected adapter called once, got ${calls.length}`);
    assert(calls[0].productId === 'prod-X', `productId not passed: ${calls[0].productId}`);
    assert(calls[0].orgId === 'org-Y', `orgId not passed: ${calls[0].orgId}`);
    pass('standards adapter called with correct productId and orgId');
  } catch(e) { fail('standards adapter called with correct productId and orgId', e); }

  // T-NFR2 — concurrent calls get correct respective standards
  try {
    const { buildSystemPromptWithProductContext, setStandardsAdapter, setProductContextAdapter } = getPromptBuilder();
    setProductContextAdapter(async function() { return { mission: '', techStack: '', constraints: '', roadmap: '', architectureGuardrails: '' }; });
    setStandardsAdapter(async function(productId, orgId) {
      return [{ name: 'Std for ' + productId, content: 'content-' + productId }];
    });
    const [rA, rB] = await Promise.all([
      buildSystemPromptWithProductContext({ productId: 'prod-A', orgId: 'org', skillContent: '' }),
      buildSystemPromptWithProductContext({ productId: 'prod-B', orgId: 'org', skillContent: '' })
    ]);
    assert(rA.includes('Std for prod-A'), 'prod-A got wrong standards');
    assert(!rA.includes('Std for prod-B'), 'prod-B standards leaked into prod-A');
    assert(rB.includes('Std for prod-B'), 'prod-B got wrong standards');
    pass('concurrent calls with different productIds receive correct respective standards');
  } catch(e) { fail('concurrent calls with different productIds receive correct respective standards', e); }

  console.log(`\n[psh-s10] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
```

**Run:** `node tests/check-psh-s10-standards-injection.js`
**Expected (RED):** Cannot find module `../src/web-ui/standards-adapter`

---

## Task 2 — Create D37 standards adapter (GREEN — partial)

**File:** `src/web-ui/standards-adapter.js`

```js
'use strict';

var _fn = function() {
  throw new Error('Adapter not wired: standards. Call setStandardsAdapter() before use.');
};

async function getActiveStandards(productId, orgId) {
  return _fn(productId, orgId);
}

function setStandardsAdapter(fn) {
  _fn = fn;
}

module.exports = { getActiveStandards, setStandardsAdapter };
```

---

## Task 3 — Extend buildSystemPromptWithProductContext in skills.js (GREEN)

**File:** `src/web-ui/routes/skills.js` — modify `buildSystemPromptWithProductContext`:

```js
var _standardsAdapter = require('../standards-adapter');

async function buildSystemPromptWithProductContext(opts) {
  var productId = opts && opts.productId;
  var orgId = opts && opts.orgId;
  var skillContent = (opts && opts.skillContent) || '';
  var parts = [];

  // 1. Product context sections from DB
  if (productId) {
    var ctx = await _productContextAdapter.getProductContext(productId);
    if (ctx) {
      if (ctx.mission)               parts.push('## Product Context — Mission\n\n' + ctx.mission);
      if (ctx.techStack)             parts.push('## Product Context — Tech Stack\n\n' + ctx.techStack);
      if (ctx.constraints)           parts.push('## Product Context — Constraints\n\n' + ctx.constraints);
      if (ctx.roadmap)               parts.push('## Product Context — Roadmap\n\n' + ctx.roadmap);
      if (ctx.architectureGuardrails) parts.push('## Product Context — Architecture Guardrails\n\n' + ctx.architectureGuardrails);
    }

    // 2. Active standards section (product-level + opted-in org standards)
    var standards = await _standardsAdapter.getActiveStandards(productId, orgId);
    if (standards && standards.length > 0) {
      var stdLines = standards.map(function(s) {
        return '### ' + s.name + '\n\n' + s.content;
      });
      parts.push('## Standards and Patterns\n\n' + stdLines.join('\n\n'));
    }
  }

  // 3. SKILL.md content
  if (skillContent) parts.push(skillContent);

  return parts.join('\n\n');
}

module.exports.buildSystemPromptWithProductContext = buildSystemPromptWithProductContext;
```

**Note:** The `_productContextAdapter` require is already established in psh-s5.

---

## Task 4 — D37 wiring in server.js (separate task)

**File:** `src/web-ui/server.js` — inside `if (process.env.DATABASE_URL)` wiring block:

```js
    // psh-s10 — D37 mandatory separate wiring: wire real Postgres standards adapter
    {
      const { Pool: _Psh10Pool } = require('pg');
      const _psh10Pool = new _Psh10Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      const { setStandardsAdapter } = require('./standards-adapter');
      setStandardsAdapter(async function(productId, orgId) {
        const r = await _psh10Pool.query(
          `SELECT name, content FROM standards
           WHERE (product_id = $1 OR (visibility = 'org' AND org_id = $2))
             AND standard_id NOT IN (
               SELECT standard_id FROM standard_product_optouts WHERE product_id = $1
             )
           ORDER BY created_at ASC`,
          [productId, orgId]
        );
        return r.rows;
      });
      console.log('[psh-s10] standards adapter wired');
    }
```

**Run:** `node tests/check-psh-s10-standards-injection.js`
**Expected (GREEN):** `[psh-s10] Results: 8 passed, 0 failed`

---

## Task 5 — Commit

```
feat(psh-s10): standards injection into skill sessions via D37 injectable adapter
```
