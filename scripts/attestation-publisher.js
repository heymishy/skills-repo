/**
 * attestation-publisher.js
 *
 * Post-merge tamper-evidence attestation publisher (p3.2b).
 *
 * Provides:
 *   computeTraceHash(filePath)
 *     → SHA-256 of the trace file as a lowercase hex string (AC2).
 *
 *   writeBackTamperEvidence(traceFilePath, evidence)
 *     → Appends a tamper-evidence JSONL record to the trace file (AC4).
 *
 *   publishAttestation(traceFilePath, opts)
 *     → Publishes the trace file hash to GitHub Artifact Attestation (AC1).
 *     opts.publishFn — override for testing (defaults to gh attestation CLI call).
 *     opts.publishedAt — override ISO 8601 timestamp (for deterministic tests).
 *     Returns { registryRef, hash, publishedAt }.
 *
 * Security (Security NFR — OIDC, no PAT):
 *   Authentication to the GitHub Attestation API uses the OIDC token provided by
 *   the Actions runtime (permissions: id-token: write). No personal access token is
 *   required or accepted. The GITHUB_TOKEN used in the write-back step has
 *   contents: write but not attestations: write — delivery agents cannot modify
 *   or delete published attestation records (access-separation evidence for AC3/Q8).
 *
 * CLI entry point:
 *   node scripts/attestation-publisher.js
 *   Reads TRACE_FILE_DIR env var (default: workspace/traces).
 *   Processes all *.jsonl files that do not already have a tamper-evidence record.
 *
 * Reference: artefacts/2026-04-14-skills-platform-phase3/stories/p3.2b-t3m1-tamper-evidence-registry.md
 */
'use strict';

var crypto   = require('crypto');
var fs       = require('fs');
var path     = require('path');
var childProc = require('child_process');

var ROOT = path.join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// computeTraceHash
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the SHA-256 hash of a trace file.
 *
 * The hash is computed over the exact bytes of the file at the time of the call.
 * Two calls on the same unmodified file always produce the same hex string.
 * Any single-byte change to the file produces a different hex string (AC2).
 *
 * @param {string} filePath — absolute or relative path to the trace file
 * @returns {string} lowercase 64-character hex string
 */
function computeTraceHash(filePath) {
  var content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// writeBackTamperEvidence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Append a tamper-evidence record to a trace JSONL file.
 *
 * A new JSON line is appended with:
 *   { type: "tamper-evidence", tamperEvidence: { registryType, registryRef, publishedAt } }
 *
 * Does NOT modify existing lines (AC4 — append-only design).
 *
 * @param {string} traceFilePath — path to the *.jsonl trace file
 * @param {{ registryType: string, registryRef: string, publishedAt: string }} evidence
 */
function writeBackTamperEvidence(traceFilePath, evidence) {
  var record = JSON.stringify({
    type: 'tamper-evidence',
    tamperEvidence: {
      registryType: evidence.registryType,
      registryRef:  evidence.registryRef,
      publishedAt:  evidence.publishedAt,
    },
  });
  fs.appendFileSync(traceFilePath, record + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// publishAttestation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default publish implementation: calls `gh attestation create` with the trace
 * file, which uses the OIDC token from the Actions runtime.
 *
 * Requires: GITHUB_TOKEN set in environment (GitHub Actions provides it).
 *
 * @param {{ traceFilePath: string, hash: string }} params
 * @returns {string} attestation URL / reference
 */
function defaultPublishFn(params) {
  var output = childProc.execSync(
    'gh attestation create ' + JSON.stringify(params.traceFilePath),
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();
  // gh attestation create outputs a URL or ID to stdout
  return output || ('github-artifact-attestation:' + params.hash.slice(0, 16));
}

/**
 * Publish a trace file attestation and return the registry reference.
 *
 * @param {string} traceFilePath — trace file to attest
 * @param {object} [opts] — { publishFn, publishedAt }
 *   publishFn(params) — injectable publish function for tests
 *   publishedAt       — override ISO 8601 timestamp (for deterministic tests)
 * @returns {{ registryRef: string, hash: string, publishedAt: string }}
 */
function publishAttestation(traceFilePath, opts) {
  var publishFn   = (opts && typeof opts.publishFn === 'function')
    ? opts.publishFn
    : defaultPublishFn;
  var publishedAt = (opts && opts.publishedAt) || new Date().toISOString();

  var hash = computeTraceHash(traceFilePath);
  var ref  = publishFn({ traceFilePath: traceFilePath, hash: hash });

  return {
    registryRef: ref,
    hash:        hash,
    publishedAt: publishedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry point
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  var traceDir = process.env.TRACE_FILE_DIR
    ? path.resolve(process.env.TRACE_FILE_DIR)
    : path.join(ROOT, 'workspace', 'traces');

  if (!fs.existsSync(traceDir)) {
    process.stdout.write('[attestation-publisher] Trace directory not found: ' + traceDir + '\n');
    process.exit(0);
  }

  var files = fs.readdirSync(traceDir).filter(function(f) { return f.endsWith('.jsonl'); });
  var processed = 0;

  for (var i = 0; i < files.length; i++) {
    var file     = files[i];
    var fullPath = path.join(traceDir, file);
    var content  = fs.readFileSync(fullPath, 'utf8');

    // Skip files that already have a tamper-evidence record
    if (content.indexOf('"tamper-evidence"') !== -1) {
      process.stdout.write('[attestation-publisher] Already attested, skipping: ' + file + '\n');
      continue;
    }

    try {
      var result = publishAttestation(fullPath, {});
      writeBackTamperEvidence(fullPath, {
        registryType: 'github-artifact-attestation',
        registryRef:  result.registryRef,
        publishedAt:  result.publishedAt,
      });
      process.stdout.write('[attestation-publisher] Attested: ' + file + ' ref=' + result.registryRef + '\n');
      processed++;
    } catch (err) {
      process.stderr.write('[attestation-publisher] Failed for ' + file + ': ' + (err && err.message) + '\n');
      process.exit(1);
    }
  }

  if (processed === 0) {
    process.stdout.write('[attestation-publisher] No new trace files to attest.\n');
  }
}

module.exports = {
  computeTraceHash:      computeTraceHash,
  writeBackTamperEvidence: writeBackTamperEvidence,
  publishAttestation:    publishAttestation,
};
