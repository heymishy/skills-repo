#!/usr/bin/env node
/**
 * check-alrf-s9-design-as-built-context.js -- alrf-s9: feed a fresh as-built
 * Data Model / System Architecture snapshot into /design's system prompt.
 *
 * skills/design/SKILL.md's Data Model diagram markers section already requires
 * "existing entities the feature touches, even with no schema change" to
 * appear in the as-designed diagram -- but /design is conversational, with
 * nothing grounding it in the product's REAL current schema/architecture
 * before it draws. This closes that gap: buildSystemPrompt() now includes a
 * fresh as-built snapshot (via the same generators csd-s5/csd-s7 already use)
 * for /design sessions only, read-only (never writes a new versioned
 * artefact as a side effect of starting a session).
 *
 * Run: node tests/check-alrf-s9-design-as-built-context.js
 */
'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const REAL_REPO_ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function run() {
  // ── AC1: a /design system prompt includes the real as-built Data Model ──
  console.log('\n  AC1 -- /design system prompt includes the real product\'s as-built Data Model (from real scripts/migrate-schema-*.js)');
  {
    const routes = freshRequire(ROUTES_PATH);
    const prompt = routes.buildSystemPrompt('design', path.join(REAL_REPO_ROOT, 'artefacts', 'x', 'design-session'), REAL_REPO_ROOT);
    ok(prompt.indexOf('EXISTING PRODUCT DATA MODEL') !== -1, 'AC1: labelled Data Model section present');
    ok(prompt.indexOf('erDiagram') !== -1, 'AC1: real erDiagram mermaid syntax present (from the real migration files)');
  }

  // ── AC2: a /design system prompt includes the real as-built System Architecture ──
  console.log('\n  AC2 -- /design system prompt includes the real product\'s as-built System Architecture');
  {
    const routes = freshRequire(ROUTES_PATH);
    const prompt = routes.buildSystemPrompt('design', path.join(REAL_REPO_ROOT, 'artefacts', 'x', 'design-session'), REAL_REPO_ROOT);
    ok(prompt.indexOf('EXISTING PRODUCT SYSTEM ARCHITECTURE') !== -1, 'AC2: labelled System Architecture section present');
  }

  // ── AC3: other skills (e.g. discovery) do NOT get this section -- scoped to /design only ──
  console.log('\n  AC3 -- non-/design skills do not get the as-built context section');
  {
    const routes = freshRequire(ROUTES_PATH);
    const prompt = routes.buildSystemPrompt('discovery', path.join(REAL_REPO_ROOT, 'artefacts', 'x', 'discovery-session'), REAL_REPO_ROOT);
    ok(prompt.indexOf('EXISTING PRODUCT DATA MODEL') === -1, 'AC3: discovery session prompt has no Data Model section');
    ok(prompt.indexOf('EXISTING PRODUCT SYSTEM ARCHITECTURE') === -1, 'AC3: discovery session prompt has no System Architecture section');
  }

  // ── AC4: a repo with no migration files yet degrades gracefully (no throw, no section, session still builds) ──
  console.log('\n  AC4 -- a product with no migrations yet: /design session still builds, just without a Data Model section');
  {
    const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s9-empty-'));
    const routes = freshRequire(ROUTES_PATH);
    let threw = false;
    let prompt = '';
    try {
      prompt = routes.buildSystemPrompt('design', path.join(emptyRoot, 'artefacts', 'x', 'design-session'), emptyRoot);
    } catch (_) { threw = true; }
    ok(!threw, 'AC4: buildSystemPrompt does not throw when no migration files exist yet');
    ok(prompt.indexOf('EXISTING PRODUCT DATA MODEL') === -1, 'AC4: no Data Model section when there\'s nothing to show');
    fs.rmSync(emptyRoot, { recursive: true, force: true });
  }

  // ── AC5: starting a /design session never writes a new versioned as-built artefact file (read-only) ──
  console.log('\n  AC5 -- building a /design system prompt is read-only, never writes a new as-built artefact file');
  {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s9-readonly-'));
    fs.mkdirSync(path.join(tmpRoot, 'scripts'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpRoot, 'scripts', 'migrate-schema-widgets.js'),
      "CREATE TABLE IF NOT EXISTS widgets (\n  id UUID PRIMARY KEY,\n  name TEXT\n);\n",
      'utf8'
    );
    const routes = freshRequire(ROUTES_PATH);
    routes.buildSystemPrompt('design', path.join(tmpRoot, 'artefacts', 'x', 'design-session'), tmpRoot);
    const diagramsDir = path.join(tmpRoot, 'artefacts', 'x', 'diagrams');
    ok(!fs.existsSync(diagramsDir), 'AC5: no diagrams/ artefact directory created as a side effect of building the system prompt');
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  console.log('\n[alrf-s9-design-as-built-context] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
