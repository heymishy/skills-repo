'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// T5 — D37 stub throws before wiring
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

function getBsp() {
  delete require.cache[require.resolve('../src/web-ui/product-context-adapter')];
  delete require.cache[require.resolve('../src/web-ui/standards-adapter')];
  delete require.cache[require.resolve('../src/web-ui/routes/skills')];
  const sa = require('../src/web-ui/standards-adapter');
  // Wire no-op standards adapter so psh-s5 tests are isolated from psh-s10 standards injection
  sa.setStandardsAdapter(async function() { return []; });
  return {
    buildSystemPromptWithProductContext: require('../src/web-ui/routes/skills').buildSystemPromptWithProductContext,
    setProductContextAdapter: require('../src/web-ui/product-context-adapter').setProductContextAdapter
  };
}

(async function() {
  try {
    const { setProductContextAdapter } = require('../src/web-ui/product-context-adapter');

    // T1 — 5 sections injected, all present before skillContent
    try {
      setProductContextAdapter(async function() {
        return { mission: 'M', techStack: 'T', constraints: 'C', roadmap: 'R', architectureGuardrails: 'AG' };
      });
      const { buildSystemPromptWithProductContext } = getBsp();
      // re-wire after cache clear
      require('../src/web-ui/product-context-adapter').setProductContextAdapter(async function() {
        return { mission: 'M', techStack: 'T', constraints: 'C', roadmap: 'R', architectureGuardrails: 'AG' };
      });
      const result = await buildSystemPromptWithProductContext({ productId: 'prod-1', skillContent: '# SKILL CONTENT' });
      assert(result.includes('## Product Context — Mission'), 'Missing Mission section');
      assert(result.includes('## Product Context — Tech Stack'), 'Missing Tech Stack section');
      assert(result.includes('## Product Context — Constraints'), 'Missing Constraints section');
      assert(result.includes('## Product Context — Roadmap'), 'Missing Roadmap section');
      assert(result.includes('## Product Context — Architecture Guardrails'), 'Missing Architecture Guardrails section');
      const skillIdx = result.indexOf('# SKILL CONTENT');
      const missionIdx = result.indexOf('## Product Context — Mission');
      assert(missionIdx < skillIdx, `Mission (${missionIdx}) must appear before SKILL CONTENT (${skillIdx})`);
      pass('buildSystemPromptWithProductContext includes 5 product context sections before SKILL.md content');
    } catch(e) { fail('buildSystemPromptWithProductContext includes 5 product context sections before SKILL.md content', e); }

    // T2 — correct order: Mission < Tech Stack < Constraints < Roadmap < Architecture Guardrails
    try {
      const { buildSystemPromptWithProductContext: bsp2, setProductContextAdapter: wire2 } = getBsp();
      wire2(async function() { return { mission:'M', techStack:'T', constraints:'C', roadmap:'R', architectureGuardrails:'AG' }; });
      const result = await bsp2({ productId: 'prod-1', skillContent: '# SKILL' });
      const idxM = result.indexOf('## Product Context — Mission');
      const idxT = result.indexOf('## Product Context — Tech Stack');
      const idxC = result.indexOf('## Product Context — Constraints');
      const idxR = result.indexOf('## Product Context — Roadmap');
      const idxA = result.indexOf('## Product Context — Architecture Guardrails');
      assert(idxM < idxT && idxT < idxC && idxC < idxR && idxR < idxA, 'Sections not in correct order');
      pass('product context sections appear in correct order');
    } catch(e) { fail('product context sections appear in correct order', e); }

    // T3 — content from adapter, not from session
    try {
      const { buildSystemPromptWithProductContext: bsp3, setProductContextAdapter: wire3 } = getBsp();
      wire3(async function() { return { mission:'correct-mission', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
      const result = await bsp3({ productId: 'prod-1', session: { artefactContent: 'wrong-content' }, skillContent: '' });
      assert(result.includes('correct-mission'), 'correct-mission not in prompt');
      assert(!result.includes('wrong-content'), 'wrong-content leaked into prompt');
      pass('product context comes from adapter return value, not from session object');
    } catch(e) { fail('product context comes from adapter return value, not from session object', e); }

    // T4 — null productId: no injection, adapter not called
    try {
      const { buildSystemPromptWithProductContext: bsp4, setProductContextAdapter: wire4 } = getBsp();
      const calls = [];
      wire4(async function(pid) { calls.push(pid); return {}; });
      const result = await bsp4({ productId: null, skillContent: '# SKILL' });
      assert(result.includes('# SKILL'), 'SKILL content missing');
      assert(!result.includes('## Product Context'), 'Product context injected for null productId');
      assert(calls.length === 0, 'Adapter called for null productId');
      pass('buildSystemPromptWithProductContext with null productId proceeds without product context sections');
    } catch(e) { fail('buildSystemPromptWithProductContext with null productId proceeds without product context sections', e); }

    // T6 — server.js wires setProductContextAdapter
    try {
      const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
      assert(src.includes('setProductContextAdapter'), 'setProductContextAdapter not found in server.js');
      pass('server.js wires setProductContextAdapter before HTTP server starts');
    } catch(e) { fail('server.js wires setProductContextAdapter before HTTP server starts', e); }

    // T7 — concurrent calls receive correct respective contexts
    try {
      const { buildSystemPromptWithProductContext: bsp7, setProductContextAdapter: wire7 } = getBsp();
      wire7(async function(productId) {
        return { mission: 'Mission ' + productId, techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' };
      });
      const [rA, rB] = await Promise.all([
        bsp7({ productId: 'prod-A', skillContent: '' }),
        bsp7({ productId: 'prod-B', skillContent: '' })
      ]);
      assert(rA.includes('Mission prod-A') && !rA.includes('Mission prod-B'), 'prod-A got wrong context');
      assert(rB.includes('Mission prod-B') && !rB.includes('Mission prod-A'), 'prod-B got wrong context');
      pass('two concurrent calls with different productIds receive correct respective contexts');
    } catch(e) { fail('two concurrent calls with different productIds receive correct respective contexts', e); }

    // T-NFR1 — adapter called exactly once per call
    try {
      const { buildSystemPromptWithProductContext: bsp8, setProductContextAdapter: wire8 } = getBsp();
      const calls = [];
      wire8(async function(pid) { calls.push(pid); return { mission:'m', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
      await bsp8({ productId: 'prod-1', skillContent: '' });
      assert(calls.length === 1, `Adapter called ${calls.length} times (expected 1)`);
      pass('getProductContext invoked exactly once per buildSystemPromptWithProductContext call');
    } catch(e) { fail('getProductContext invoked exactly once per buildSystemPromptWithProductContext call', e); }

    // T-NFR2 — DB error propagates
    try {
      const { buildSystemPromptWithProductContext: bsp9, setProductContextAdapter: wire9 } = getBsp();
      wire9(async function() { throw new Error('DB connection lost'); });
      let threw = false;
      try { await bsp9({ productId: 'prod-1', skillContent: '' }); } catch(e) {
        threw = (e.message === 'DB connection lost');
      }
      assert(threw, 'DB error not propagated');
      pass('buildSystemPromptWithProductContext propagates DB error');
    } catch(e) { fail('buildSystemPromptWithProductContext propagates DB error', e); }

  } catch(e) { fail('setup error', e); }

  console.log(`\n[psh-s5] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
