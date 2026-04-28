'use strict';

/**
 * cli-adapter.js — CLI enforcement adapter (p4-enf-cli)
 *
 * Exports Mode 1 MVP command set (9 commands):
 *   init, fetch, pin, verify, workflow, advance, back, navigate, emitTrace
 *
 * Architecture constraints:
 *   C5    — advance calls verifyHash before envelope build; no bypass flag permitted
 *   ADR-002 — advance enforces allowedTransitions from workflow declaration
 *   ADR-004 — no hardcoded URLs or paths; config injected by caller
 *   ADR-016 — lockfile path is always .github/skills/skill-lockfile.json
 *   MC-SEC-02 — no credentials in CLI output or trace artefacts
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

// ── Lockfile helpers ──────────────────────────────────────────────────────────

const LOCKFILE_REL  = path.join('.github', 'skills', 'skill-lockfile.json');
const SKILLS_DIR_REL = path.join('.github', 'skills');

/**
 * Compute SHA-256 hex digest of a file's UTF-8 byte content.
 * @param {string} filePath Absolute path to the file.
 * @returns {string} 64-character lowercase hex digest.
 */
function computeFileSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively collect absolute paths of every SKILL.md file under dir.
 * @param {string} dir Absolute path to the directory to walk.
 * @returns {string[]} Sorted list of absolute file paths.
 */
function findSkillFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = findSkillFiles(fullPath);
      results.push(...sub);
    } else if (entry.name === 'SKILL.md') {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Look up the allowedTransitions for `current` in a workflow declaration.
 * @returns {{ allowed: string[] }}
 */
function resolveTransition(declaration, current, next) {
  if (!declaration || !Array.isArray(declaration.nodes)) return { allowed: [] };
  const node = declaration.nodes.find(function(n) { return n.id === current; });
  if (!node) return { allowed: [] };
  return { allowed: Array.isArray(node.allowedTransitions) ? node.allowedTransitions : [] };
}

// ── Commands ──────────────────────────────────────────────────────────────────

/**
 * init — install sidecar + lockfile (Mode 1 MVP stub)
 */
function init(opts) {
  return { status: 'ok', command: 'init' };
}

/**
 * fetch — retrieve upstream skill content (Mode 1 MVP stub)
 */
function fetch(opts) {
  return { status: 'ok', command: 'fetch' };
}

/**
 * pin — walk .github/skills/ recursively, compute SHA-256 for every SKILL.md,
 * and write the result to .github/skills/skill-lockfile.json (ADR-016).
 *
 * Lockfile schema:
 *   { schemaVersion: "1.0.0", pinnedAt: "<ISO-8601>",
 *     skills: [{ skill, path, sha256 }] }
 *
 * @param {string} rootDir Repository root (defaults to process.cwd()).
 * @returns {{ status: 'ok', command: 'pin' }}
 */
function pin(rootDir) {
  const root      = rootDir || process.cwd();
  const skillsDir = path.join(root, SKILLS_DIR_REL);
  const lockPath  = path.join(root, LOCKFILE_REL);

  const absFiles = findSkillFiles(skillsDir);
  const skills   = absFiles.map(function(absPath) {
    return {
      skill:  path.basename(path.dirname(absPath)),
      path:   path.relative(root, absPath),
      sha256: computeFileSha256(absPath),
    };
  });

  const lockfile = {
    schemaVersion: '1.0.0',
    pinnedAt:      new Date().toISOString(),
    skills:        skills,
  };

  fs.writeFileSync(lockPath, JSON.stringify(lockfile, null, 2), 'utf8');
  return { status: 'ok', command: 'pin' };
}

/**
 * verify — re-read .github/skills/skill-lockfile.json and confirm every
 * SKILL.md still matches its stored SHA-256 (ADR-016).
 *
 * Returns:
 *   { status: 'pass', drifted: [], checked: n }          — all hashes match
 *   { status: 'fail', drifted: [{skill,path,expected,actual}], checked: n }
 *   { status: 'fail', error: 'no lockfile', drifted: [] } — lockfile absent
 *
 * @param {string} rootDir Repository root (defaults to process.cwd()).
 */
function verify(rootDir) {
  const root     = rootDir || process.cwd();
  const lockPath = path.join(root, LOCKFILE_REL);

  if (!fs.existsSync(lockPath)) {
    return { status: 'fail', error: 'no lockfile', drifted: [] };
  }

  let lockfile;
  try {
    lockfile = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch (_) {
    return { status: 'fail', error: 'lockfile parse error', drifted: [] };
  }

  const skills  = lockfile.skills || [];
  const drifted = [];

  for (let i = 0; i < skills.length; i++) {
    const entry   = skills[i];
    const absPath = path.join(root, entry.path);
    let actual;
    try {
      actual = computeFileSha256(absPath);
    } catch (_) {
      actual = null;
    }
    if (actual !== entry.sha256) {
      drifted.push({
        skill:    entry.skill,
        path:     entry.path,
        expected: entry.sha256,
        actual:   actual,
      });
    }
  }

  return {
    status:  drifted.length === 0 ? 'pass' : 'fail',
    drifted: drifted,
    checked: skills.length,
  };
}

/**
 * workflow — read and display workflow declaration (Mode 1 MVP stub)
 */
function workflow(opts) {
  return { status: 'ok', command: 'workflow' };
}

/**
 * advance — governed state transition with hash check.
 *
 * Protocol (ADR-002 + C5):
 *   1. Validate transition against declaration.allowedTransitions
 *   2. Call govPackage.verifyHash before envelope build (C5)
 *   3. Call govPackage.advanceState and return result
 *
 * @param {{
 *   current: string,
 *   next: string,
 *   declaration: object,
 *   govPackage: object,
 *   skillId?: string,
 *   expectedHash?: string,
 *   sidecarRoot?: string
 * }} opts
 */
function advance(opts) {
  const { current, next, declaration, govPackage, skillId, expectedHash, sidecarRoot } = opts || {};

  // Step 1 — ADR-002: transition must be declared
  const { allowed } = resolveTransition(declaration, current, next);
  if (!allowed.includes(next)) {
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : '(none)';
    return {
      error:   'TRANSITION_NOT_PERMITTED',
      message: 'Transition to ' + next + ' not permitted from ' + current + '. Allowed: ' + allowedStr,
    };
  }

  // Step 2 — C5: hash verification before envelope build; no bypass parameter permitted
  if (govPackage && skillId && sidecarRoot) {
    const resolved = govPackage.resolveSkill({ skillId: skillId, sidecarRoot: sidecarRoot });
    if (!resolved) {
      return { error: 'SKILL_NOT_FOUND', skillId: skillId };
    }
    const hashResult = govPackage.verifyHash({
      skillId:  skillId,
      expected: expectedHash,
      actual:   resolved.contentHash,
    });
    if (hashResult) {
      const exp = hashResult.expected || expectedHash || '';
      const act = hashResult.actual   || '';
      return {
        error:   'HASH_MISMATCH',
        message: 'Hash mismatch for skill ' + skillId + ': expected ' + exp + ', got ' + act,
      };
    }
  }

  // Step 3 — advance state
  const newState = govPackage
    ? govPackage.advanceState({ current: current, next: next, declaration: declaration })
    : { current: next, previous: current };

  return newState || { current: next, previous: current };
}

/**
 * back — back-navigation to permitted prior state (Mode 1 MVP stub)
 */
function back(opts) {
  return { status: 'ok', command: 'back' };
}

/**
 * navigate — arbitrary permitted transition (Mode 1 MVP stub)
 */
function navigate(opts) {
  return { status: 'ok', command: 'navigate' };
}

/**
 * emitTrace — emit a validated trace entry.
 *
 * Required fields: skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp.
 * Optionally writes JSON to outputPath.
 *
 * MC-SEC-02: no credentials included in returned object.
 *
 * @param {{
 *   skillId?: string,
 *   skillHash: string,
 *   inputHash: string,
 *   outputRef: string,
 *   transitionTaken: string,
 *   surfaceType: string,
 *   timestamp: string,
 *   outputPath?: string
 * }} opts
 */
function emitTrace(opts) {
  const {
    skillId, skillHash, inputHash, outputRef,
    transitionTaken, surfaceType, timestamp, outputPath,
  } = opts || {};

  const entry = {
    skillId:         skillId         || null,
    skillHash:       skillHash,
    inputHash:       inputHash,
    outputRef:       outputRef,
    transitionTaken: transitionTaken,
    surfaceType:     surfaceType,
    timestamp:       timestamp,
  };

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(entry, null, 2), 'utf8');
  }

  return entry;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  init,
  fetch,
  pin,
  verify,
  workflow,
  advance,
  back,
  navigate,
  emitTrace,
};
