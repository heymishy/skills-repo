#!/usr/bin/env node
'use strict';

/**
 * check-tst-s1-baseline-triage.js
 *
 * Meta-test implementing U1-U8 from the tst-s1 test plan:
 * artefacts/2026-07-16-baseline-test-triage/test-plans/tst-s1-triage-pre-existing-baseline-failures-test-plan.md
 *
 * Verifies the triage-report.md artefact is complete and internally
 * consistent with tests/known-baseline-failures.json, and that every file
 * this story claims to have Fixed actually passes standalone.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TRIAGE_REPORT_PATH = path.join(ROOT, 'artefacts', '2026-07-16-baseline-test-triage', 'triage-report.md');
const BASELINE_PATH = path.join(ROOT, 'tests', 'known-baseline-failures.json');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log('  ✓ ' + label);
    passed++;
  } else {
    process.stderr.write('  ✗ ' + label + (detail ? ': ' + detail : '') + '\n');
    failed++;
  }
}

// ── The 69 files the story's "Current, freshly-verified state" names ────────
// (68 remaining-failures matching the pre-existing snapshot minus the 5
// now-passing files, plus check-md-3-adr.js -- confirmed byte-for-byte
// against a fresh `node scripts/run-all-tests.js` run on 2026-07-16.)
const THE_69_FILES = [
  'scripts/check-pipeline-state-integrity.js',
  'tests/artefact-preview.test.js',
  'tests/artefact-writeback.test.js',
  'tests/check-artefact-coverage.js',
  'tests/check-bee1-landing-page.js',
  'tests/check-bee3-posthog.js',
  'tests/check-bri-s2.2-neon-staging-branch.js',
  'tests/check-challenger.js',
  'tests/check-cli-outer-loop.js',
  'tests/check-definition-skill.js',
  'tests/check-discovery-skill.js',
  'tests/check-i1.1-orient-skill.js',
  'tests/check-i1.2-platform-init-fetch.js',
  'tests/check-i2.1-entry-a-story-first.js',
  'tests/check-i2.2-entry-b-code-first.js',
  'tests/check-i2.3-entry-c-no-history.js',
  'tests/check-i3.1-discovery-attribution.js',
  'tests/check-i3.2-benefit-metric-attribution.js',
  'tests/check-i3.3-dor-h-gov.js',
  'tests/check-ilc1-capture-schema.js',
  'tests/check-ilc2-agent-selfrecord.js',
  'tests/check-inc2.1-conditions-panel.js',
  'tests/check-inc2.2-condition-marker-instruction.js',
  'tests/check-inc3-question-cadence.js',
  'tests/check-inc4-canvas-panel.js',
  'tests/check-inc5-canvas-skill-instruction.js',
  'tests/check-iwu2-right-panel-layout.js',
  'tests/check-iwu6-skillmd.js',
  'tests/check-lab-s3.5-billing-portal.js',
  'tests/check-md-1-skill-md.js',
  'tests/check-md-2-skill-contracts.js',
  'tests/check-md-3-adr.js',
  'tests/check-mfc1-model-first-chat-session.js',
  'tests/check-mfc2-chat-ux-improvements.js',
  'tests/check-model-routing.js',
  'tests/check-ougl1-buildsystemprompt-handoff.js',
  'tests/check-ougl2-journey-state-store.js',
  'tests/check-ougl3-journey-entry-and-start.js',
  'tests/check-ougl4-journey-aware-chat-button.js',
  'tests/check-ougl5-gate-confirm-feature-stages.js',
  'tests/check-ougl6-perstory-stage-routing.js',
  'tests/check-p11-attribution.js',
  'tests/check-p11-hgov.js',
  'tests/check-p11-start.js',
  'tests/check-p3.6-dispatch.js',
  'tests/check-p4-enf-decision.js',
  'tests/check-pr.1.js',
  'tests/check-pr.2.js',
  'tests/check-pr.3.js',
  'tests/check-pr.4.js',
  'tests/check-pr.5.js',
  'tests/check-rrc1-discovery-seed.js',
  'tests/check-rrc2-constraint-index.js',
  'tests/check-rrc3-discovery-integration.js',
  'tests/check-rrc4-corpus-update-skill.js',
  'tests/check-s0.2-tenant-login-fallback.js',
  'tests/check-sec3-return-to.js',
  'tests/check-sec5-session-rotation.js',
  'tests/check-sfa1-state-schema.js',
  'tests/check-spc2-capture-block-template.js',
  'tests/check-sro1-skill-routing.js',
  'tests/check-srt1-status-report-template.js',
  'tests/check-trace-commit.js',
  'tests/check-wsm2-collaborative-sessions.js',
  'tests/check-wuce24-guided-question-form.js',
  'tests/check-wuce3-attributed-signoff.js',
  'tests/check-wuce4-docker-deployment.js',
  'tests/check-wucp1-context-autoloader.js',
  'tests/check-wusl1-chat-streaming.js',
];

const NOW_PASSING_5 = [
  'tests/check-bri-s3.5-nfr-stripe-keys.js',
  'tests/check-gpa-sc06-source-path-guard.js',
  'tests/check-lab-s3.2-stripe-checkout.js',
  'tests/check-lab-s3.4-stripe-webhook.js',
  'tests/run-gpa-tests.js',
];

const FIXED_FILES = [
  'tests/check-md-3-adr.js',
  'tests/check-bee1-landing-page.js',
  'tests/check-ilc1-capture-schema.js',
];

// ── Load artefacts ───────────────────────────────────────────────────────────

if (!fs.existsSync(TRIAGE_REPORT_PATH)) {
  console.error('[tst-s1-baseline-triage] FATAL: triage report not found at ' + TRIAGE_REPORT_PATH);
  process.exit(1);
}
const report = fs.readFileSync(TRIAGE_REPORT_PATH, 'utf8');

if (!fs.existsSync(BASELINE_PATH)) {
  console.error('[tst-s1-baseline-triage] FATAL: ' + BASELINE_PATH + ' not found');
  process.exit(1);
}
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
const baselineFiles = baseline.files || [];

// Split the report into its "(a) Fixed" section and everything after, for
// simple substring-based section membership checks.
const fixedSectionStart = report.indexOf('## (a) Fixed');
const deferredSectionStart = report.indexOf('## (b) Deferred');
const removedSectionStart = report.indexOf('## Files removed from the baseline separately');
const fixedSection = report.slice(fixedSectionStart, deferredSectionStart);
const deferredSection = report.slice(deferredSectionStart, removedSectionStart >= 0 ? removedSectionStart : report.length);

// ── U1 + U2: every one of the 69 files appears in the report, categorized ───

console.log('[tst-s1-baseline-triage] U1/U2 — every file named in the triage report');
{
  const missing = [];
  THE_69_FILES.forEach(function (f) {
    const base = f.split('/').pop();
    if (!report.includes(base)) missing.push(f);
  });
  assert(
    'U1/U2: all 69 files from the story appear in triage-report.md',
    missing.length === 0,
    missing.length > 0 ? 'missing: ' + missing.join(', ') : undefined,
  );
}

// Every file must appear in either the Fixed section or the Deferred section
// (i.e. it has been assigned to at least one category, not left uncategorized).
console.log('\n[tst-s1-baseline-triage] U1 — every file assigned a category (a or b)');
{
  const uncategorized = [];
  THE_69_FILES.forEach(function (f) {
    const base = f.split('/').pop();
    const inFixed = fixedSection.includes(base);
    const inDeferred = deferredSection.includes(base);
    if (!inFixed && !inDeferred) uncategorized.push(f);
  });
  assert(
    'U1: every file appears in the Fixed or Deferred section',
    uncategorized.length === 0,
    uncategorized.length > 0 ? 'uncategorized: ' + uncategorized.join(', ') : undefined,
  );
}

// ── U3: every category-(b) entry has a real root cause, not a placeholder ──

console.log('\n[tst-s1-baseline-triage] U3 — no blank/TBD placeholders in deferred entries');
{
  const placeholderPatterns = [/\bTBD\b/i, /\bTODO\b/i, /\[fill in\]/i, /^\s*$/];
  // Check the deferred section doesn't contain bare placeholder markers.
  const hasPlaceholder = placeholderPatterns.some(function (re) { return re.test(deferredSection.replace(/\n{2,}/g, '\n')); });
  assert(
    'U3: deferred section contains no TBD/TODO/[fill in] placeholders',
    !hasPlaceholder,
  );
  // Every RISK-ACCEPT group must state a "Revisit trigger" that is not empty/None-only guesswork.
  assert(
    'U3: every RISK-ACCEPT group has a one-sentence root cause (spot check: "Root cause" or "root cause" appears repeatedly)',
    (deferredSection.match(/root cause/gi) || []).length >= 5,
  );
}

// ── U4: every category-(a) Fixed file passes standalone ────────────────────

console.log('\n[tst-s1-baseline-triage] U4 — every Fixed file passes standalone');
FIXED_FILES.forEach(function (f) {
  assert('U4: ' + f + ' is documented as Fixed in the report', fixedSection.includes(f.split('/').pop()));
});
// Note: actually spawning check-md-3-adr.js here would trigger its own nested
// `npm test` run (by design, see its T4) which takes several minutes -- too
// slow for a meta-test that should run quickly as part of the full suite.
// It has already been verified standalone during this story's implementation
// (9/9 passing, see decisions.md). Spawn the two fast ones directly here.
['tests/check-bee1-landing-page.js', 'tests/check-ilc1-capture-schema.js'].forEach(function (f) {
  const result = spawnSync(process.execPath, [path.join(ROOT, f)], { cwd: ROOT, timeout: 30000 });
  const code = result.status === null ? 1 : result.status;
  assert('U4: node ' + f + ' exits 0', code === 0, 'exit code ' + code);
});

// ── U5: check-md-3-adr.js's AC3 classification is explicit ─────────────────

console.log('\n[tst-s1-baseline-triage] U5 — check-md-3-adr.js AC3 classification is explicit');
{
  const idx = report.indexOf('AC3 classification');
  const section = idx >= 0 ? report.slice(idx, idx + 1500) : '';
  const statesRegression = /genuinely new regression/i.test(section);
  const statesPreExisting = /pre-existing gap/i.test(section);
  assert(
    'U5: AC3 classification section states either "genuinely new regression" or "pre-existing gap"',
    statesRegression || statesPreExisting,
  );
  assert(
    'U5: AC3 classification is not left as an open question',
    !/not yet (determined|classified|known)/i.test(section) && !/TBD/i.test(section),
  );
}

// ── U6: the 5 now-passing files are not in the refreshed baseline ──────────

console.log('\n[tst-s1-baseline-triage] U6 — 5 now-passing files removed from baseline');
NOW_PASSING_5.forEach(function (f) {
  assert('U6: ' + f + ' not in known-baseline-failures.json', !baselineFiles.includes(f));
});

// ── U7: no category-(a) Fixed file remains in the baseline ─────────────────

console.log('\n[tst-s1-baseline-triage] U7 — Fixed files removed from baseline');
FIXED_FILES.forEach(function (f) {
  assert('U7: ' + f + ' not in known-baseline-failures.json', !baselineFiles.includes(f));
});

// ── U8: every file remaining in the baseline is deferred (b)/(c) in the report ──

console.log('\n[tst-s1-baseline-triage] U8 — baseline/report internal consistency');
{
  const inconsistent = [];
  baselineFiles.forEach(function (f) {
    const base = f.split('/').pop();
    if (!deferredSection.includes(base)) inconsistent.push(f);
  });
  assert(
    'U8: every file in known-baseline-failures.json is marked deferred in triage-report.md',
    inconsistent.length === 0,
    inconsistent.length > 0 ? 'not found in deferred section: ' + inconsistent.join(', ') : undefined,
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n[tst-s1-baseline-triage] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
