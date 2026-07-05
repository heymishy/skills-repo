# Implementation Plan — psh-s5: Product context injection into skill sessions

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s5.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s5-dor.md
**Test file:** `tests/check-psh-s5-context-injection.js`
**Model class:** deep-reasoning (D37 + buildSystemPrompt extension + concurrent safety)
**Upstream dependency:** psh-s1, psh-s4.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/product-context-adapter.js` | Create | D37 injectable adapter for product context DB lookup |
| `src/web-ui/routes/skills.js` | Modify | Extend `buildSystemPrompt` to inject product context sections |
| `src/web-ui/server.js` | Modify | D37 wiring: call `setProductContextAdapter` with real Postgres fn |
| `tests/check-psh-s5-context-injection.js` | Create | 7 unit + 2 NFR tests |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s5-context-injection.js`

```js
'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// T5 — D37 stub throws (fresh module)
try {
  delete require.cache[require.resolve('../src/web-ui/product-context-adapter')];
  const { getProductContext } = require('../src/web-ui/product-context-adapter');
  let threw = false;
  try { getProductContext('any-id'); } catch(e) {
    threw = (e.message === 'Adapter not wired: productContext. Call setProductContextAdapter() before use.');
  }
  assert(threw, 'D37 stub did not throw with exact message');
  pass('getProductContext throws adapter-not-wired error when setProductContextAdapter not called');
} catch(e) { fail('getProductContext throws adapter-not-wired error when setProductContextAdapter not called', e); }

// Helper: build a test-friendly version of buildSystemPrompt that accepts productId
// The real buildSystemPrompt is in routes/skills.js — we test its exported wrapper
function getBuildSystemPrompt() {
  delete require.cache[require.resolve('../src/web-ui/routes/skills')];
  return require('../src/web-ui/routes/skills').buildSystemPromptWithProductContext;
}

(async function() {
  try {
    const { setProductContextAdapter } = require('../src/web-ui/product-context-adapter');

    // T1 — 5 sections injected before SKILL.md content
    try {
      setProductContextAdapter(async function(productId) {
        return { mission: 'M', techStack: 'T', constraints: 'C', roadmap: 'R', architectureGuardrails: 'AG' };
      });
      const bsp = getBuildSystemPrompt();
      const result = await bsp({ productId: 'prod-1', skillContent: '# SKILL CONTENT' });
      assert(result.includes('## Product Context — Mission'), 'Missing Mission section');
      assert(result.includes('## Product Context — Tech Stack'), 'Missing Tech Stack section');
      assert(result.includes('## Product Context — Constraints'), 'Missing Constraints section');
      assert(result.includes('## Product Context — Roadmap'), 'Missing Roadmap section');
      assert(result.includes('## Product Context — Architecture Guardrails'), 'Missing Architecture Guardrails section');
      const skillIdx = result.indexOf('# SKILL CONTENT');
      const missionIdx = result.indexOf('## Product Context — Mission');
      assert(missionIdx < skillIdx, `Mission section (${missionIdx}) must appear before SKILL CONTENT (${skillIdx})`);
      pass('buildSystemPrompt includes 5 product context sections before SKILL.md content');
    } catch(e) { fail('buildSystemPrompt includes 5 product context sections before SKILL.md content', e); }

    // T2 — correct order
    try {
      const bsp = getBuildSystemPrompt();
      const result = await bsp({ productId: 'prod-1', skillContent: '# SKILL' });
      const idxMission = result.indexOf('## Product Context — Mission');
      const idxTech = result.indexOf('## Product Context — Tech Stack');
      const idxConst = result.indexOf('## Product Context — Constraints');
      const idxRoad = result.indexOf('## Product Context — Roadmap');
      const idxArch = result.indexOf('## Product Context — Architecture Guardrails');
      assert(idxMission < idxTech && idxTech < idxConst && idxConst < idxRoad && idxRoad < idxArch, 'Sections not in correct order');
      pass('product context sections appear in correct order: Mission, Tech Stack, Constraints, Roadmap, Architecture Guardrails');
    } catch(e) { fail('product context sections appear in correct order: Mission, Tech Stack, Constraints, Roadmap, Architecture Guardrails', e); }

    // T3 — content from adapter only, not session
    try {
      setProductContextAdapter(async function() {
        return { mission: 'correct-mission', techStack: '', constraints: '', roadmap: '', architectureGuardrails: '' };
      });
      const bsp = getBuildSystemPrompt();
      const result = await bsp({ productId: 'prod-1', session: { artefactContent: 'wrong-content', productContext: 'also-wrong' }, skillContent: '' });
      assert(result.includes('correct-mission'), 'correct-mission not in prompt');
      assert(!result.includes('wrong-content'), 'wrong-content leaked into prompt');
      pass('product context comes from adapter return value, not from session object');
    } catch(e) { fail('product context comes from adapter return value, not from session object', e); }

    // T4 — null productId: no injection, no error
    try {
      const spyCalls = [];
      setProductContextAdapter(async function(pid) { spyCalls.push(pid); return {}; });
      const bsp = getBuildSystemPrompt();
      const result = await bsp({ productId: null, skillContent: '# SKILL' });
      assert(result.includes('# SKILL'), 'SKILL content missing');
      assert(!result.includes('## Product Context'), 'Product context injected for null productId');
      assert(spyCalls.length === 0, 'Adapter called for null productId');
      pass('buildSystemPrompt with null product_id proceeds without product context sections');
    } catch(e) { fail('buildSystemPrompt with null product_id proceeds without product context sections', e); }

    // T6 — D37 production wiring in server.js
    try {
      const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
      assert(src.includes('setProductContextAdapter'), 'setProductContextAdapter not found in server.js');
      pass('server.js wires setProductContextAdapter before HTTP server starts');
    } catch(e) { fail('server.js wires setProductContextAdapter before HTTP server starts', e); }

    // T7 — concurrent session safety
    try {
      const bsp = getBuildSystemPrompt();
      setProductContextAdapter(async function(productId) {
        return {
          mission: 'Mission ' + productId,
          techStack: '', constraints: '', roadmap: '', architectureGuardrails: ''
        };
      });
      const [rA, rB] = await Promise.all([
        bsp({ productId: 'prod-A', skillContent: '' }),
        bsp({ productId: 'prod-B', skillContent: '' })
      ]);
      assert(rA.includes('Mission prod-A') && !rA.includes('Mission prod-B'), 'prod-A got wrong context');
      assert(rB.includes('Mission prod-B') && !rB.includes('Mission prod-A'), 'prod-B got wrong context');
      pass('two concurrent buildSystemPrompt calls with different productIds receive correct respective contexts');
    } catch(e) { fail('two concurrent buildSystemPrompt calls with different productIds receive correct respective contexts', e); }

    // T-NFR1 ��� adapter called exactly once
    try {
      const calls = [];
      setProductContextAdapter(async function(pid) { calls.push(pid); return { mission:'m', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
      const bsp = getBuildSystemPrompt();
      await bsp({ productId: 'prod-1', skillContent: '' });
      assert(calls.length === 1, `Adapter called ${calls.length} times (expected 1)`);
      pass('getProductContext invoked exactly once per buildSystemPrompt call');
    } catch(e) { fail('getProductContext invoked exactly once per buildSystemPrompt call', e); }

    // T-NFR2 — DB error propagates
    try {
      setProductContextAdapter(async function() { throw new Error('DB connection lost'); });
      const bsp = getBuildSystemPrompt();
      let threw = false;
      try { await bsp({ productId: 'prod-1', skillContent: '' }); } catch(e) {
        threw = (e.message === 'DB connection lost');
      }
      assert(threw, 'DB error not propagated');
      pass('buildSystemPrompt propagates DB error — does not silently return empty context');
    } catch(e) { fail('buildSystemPrompt propagates DB error — does not silently return empty context', e); }

  } catch(e) { fail('setup error', e); }

  console.log(`\n[psh-s5] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
