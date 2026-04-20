#!/usr/bin/env node
/**
 * src/improvement-agent/compliance-report.js
 *
 * Compliance monitoring report generator (p3.13).
 *
 * Generates workspace/compliance-reports/compliance-[YYYY-MM].md from a
 * cross-team trace registry query result.  Intended to be called monthly
 * by the GitHub Actions schedule job (.github/workflows/compliance-report.yml).
 *
 * Exports:
 *   generateComplianceReport(options) → { outputPath, squadResults }
 *
 * Options:
 *   traces       {object[]}  — flat array of trace entries (each with _squadId)
 *                              Normally produced by getTraces({filter:{period:'last-30-days'}})
 *   outputDir    {string}    — directory to write the report (default: workspace/compliance-reports)
 *   currentDate  {Date}      — date for YYYY-MM filename (default: new Date())
 *   registryPath {string}    — registry path reference for report header
 *                              (default: platform/traces/)
 *
 * Gap threshold policy (AC3): squads where >10% of traces are missing a gate
 * verdict are marked FAIL.  Exactly 10% is PASS.
 *
 * T3M1 fields checked per trace (AC2, p3.2a):
 *   standardsInjected, watermarkResult, stalenessFlag, sessionIdentity
 *
 * Tamper-evidence field (AC2, p3.2b — optional):
 *   tamperEvidence.registryRef — noted absent when field not present.
 *
 * Zero external npm dependencies — plain Node.js (fs, path) only.
 *
 * Reference: artefacts/2026-04-14-skills-platform-phase3/stories/p3.13-compliance-monitoring-report.md
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var ROOT                 = path.join(__dirname, '..', '..');
var DEFAULT_OUTPUT_DIR   = path.join(ROOT, 'workspace', 'compliance-reports');
var DEFAULT_REGISTRY_PATH = 'platform/traces/';
var GAP_THRESHOLD        = 0.10; // >10% triggers FAIL
var T3M1_FIELDS          = ['standardsInjected', 'watermarkResult', 'stalenessFlag', 'sessionIdentity'];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format a Date as YYYY-MM.
 * @param {Date} d
 * @returns {string}
 */
function formatYearMonth(d) {
  var year  = d.getUTCFullYear();
  var month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return year + '-' + month;
}

/**
 * Check whether a trace entry has a gate verdict.
 * A gate verdict is present when the `gateVerdict` field is a non-empty string.
 * @param {object} entry
 * @returns {boolean}
 */
function hasGateVerdict(entry) {
  return typeof entry.gateVerdict === 'string' && entry.gateVerdict.length > 0;
}

/**
 * Return a list of missing T3M1 field names from a trace entry.
 * @param {object} entry
 * @returns {string[]}
 */
function missingT3m1Fields(entry) {
  return T3M1_FIELDS.filter(function (field) {
    return entry[field] === undefined || entry[field] === null;
  });
}

/**
 * Check whether a trace has tamper-evidence populated.
 * @param {object} entry
 * @returns {boolean}
 */
function hasTamperEvidence(entry) {
  return entry.tamperEvidence &&
         typeof entry.tamperEvidence === 'object' &&
         typeof entry.tamperEvidence.registryRef === 'string' &&
         entry.tamperEvidence.registryRef.length > 0;
}

// ── Per-squad analysis ────────────────────────────────────────────────────────

/**
 * Analyse all traces for a single squad.
 *
 * @param {string}   squadId
 * @param {object[]} entries  — trace entries for this squad only
 * @returns {object}  squad result record
 */
function analyseSquad(squadId, entries) {
  var traceCount        = entries.length;
  var missingGate       = entries.filter(function (e) { return !hasGateVerdict(e); });
  var gapCount          = missingGate.length;
  var gapRate           = traceCount > 0 ? gapCount / traceCount : 0;
  var complianceStatus  = gapRate > GAP_THRESHOLD ? 'FAIL' : 'PASS';

  // Gate verdict presence summary
  var gateVerdictsPresent = gapCount === 0 ? 'yes' : 'no (' + gapCount + ' missing)';

  // T3M1 field presence
  var allMissingT3m1 = [];
  entries.forEach(function (e) {
    missingT3m1Fields(e).forEach(function (f) {
      if (allMissingT3m1.indexOf(f) === -1) allMissingT3m1.push(f);
    });
  });
  var totalMissingT3m1 = entries.reduce(function (acc, e) {
    return acc + missingT3m1Fields(e).length;
  }, 0);
  var t3m1FieldsPopulated = totalMissingT3m1 === 0
    ? 'yes'
    : 'no (missing: ' + allMissingT3m1.join(', ') + '; count: ' + totalMissingT3m1 + ')';

  // Tamper evidence
  var tamperCount     = entries.filter(hasTamperEvidence).length;
  var tamperEvidence  = tamperCount === traceCount
    ? 'verified (' + tamperCount + '/' + traceCount + ')'
    : tamperCount > 0
      ? 'partial (' + tamperCount + '/' + traceCount + ')'
      : 'not available this cycle';

  // Gap detail: slugs of traces missing gate verdict
  var gapSlugs = missingGate
    .map(function (e) { return e.storySlug || '(unknown)'; })
    .slice(0, 20); // cap list length in report

  return {
    squadId:            squadId,
    traceCount:         traceCount,
    gateVerdictsPresent: gateVerdictsPresent,
    t3m1FieldsPopulated: t3m1FieldsPopulated,
    tamperEvidence:     tamperEvidence,
    gapCount:           gapCount,
    gapRate:            gapRate,
    complianceStatus:   complianceStatus,
    gapSlugs:           gapSlugs,
  };
}

