'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const child = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN_SKILLS = path.join(ROOT, 'bin', 'skills');
const STATE_PATH = path.join(ROOT, '.github', 'pipeline-state.json');

let passed = 0, failed = 0;
function ok(condition, label) {
  if (condition) { console.log('  \u2713 ' + label); passed++; }
  else { console.log('  \u2717 ' + label); failed++; }
}

// T1: module exports init function
try {
  const mod = require('../src/enforcement/cli-init');
  ok(typeof mod.init === 'function', 'T1: cli-init exports init function');
} catch (e) {
  ok(false, 'T1: cli-init exports init function (require failed: ' + e.message + ')');
}

// T2: valid slug → exit 0 + correct fields
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    const slug = '2026-05-25-test-feature-sc05-t2';
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakeStatePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakeStatePath, JSON.stringify({ features: [] }, null, 2), 'utf8');
    const result = mod.init(slug, undefined, fakeRoot);
    const stateAfter = JSON.parse(fs.readFileSync(fakeStatePath, 'utf8'));
    const newFeat = stateAfter.features.find(f => f.slug === slug);
    ok(result.exitCode === 0, 'T2: valid slug → exitCode 0');
    ok(result.stdout.includes(slug), 'T2: stdout contains slug');
    ok(newFeat !== undefined, 'T2: feature created in state');
    ok(newFeat && newFeat.stage === 'discovery', 'T2: feature.stage === discovery');
    ok(newFeat && newFeat.health === 'green', 'T2: feature.health === green');
    ok(newFeat && Array.isArray(newFeat.stories) && newFeat.stories.length === 0, 'T2: feature.stories is empty array');
    ok(newFeat && Array.isArray(newFeat.metrics) && newFeat.metrics.length === 0, 'T2: feature.metrics is empty array');
    ok(newFeat && typeof newFeat.updatedAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(newFeat.updatedAt), 'T2: feature.updatedAt is ISO date');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T2: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// T3: --description → name from description
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t3-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakeStatePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakeStatePath, JSON.stringify({ features: [] }, null, 2), 'utf8');
    const result = mod.init('test-feature-sc05b', 'My Custom Feature Name', fakeRoot);
    const stateAfter = JSON.parse(fs.readFileSync(fakeStatePath, 'utf8'));
    const newFeat = stateAfter.features.find(f => f.slug === 'test-feature-sc05b');
    ok(result.exitCode === 0, 'T3: exitCode 0');
    ok(newFeat && newFeat.name === 'My Custom Feature Name', 'T3: name from description');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T3: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// T4: no description → name title-cased from slug
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t4-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakeStatePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakeStatePath, JSON.stringify({ features: [] }, null, 2), 'utf8');
    const result = mod.init('my-new-feature', undefined, fakeRoot);
    const stateAfter = JSON.parse(fs.readFileSync(fakeStatePath, 'utf8'));
    const newFeat = stateAfter.features.find(f => f.slug === 'my-new-feature');
    ok(result.exitCode === 0, 'T4: exitCode 0');
    ok(newFeat && typeof newFeat.name === 'string' && newFeat.name.length > 0, 'T4: name is non-empty string');
    ok(newFeat && newFeat.name[0] === newFeat.name[0].toUpperCase(), 'T4: name starts with uppercase (title-cased)');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T4: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// T5: no .tmp file left after success
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t5-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakeStatePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakeStatePath, JSON.stringify({ features: [] }, null, 2), 'utf8');
    const result = mod.init('atomic-test-sc05', undefined, fakeRoot);
    ok(result.exitCode === 0, 'T5: init succeeds');
    ok(!fs.existsSync(fakeStatePath + '.tmp'), 'T5: no .tmp file left after success');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T5: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// T6: duplicate slug → exitCode === 2 (exact code, not just non-zero)
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t6-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakeStatePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakeStatePath, JSON.stringify({ features: [{ slug: 'existing-feature-sc05', stage: 'discovery' }] }, null, 2), 'utf8');
    const result = mod.init('existing-feature-sc05', undefined, fakeRoot);
    ok(result.exitCode === 2, 'T6: duplicate slug → exitCode === 2 (exact code)');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T6: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// T7: duplicate → error message contains slug, state unchanged
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t7-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakeStatePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    const initState = { features: [{ slug: 'existing-feature-sc05', stage: 'discovery' }] };
    fs.writeFileSync(fakeStatePath, JSON.stringify(initState, null, 2), 'utf8');
    const result = mod.init('existing-feature-sc05', undefined, fakeRoot);
    const stateAfter = JSON.parse(fs.readFileSync(fakeStatePath, 'utf8'));
    ok((result.stderr || '').includes('existing-feature-sc05'), 'T7: stderr contains slug');
    ok(stateAfter.features.length === 1, 'T7: state unchanged (still 1 feature)');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T7: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// T8-T13: invalid slugs → exitCode 1