```

**Run:** `node tests/check-psh-s5-context-injection.js`
**Expected (RED):** Cannot find module `../src/web-ui/product-context-adapter`

---

## Task 2 — Create D37 adapter (GREEN — partial)

**File:** `src/web-ui/product-context-adapter.js`

```js
'use strict';

var _fn = function() {
  throw new Error('Adapter not wired: productContext. Call setProductContextAdapter() before use.');
};

async function getProductContext(productId) {
  return _fn(productId);
}

function setProductContextAdapter(fn) {
  _fn = fn;
}

module.exports = { getProductContext, setProductContextAdapter };
```

---

## Task 3 — Add buildSystemPromptWithProductContext export to skills.js (GREEN)

**File:** `src/web-ui/routes/skills.js`

Add after `buildSystemPrompt` function definition (around line 1820):

```js
var _productContextAdapter = require('../product-context-adapter');

/**
 * Wrapper around buildSystemPrompt that injects product context sections from DB.
 * Used by psh-s5 injection flow and tested in isolation.
 * @param {object} opts - { productId, skillContent, session }
 * @returns {Promise<string>}
 */
async function buildSystemPromptWithProductContext(opts) {
  var productId = opts && opts.productId;
  var skillContent = opts && opts.skillContent || '';
  var parts = [];

  // Inject product context sections from DB (before SKILL.md content)
  if (productId) {
    var ctx = await _productContextAdapter.getProductContext(productId);
    if (ctx) {
      if (ctx.mission)               parts.push('## Product Context — Mission\n\n' + ctx.mission);
      if (ctx.techStack)             parts.push('## Product Context — Tech Stack\n\n' + ctx.techStack);
      if (ctx.constraints)           parts.push('## Product Context — Constraints\n\n' + ctx.constraints);
      if (ctx.roadmap)               parts.push('## Product Context — Roadmap\n\n' + ctx.roadmap);
      if (ctx.architectureGuardrails) parts.push('## Product Context — Architecture Guardrails\n\n' + ctx.architectureGuardrails);
    }
  }

  // SKILL.md content
  if (skillContent) parts.push(skillContent);

  return parts.join('\n\n');
}

