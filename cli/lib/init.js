'use strict';

const fs = require('fs');
const path = require('path');

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

function runInit(targetDir, opts) {
  opts = opts || {};
  const platformRoot = opts.platformRoot || resolvePlatformRoot(__dirname);
  const resolvedTarget = path.resolve(targetDir);
  const force = !!opts.force;

  requirePlatformInit(resolvedTarget, platformRoot, force);

  const contextResult = seedContextYml(resolvedTarget, platformRoot, force);
  const stateResult = seedPipelineState(resolvedTarget, force);

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
  console.log('[skills-repo-init] Done.');
}

module.exports = { resolvePlatformRoot, runInit };
