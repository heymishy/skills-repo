#!/usr/bin/env node
'use strict';

// check-capture-completeness.js
// Scans artefact files for ## Capture Block sections and reports field completeness.
// Governed by spc.5 — artefacts/2026-04-18-skill-performance-capture/
//
// Usage:
//   node scripts/check-capture-completeness.js [--artefact-dir <path>]
//
// Exit codes:
//   0 — completeness >= 80% (or instrumentation.enabled is false — skip mode)
//   1 — completeness < 80%
//
// Plain Node.js — no external dependencies.

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = ['experiment_id', 'model_label', 'cost_tier', 'skill_name', 'artefact_path', 'run_timestamp'];
const COMPLETENESS_THRESHOLD = 80;

// ── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let artefactDir = path.join(__dirname, '..', 'artefacts');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--artefact-dir' && args[i + 1]) {
    artefactDir = path.resolve(args[i + 1]);
    i++;
  }
}

// ── Check instrumentation.enabled flag ──────────────────────────────────────

function readInstrumentationEnabled() {
  const contextPaths = [
    path.join(__dirname, '..', '.github', 'context.yml'),
    path.join(__dirname, '..', 'contexts', 'personal.yml'),
  ];
  for (const p of contextPaths) {
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, 'utf8');
      const lines = raw.split(/\r?\n/);
      let inBlock = false;
      for (const line of lines) {
        if (/^instrumentation\s*:/.test(line)) { inBlock = true; continue; }
        if (inBlock) {
          if (line.length > 0 && !/^\s/.test(line) && !/^#/.test(line)) break;
          const m = line.match(/^\s{2,}enabled\s*:\s*(true|false)/);
          if (m) return m[1] === 'true';
        }
      }
    } catch (_) { /* ignore */ }
  }
  return false; // default: disabled
}

const instrumentationEnabled = readInstrumentationEnabled();

if (!instrumentationEnabled) {
  console.log('[capture-completeness] instrumentation.enabled is false — skipping capture block scan.');
  process.exit(0);
}

// ── Scan artefact directory for .md files ───────────────────────────────────

function findMdFiles(dir, results) {
  results = results || [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findMdFiles(full, results);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

const mdFiles = findMdFiles(artefactDir);

// ── Parse capture blocks ─────────────────────────────────────────────────────

function parseCaptureBlock(content) {
  // Find ## Capture Block section
  const blockMatch = content.match(/^## Capture Block[\s\S]*?(?=^## |\n---|\Z)/m);
  if (!blockMatch) return null;
  const block = blockMatch[0];
  const presentFields = REQUIRED_FIELDS.filter(f => {
    // field is present if it appears in a table row with a non-empty value
    // e.g. | experiment_id | some-value |
    const fieldRe = new RegExp(`\\|\\s*${f}\\s*\\|\\s*([^|\\n]+)\\s*\\|`);
    const m = block.match(fieldRe);
    if (!m) return false;
    const val = m[1].trim();
    return val.length > 0 && val !== '<!-- ...' && !val.startsWith('<!--');
  });
  return {
    totalFields: REQUIRED_FIELDS.length,
    presentFields: presentFields.length,
    missingFields: REQUIRED_FIELDS.filter(f => !presentFields.includes(f)),
  };
}

// ── Evaluate all files ───────────────────────────────────────────────────────

const withBlocks = [];
const withoutBlocks = [];

for (const filePath of mdFiles) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (_) { continue; }

  const result = parseCaptureBlock(content);
  if (result) {
    withBlocks.push({ filePath, ...result });
  } else {
    withoutBlocks.push(filePath);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

if (withBlocks.length === 0 && withoutBlocks.length === 0) {
  console.log(`[capture-completeness] No .md files found in ${artefactDir}.`);
  process.exit(0);
}

if (withBlocks.length === 0) {
  console.log(`[capture-completeness] No capture blocks found in ${mdFiles.length} artefact file(s).`);
  console.log(`  Files without capture blocks: ${withoutBlocks.length}`);
  process.exit(0);
}

// Compute field completeness across all blocks
let totalFields = 0;
let presentFields = 0;
const incompleteFiles = [];

for (const b of withBlocks) {
  totalFields += b.totalFields;
  presentFields += b.presentFields;
  if (b.missingFields.length > 0) {
    incompleteFiles.push({ filePath: b.filePath, missingFields: b.missingFields });
  }
}

const completenessPercent = totalFields > 0 ? Math.round((presentFields / totalFields) * 100) : 100;

console.log(`[capture-completeness] Scanned ${mdFiles.length} file(s), found ${withBlocks.length} capture block(s).`);
console.log(`  Field completeness: ${presentFields}/${totalFields} fields filled = ${completenessPercent}%`);

if (withoutBlocks.length > 0) {
  console.log(`  Files without capture blocks (${withoutBlocks.length}):`);
  for (const f of withoutBlocks) {
    console.log(`    - ${path.relative(process.cwd(), f)}`);
  }
}

if (incompleteFiles.length > 0) {
  console.log(`  Incomplete capture blocks (${incompleteFiles.length}):`);
  for (const { filePath, missingFields } of incompleteFiles) {
    console.log(`    - ${path.relative(process.cwd(), filePath)}: missing ${missingFields.join(', ')}`);
  }
}

if (completenessPercent >= COMPLETENESS_THRESHOLD) {
  console.log(`  [PASS] Completeness ${completenessPercent}% >= threshold ${COMPLETENESS_THRESHOLD}%`);
  process.exit(0);
} else {
  console.error(`  [FAIL] Completeness ${completenessPercent}% < threshold ${COMPLETENESS_THRESHOLD}%`);
  process.exit(1);
}