const invalidSlugs = [
  ['has space', 'T8: space'],
  ['path/slash', 'T9: slash'],
  ['..', 'T10: dotdot'],
  ['has_underscore', 'T11: underscore'],
  ['-leading', 'T12: leading hyphen'],
  ['trailing-', 'T13: trailing hyphen'],
];
try {
  const mod = require('../src/enforcement/cli-init');
  for (const [slug, label] of invalidSlugs) {
    try {
      const result = mod.init(slug, undefined, ROOT);
      ok(result.exitCode !== 0, label + ': invalid slug exits non-zero');
      ok(result.stderr && result.stderr.length > 0, label + ': stderr has message');
    } catch (e) {
      ok(false, label + ': threw: ' + e.message);
    }
  }
} catch (e) {
  for (const [, label] of invalidSlugs) ok(false, label + ' (module missing)');
}

// T14: integrity check passes after init
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    const realState = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t14-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakePath, JSON.stringify(realState, null, 2), 'utf8');
    const slug = 'integrity-check-sc05-' + Date.now();
    const result = mod.init(slug, 'Test Feature', fakeRoot);
    ok(result.exitCode === 0, 'T14: init succeeds');
    const stateAfter = JSON.parse(fs.readFileSync(fakePath, 'utf8'));
    const newFeat = stateAfter.features.find(f => f.slug === slug);
    ok(newFeat && newFeat.stage && newFeat.health && Array.isArray(newFeat.stories), 'T14: new feature has required shape fields');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T14: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// IT1: node bin/skills init <slug> exits 0
{
  let fakeRoot;
  try {
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-it1-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakePath, JSON.stringify({ features: [] }, null, 2), 'utf8');
    const spawn = child.spawnSync(
      'node', [BIN_SKILLS, 'init', 'spawn-test-sc05'],
      { cwd: fakeRoot, encoding: 'utf8', timeout: 8000, env: Object.assign({}, process.env) }
    );
    ok(spawn.status === 0, 'IT1: node bin/skills init valid-slug exits 0 (got ' + spawn.status + ')');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'IT1: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// IT2: duplicate slug exits 2 (exact code)
{
  let fakeRoot;
  try {
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-it2-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakePath, JSON.stringify({ features: [{ slug: 'spawn-dup-sc05', stage: 'discovery' }] }, null, 2), 'utf8');
    const spawn = child.spawnSync(
      'node', [BIN_SKILLS, 'init', 'spawn-dup-sc05'],
      { cwd: fakeRoot, encoding: 'utf8', timeout: 8000, env: Object.assign({}, process.env) }
    );
    ok(spawn.status === 2, 'IT2: duplicate slug exits 2 (got ' + spawn.status + ')');
    ok((spawn.stderr || '').includes('spawn-dup-sc05'), 'IT2: stderr contains slug');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'IT2: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// IT3: node bin/skills without args lists init subcommand in usage
{
  try {
    const spawn = child.spawnSync('node', [BIN_SKILLS], { encoding: 'utf8', timeout: 5000 });
    ok(spawn.status !== 0, 'IT3: bin/skills without args exits non-zero');
    ok((spawn.stderr || '').includes('init'), 'IT3: usage message includes init');
  } catch (e) {
    ok(false, 'IT3: errored: ' + e.message);
  }
}

// NFR-T1: no .tmp left on validation failure path
{
  try {
    const mod = require('../src/enforcement/cli-init');
    const result = mod.init('has space', undefined, ROOT);
    ok(result.exitCode !== 0, 'NFR-T1: validation failure exits non-zero');
    ok(!fs.existsSync(path.join(ROOT, '.github', 'pipeline-state.json.tmp')), 'NFR-T1: no .tmp left after validation failure');
  } catch (e) {
    ok(false, 'NFR-T1: errored: ' + e.message);
  }
}

// NFR-T2: no external npm dependencies in cli-init.js
{
  try {
    const source = fs.readFileSync(path.join(ROOT, 'src', 'enforcement', 'cli-init.js'), 'utf8');
    const externalRequires = source.match(/require\(['"](?![./])((?!fs|path|os|child_process|assert|util|stream|crypto)[^'"]+)['"]\)/g);
    ok(!externalRequires || externalRequires.length === 0, 'NFR-T2: no external npm dependencies (found: ' + (externalRequires || []).join(', ') + ')');
  } catch (e) {
    ok(false, 'NFR-T2: errored: ' + e.message);
  }
}

// NFR-T3: path traversal guard fires for ../../ slug
{
  try {
    const mod = require('../src/enforcement/cli-init');
    const result = mod.init('../../etc-malicious', undefined, ROOT);
    ok(result.exitCode !== 0, 'NFR-T3: path traversal attempt exits non-zero');
  } catch (e) {
    ok(false, 'NFR-T3: errored: ' + e.message);
  }
}

// T15: default track is 'standard'
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t15-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakePath, JSON.stringify({ features: [] }, null, 2), 'utf8');
    mod.init('track-default-sc05', undefined, fakeRoot, undefined);
    const stateAfter = JSON.parse(fs.readFileSync(fakePath, 'utf8'));
    const newFeat = stateAfter.features.find(f => f.slug === 'track-default-sc05');
    ok(newFeat && newFeat.track === 'standard', 'T15: default track is standard');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T15: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// T16: --track short → track is 'short'
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t16-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakePath, JSON.stringify({ features: [] }, null, 2), 'utf8');
    mod.init('track-short-sc05', undefined, fakeRoot, 'short');
    const stateAfter = JSON.parse(fs.readFileSync(fakePath, 'utf8'));
    const newFeat = stateAfter.features.find(f => f.slug === 'track-short-sc05');
    ok(newFeat && newFeat.track === 'short', 'T16: track=short set correctly');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T16: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

