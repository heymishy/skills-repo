'use strict';

// check-lab-s1.1-auth-spike.js
// Verification script for lab-s1.1: Auth tech spike — ESM/CJS path recommendation
// Checks artefact completeness for AC1 (spike outcome doc) and AC5 (decisions.md update).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed++;
    console.log('PASS:', label);
  } else {
    failed++;
    console.error('FAIL:', label);
  }
}

const repoRoot = path.resolve(__dirname, '..');
const spikePath = path.join(repoRoot, 'artefacts', '2026-07-01-landing-auth-billing', 'research', 'auth-spike-outcome.md');
const decisionsPath = path.join(repoRoot, 'artefacts', '2026-07-01-landing-auth-billing', 'decisions.md');

// --- T1: Spike outcome document ---

// T1.1: file exists
const spikeExists = fs.existsSync(spikePath);
check('T1.1 spike-outcome-doc-exists', spikeExists);

let spikeContent = '';
if (spikeExists) {
  spikeContent = fs.readFileSync(spikePath, 'utf8');
}

// T1.2: contains one of "Path A", "Path B", or "Path C" (the recommendation)
check('T1.2 spike-outcome-contains-path-recommendation',
  spikeContent.includes('Path A') || spikeContent.includes('Path B') || spikeContent.includes('Path C'));

// T1.3: contains "rationale" or "Rationale" (section present)
check('T1.3 spike-outcome-contains-rationale-section',
  /rationale/i.test(spikeContent));

// T1.4: contains "unblocked" or "stories unblocked" (section present)
check('T1.4 spike-outcome-contains-unblocked-stories',
  /unblocked|stories unblocked/i.test(spikeContent));

// T1.5: does NOT contain "DEFERRED" (spike has exited)
check('T1.5 spike-outcome-no-deferred-marker',
  !spikeContent.includes('DEFERRED'));

// --- T2: decisions.md ARCH-002 update ---

const decisionsExists = fs.existsSync(decisionsPath);
let decisionsContent = '';
if (decisionsExists) {
  decisionsContent = fs.readFileSync(decisionsPath, 'utf8');
}

// Extract the ARCH-002 section (from ### ARCH-002 to the next --- separator)
const arch002Match = decisionsContent.match(/### ARCH-002[\s\S]*?(?=\n---|\n### )/);
const arch002Entry = arch002Match ? arch002Match[0] : '';

// T2.1: ARCH-002 entry does NOT contain "DEFERRED to spike exit"
check('T2.1 decisions-md-arch002-not-deferred',
  decisionsExists && !arch002Entry.includes('DEFERRED to spike exit'));

// T2.2: ARCH-002 entry contains the path name ("Path A" or "Path B" or "Path C")
check('T2.2 decisions-md-arch002-contains-chosen-path',
  decisionsExists && (arch002Entry.includes('Path A') || arch002Entry.includes('Path B') || arch002Entry.includes('Path C')));

// --- NFR1: no real API keys or credentials ---
check('NFR1 no-real-credentials-in-spike-artefact',
  !/sk_live_|sk_test_|ghp_|ghs_|DATABASE_URL=postgres:\/\/[^$<]/.test(spikeContent));

// --- Summary ---
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
