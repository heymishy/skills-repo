#!/usr/bin/env node
/**
 * failure-detector.js
 *
 * Failure signal detection, staleness detection, anti-overfitting gate, and
 * proposal generation for the improvement agent (p2.11).
 *
 * Exports:
 *   readContextConfig(contextYmlPath)         — read improvement_agent config from context.yml
 *   getSlidingWindow(traces, surfaceType, n)   — return n most recent traces for a surface type
 *   detectFailureSignals(traces, config)       — detect repeated failure patterns
 *   detectStalenessSignals(traces, config, now)— detect surfaces with no recent activity
 *   checkAntiOverfitting(proposal, windowTraces, windowSize) — anti-overfitting gate
 *   buildFailureProposal(signal, config, now)  — build a failure proposal object
 *   buildStalenessProposal(signal, config, now)— build a staleness proposal object
 *   writeProposalFile(proposalsDir, proposal)  — write proposal markdown file
 *   writeOverfittingWarning(proposalsDir, proposal, gateResult) — write warning file
 *   updateStateJson(stateJsonPath, proposals)  — update workspace/state.json proposals block
 *   runAgent(options)                          — main entry point
 *
 * Evaluation scenario name: s-improvement-agent-failure-clustering
 *
 * All thresholds and windows read from context.yml (improvement_agent.*) — ADR-004.
 * Proposal files must not contain org/squad names or personal identifiers — AP-02.
 * Trace data is redacted before processing — MC-SEC-02 (handled by trace-interface.js).
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

var fs   = require('fs');
var path = require('path');

var traceInterface = require('./trace-interface.js');

// Default values (only used when context.yml is unreadable or key is absent)
var DEFAULT_FAILURE_THRESHOLD    = 3;
var DEFAULT_STALENESS_WINDOW_DAYS = 90;
var DEFAULT_SLIDING_WINDOW_SIZE  = 10;

// Kebab-case validation (failure pattern labels must be kebab-case)
var KEBAB_CASE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ── Config reader ─────────────────────────────────────────────────────────────

/**
 * Read improvement_agent configuration from context.yml.
 * All thresholds read from context.yml (ADR-004 — no hardcoded constants).
 *
 * @param {string} [contextYmlPath] - override path to context.yml
 * @returns {{failurePatternThreshold: number, stalenessWindowDays: number, slidingWindowSize: number}}
 */