// ── Report renderer ───────────────────────────────────────────────────────────

/**
 * Render the markdown compliance report from squad results.
 *
 * @param {object[]} squadResults
 * @param {object}   meta  — { period, sampleSize, policyThreshold, registryPath }
 * @returns {string}
 */
function renderReport(squadResults, meta) {
  var lines = [];

  lines.push('# Compliance Monitoring Report');
  lines.push('');
  lines.push('**Period:** ' + meta.period);
  lines.push('**Generated:** ' + meta.generatedAt);
  lines.push('**Policy threshold:** ' + meta.policyThreshold + ' (squads with >' +
    meta.policyThreshold + ' traces missing gate verdicts are marked FAIL)');
  lines.push('**Sample size:** ' + meta.sampleSize + ' total traces reviewed');
  lines.push('**Registry path:** ' + meta.registryPath);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Squad ID | Trace Count | Gate Verdicts Present | T3M1 Fields Populated | Gap Count | Compliance Status |');
  lines.push('|---|---|---|---|---|---|');
  squadResults.forEach(function (r) {
    lines.push('| ' + r.squadId +
      ' | ' + r.traceCount +
      ' | ' + r.gateVerdictsPresent +
      ' | ' + r.t3m1FieldsPopulated +
      ' | ' + r.gapCount +
      ' | **' + r.complianceStatus + '** |');
  });
  lines.push('');

  // Per-squad detail sections
  lines.push('---');
  lines.push('');
  lines.push('## Per-squad detail');
  lines.push('');

  squadResults.forEach(function (r) {
    lines.push('### ' + r.squadId);
    lines.push('');
    lines.push('- **Squad ID:** ' + r.squadId);
    lines.push('- **Trace Count:** ' + r.traceCount);
    lines.push('- **Gate Verdicts Present:** ' + r.gateVerdictsPresent);
    lines.push('- **T3M1 Fields Populated:** ' + r.t3m1FieldsPopulated);
    lines.push('- **Tamper Evidence:** ' + r.tamperEvidence);
    lines.push('- **Gap Count:** ' + r.gapCount + ' (' + (r.gapRate * 100).toFixed(1) + '%)');
    lines.push('- **Compliance Status:** ' + r.complianceStatus);

    if (r.complianceStatus === 'FAIL') {
      lines.push('');
      lines.push('**Gap details — traces missing gate verdict:**');
      lines.push('');
      if (r.gapSlugs.length > 0) {
        r.gapSlugs.forEach(function (slug) {
          lines.push('- Missing gate verdict: `' + slug + '`');
        });
        if (r.gapCount > r.gapSlugs.length) {
          lines.push('- ... and ' + (r.gapCount - r.gapSlugs.length) + ' more');
        }
      } else {
        lines.push('- (no slugs available)');
      }
    }

    lines.push('');
  });

  return lines.join('\n');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a compliance report from a pre-fetched array of trace entries.
 *
 * Normally called with the result of:
 *   getTraces({ filter: { period: 'last-30-days' }, registryDir })
 *
 * @param {object} options
 * @param {object[]} options.traces        — flat array of trace entries with _squadId
 * @param {string}  [options.outputDir]    — defaults to workspace/compliance-reports/
 * @param {Date}    [options.currentDate]  — for YYYY-MM filename (defaults to now)
 * @param {string}  [options.registryPath] — registry path for report header
 * @returns {{ outputPath: string, squadResults: object[] }}
 */
function generateComplianceReport(options) {
  var opts         = options || {};
  var traces       = opts.traces || [];
  var outputDir    = opts.outputDir || DEFAULT_OUTPUT_DIR;
  var currentDate  = opts.currentDate || new Date();
  var registryPath = opts.registryPath || DEFAULT_REGISTRY_PATH;

  // Group traces by _squadId
  var bySquad = {};
  traces.forEach(function (entry) {
    var sid = entry._squadId || 'unknown';
    if (!bySquad[sid]) bySquad[sid] = [];
    bySquad[sid].push(entry);
  });

  var squadIds    = Object.keys(bySquad).sort();
  var squadResults = squadIds.map(function (sid) {
    return analyseSquad(sid, bySquad[sid]);
  });

  var sampleSize = traces.length;
  var period     = 'last 30 days';
  var yearMonth  = formatYearMonth(currentDate);

  var meta = {
    period:          period,
    sampleSize:      sampleSize,
    policyThreshold: '10%',
    registryPath:    registryPath,
    generatedAt:     currentDate.toISOString().slice(0, 10),
  };

  var content    = renderReport(squadResults, meta);
  var filename   = 'compliance-' + yearMonth + '.md';

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  var outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, content, 'utf8');

  return { outputPath: outputPath, squadResults: squadResults };
}

module.exports = {
  generateComplianceReport: generateComplianceReport,
  // Exposed for testing
  formatYearMonth:   formatYearMonth,
  analyseSquad:      analyseSquad,
  GAP_THRESHOLD:     GAP_THRESHOLD,
};

// ── CLI entry ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  var { getTraces } = require(path.join(ROOT, 'src', 'trace-registry', 'getTraces.js'));
  var traces = getTraces({ filter: { period: 'last-30-days' } });
  var result = generateComplianceReport({ traces: traces });
  process.stdout.write('Compliance report written to: ' + result.outputPath + '\n');
  process.stdout.write('Squads evaluated: ' + result.squadResults.length + '\n');
  var failCount = result.squadResults.filter(function (r) { return r.complianceStatus === 'FAIL'; }).length;
  process.stdout.write('FAIL: ' + failCount + ', PASS: ' + (result.squadResults.length - failCount) + '\n');
}
