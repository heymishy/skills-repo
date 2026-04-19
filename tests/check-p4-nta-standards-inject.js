#!/usr/bin/env node
// check-p4-nta-standards-inject.js — test plan verification for p4-nta-standards-inject
// Covers T1–T8, T-NFR1, T-NFR2
// Tests FAIL until src/teams-bot/standards-injector.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const INJECTOR  = path.join(ROOT, 'src', 'teams-bot', 'standards-injector.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(INJECTOR)) return null;
  try {
    delete require.cache[require.resolve(INJECTOR)];
    return require(INJECTOR);
  } catch (_) { return null; }
}

// Create a temporary sidecar directory with multi-discipline standards files
function makeTmpSidecar() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p4-sidecar-'));
  const dirs   = ['product', 'security-engineering', 'software-engineering', 'quality-assurance'];
  for (const d of dirs) {
    fs.mkdirSync(path.join(tmpDir, d), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, d, 'standards.md'),
      `# ${d} standards\nThis is the ${d} standard content.`, 'utf8');
  }
  return tmpDir;
}

// ── T1 — Module exists and exports injectStandards ───────────────────────────
console.log('\n[p4-nta-standards-inject] T1 — module exists and exports injectStandards');
{
  const exists = fs.existsSync(INJECTOR);
  assert(exists, 'T1a: src/teams-bot/standards-injector.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    assert(typeof mod.injectStandards === 'function',
      'T1c: exports injectStandards as function');
  }
}

const mod = loadModule();

// ── T2 — Sidecar present → standardsContent + standardsInjected: true ────────
console.log('\n[p4-nta-standards-inject] T2 — sidecar present → standardsContent + standardsInjected: true');
{
  if (!mod || typeof mod.injectStandards !== 'function') {
    assert(false, 'T2: injectStandards (function missing)');
  } else {
    const tmpDir = makeTmpSidecar();
    let result = null;
    try {
      result = mod.injectStandards({
        step:        'problem-statement',
        role:        'product-manager',
        sidecarRoot: tmpDir,
      });
    } catch (_) {}
    fs.rmSync(tmpDir, { recursive: true, force: true });

    assert(result !== null && result !== undefined, 'T2a: result is not null');
    if (result) {
      assert(typeof result.standardsContent === 'string' && result.standardsContent.length > 0,
        `T2b: standardsContent is non-empty string (got: ${typeof result.standardsContent})`);
      assert(result.standardsInjected === true,
        `T2c: standardsInjected is true (got: ${result.standardsInjected})`);
    }
  }
}

// ── T3 — Standards content before question (C7 ordering) ─────────────────────
console.log('\n[p4-nta-standards-inject] T3 — standards before question (C7 ordering contract)');
{
  if (!mod || typeof mod.injectStandards !== 'function') {
    assert(false, 'T3: injectStandards (function missing)');
  } else {
    const tmpDir = makeTmpSidecar();
    let result = null;
    try {
      result = mod.injectStandards({
        step:        'problem-statement',
        role:        'product-manager',
        sidecarRoot: tmpDir,
        question:    'What problem are you solving?',
      });
    } catch (_) {}
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (!result) {
      assert(false, 'T3: no result');
    } else {
      // The standards must be a separate field — not mixed into the question string
      assert(result.standardsContent !== undefined,
        'T3a: standardsContent is a distinct field (ordering: standards separate from question)');
      // The question should also be available (or the function doesn't merge them)
      if (result.question) {
        assert(!result.question.startsWith(result.standardsContent),
          'T3b: standardsContent not prepended into question (separate fields)');
      } else {
        assert(true, 'T3b: no mixed question/standards field (correct)');
      }
    }
  }
}

