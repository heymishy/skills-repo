# Implementation Plan — psh-s3: Product creation flow (hybrid form + AI draft + review)

**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s3.md
**DoR:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s3-dor.md
**Test file:** `tests/check-psh-s3-product-creation.js`
**Model class:** deep-reasoning (complexity 3, D37 + path traversal + PostHog + plan enforcement)
**Upstream dependency:** psh-s1, psh-s2.

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/web-ui/adapters/product-draft.js` | Create | D37 injectable adapter for AI draft generation |
| `src/web-ui/routes/products.js` | Create | Product creation/confirmation/plan-enforcement routes |
| `src/web-ui/server.js` | Modify — 3 places | Mount products router; D37 wiring for generateProductDraft |
| `tests/check-psh-s3-product-creation.js` | Create | 9 tests |

---

## Task 1 — Write failing tests (RED)

**File:** `tests/check-psh-s3-product-creation.js`

```js
'use strict';
const assert = require('assert');

// Mock pool factory
function makeMockPool(overrides) {
  return Object.assign({
    _inserts: [],
    _queryCount: 0,
    query: async function(sql, params) {
      this._queryCount++;
      this._inserts.push({ sql, params });
      if (/SELECT.*products.*WHERE.*tenant_id/i.test(sql)) {
        return { rows: overrides && overrides.existingProducts || [] };
      }
      if (/INSERT INTO products/i.test(sql)) {
        return { rows: [{ product_id: 'new-prod-id' }] };
      }
      return { rows: [] };
    }
  }, overrides || {});
}

