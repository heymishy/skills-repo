'use strict';

const fs = require('fs');
const path = require('path');
const { buildRegistry, copySkillsFromRegistry, writeRegistryFile } = require('./skills-registry');

function resolvePlatformRoot(callerDir) {
  return path.resolve(callerDir, '..', '..');
}

function requirePlatformInit(resolvedTarget, platformRoot, force) {
  const scriptPath = require.resolve(path.join(platformRoot, 'scripts', 'platform-init.js'));
  const originalArgv = process.argv;
  const originalEnv = process.env.PLATFORM_ROOT;
  process.argv = [process.argv[0], scriptPath, resolvedTarget].concat(force ? ['--force'] : []);
  process.env.PLATFORM_ROOT = platformRoot;
  delete require.cache[scriptPath];
  try {
    require(scriptPath);
  } finally {
    process.argv = originalArgv;
    if (originalEnv === undefined) delete process.env.PLATFORM_ROOT;
    else process.env.PLATFORM_ROOT = originalEnv;
  }
}

function seedContextYml(resolvedTarget, platformRoot, force) {
  const dest = path.join(resolvedTarget, 'context.yml');
  if (!force && fs.existsSync(dest)) return 'skipped';
  const src = path.join(platformRoot, 'contexts', 'personal.yml');
  fs.copyFileSync(src, dest);
  return 'copied';
}

function seedPipelineState(resolvedTarget, force) {
  const dest = path.join(resolvedTarget, '.github', 'pipeline-state.json');
  if (!force && fs.existsSync(dest)) return 'skipped';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const seed = { version: '1', updated: new Date().toISOString(), programmes: [], features: [] };
  fs.writeFileSync(dest, JSON.stringify(seed, null, 2) + '\n', 'utf8');
  return 'copied';
}

// rb-s2: platform-init.js's own COPY_DIRS only copies this repo's
// .github/skills/ (a 5-skill legacy set). The platform's actual complete,
// current skill set lives at this repo's top-level skills/ (46 skills as of
// 2026-08-05) and is not touched by platform-init.js at all. This step adds
// that full set on top of what platform-init.js already materialized into
// the target's .github/skills/, and writes a categorised registry manifest
// alongside it. Deliberately does not modify platform-init.js — see
// artefacts/2026-08-05-repo-bootstrap-no-fork/plans/rb-s2-plan.md
// "Pre-implementation finding".
function installFullSkillSetAndRegistry(resolvedTarget, platformRoot, force) {
  const skillsSourceDir = path.join(platformRoot, 'skills');
  const skillsDestDir = path.join(resolvedTarget, '.github', 'skills');
  const registry = buildRegistry(skillsSourceDir);
  const copied = copySkillsFromRegistry(skillsSourceDir, skillsDestDir, registry, force);
  const registryDest = path.join(resolvedTarget, '.github', 'skills-registry.json');
  // Same skip-unless-force semantics as every other seeded file (context.yml,
  // pipeline-state.json, individual skill files) — a second init run must not
  // rewrite files that already exist, so mtimes stay stable across reruns.
  let registryWritten = false;
  if (force || !fs.existsSync(registryDest)) {
    writeRegistryFile(registry, registryDest);
    registryWritten = true;
  }
  return { copiedCount: copied.length, registryPath: registryDest, registryWritten };
}

function runInit(targetDir, opts) {
  opts = opts || {};
  const platformRoot = opts.platformRoot || resolvePlatformRoot(__dirname);
  const resolvedTarget = path.resolve(targetDir);
  const force = !!opts.force;

  requirePlatformInit(resolvedTarget, platformRoot, force);

  const contextResult = seedContextYml(resolvedTarget, platformRoot, force);
  const stateResult = seedPipelineState(resolvedTarget, force);
  const skillSetResult = installFullSkillSetAndRegistry(resolvedTarget, platformRoot, force);

  const seeded = [];
  const skipped = [];
  if (contextResult === 'copied') seeded.push('context.yml'); else skipped.push('context.yml');
  if (stateResult === 'copied') seeded.push(path.join('.github', 'pipeline-state.json')); else skipped.push(path.join('.github', 'pipeline-state.json'));

  if (seeded.length > 0) {
    console.log(`[skills-repo-init] Seeded ${seeded.length} additional file(s):`);
    for (const f of seeded) console.log(`  + ${f}`);
  }
  if (skipped.length > 0) {
    console.log(`[skills-repo-init] Skipped ${skipped.length} existing file(s) (run \`npm run platform:fetch\` to pull updates, or pass --force to overwrite):`);
    for (const f of skipped) console.log(`  ~ ${f}`);
  }
  console.log(`[skills-repo-init] Installed ${skillSetResult.copiedCount} skill(s) (full skill set) under .github/skills/`);
  if (skillSetResult.registryWritten) {
    console.log(`[skills-repo-init] Wrote skills registry: ${path.relative(resolvedTarget, skillSetResult.registryPath)}`);
  } else {
    console.log(`[skills-repo-init] Skipped existing skills registry: ${path.relative(resolvedTarget, skillSetResult.registryPath)} (run \`npm run platform:fetch\` to pull updates, or pass --force to overwrite)`);
  }
  console.log('[skills-repo-init] Done.');
}

module.exports = { resolvePlatformRoot, runInit, installFullSkillSetAndRegistry };