function readContextConfig(contextYmlPath) {
  var resolvedPath = contextYmlPath ||
    path.join(__dirname, '..', '..', '.github', 'context.yml');

  var config = {
    failurePatternThreshold: DEFAULT_FAILURE_THRESHOLD,
    stalenessWindowDays:     DEFAULT_STALENESS_WINDOW_DAYS,
    slidingWindowSize:       DEFAULT_SLIDING_WINDOW_SIZE,
  };

  var content;
  try {
    content = fs.readFileSync(resolvedPath, 'utf8');
  } catch (e) {
    return config;
  }

  var lines = content.split('\n');
  var inSection = false;
  var sectionIndent = -1;

  for (var i = 0; i < lines.length; i++) {
    var raw     = lines[i].replace(/\s*#.*$/, '').trimRight();
    if (!raw.trim()) continue;

    var indent  = raw.match(/^(\s*)/)[1].length;
    var trimmed = raw.trim();

    if (!inSection) {
      if (trimmed === 'improvement_agent:') {
        inSection    = true;
        sectionIndent = indent;
      }
      continue;
    }

    // Exit section when we encounter a key at or before the section's indent level
    if (indent <= sectionIndent && trimmed.match(/^\w[\w_]*:/)) {
      break;
    }

    // Parse key: value pairs within the improvement_agent section
    var m = trimmed.match(/^(\w[\w_]*)\s*:\s*(.+)$/);
    if (!m) continue;

    var key = m[1];
    var val = m[2].trim().replace(/^['"]|['"]$/g, '');
    var num = parseInt(val, 10);

    if (key === 'failure_pattern_threshold' && !isNaN(num)) {
      config.failurePatternThreshold = num;
    } else if (key === 'staleness_window_days' && !isNaN(num)) {
      config.stalenessWindowDays = num;
    } else if (key === 'sliding_window_size' && !isNaN(num)) {
      config.slidingWindowSize = num;
    }
  }

  return config;
}

// ── Sliding window ────────────────────────────────────────────────────────────

/**
 * Return the n most recent trace records for a given surfaceType,
 * sorted by createdAt descending.
 *
 * @param {object[]} traces    - all trace records
 * @param {string}   surfaceType
 * @param {number}   n         - window size
 * @returns {object[]}
 */
function getSlidingWindow(traces, surfaceType, n) {
  var filtered = traces.filter(function (t) {
    return t.surfaceType === surfaceType;
  });

  filtered.sort(function (a, b) {
    var da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    var db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da; // descending
  });

  return filtered.slice(0, n);
}

// ── Failure signal detection ──────────────────────────────────────────────────

/**
 * Detect repeated failure patterns across all surface types.
 * Applies the sliding window algorithm:
 *   - Group traces by surfaceType
 *   - For each group: take n most recent traces
 *   - Count occurrences of each failurePattern value (case-insensitive)
 *   - If count >= threshold AND pattern is valid kebab-case: emit signal
 *
 * @param {object[]} traces
 * @param {{failurePatternThreshold: number, slidingWindowSize: number}} config
 * @returns {Array<{surfaceType: string, pattern: string, count: number, evidenceTraces: object[]}>}
 */
function detectFailureSignals(traces, config) {
  var threshold  = config.failurePatternThreshold || DEFAULT_FAILURE_THRESHOLD;
  var windowSize = config.slidingWindowSize       || DEFAULT_SLIDING_WINDOW_SIZE;

  // Collect unique surface types
  var surfaceTypes = [];
  for (var i = 0; i < traces.length; i++) {
    var st = traces[i].surfaceType;
    if (st && surfaceTypes.indexOf(st) === -1) {
      surfaceTypes.push(st);
    }
  }

  var signals = [];

  for (var s = 0; s < surfaceTypes.length; s++) {
    var surfaceType = surfaceTypes[s];
    var window      = getSlidingWindow(traces, surfaceType, windowSize);

    // Count occurrences of each failurePattern (case-insensitive)
    var patternCounts = {};
    var patternTraces = {};

    for (var j = 0; j < window.length; j++) {
      var trace = window[j];
      var fp = trace.failurePattern;
      if (typeof fp !== 'string') continue;

      // Validate kebab-case format — skip invalid labels
      var fpLower = fp.toLowerCase();
      if (!KEBAB_CASE_RE.test(fpLower)) continue;

      if (!patternCounts[fpLower]) {
        patternCounts[fpLower] = 0;
        patternTraces[fpLower] = [];
      }
      patternCounts[fpLower]++;
      patternTraces[fpLower].push(trace);
    }

    var patterns = Object.keys(patternCounts);
    for (var k = 0; k < patterns.length; k++) {
      var pattern = patterns[k];
      if (patternCounts[pattern] >= threshold) {
        signals.push({
          surfaceType:    surfaceType,
          pattern:        pattern,
          count:          patternCounts[pattern],
          evidenceTraces: patternTraces[pattern],
          windowTraces:   window,
        });
      }
    }
  }

  return signals;
}

// ── Staleness signal detection ────────────────────────────────────────────────

/**
 * Detect surface types with no trace activity for >= stalenessWindowDays.
 *
 * @param {object[]} traces
 * @param {{stalenessWindowDays: number}} config
 * @param {Date}     [now]  - override current time (for testing)
 * @returns {Array<{surfaceType: string, lastActivityAt: string, daysSinceActivity: number}>}
 */
function detectStalenessSignals(traces, config, now) {
  var windowDays = config.stalenessWindowDays || DEFAULT_STALENESS_WINDOW_DAYS;
  var nowTime    = (now instanceof Date ? now : new Date()).getTime();

  // Find the most recent createdAt per surfaceType
  var lastActivity = {};
  for (var i = 0; i < traces.length; i++) {
    var t  = traces[i];
    var st = t.surfaceType;
    if (!st || !t.createdAt) continue;

    var ts = new Date(t.createdAt).getTime();
    if (isNaN(ts)) continue;

    if (!lastActivity[st] || ts > lastActivity[st]) {
      lastActivity[st] = ts;
    }
  }

  var signals = [];
  var surfaceTypes = Object.keys(lastActivity);

  for (var j = 0; j < surfaceTypes.length; j++) {
    var surfaceType   = surfaceTypes[j];
    var lastTs        = lastActivity[surfaceType];
    var msElapsed     = nowTime - lastTs;
    var daysElapsed   = msElapsed / (1000 * 60 * 60 * 24);

    if (daysElapsed >= windowDays) {
      signals.push({
        surfaceType:       surfaceType,
        lastActivityAt:    new Date(lastTs).toISOString(),
        daysSinceActivity: Math.floor(daysElapsed),
      });
    }
  }

  return signals;
}

// ── Anti-overfitting gate ─────────────────────────────────────────────────────

/**
 * Apply the anti-overfitting gate to a proposal.
 *
 * If the proposal proposes to remove or weaken an existing check, and that
 * check has passed on ALL traces in the current window, the gate BLOCKS the
 * proposal.
 *
 * @param {{proposedAction: string, targetCheckName?: string}} proposal
 * @param {object[]} windowTraces  - traces in the current sliding window
 * @returns {{passed: boolean, blockedCheckName?: string, traceCount?: number, reason?: string}}
 */
function checkAntiOverfitting(proposal, windowTraces) {
  var action = (proposal.proposedAction || '').toLowerCase();

  // Only removal or weakening triggers the gate
  var isRemovalOrWeakening = (action === 'remove-check' || action === 'weaken-check' || action === 'modify-threshold');
  if (!isRemovalOrWeakening) {
    return { passed: true };
  }

  var targetCheck = proposal.targetCheckName;
  if (!targetCheck) {
    return { passed: true };
  }

  if (!windowTraces || windowTraces.length === 0) {
    return { passed: true };
  }

  // Check if targetCheck passes in ALL window traces
  var tracesWithCheck = 0;
  var allPass = true;

  for (var i = 0; i < windowTraces.length; i++) {
    var trace  = windowTraces[i];
    var checks = trace.checks;
    if (!Array.isArray(checks)) continue;

    for (var j = 0; j < checks.length; j++) {
      if (checks[j].name === targetCheck) {
        tracesWithCheck++;
        if (!checks[j].passed) {
          allPass = false;
        }
        break;
      }
    }
  }

  if (tracesWithCheck > 0 && allPass) {
    return {
      passed:           false,
      blockedCheckName: targetCheck,
      traceCount:       tracesWithCheck,
      reason:           'Proposed removal affects a currently-passing check (' +
                        targetCheck + ', last ' + tracesWithCheck +
                        ' traces all pass). Challenger pre-check required to proceed.',
    };
  }

  return { passed: true };
}

// ── Proposal builders ─────────────────────────────────────────────────────────

/**
 * Format a Date for use in proposal filenames (YYYY-MM-DD).
 *
 * @param {Date} d
 * @returns {string}
 */
function formatDateSlug(d) {
  var y = d.getUTCFullYear();
  var m = String(d.getUTCMonth() + 1).padStart(2, '0');
  var day = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/**
 * Derive a skill slug from a signal for use in proposal filenames.
 * Uses skillSlug field if present, otherwise falls back to surfaceType.
 *
 * @param {object} signal
 * @returns {string}
 */
function deriveSkillSlug(signal) {
  if (signal.skillSlug) return signal.skillSlug;
  if (signal.evidenceTraces && signal.evidenceTraces.length > 0) {
    var first = signal.evidenceTraces[0];
    if (first.skillSlug) return first.skillSlug;
  }
  return signal.surfaceType || 'unknown';
}

/**
 * Build a failure proposal object from a failure signal.
 *
 * @param {object} signal   - from detectFailureSignals
 * @param {object} config   - from readContextConfig
 * @param {Date}   [now]
 * @returns {object}
 */
function buildFailureProposal(signal, config, now) {
  var nowDate    = now instanceof Date ? now : new Date();
  var dateSlug   = formatDateSlug(nowDate);
  var skillSlug  = deriveSkillSlug(signal);
  var evidenceIds = signal.evidenceTraces.map(function (t) {
    return t.traceId || t.traceHash || JSON.stringify(t).substring(0, 16);
  });

  return {
    type:               'failure',
    skillSlug:          skillSlug,
    surfaceType:        signal.surfaceType,
    pattern:            signal.pattern,
    dateSlug:           dateSlug,
    fileName:           dateSlug + '-' + skillSlug + '-failure-proposal.md',
    evidence:           evidenceIds,
    proposed_diff: {
      before: 'SKILL.md does not explicitly handle pattern: ' + signal.pattern,
      after:  'Add MUST check for pattern: ' + signal.pattern +
              ' (observed ' + signal.count + ' times in sliding window)',
    },
    confidence:         signal.count >= 5 ? 'high' : 'medium',
    confidence_rationale: signal.count + ' occurrences in ' +
                          (config.slidingWindowSize || DEFAULT_SLIDING_WINDOW_SIZE) +
                          '-trace window (' +
                          Math.round(signal.count / (config.slidingWindowSize || DEFAULT_SLIDING_WINDOW_SIZE) * 100) +
                          '%)',
    proposedAction:     'add-check',
    status:             'pending_review',
    created_at:         nowDate.toISOString(),
    evaluationScenario: 's-improvement-agent-failure-clustering',
  };
}

/**
 * Build a staleness proposal object from a staleness signal.
 *
 * @param {object} signal   - from detectStalenessSignals
 * @param {object} config   - from readContextConfig
 * @param {Date}   [now]
 * @returns {object}
 */
function buildStalenessProposal(signal, config, now) {
  var nowDate   = now instanceof Date ? now : new Date();
  var dateSlug  = formatDateSlug(nowDate);
  var skillSlug = signal.surfaceType || 'unknown';

  return {
    type:         'staleness',
    skillSlug:    skillSlug,
    surfaceType:  signal.surfaceType,
    dateSlug:     dateSlug,
    fileName:     dateSlug + '-' + skillSlug + '-staleness-proposal.md',
    evidence:     'Last trace activity: ' + signal.lastActivityAt +
                  ' (' + signal.daysSinceActivity + ' days ago)',
    proposed_diff: {
      before: 'Surface type ' + signal.surfaceType + ' is listed as active',
      after:  'Surface type ' + signal.surfaceType +
              ' should be reviewed for explicit deferral or removal' +
              ' (inactive for ' + signal.daysSinceActivity + ' days)',
    },
    confidence:          'medium',
    confidence_rationale: signal.daysSinceActivity + ' days since last trace activity' +
                          ' (threshold: ' + (config.stalenessWindowDays || DEFAULT_STALENESS_WINDOW_DAYS) + ' days)',
    proposedAction:      'review-surface',
    status:              'pending_review',
    created_at:          nowDate.toISOString(),
  };
}

// ── File writers ──────────────────────────────────────────────────────────────

/**
 * Render a proposal object as a markdown file with YAML front-matter fields.
 *
 * @param {object} proposal
 * @returns {string}
 */
function renderProposalMarkdown(proposal) {
  var evidenceStr = Array.isArray(proposal.evidence)
    ? proposal.evidence.join(', ')
    : String(proposal.evidence);

  var lines = [
    '---',
    'evidence: ' + (Array.isArray(proposal.evidence)
      ? '[' + proposal.evidence.map(function (e) { return '"' + e + '"'; }).join(', ') + ']'
      : '"' + proposal.evidence + '"'),
    'proposed_diff:',
    '  before: "' + proposal.proposed_diff.before.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"',
    '  after: "' + proposal.proposed_diff.after.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"',
    'confidence: ' + proposal.confidence,
    'confidence_rationale: "' + proposal.confidence_rationale + '"',
    'anti_overfitting_gate: passed',
    'status: ' + proposal.status,
    'created_at: "' + proposal.created_at + '"',
    'skill_slug: ' + proposal.skillSlug,
    'surface_type: ' + proposal.surfaceType,
  ];

  // Annotate with deferred_reference if this proposal re-surfaces a previously-deferred one
  if (proposal.deferred_reference) {
    lines.push('deferred_reference: ' + proposal.deferred_reference);
  }

  lines.push('---');
  lines.push('');

  if (proposal.type === 'failure') {
    lines.push('# Failure Pattern Proposal: ' + proposal.pattern);
    lines.push('');
    lines.push('## Signal');
    lines.push('');
    lines.push('Pattern `' + proposal.pattern + '` observed ' + proposal.evidence.length +
               ' times in the last sliding window for surface type `' + proposal.surfaceType + '`.');
    lines.push('');
    lines.push('## Evidence');
    lines.push('');
    lines.push('Trace IDs: ' + evidenceStr);
    lines.push('');
    lines.push('## Proposed Diff');
    lines.push('');
    lines.push('**Before:** ' + proposal.proposed_diff.before);
    lines.push('');
    lines.push('**After:** ' + proposal.proposed_diff.after);
  } else if (proposal.type === 'staleness') {
    lines.push('# Staleness Proposal: ' + proposal.surfaceType);
    lines.push('');
    lines.push('## Signal');
    lines.push('');
    lines.push('Surface type `' + proposal.surfaceType + '` has had no trace activity for ' +
               proposal.confidence_rationale + '.');
    lines.push('');
    lines.push('## Evidence');
    lines.push('');
    lines.push(evidenceStr);
    lines.push('');
    lines.push('## Proposed Diff');
    lines.push('');
    lines.push('**Before:** ' + proposal.proposed_diff.before);
    lines.push('');
    lines.push('**After:** ' + proposal.proposed_diff.after);
  }

  return lines.join('\n') + '\n';
}

/**
 * Write a proposal file to proposalsDir.
 * Idempotent: if the file already exists, returns the existing path without overwriting.
 *
 * @param {string} proposalsDir
 * @param {object} proposal
 * @returns {string} file path written (or existing)
 */
function writeProposalFile(proposalsDir, proposal) {
  if (!fs.existsSync(proposalsDir)) {
    fs.mkdirSync(proposalsDir, { recursive: true });
  }

  var filePath = path.join(proposalsDir, proposal.fileName);

  // Idempotency: skip if file already exists (deduplicate by slug + pattern + date)
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  var content = renderProposalMarkdown(proposal);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Render an overfitting warning as markdown.
 *
 * @param {object} proposal
 * @param {object} gateResult - from checkAntiOverfitting
 * @returns {string}
 */
function renderWarningMarkdown(proposal, gateResult) {
  var lines = [
    '---',
    'check_label: ' + (gateResult.blockedCheckName || 'unknown'),
    'trace_count: ' + (gateResult.traceCount || 0),
    'gate_result: blocked',
    'created_at: "' + proposal.created_at + '"',
    'skill_slug: ' + (proposal.skillSlug || 'unknown'),
    'surface_type: ' + (proposal.surfaceType || 'unknown'),
    '---',
    '',
    '# Anti-Overfitting Warning',
    '',
    gateResult.reason ||
      ('Proposed removal affects a currently-passing check (' +
       (gateResult.blockedCheckName || 'unknown') + ', last ' +
       (gateResult.traceCount || 0) +
       ' traces all pass). Challenger pre-check required to proceed.'),
    '',
  ];
  return lines.join('\n');
}

/**
 * Write an overfitting warning file instead of a proposal.
 * The warning filename is derived from the proposal filename.
 * Idempotent: returns existing path if already written.
 *
 * @param {string} proposalsDir
 * @param {object} proposal
 * @param {object} gateResult
 * @returns {string} file path written
 */
function writeOverfittingWarning(proposalsDir, proposal, gateResult) {
  if (!fs.existsSync(proposalsDir)) {
    fs.mkdirSync(proposalsDir, { recursive: true });
  }

  // Derive warning filename from proposal fileName
  var baseFileName = proposal.fileName.replace(/\.md$/, '');
  var warningFile  = baseFileName + '-overfitting-warning.md';
  var filePath     = path.join(proposalsDir, warningFile);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  var content = renderWarningMarkdown(proposal, gateResult);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

// ── State update ──────────────────────────────────────────────────────────────

/**
 * Update workspace/state.json with the proposals block (schema-first, ADR-003).
 * Appends new proposals; does not remove existing ones.
 * Deduplicates by file path.
 *
 * @param {string}   stateJsonPath
 * @param {Array<{file: string, created_at: string, status: string}>} newProposals
 */
function updateStateJson(stateJsonPath, newProposals) {
  if (!newProposals || newProposals.length === 0) return;

  var state;
  try {
    var raw = fs.readFileSync(stateJsonPath, 'utf8');
    state = JSON.parse(raw);
  } catch (e) {
    state = {};
  }

  if (!Array.isArray(state.proposals)) {
    state.proposals = [];
  }

  // Deduplicate: skip proposals whose file path is already recorded
  var existingFiles = {};
  for (var i = 0; i < state.proposals.length; i++) {
    existingFiles[state.proposals[i].file] = true;
  }

  for (var j = 0; j < newProposals.length; j++) {
    var p = newProposals[j];
    if (!existingFiles[p.file]) {
      state.proposals.push({
        file:       p.file,
        created_at: p.created_at,
        status:     p.status,
      });
      existingFiles[p.file] = true;
    }
  }

  fs.writeFileSync(stateJsonPath, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

// ── Main agent runner ─────────────────────────────────────────────────────────

/**
 * Find a previous deferred proposal that a new higher-confidence signal is re-surfacing.
 * Returns the deferred proposal info (for annotation) when the new confidence is higher
 * than the deferred proposal's confidence and the deferral has not yet expired.
 *
 * @param {object} ch            - challenger module
 * @param {string} skillSlug
 * @param {string} pattern
 * @param {string} newConfidence
 * @param {string} proposalsDir
 * @param {Date}   now
 * @returns {{ deferredProposalId: string } | null}
 */
function findPreviousDeferralForAnnotation(ch, skillSlug, pattern, newConfidence, proposalsDir, now) {
  if (!ch || !ch.readExistingProposals) return null;

  var proposals = ch.readExistingProposals(proposalsDir);
  var nowTime   = (now instanceof Date ? now : new Date()).getTime();

  var confidenceRank = { high: 3, medium: 2, low: 1 };
  var newRank = confidenceRank[newConfidence] || 2;

  for (var i = 0; i < proposals.length; i++) {
    var p = proposals[i];
    if (p.status !== 'deferred') continue;
    if (p.skill_slug !== skillSlug || p.pattern !== pattern) continue;

    if (!p.deferred_until) continue;
    var deferUntilTime = new Date(p.deferred_until).getTime();
    if (isNaN(deferUntilTime) || deferUntilTime <= nowTime) continue;

    var existingRank = confidenceRank[p.confidence] || 2;
    if (newRank > existingRank) {
      return { deferredProposalId: p.id };
    }
  }

  return null;
}

/**
 * Run the improvement agent.
 * Reads traces, detects signals, applies anti-overfitting gate, writes proposals.
 * Respects deferred proposals: does not re-surface a proposal before deferred_until
 * unless the new signal has strictly higher confidence (AC5c).
 *
 * @param {object} options
 * @param {string}  [options.tracesDir]      - traces directory (default: workspace/traces/)
 * @param {string}  [options.proposalsDir]   - proposals output directory (default: workspace/proposals/)
 * @param {string}  [options.stateJsonPath]  - workspace/state.json path
 * @param {string}  [options.contextYmlPath] - .github/context.yml path
 * @param {Date}    [options.now]            - override current time (for testing)
 * @param {boolean} [options.verbose]        - emit progress to stdout
 * @returns {{proposals: string[], warnings: string[], suppressed: string[]}}
 */
function runAgent(options) {
  var opts = options || {};
  var tracesDir    = opts.tracesDir    || path.join(__dirname, '..', '..', 'workspace', 'traces');
  var proposalsDir = opts.proposalsDir || path.join(__dirname, '..', '..', 'workspace', 'proposals');
  var stateJsonPath = opts.stateJsonPath ||
    path.join(__dirname, '..', '..', 'workspace', 'state.json');
  var now = opts.now instanceof Date ? opts.now : new Date();

  var config = readContextConfig(opts.contextYmlPath);

  if (opts.verbose) {
    process.stdout.write('[improvement-agent] Reading traces from: ' + tracesDir + '\n');
  }

  // Canonical trace data access — via trace-interface only
  var traces = traceInterface.readAllTraces(tracesDir);

  if (opts.verbose) {
    process.stdout.write('[improvement-agent] Loaded ' + traces.length + ' trace records\n');
  }

  var writtenProposals    = [];
  var writtenWarnings     = [];
  var suppressedProposals = [];
  var stateProposals      = [];

  // Lazy-load challenger module to read existing deferred proposals (AC5c).
  // Avoids a circular dependency — challenger.js is not required at module load time.
  var challenger = null;
  function getChallengerModule() {
    if (!challenger) {
      try {
        challenger = require('./challenger.js');
      } catch (e) {
        challenger = null;
      }
    }
    return challenger;
  }

  // ── Failure signal detection ──
  var failureSignals = detectFailureSignals(traces, config);

  if (opts.verbose) {
    process.stdout.write('[improvement-agent] Failure signals: ' + failureSignals.length + '\n');
  }

  for (var f = 0; f < failureSignals.length; f++) {
    var signal   = failureSignals[f];
    var proposal = buildFailureProposal(signal, config, now);

    // AC5c — deferral suppression: skip if an active deferral exists for same skill+pattern
    var ch = getChallengerModule();
    if (ch && ch.findActiveDeferral) {
      var skillSlugF = proposal.skillSlug || signal.surfaceType || '';
      var deferralF = ch.findActiveDeferral(
        skillSlugF,
        signal.pattern,
        proposal.confidence,
        proposalsDir,
        now
      );
      if (deferralF) {
        suppressedProposals.push(proposal.fileName);
        if (opts.verbose) {
          process.stdout.write(
            '[improvement-agent] Deferral active for ' + proposal.fileName +
            ' (deferred until: ' + deferralF.proposal.deferred_until + ') — skipping\n'
          );
        }
        continue;
      }

      // Higher-severity re-surface: annotate proposal with deferred_reference
      var prevDeferral = findPreviousDeferralForAnnotation(
        ch, skillSlugF, signal.pattern, proposal.confidence, proposalsDir, now
      );
      if (prevDeferral) {
        proposal.deferred_reference = prevDeferral.deferredProposalId;
      }
    }

    var gateResult = checkAntiOverfitting(proposal, signal.windowTraces);

    if (!gateResult.passed) {
      var warningPath = writeOverfittingWarning(proposalsDir, proposal, gateResult);
      writtenWarnings.push(warningPath);
      if (opts.verbose) {
        process.stdout.write('[improvement-agent] Anti-overfitting gate BLOCKED: ' + proposal.fileName + '\n');
      }
    } else {
      var proposalPath = writeProposalFile(proposalsDir, proposal);
      writtenProposals.push(proposalPath);
      stateProposals.push({
        file:       proposalPath,
        created_at: proposal.created_at,
        status:     proposal.status,
      });
      if (opts.verbose) {
        process.stdout.write('[improvement-agent] Proposal written: ' + proposal.fileName + '\n');
      }
    }
  }

  // ── Staleness signal detection ──
  var stalenessSignals = detectStalenessSignals(traces, config, now);

  if (opts.verbose) {
    process.stdout.write('[improvement-agent] Staleness signals: ' + stalenessSignals.length + '\n');
  }

  for (var s = 0; s < stalenessSignals.length; s++) {
    var stalenessSignal   = stalenessSignals[s];
    var stalenessProposal = buildStalenessProposal(stalenessSignal, config, now);

    // AC5c — deferral suppression for staleness proposals
    var chS = getChallengerModule();
    if (chS && chS.findActiveDeferral) {
      var stalenessSkillSlug = stalenessProposal.skillSlug || stalenessSignal.surfaceType || '';
      var stalenessDeferral = chS.findActiveDeferral(
        stalenessSkillSlug,
        stalenessProposal.proposedAction || '',
        stalenessProposal.confidence,
        proposalsDir,
        now
      );
      if (stalenessDeferral) {
        suppressedProposals.push(stalenessProposal.fileName);
        continue;
      }
    }

    var stalenessGateResult = checkAntiOverfitting(stalenessProposal, []);
    if (!stalenessGateResult.passed) {
      var stalenessWarning = writeOverfittingWarning(proposalsDir, stalenessProposal, stalenessGateResult);
      writtenWarnings.push(stalenessWarning);
    } else {
      var stalenessPath = writeProposalFile(proposalsDir, stalenessProposal);
      writtenProposals.push(stalenessPath);
      stateProposals.push({
        file:       stalenessPath,
        created_at: stalenessProposal.created_at,
        status:     stalenessProposal.status,
      });
    }
  }

  // ── Update state.json ──
  if (stateProposals.length > 0) {
    try {
      updateStateJson(stateJsonPath, stateProposals);
      if (opts.verbose) {
        process.stdout.write('[improvement-agent] Updated state.json with ' +
          stateProposals.length + ' proposal(s)\n');
      }
    } catch (e) {
      if (opts.verbose) {
        process.stdout.write('[improvement-agent] Warning: could not update state.json: ' + e.message + '\n');
      }
    }
  }

  return {
    proposals:  writtenProposals,
    warnings:   writtenWarnings,
    suppressed: suppressedProposals,
  };
}

module.exports = {
  readContextConfig:                  readContextConfig,
  getSlidingWindow:                   getSlidingWindow,
  detectFailureSignals:               detectFailureSignals,
  detectStalenessSignals:             detectStalenessSignals,
  checkAntiOverfitting:               checkAntiOverfitting,
  buildFailureProposal:               buildFailureProposal,
  buildStalenessProposal:             buildStalenessProposal,
  writeProposalFile:                  writeProposalFile,
  writeOverfittingWarning:            writeOverfittingWarning,
  findPreviousDeferralForAnnotation:  findPreviousDeferralForAnnotation,
  updateStateJson:         updateStateJson,
  runAgent:                runAgent,
};