// T17: invalid track → exitCode 1
{
  try {
    const mod = require('../src/enforcement/cli-init');
    const result = mod.init('track-invalid-sc05', undefined, ROOT, 'bogus');
    ok(result.exitCode === 1, 'T17: invalid track → exitCode 1');
    ok((result.stderr || '').includes('bogus'), 'T17: stderr contains invalid track value');
  } catch (e) {
    ok(false, 'T17: errored: ' + e.message);
  }
}

// T18: schema-valid stub (track field present, all required fields present)
{
  let fakeRoot;
  try {
    const mod = require('../src/enforcement/cli-init');
    fakeRoot = path.join(ROOT, 'tmp-test-root-sc05-t18-' + Date.now());
    fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
    const fakePath = path.join(fakeRoot, '.github', 'pipeline-state.json');
    fs.writeFileSync(fakePath, JSON.stringify({ features: [] }, null, 2), 'utf8');
    mod.init('schema-check-sc05', 'Schema Check Feature', fakeRoot, 'library');
    const stateAfter = JSON.parse(fs.readFileSync(fakePath, 'utf8'));
    const f = stateAfter.features.find(x => x.slug === 'schema-check-sc05');
    ok(f && f.slug && f.name && f.track && f.stage && f.health, 'T18: stub has all required schema fields (slug/name/track/stage/health)');
    ok(f && f.track === 'library', 'T18: track=library stored correctly');
    try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  } catch (e) {
    ok(false, 'T18: errored: ' + e.message);
    if (fakeRoot) try { fs.rmSync(fakeRoot, { recursive: true }); } catch(_) {}
  }
}

console.log('\n[gpa-sc05] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
