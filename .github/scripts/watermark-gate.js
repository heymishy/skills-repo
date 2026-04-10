#!/usr/bin/env node
/**
 * watermark-gate.js
 *
 * Watermark gate for eval regression detection (p1.4).
 *
 * Reads workspace/suite.json to compute current passRate and fullTestScore,
 * then reads workspace/results.tsv to find the best recorded watermark for the
 * skillSetHash + surfaceType composite key.
 *
 * First run: creates results.tsv with a baseline row, exits 0.
 * Subsequent runs: appends a pass or blocked row.
 *   - pass:    both passRate >= watermark AND fullTestScore >= watermark, exits 0
 *   - blocked: either metric below watermark, exits 1 with trigger field set to
 *              pass-rate-below-watermark | score-below-best | both
 *
 * Exported functions (for testing without file I/O):
 *   parseSuite(suiteJson)                     → { skillSetHash, surfaceType, passRate, fullTestScore }
 *   parseResultsTsv(content)                  → Array<row>
 *   findBestWatermark(rows, hash, surface)     → { passRate, fullTestScore } | null
 *   computeVerdict(current, watermark)         → { verdict, trigger }
 *   formatTsvRow(ts, hash, surface, pr, score, verdict, trigger) → string
 *   runWatermarkGate({ suiteJsonPath, resultsTsvPath }) → { verdict, trigger, ... }
 *
 * CLI usage:
 *   node .github/scripts/watermark-gate.js
 *
 * Path overrides via environment variables:
 *   SUITE_JSON_PATH    — default: workspace/suite.json
 *   RESULTS_TSV_PATH   — default: workspace/results.tsv
 *
 * Zero external npm dependencies — plain Node.js only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Column indices in the TSV (0-based) ──────────────────────────────────────

const COL_TIMESTAMP     = 0;
const COL_SKILL_HASH    = 1;
const COL_SURFACE_TYPE  = 2;
const COL_PASS_RATE     = 3;
const COL_FULL_SCORE    = 4;
const COL_VERDICT       = 5;
const COL_TRIGGER       = 6;
const COLUMN_COUNT      = 7;

// ── Exported pure functions ───────────────────────────────────────────────────

/**
 * Parse workspace/suite.json and compute pass rate + full test score.
 *
 * Expected suite.json schema:
 *   {
 *     "skillSetHash":  string,
 *     "surfaceType":   string,
 *     "scenarios":     Array<{ id: string, pass: boolean }>
 *   }
 *
 * @param {object} suiteJson - already-parsed JSON object
 * @returns {{ skillSetHash: string, surfaceType: string, passRate: number, fullTestScore: number }}
 */
function parseSuite(suiteJson) {
  if (!suiteJson || typeof suiteJson !== 'object') {
    throw new Error('suite.json must be a JSON object');
  }
  const { skillSetHash, surfaceType, scenarios } = suiteJson;
  if (!skillSetHash || typeof skillSetHash !== 'string') {
    throw new Error('suite.json missing or invalid field: skillSetHash');
  }
  if (!surfaceType || typeof surfaceType !== 'string') {
    throw new Error('suite.json missing or invalid field: surfaceType');
  }
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    throw new Error('suite.json scenarios must be a non-empty array');
  }
  const total   = scenarios.length;
  const passed  = scenarios.filter(s => s.pass === true).length;
  const passRate = passed / total;
  return { skillSetHash, surfaceType, passRate, fullTestScore: passed };
}

/**
 * Parse the content of results.tsv into an array of row objects.
 * Lines beginning with '#' are treated as comments and skipped.
 * Empty lines are skipped.
 *
 * @param {string} content - raw file content
 * @returns {Array<{ timestamp:string, skillSetHash:string, surfaceType:string, passRate:number, fullTestScore:number, verdict:string, trigger:string }>}
 */