module.exports.buildSystemPromptWithProductContext = buildSystemPromptWithProductContext;
```

Also integrate into the main `buildSystemPrompt` call when `sessionContext.productId` is set (extends the existing flow).

---

## Task 4 — D37 wiring in server.js (separate task)

**File:** `src/web-ui/server.js` — add inside `if (process.env.DATABASE_URL)` block:

```js
    // psh-s5 — D37 mandatory separate wiring: wire real Postgres product context adapter
    {
      const { Pool: _PshPool } = require('pg');
      const _psh5Pool = new _PshPool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      const { setProductContextAdapter } = require('./product-context-adapter');
      setProductContextAdapter(async function(productId) {
        const r = await _psh5Pool.query(
          'SELECT name, description, mission, roadmap, tech_stack, constraints, architecture_guardrails FROM products WHERE product_id = $1',
          [productId]
        );
        if (!r.rows.length) return null;
        const row = r.rows[0];
        return {
          mission: row.mission || row.description || '',
          techStack: row.tech_stack || '',
          constraints: row.constraints || '',
          roadmap: row.roadmap || '',
          architectureGuardrails: row.architecture_guardrails || ''
        };
      });
      console.log('[psh-s5] product context adapter wired');
    }
```

**Run:** `node tests/check-psh-s5-context-injection.js`
**Expected (GREEN):** `[psh-s5] Results: 9 passed, 0 failed`

---

## Task 5 — Commit

```
feat(psh-s5): product context injection into skill sessions via injectable adapter
```
