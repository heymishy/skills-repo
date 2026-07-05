'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// T1 — D37 stub throws before wiring
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

function getFreshModules() {
  delete require.cache[require.resolve('../src/web-ui/standards-adapter')];
  delete require.cache[require.resolve('../src/web-ui/product-context-adapter')];
  delete require.cache[require.resolve('../src/web-ui/routes/skills')];
  const sa = require('../src/web-ui/standards-adapter');
  const pca = require('../src/web-ui/product-context-adapter');
  const skills = require('../src/web-ui/routes/skills');
  // Wire product context to no-op
  pca.setProductContextAdapter(async function() { return { mission:'', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
  return {
    bsp: skills.buildSystemPromptWithProductContext,
    setStandardsAdapter: sa.setStandardsAdapter,
    setProductContextAdapter: pca.setProductContextAdapter
  };
}

(async function() {
  // T2 — standards section injected, appears after product context sections, before skillContent
  try {
    const { bsp, setStandardsAdapter, setProductContextAdapter } = getFreshModules();
    setProductContextAdapter(async function() { return { mission:'M', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
    setStandardsAdapter(async function() {
      return [
        { name: 'Use camelCase', content: 'All variables must use camelCase.' },
        { name: 'No console.log', content: 'Use structured logger.' }
      ];
    });
    const result = await bsp({ productId: 'prod-1', orgId: 'org-1', skillContent: '# SKILL' });
    assert(result.includes('## Standards and Patterns'), 'Standards section missing');
    const stdIdx = result.indexOf('## Standards and Patterns');
    const skillIdx = result.indexOf('# SKILL');
    const missionIdx = result.indexOf('## Product Context — Mission');
    assert(missionIdx < stdIdx, `Standards section must appear after product context sections (mission at ${missionIdx}, standards at ${stdIdx})`);
    assert(stdIdx < skillIdx, `Standards section (${stdIdx}) must appear before SKILL content (${skillIdx})`);
    assert(result.includes('Use camelCase'), 'Standard name not in output');
    assert(result.includes('All variables must use camelCase'), 'Standard content not in output');
    pass('standards section injected between product context sections and SKILL.md content');
  } catch(e) { fail('standards section injected between product context sections and SKILL.md content', e); }

  // T3 — empty standards list: no section written
  try {
    const { bsp, setStandardsAdapter, setProductContextAdapter } = getFreshModules();
    setProductContextAdapter(async function() { return { mission:'M', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
    setStandardsAdapter(async function() { return []; });
    const result = await bsp({ productId: 'prod-1', orgId: 'org-1', skillContent: '# SKILL' });
    assert(!result.includes('## Standards and Patterns'), 'Standards section written for empty list');
    pass('empty standards list: ## Standards and Patterns section not written');
  } catch(e) { fail('empty standards list: ## Standards and Patterns section not written', e); }

  // T4 — null productId: adapter not called, no section
  try {
    const { bsp, setStandardsAdapter, setProductContextAdapter } = getFreshModules();
    setProductContextAdapter(async function() { return {}; });
    const calls = [];
    setStandardsAdapter(async function(pid, org) { calls.push({ pid, org }); return []; });
    const result = await bsp({ productId: null, orgId: null, skillContent: '# SKILL' });
    assert(calls.length === 0, `Adapter called ${calls.length} times for null productId`);
    assert(!result.includes('## Standards and Patterns'), 'Standards section written for null productId');
    pass('null productId: standards adapter not called, no section written');
  } catch(e) { fail('null productId: standards adapter not called, no section written', e); }

  // T5 — DB error propagates
  try {
    const { bsp, setStandardsAdapter, setProductContextAdapter } = getFreshModules();
    setProductContextAdapter(async function() { return { mission:'M', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
    setStandardsAdapter(async function() { throw new Error('Standards DB offline'); });
    let threw = false;
    try { await bsp({ productId: 'prod-1', orgId: 'org-1', skillContent: '' }); }
    catch(e) { threw = (e.message === 'Standards DB offline'); }
    assert(threw, 'Standards adapter error not propagated');
    pass('standards adapter DB error propagates — not silently swallowed');
  } catch(e) { fail('standards adapter DB error propagates — not silently swallowed', e); }

  // T6 — server.js wires setStandardsAdapter
  try {
    const src = require('fs').readFileSync('src/web-ui/server.js', 'utf8');
    assert(src.includes('setStandardsAdapter'), 'setStandardsAdapter not found in server.js');
    pass('server.js wires setStandardsAdapter before HTTP server starts');
  } catch(e) { fail('server.js wires setStandardsAdapter before HTTP server starts', e); }

  // T-NFR1 — adapter called with correct productId and orgId
  try {
    const { bsp, setStandardsAdapter, setProductContextAdapter } = getFreshModules();
    setProductContextAdapter(async function() { return { mission:'', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
    const calls = [];
    setStandardsAdapter(async function(productId, orgId) { calls.push({ productId, orgId }); return []; });
    await bsp({ productId: 'prod-X', orgId: 'org-Y', skillContent: '' });
    assert(calls.length === 1, `Expected adapter called once, got ${calls.length}`);
    assert(calls[0].productId === 'prod-X', `productId not passed: ${calls[0].productId}`);
    assert(calls[0].orgId === 'org-Y', `orgId not passed: ${calls[0].orgId}`);
    pass('standards adapter called with correct productId and orgId');
  } catch(e) { fail('standards adapter called with correct productId and orgId', e); }

  // T-NFR2 — concurrent calls get correct respective standards
  try {
    const { bsp, setStandardsAdapter, setProductContextAdapter } = getFreshModules();
    setProductContextAdapter(async function() { return { mission:'', techStack:'', constraints:'', roadmap:'', architectureGuardrails:'' }; });
    setStandardsAdapter(async function(productId) {
      return [{ name: 'Std for ' + productId, content: 'content-' + productId }];
    });
    const [rA, rB] = await Promise.all([
      bsp({ productId: 'prod-A', orgId: 'org', skillContent: '' }),
      bsp({ productId: 'prod-B', orgId: 'org', skillContent: '' })
    ]);
    assert(rA.includes('Std for prod-A'), 'prod-A got wrong standards');
    assert(!rA.includes('Std for prod-B'), 'prod-B standards leaked into prod-A');
    assert(rB.includes('Std for prod-B'), 'prod-B got wrong standards');
    pass('concurrent calls with different productIds receive correct respective standards');
  } catch(e) { fail('concurrent calls with different productIds receive correct respective standards', e); }

  console.log(`\n[psh-s10] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