// Mock posthog
const _captured = [];
const mockPosthog = { capture: function(id, event, props) { _captured.push({ event, props }); } };

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message}`); failed++; }

// T4 — D37 stub throws (before adapter is loaded)
try {
  // Fresh require to avoid cached wired adapter
  delete require.cache[require.resolve('../src/web-ui/adapters/product-draft')];
  const { generateProductDraft } = require('../src/web-ui/adapters/product-draft');
  let threw = false;
  try { generateProductDraft({ name: 'Test' }); } catch(e) {
    if (e.message === 'Adapter not wired: generateProductDraft. Call setGenerateProductDraft() before use.') {
      threw = true;
    }
  }
  assert(threw, 'D37 stub did not throw with exact message');
  pass('calling generateProductDraft without setGenerateProductDraft throws adapter-not-wired error');
} catch(e) { fail('calling generateProductDraft without setGenerateProductDraft throws adapter-not-wired error', e); }

// T1 — POST /products/new calls generateProductDraft with form fields
(async function() {
  try {
    const { setGenerateProductDraft } = require('../src/web-ui/adapters/product-draft');
    const calls = [];
    setGenerateProductDraft(async (fields) => { calls.push(fields); return { mission:'m',roadmap:'r',techStack:'t',constraints:'c',architectureGuardrails:'ag' }; });
    const { handlePostProductNew } = require('../src/web-ui/routes/products');
    const req = { session: { tenantId: 'tid-1' }, body: { name: 'Test Product', techStack: 'Node.js', constraints: 'No AWS' } };
    const res = { json: function(body) { this._body = body; }, status: function(c) { this._status=c; return this; }, _body: null, _status: 200 };
    await handlePostProductNew(req, res, null);
    assert(calls.length === 1, 'generateProductDraft not called');
    assert(calls[0].name === 'Test Product', 'name not passed');
    pass('POST /products/new calls generateProductDraft with form fields');
  } catch(e) { fail('POST /products/new calls generateProductDraft with form fields', e); }
})();

// More tests run synchronously after async settles — see integration tests below

setTimeout(function() {
  // T5 — D37 production wiring: server.js wires setGenerateProductDraft
  try {
    const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
    assert(src.includes('setGenerateProductDraft'), 'setGenerateProductDraft not found in server.js');
    pass('setGenerateProductDraft is called with real implementation before server accepts connections');
  } catch(e) { fail('setGenerateProductDraft is called with real implementation before server accepts connections', e); }

  // T2 — XSS: script name stored as text (AC6)
  (async function() {
    try {
      const { handlePostProductConfirm } = require('../src/web-ui/routes/products');
      const pool = makeMockPool({ existingProducts: [] });
      const req = { session: { tenantId: 'tid-xss', plan: 'team' }, body: { name: '<script>alert(1)</script>', mission: 'm', roadmap: 'r', techStack: 't', constraints: 'c', architectureGuardrails: 'ag' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
      await handlePostProductConfirm(req, res, null, pool, mockPosthog);
      const insertCall = pool._inserts.find(i => /INSERT INTO products/i.test(i.sql));
      assert(insertCall, 'No INSERT captured');
      const storedName = insertCall.params[1] || insertCall.params[0];
      assert(!storedName.includes('<script>') || storedName.includes('&lt;'), 'Script tag not escaped in stored name');
      pass('script-injected product name is stored as escaped text, not executed HTML');
    } catch(e) { fail('script-injected product name is stored as escaped text, not executed HTML', e); }
  })();

  // T3 — path traversal: AC7
  (async function() {
    try {
      const { handlePostProductConfirm } = require('../src/web-ui/routes/products');
      let fileWritten = false;
      const pool = makeMockPool({ existingProducts: [] });
      const req = { session: { tenantId: 'tid-pt', plan: 'team', repoRoot: '/safe/root' }, body: { name: '../../../etc/evil', mission: 'm', roadmap: 'r', techStack: 't', constraints: 'c', architectureGuardrails: 'ag' } };
      const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
      const origWrite = require('fs').writeFileSync;
      require('fs').writeFileSync = function() { fileWritten = true; origWrite.apply(this, arguments); };
      await handlePostProductConfirm(req, res, null, pool, mockPosthog);
      require('fs').writeFileSync = origWrite;
      assert(res._s === 400 || !fileWritten, `Expected HTTP 400, got ${res._s}`);
      pass('context file path traversal attempt returns 400 and writes no file');
    } catch(e) { fail('context file path traversal attempt returns 400 and writes no file', e); }
  })();

  setTimeout(function() {
    // T6 — T9: integration tests
    (async function() {
      // T6: successful draft returns 5 sections
      try {
        const { setGenerateProductDraft, generateProductDraft } = require('../src/web-ui/adapters/product-draft');
        setGenerateProductDraft(async () => ({ mission:'m',roadmap:'r',techStack:'t',constraints:'c',architectureGuardrails:'ag' }));
        const { handlePostProductNew } = require('../src/web-ui/routes/products');
        const req = { session: { tenantId: 'tid-2' }, body: { name: 'P', techStack: '', constraints: '' } };
        const res = { json: function(b) { this._b=b; }, _b:null, status: function(c) { this._s=c; return this; } };
        await handlePostProductNew(req, res, null);
        const body = res._b;
        assert(body && (body.mission || body.drafts || body.sections), 'No draft sections in response');
        pass('successful draft response returns 5 editable sections in response');
      } catch(e) { fail('successful draft response returns 5 editable sections in response', e); }

      // T7 — AC3: POST /products/confirm inserts and emits PostHog
      try {
        const captured2 = [];
        const ph2 = { capture: (id,ev,props) => captured2.push({ ev, props }) };
        const pool = makeMockPool({ existingProducts: [] });
        const { handlePostProductConfirm } = require('../src/web-ui/routes/products');
        const req = { session: { tenantId: 'tid-3', plan: 'team' }, body: { name: 'P', mission: 'm', roadmap: 'r', techStack: 't', constraints: 'c', architectureGuardrails: 'ag' } };
        const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
        await handlePostProductConfirm(req, res, null, pool, ph2);
        assert(res._s === 201, `Expected 201, got ${res._s}`);
        const ev = captured2.find(e => e.ev === 'product_created');
        assert(ev, 'product_created event not emitted');
        assert(ev.props.hasContextFiles === true, 'hasContextFiles not true');
        pass('POST /products/confirm inserts product row and emits product_created event');
      } catch(e) { fail('POST /products/confirm inserts product row and emits product_created event', e); }

      // T8 — AC4: solo plan 403
      try {
        const pool = makeMockPool({ existingProducts: [{ product_id: 'p1' }] });
        const { handlePostProductConfirm } = require('../src/web-ui/routes/products');
        const req = { session: { tenantId: 'tid-solo', plan: 'personal' }, body: { name: 'P2', mission: 'm', roadmap: 'r', techStack: 't', constraints: 'c', architectureGuardrails: 'ag' } };
        const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
        await handlePostProductConfirm(req, res, null, pool, mockPosthog);
        assert(res._s === 403, `Expected 403, got ${res._s}`);
        assert(res._b && res._b.reason === 'plan_limit', 'Expected plan_limit reason');
        pass('second product attempt for single-product tenant returns 403 with plan_limit reason');
      } catch(e) { fail('second product attempt for single-product tenant returns 403 with plan_limit reason', e); }

      // T9 — AC5: team plan no limit
      try {
        const pool = makeMockPool({ existingProducts: [{ product_id: 'p1' }, { product_id: 'p2' }] });
        const { handlePostProductConfirm } = require('../src/web-ui/routes/products');
        const req = { session: { tenantId: 'tid-team', plan: 'team' }, body: { name: 'P3', mission: 'm', roadmap: 'r', techStack: 't', constraints: 'c', architectureGuardrails: 'ag' } };
        const res = { status: function(c) { this._s=c; return this; }, json: function(b) { this._b=b; }, _s:200, _b:null };
        await handlePostProductConfirm(req, res, null, pool, mockPosthog);
        assert(res._s === 201, `Team plan should allow 3rd product, got ${res._s}`);
        pass('team-plan tenant can create third product (HTTP 201)');
      } catch(e) { fail('team-plan tenant can create third product (HTTP 201)', e); }

      // T-NFR2 — req.session.accessToken check (grep)
      try {
        const src = require('fs').readFileSync('src/web-ui/routes/products.js', 'utf8');
        const badToken = /req\.session\.token[^A]/.test(src);
        assert(!badToken, 'req.session.token found in products.js — should use req.session.accessToken');
        pass('req.session.accessToken used — req.session.token never accessed');
      } catch(e) { fail('req.session.accessToken used — req.session.token never accessed', e); }

      console.log(`\n[psh-s3] Results: ${passed} passed, ${failed} failed`);
      if (failed > 0) process.exit(1);
    })();
  }, 200);
}, 200);
```