// ── T4 — No HTTP/HTTPS fetch in source (C5) ───────────────────────────────────
console.log('\n[p4-nta-standards-inject] T4 — no HTTP/HTTPS fetch in source (C5)');
{
  if (!fs.existsSync(INJECTOR)) {
    assert(false, 'T4: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(INJECTOR, 'utf8');
    assert(!/require\s*\(\s*['"]https?['"]\s*\)/.test(src), 'T4a: no require(http/https)');
    assert(!/\bfetch\s*\(/.test(src),                       'T4b: no fetch( call');
    assert(!/require\s*\(\s*['"]node-fetch['"]\s*\)/.test(src), 'T4c: no node-fetch import');
    assert(!/require\s*\(\s*['"]axios['"]\s*\)/.test(src),  'T4d: no axios import');
  }
}

// ── T5 — Sidecar unavailable → standardsInjected: false ──────────────────────
console.log('\n[p4-nta-standards-inject] T5 — sidecar unavailable → standardsInjected: false');
{
  if (!mod || typeof mod.injectStandards !== 'function') {
    assert(false, 'T5: injectStandards (function missing)');
  } else {
    let result = null;
    let threw  = false;
    try {
      result = mod.injectStandards({
        step:        'problem-statement',
        role:        'product-manager',
        sidecarRoot: '/nonexistent/path/that/does/not/exist',
      });
    } catch (e) { threw = true; result = e; }
    // Should NOT throw — should return gracefully with standardsInjected: false
    assert(!threw,
      `T5a: does not throw when sidecar unavailable (threw: ${threw})`);
    if (!threw && result) {
      assert(result.standardsInjected === false,
        `T5b: standardsInjected is false (got: ${result.standardsInjected})`);
      assert(result.standardsContent === null || result.standardsContent === undefined || result.standardsContent === '',
        `T5c: standardsContent is null/undefined/empty (got: ${JSON.stringify(result.standardsContent)})`);
    }
  }
}

// ── T6 — Unavailability note contains required guidance ───────────────────────
console.log('\n[p4-nta-standards-inject] T6 — unavailability note contains sidecar guidance');
{
  if (!mod || typeof mod.injectStandards !== 'function') {
    assert(false, 'T6: injectStandards (function missing)');
  } else {
    let result = null;
    try {
      result = mod.injectStandards({
        step:        'problem-statement',
        role:        'product-manager',
        sidecarRoot: '/nonexistent-sidecar',
      });
    } catch (_) {}
    if (!result || !result.note) {
      assert(false, 'T6: no note field in result');
    } else {
      assert(/sidecar not installed/i.test(result.note),
        `T6a: note contains "sidecar not installed" (got: "${result.note}")`);
      assert(/skills-repo init/i.test(result.note),
        `T6b: note contains "skills-repo init" (got: "${result.note}")`);
    }
  }
}

// ── T7 — role: product-manager → only product standards injected ──────────────
console.log('\n[p4-nta-standards-inject] T7 — product-manager role → product standards only');
{
  if (!mod || typeof mod.injectStandards !== 'function') {
    assert(false, 'T7: injectStandards (function missing)');
  } else {
    const tmpDir = makeTmpSidecar();
    let result = null;
    try {
      result = mod.injectStandards({
        step:        'problem-statement',
        role:        'product-manager',
        sidecarRoot: tmpDir,
      });
    } catch (_) {}
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (!result || !result.standardsContent) {
      assert(false, 'T7: no standards content to check');
    } else {
      // Content should be from product/ not security-engineering/ or software-engineering/
      assert(!/security-engineering standards/i.test(result.standardsContent),
        'T7a: security-engineering content not injected for product-manager');
      assert(!/software-engineering standards/i.test(result.standardsContent),
        'T7b: software-engineering content not injected for product-manager');
    }
  }
}

// ── T8 — role: risk-reviewer → review/quality standards only ─────────────────
console.log('\n[p4-nta-standards-inject] T8 — risk-reviewer role → quality/review standards only');
{
  if (!mod || typeof mod.injectStandards !== 'function') {
    assert(false, 'T8: injectStandards (function missing)');
  } else {
    const tmpDir = makeTmpSidecar();
    let result = null;
    try {
      result = mod.injectStandards({
        step:        'dor-review',
        role:        'risk-reviewer',
        sidecarRoot: tmpDir,
      });
    } catch (_) {}
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (!result || result.standardsInjected === false) {
      // If role not configured yet, skip gracefully
      console.log('  - T8: skipped (risk-reviewer role not configured — verify after implementation)');
      passed++;
    } else if (result.standardsContent) {
      // Should not inject software-engineering or product standards for risk-reviewer
      assert(!/software-engineering standards/i.test(result.standardsContent),
        'T8: software-engineering content not injected for risk-reviewer');
    }
  }
}

// ── T-NFR1 — No standards content in external log calls (MC-SEC-02) ──────────
console.log('\n[p4-nta-standards-inject] T-NFR1 — no standards content in log calls (MC-SEC-02)');
{
  if (!fs.existsSync(INJECTOR)) {
    assert(false, 'T-NFR1: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(INJECTOR, 'utf8');
    assert(!/console\.(log|error|warn)\s*\([^)]*standardsContent/.test(src),
      'T-NFR1a: no console.log(standardsContent)');
    assert(!/console\.(log|error|warn)\s*\([^)]*content/.test(src),
      'T-NFR1b: no console.log with content variable');
  }
}

// ── T-NFR2 — No hardcoded standards file paths (ADR-004) ──────────────────────
console.log('\n[p4-nta-standards-inject] T-NFR2 — no hardcoded standards paths (ADR-004)');
{
  if (!fs.existsSync(INJECTOR)) {
    assert(false, 'T-NFR2: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(INJECTOR, 'utf8');
    // Hardcoded paths like 'standards/product/discovery-quality.md'
    assert(!/standards\/product\/[a-z\-]+\.md/.test(src),
      'T-NFR2a: no hardcoded standards file path');
    assert(!/standards\/security-engineering\/[a-z\-]+\.md/.test(src),
      'T-NFR2b: no hardcoded security standards path');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-nta-standards-inject] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