function parseResultsTsv(content) {
  const rows = [];
  for (const rawLine of content.split('\n')) {
    // Normalise CRLF; use trimmed copy only for empty/comment checks
    const stripped = rawLine.replace(/\r$/, '');
    if (!stripped.trim() || stripped.trim().startsWith('#')) continue;
    const cols = stripped.split('\t');
    // COLUMN_COUNT is 7; trigger (last column) may be an empty string — accept
    // rows with 6 or 7 columns so that both pass/baseline and blocked rows parse.
    if (cols.length < COLUMN_COUNT - 1) continue;
    rows.push({
      timestamp:    cols[COL_TIMESTAMP],
      skillSetHash: cols[COL_SKILL_HASH],
      surfaceType:  cols[COL_SURFACE_TYPE],
      passRate:     parseFloat(cols[COL_PASS_RATE]),
      fullTestScore: parseInt(cols[COL_FULL_SCORE], 10),
      verdict:      cols[COL_VERDICT],
      trigger:      cols[COL_TRIGGER] || '',
    });
  }
  return rows;
}

/**
 * Find the best (highest) recorded passRate and fullTestScore for a composite key.
 *
 * Searches all rows (including baseline, pass, and blocked) to find the
 * high-watermark values. Both metrics are tracked independently.
 *
 * @param {Array} rows - parsed rows from results.tsv
 * @param {string} skillSetHash
 * @param {string} surfaceType
 * @returns {{ passRate: number, fullTestScore: number } | null}
 */
function findBestWatermark(rows, skillSetHash, surfaceType) {
  const matching = rows.filter(
    r => r.skillSetHash === skillSetHash && r.surfaceType === surfaceType
  );
  if (matching.length === 0) return null;

  let bestPassRate    = -Infinity;
  let bestFullScore   = -Infinity;
  for (const r of matching) {
    if (r.passRate > bestPassRate)      bestPassRate  = r.passRate;
    if (r.fullTestScore > bestFullScore) bestFullScore = r.fullTestScore;
  }
  return { passRate: bestPassRate, fullTestScore: bestFullScore };
}

/**
 * Compare current metrics against the watermark and return verdict + trigger.
 *
 * Equal-to threshold is treated as pass (≥, not >).
 *
 * @param {{ passRate: number, fullTestScore: number }} current
 * @param {{ passRate: number, fullTestScore: number }} watermark
 * @returns {{ verdict: 'pass'|'blocked', trigger: string }}
 */
function computeVerdict(current, watermark) {
  const passRateFails  = current.passRate    < watermark.passRate;
  const fullScoreFails = current.fullTestScore < watermark.fullTestScore;

  if (!passRateFails && !fullScoreFails) {
    return { verdict: 'pass', trigger: '' };
  }

  let trigger;
  if (passRateFails && fullScoreFails) {
    trigger = 'both';
  } else if (passRateFails) {
    trigger = 'pass-rate-below-watermark';
  } else {
    trigger = 'score-below-best';
  }

  return { verdict: 'blocked', trigger };
}

/**
 * Format a single TSV row (no trailing newline).
 *
 * @param {string} timestamp   - ISO 8601
 * @param {string} skillSetHash
 * @param {string} surfaceType
 * @param {number} passRate    - float 0–1
 * @param {number} fullTestScore - integer
 * @param {string} verdict     - baseline | pass | blocked
 * @param {string} trigger     - empty string on baseline/pass; reason on blocked
 * @returns {string}
 */
function formatTsvRow(timestamp, skillSetHash, surfaceType, passRate, fullTestScore, verdict, trigger) {
  return [
    timestamp,
    skillSetHash,
    surfaceType,
    passRate.toString(),
    fullTestScore.toString(),
    verdict,
    trigger,
  ].join('\t');
}

/**
 * Append a row to the TSV file.  Creates the file if it does not exist.
 * Validates that the file has not shrunk (append-only enforcement).
 *
 * @param {string} tsvPath   - absolute path to results.tsv
 * @param {string} rowString - formatted row (no trailing newline)
 */
