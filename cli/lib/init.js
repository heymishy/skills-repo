'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { buildRegistry, copySkillsFromRegistry, writeRegistryFile } = require('./skills-registry');
const { promptForCredential } = require('./credential-prompt');
const { fetchFromSaas } = require('./saas-fetch');

const HARNESS_INSTRUCTION_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  '.cursorrules',
  path.join('.github', 'copilot-instructions.md'),
];

// On Windows, WSL bash may be absent or broken; prefer Git Bash when
// available. Mirrors the same resolution used by
// .github/scripts/check-assembly.js and tests/check-rb-s3-*.js.
function resolveBashBin() {
  if (process.platform !== 'win32') return 'bash';
  const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
  if (fs.existsSync(gitBash)) return gitBash;
  return 'bash';
}

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

// rb-s5 (revised 2026-08-06 -- see decisions.md): --with-outer-loop controls
// an *enablement signal* in context.yml, not which skill files exist on disk.
// rb-s2 AC1 ("the target directory contains the platform's complete current
// skill set... not a subset or placeholder") is an unconditional, already-
// shipped guarantee -- every skill file, outer-loop included, is always
// present regardless of this flag. This function only ever flips
// outerLoop.enabled from false to true; it never downgrades true back to
// false (no removal mechanism is in scope), so a later bootstrap run without
// the flag can never silently disable an outer loop a previous run enabled.
// Runs on every init call, independent of context.yml's own file-level
// skip-unless-force gate (seedContextYml) -- that gate protects the file's
// existence/general content from being clobbered by a second run; this
// function is the one, narrow, intentional exception that a second run is
// expected to mutate, since flipping this one field on an add-on run (AC4)
// is the entire point of the flag.
function ensureOuterLoopSignal(resolvedTarget, withOuterLoop) {
  const contextPath = path.join(resolvedTarget, 'context.yml');
  if (!fs.existsSync(contextPath)) {
    return { changed: false, enabled: !!withOuterLoop };
  }

  const original = fs.readFileSync(contextPath, 'utf8');
  const blockRe = /^outerLoop:\r?\n(?:[ \t].*\r?\n?)*/m;
  const match = original.match(blockRe);

  let previousEnabled = false;
  if (match) {
    const enabledMatch = match[0].match(/^[ \t]+enabled:\s*(true|false)/m);
    previousEnabled = enabledMatch ? enabledMatch[1] === 'true' : false;
  }

  const desired = !!withOuterLoop || previousEnabled;
  const newBlock = `outerLoop:\n  enabled: ${desired}\n`;

  let updated;
  if (match) {
    updated = original.slice(0, match.index) + newBlock + original.slice(match.index + match[0].length);
  } else {
    const sep = original.endsWith('\n') ? '' : '\n';
    updated = `${original}${sep}\n${newBlock}`;
  }

  if (updated !== original) {
    fs.writeFileSync(contextPath, updated, 'utf8');
  }

  return { changed: previousEnabled !== desired, enabled: desired };
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

// rb-s3: the story's Architecture Constraints assumed
// scripts/assemble-copilot-instructions.sh already produced the single
// instruction file rb-s1 seeds — it does not. rb-s1's single
// .github/copilot-instructions.md is a hardcoded placeholder written
// directly by platform-init.js, a separate code path from this script's
// assemble() logic. This step wires the actual assembly script in as an
// additive install step (same pattern as installFullSkillSetAndRegistry
// above), run after the full skill set is in place so the assembled content
// reflects the target's real .github/skills, not a placeholder. Skip-unless-
// force semantics mirror every other seeded file: only skipped when ALL FOUR
// harness files already exist (a genuine second run) — on the very first
// init call, .github/copilot-instructions.md already exists (written moments
// earlier by platform-init.js) but the other three do not, so this correctly
// still runs and replaces that placeholder rather than skipping.
//
// rb-s5: forceRegen is a narrow, separate override from force -- it bypasses
// the "all 4 already exist" skip specifically when ensureOuterLoopSignal()
// just flipped outerLoop.enabled on an add-on run (AC4), so the session-start
// section reflects the new signal, without pulling in --force's much broader
// "overwrite every seeded file" semantics.
function assembleHarnessInstructions(resolvedTarget, platformRoot, force, forceRegen) {
  const allExist = HARNESS_INSTRUCTION_FILES.every(rel => fs.existsSync(path.join(resolvedTarget, rel)));
  if (!force && !forceRegen && allExist) {
    return { ran: false, reason: 'all 4 harness instruction files already present' };
  }

  const assembleScript = path.join(platformRoot, 'scripts', 'assemble-copilot-instructions.sh');
  const contextFile = path.join(resolvedTarget, 'context.yml');
  const bashBin = resolveBashBin();

  const assembleResult = spawnSync(bashBin, [
    assembleScript,
    '--skills-repo-path', resolvedTarget,
    '--context', contextFile,
    '--all-harnesses',
  ], { cwd: resolvedTarget, encoding: 'utf8' });

  if (assembleResult.status !== 0) {
    throw new Error(
      `[skills-repo-init] Failed to assemble harness-agnostic instruction files: ${assembleResult.stderr || assembleResult.stdout}`
    );
  }

  // Immediately verify the four files this step just wrote are in sync —
  // a freshly-bootstrapped repo must never be in a state where they could
  // already have diverged. Uses the target's own copy of the drift-check
  // validator (copied in by platform-init.js's COPY_DIRS moments earlier),
  // not this platform repo's, so this proves what a real npx consumer gets.
  const driftScript = path.join(resolvedTarget, 'scripts', 'check-instructions-drift.js');
  const driftResult = spawnSync(process.execPath, [driftScript, '--dir', resolvedTarget], { encoding: 'utf8' });
  if (driftResult.status !== 0) {
    throw new Error(
      `[skills-repo-init] Freshly-assembled harness instruction files failed drift-check: ${driftResult.stdout || driftResult.stderr}`
    );
  }

  return { ran: true, files: HARNESS_INSTRUCTION_FILES };
}

async function runInit(targetDir, opts) {
  opts = opts || {};
  const platformRoot = opts.platformRoot || resolvePlatformRoot(__dirname);
  const resolvedTarget = path.resolve(targetDir);
  const force = !!opts.force;

  // rb-s4: --from-saas fetches a DoR-approved feature's artefact + pipeline-
  // state entry from the hosted SaaS before any fresh-repo scaffolding runs.
  // This ordering is what makes AC3 ("no silent fallback") structurally
  // true: if the fetch throws (e.g. a 403), this function returns/propagates
  // before requirePlatformInit or anything else below has written a single
  // byte to resolvedTarget.
  if (opts.fromSaas) {
    const promptFn = opts.promptFn || promptForCredential;
    const credential = opts.credential || await promptFn();
    fs.mkdirSync(resolvedTarget, { recursive: true });
    await fetchFromSaas(resolvedTarget, opts.fromSaas, credential, {
      baseUrl: opts.saasBaseUrl,
      fetchImpl: opts.fetchImpl
    });
    console.log(`[skills-repo-init] Fetched DoR-approved feature '${opts.fromSaas}' from the SaaS and materialized it locally.`);
  }

  requirePlatformInit(resolvedTarget, platformRoot, force);

  const withOuterLoop = !!opts.withOuterLoop;
  const contextResult = seedContextYml(resolvedTarget, platformRoot, force);
  const stateResult = seedPipelineState(resolvedTarget, force);
  const skillSetResult = installFullSkillSetAndRegistry(resolvedTarget, platformRoot, force);
  const signalResult = ensureOuterLoopSignal(resolvedTarget, withOuterLoop);
  const harnessResult = assembleHarnessInstructions(resolvedTarget, platformRoot, force, signalResult.changed);

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
  if (harnessResult.ran) {
    console.log(`[skills-repo-init] Assembled harness-agnostic instruction files (drift-checked clean): ${harnessResult.files.join(', ')}`);
  } else {
    console.log(`[skills-repo-init] Skipped harness-agnostic instruction assembly: ${harnessResult.reason} (pass --force to regenerate)`);
  }
  console.log(`[skills-repo-init] Outer loop enablement signal: outerLoop.enabled=${signalResult.enabled} in context.yml`);
  if (signalResult.enabled) {
    console.log('[skills-repo-init] Outer-loop skills (discovery through decisions) are presented as active tooling at session start.');
  } else {
    console.log('[skills-repo-init] Outer-loop skills are installed but not enabled. Re-run this same command later with --with-outer-loop (add-on mode) to activate them at session start -- every skill file is already present either way.');
  }
  if (signalResult.changed) {
    console.log('[skills-repo-init] outerLoop.enabled flipped to true -- regenerated the instruction file to reflect it.');
  }
  console.log('[skills-repo-init] Done.');
}

module.exports = { resolvePlatformRoot, runInit, installFullSkillSetAndRegistry, assembleHarnessInstructions, ensureOuterLoopSignal, HARNESS_INSTRUCTION_FILES };