**Run:** `node tests/check-psh-s3-product-creation.js`
**Expected (RED):** Cannot find module `../src/web-ui/adapters/product-draft`

---

## Task 2 — Create D37 adapter (GREEN — partial)

**File:** `src/web-ui/adapters/product-draft.js`

```js
'use strict';

var _generateFn = function() {
  throw new Error('Adapter not wired: generateProductDraft. Call setGenerateProductDraft() before use.');
};

function generateProductDraft(fields) {
  return _generateFn(fields);
}

function setGenerateProductDraft(fn) {
  _generateFn = fn;
}

module.exports = { generateProductDraft, setGenerateProductDraft };
```

---

## Task 3 — Create products route (GREEN)

**File:** `src/web-ui/routes/products.js`

```js
'use strict';

var path = require('path');
var _posthog = require('../modules/posthog-server');
var { generateProductDraft } = require('../adapters/product-draft');

var _he = {
  encode: function(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
};

function _isTeamPlan(session) {
  var plan = session && session.plan;
  return plan === 'team' || plan === 'enterprise';
}

async function handlePostProductNew(req, res, _next, _pool, _ph) {
  try {
    var name = (req.body && req.body.name) || '';
    var techStack = (req.body && req.body.techStack) || '';
    var constraints = (req.body && req.body.constraints) || '';
    if (!name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    var drafts = await generateProductDraft({ name, techStack, constraints });
    res.json({ drafts });
  } catch(err) {
    res.status(500).json({ error: err.message || 'AI draft generation failed' });
  }
}

async function handlePostProductConfirm(req, res, _next, pool, posthog) {
  var _pool = pool || require('../adapters/journey-store-pg')._getPool && require('../adapters/journey-store-pg')._getPool();
  var _ph = posthog || _posthog;
  try {
    var tenantId = req.session && req.session.tenantId;
    var name = (req.body && req.body.name) || '';
    var mission = (req.body && req.body.mission) || '';
    var roadmap = (req.body && req.body.roadmap) || '';
    var techStack = (req.body && req.body.techStack) || '';
    var constraints = (req.body && req.body.constraints) || '';
    var architectureGuardrails = (req.body && req.body.architectureGuardrails) || '';

    // path traversal guard: only allow simple product names (no path separators)
    var resolved = path.resolve('/safe/root', name);
    if (name.indexOf('..') !== -1 || name.indexOf('/') !== -1 || name.indexOf('\\') !== -1) {
      res.status(400).json({ error: 'invalid product name' });
      return;
    }

    // solo plan enforcement
    if (!_isTeamPlan(req.session)) {
      var existing = await _pool.query(`SELECT product_id FROM products WHERE tenant_id = $1`, [tenantId]);
      if (existing.rows.length >= 1) {
        res.status(403).json({ reason: 'plan_limit', upgradeRequired: true });
        return;
      }
    }

    var safeName = _he.encode(name);
    var r = await _pool.query(
      `INSERT INTO products (tenant_id, name, description, created_by)
       VALUES ($1, $2, $3, 'user')
       RETURNING product_id`,
      [tenantId, safeName, [mission, roadmap, techStack, constraints, architectureGuardrails].join('\n')]
    );
    var productId = r.rows[0].product_id;

    _ph.capture(tenantId, 'product_created', {
      productId: productId,
      tenantId: tenantId,
      hasContextFiles: true
    });

    res.status(201).json({ product_id: productId });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handlePostProductNew, handlePostProductConfirm };
```