function appendRowToFile(tsvPath, rowString) {
  const dir = path.dirname(tsvPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let existingSize = 0;
  if (fs.existsSync(tsvPath)) {
    existingSize = fs.statSync(tsvPath).size;
  }

  const content = rowString + '\n';
  fs.appendFileSync(tsvPath, content, 'utf8');

  // Validate append-only: file must have grown
  const newSize = fs.statSync(tsvPath).size;
  if (newSize < existingSize) {
    throw new Error(
      `Append-only violation: results.tsv shrank from ${existingSize} to ${newSize} bytes`
    );
  }
}

/**
 * Run the full watermark gate:
 *   1. Read suite.json to compute current passRate + fullTestScore
 *   2. Read results.tsv to find best watermark for the composite key
 *   3. First run → write baseline row; subsequent runs → compare and append
 *
 * @param {{ suiteJsonPath: string, resultsTsvPath: string }} opts
 * @returns {{ verdict: string, trigger: string, skillSetHash: string, surfaceType: string, passRate: number, fullTestScore: number }}
 */
function runWatermarkGate({ suiteJsonPath, resultsTsvPath }) {
  // 1. Read and parse suite.json
  if (!fs.existsSync(suiteJsonPath)) {
    throw new Error(`suite.json not found: ${suiteJsonPath}`);
  }
  const suiteJson = JSON.parse(fs.readFileSync(suiteJsonPath, 'utf8'));
  const { skillSetHash, surfaceType, passRate, fullTestScore } = parseSuite(suiteJson);

  // 2. Read existing results.tsv (if any)
  let existingRows = [];
  if (fs.existsSync(resultsTsvPath)) {
    const content = fs.readFileSync(resultsTsvPath, 'utf8');
    existingRows  = parseResultsTsv(content);
  }

  // 3. Determine verdict
  const timestamp = new Date().toISOString();
  const watermark = findBestWatermark(existingRows, skillSetHash, surfaceType);

  let verdict, trigger;
  if (watermark === null) {
    // First run for this composite key — establish baseline
    verdict = 'baseline';
    trigger = '';
  } else {
    const result = computeVerdict({ passRate, fullTestScore }, watermark);
    verdict = result.verdict;
    trigger = result.trigger;
  }

  // 4. Append row to results.tsv
  const row = formatTsvRow(timestamp, skillSetHash, surfaceType, passRate, fullTestScore, verdict, trigger);
  appendRowToFile(resultsTsvPath, row);

  return { verdict, trigger, skillSetHash, surfaceType, passRate, fullTestScore };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  parseSuite,
  parseResultsTsv,
  findBestWatermark,
  computeVerdict,
  formatTsvRow,
  appendRowToFile,
  runWatermarkGate,
};

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  const root           = path.join(__dirname, '..', '..');
  const suiteJsonPath  = process.env.SUITE_JSON_PATH  || path.join(root, 'workspace', 'suite.json');
  const resultsTsvPath = process.env.RESULTS_TSV_PATH || path.join(root, 'workspace', 'results.tsv');

  let result;
  try {
    result = runWatermarkGate({ suiteJsonPath, resultsTsvPath });
  } catch (err) {
    console.error(`[watermark-gate] ERROR: ${err.message}`);
    process.exit(2);
  }

  const { verdict, trigger, skillSetHash, surfaceType, passRate, fullTestScore } = result;

  console.log(`[watermark-gate] skillSetHash=${skillSetHash} surfaceType=${surfaceType}`);
  console.log(`[watermark-gate] passRate=${passRate} fullTestScore=${fullTestScore}`);
  console.log(`[watermark-gate] verdict=${verdict}${trigger ? ` trigger=${trigger}` : ''}`);

  if (verdict === 'blocked') {
    console.error(`[watermark-gate] BLOCKED: ${trigger}`);
    process.exit(1);
  }

  process.exit(0);
}
