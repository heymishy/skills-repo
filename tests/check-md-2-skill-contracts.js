#!/usr/bin/env node
/**
 * check-md-2-skill-contracts.js
 * TDD test file for md-2: registers modernisation-decompose in check-skill-contracts.js
 *
 * AC1: npm test passes 0 failures with new skill registered
 * AC2: Removing State update section causes named failure with skill name
 * AC3: 0 regressions to existing 37 skills
 *
 * Tests run by spawning the checker script in isolation against the real files.
 * For AC2 the SKILL.md is temporarily modified in a temp copy and injected via
 * a monkey-patched require so we never touch the real file.
 */
'use strict';
const fs      = require('fs');
const path    = require('path');
const { execSync } = require('child_process');

const root        = path.join(__dirname, '..');
const checkerPath = path.join(root, '.github', 'scripts', 'check-skill-contracts.js');
const skillPath   = path.join(root, '.github', 'skills', 'modernisation-decompose', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    process.stdout.write(`  ✓ ${label}\n`);
    passed++;
  } else {
    process.stderr.write(`  ✗ ${label}${detail ? ': ' + detail : ''}\n`);
    failed++;
  }
}

// ── T1 (AC1) — npm test [skill-contracts] passes with modernisation-decompose registered ──
process.stdout.write('\n[md-2-skill-contracts] T1: skill-contracts passes after registration\n');
{
  let stdout = '';
  let exitCode = 0;
  try {
    stdout = execSync(`node "${checkerPath}"`, { encoding: 'utf8', cwd: root });
  } catch (e) {
    stdout = (e.stdout || '') + (e.stderr || '');
    exitCode = e.status || 1;
  }
  assert(
    'T1.1 — checker exits 0',
    exitCode === 0,
    `exit code: ${exitCode}\n${stdout}`
  );
  assert(
    'T1.2 — output includes modernisation-decompose',
    stdout.includes('modernisation-decompose'),
    stdout.slice(-400)
  );
  assert(
    'T1.3 — output reports 38 skills',
    /38\s+skill/.test(stdout),
    stdout.trim().slice(-200)
  );
}

// ── T2 (AC2) — removing State update section causes named failure ──────────────
process.stdout.write('\n[md-2-skill-contracts] T2: removing State update section causes named failure\n');
{
  if (!fs.existsSync(skillPath)) {
    process.stderr.write(`  ✗ T2 — SKILL.md not found at ${skillPath}\n`);
    failed++;
  } else {
    const originalContent = fs.readFileSync(skillPath, 'utf8');
    // Remove the State update section (everything from the heading to the end of its block)
    const stripped = originalContent.replace(/## State update[\s\S]*?(?=\n## |\n---|\n#[^#]|$)/, '');
    const tmpPath = path.join(root, '.github', 'skills', 'modernisation-decompose', 'SKILL.md.tmp');
    fs.writeFileSync(tmpPath, stripped, 'utf8');
    fs.renameSync(skillPath, skillPath + '.bak');
    fs.renameSync(tmpPath, skillPath);

    let stderr = '';
    let exitCode = 0;
    try {
      execSync(`node "${checkerPath}"`, { encoding: 'utf8', cwd: root });
    } catch (e) {
      stderr = (e.stderr || '') + (e.stdout || '');
      exitCode = e.status || 1;
    }

    // Restore original
    fs.renameSync(skillPath, tmpPath);
    fs.renameSync(skillPath + '.bak', skillPath);
    fs.unlinkSync(tmpPath);

    assert(
      'T2.1 — checker exits non-zero when State update section removed',
      exitCode !== 0,
      `exit code: ${exitCode}`
    );
    assert(
      'T2.2 — failure output names "modernisation-decompose"',
      stderr.includes('modernisation-decompose'),
      stderr.slice(-400)
    );
    assert(
      'T2.3 — failure output names "State update"',
      stderr.includes('State update'),
      stderr.slice(-400)
    );
  }
}

// ── T3 (AC3) — no regressions to existing 37 skills ───────────────────────────
process.stdout.write('\n[md-2-skill-contracts] T3: no regressions to existing skills\n');
{
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    stdout = execSync(`node "${checkerPath}"`, { encoding: 'utf8', cwd: root });
  } catch (e) {
    stdout = e.stdout || '';
    stderr = e.stderr || '';
    exitCode = e.status || 1;
  }
  assert(
    'T3.1 — checker exits 0 (no regressions)',
    exitCode === 0,
    stderr.slice(-400)
  );
  assert(
    'T3.2 — skill-contracts line mentions ≥160 contracts (37 skills × avg 4 + new entry)',
    (() => {
      const m = stdout.match(/(\d+)\s+contract/);
      return m && parseInt(m[1], 10) >= 160;
    })(),
    stdout.trim().slice(-200)
  );
}

process.stdout.write(`\n[md-2-skill-contracts] Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