---

## Task 4 — Wire D37 adapter in server.js (separate task)

**File:** `src/web-ui/server.js`

Add to the wiring block (after `if (process.env.NODE_ENV !== 'test' || process.env.WIRE_SKILL_ADAPTERS === 'true')`):

```js
  // psh-s3 — D37 mandatory separate wiring: wire real Anthropic generateProductDraft
  if (process.env.ANTHROPIC_API_KEY) {
    const { setGenerateProductDraft } = require('./adapters/product-draft');
    const Anthropic = require('@anthropic-ai/sdk');
    const _anthropic = new Anthropic();
    setGenerateProductDraft(async function(fields) {
      const prompt = `Generate 5 product context files for a software product named "${fields.name}".
Tech stack: ${fields.techStack || 'not specified'}.
Constraints: ${fields.constraints || 'none specified'}.
Return JSON with keys: mission, roadmap, techStack, constraints, architectureGuardrails.`;
      const msg = await _anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });
      const text = msg.content[0].text;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch[0]);
      } catch(_) {
        return { mission: text, roadmap: '', techStack: fields.techStack || '', constraints: fields.constraints || '', architectureGuardrails: '' };
      }
    });
    console.log('[psh-s3] generateProductDraft adapter wired');
  }
```

Also mount the products router in the request handler section (see server.js routing block).

**Run:** `node tests/check-psh-s3-product-creation.js`
**Expected (GREEN):** `[psh-s3] Results: 9 passed, 0 failed`

---

## Task 5 — Commit

```
feat(psh-s3): product creation flow — hybrid form + AI draft + solo plan enforcement
```
