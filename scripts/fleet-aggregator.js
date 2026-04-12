#!/usr/bin/env node
/**
 * fleet-aggregator.js
 *
 * Fleet registry CI aggregation script.
 * Reads all fleet/squads/{id}.json files, filters to squads with
 * registry_mode: publishing, fetches each squad's pipelineStateUrl,
 * and writes fleet-state.json.
 *
 * Graceful degradation: unreachable pipelineStateUrl → health: "unknown"
 * plus an error field; the job continues and exits 0.
 *
 * Supports both HTTP/HTTPS URLs and local file paths (for testing).
 * registry_mode is read from each squad file (mirrors squad's context.yml).
 *
 * Usage (CLI):
 *   node scripts/fleet-aggregator.js [--squads-dir <path>] [--output <path>]
 *
 * Module exports (for unit testing):
 *   validateSquadFile(squad)    → { valid: bool, errors: string[] }
 *   fetchPipelineState(url)     → Promise<{ stage, health, error? }>
 *   aggregateFleet(squadsDir, outputPath, options) → Promise<fleetState>
 *
 * ADR-003: fleet-state.json schema defined in pipeline-state.schema.json $defs
 *          before this script writes any fleet files.
 * ADR-004: registry_mode read from squad files (not hardcoded in this script).
 * MC-SEC-02: No credentials, tokens, or personal data written to fleet files.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const http  = require('http');
const https = require('https');

// Required fields for a fleet squad file (per $defs.fleetSquad in schema).
const REQUIRED_SQUAD_FIELDS = ['squadId', 'repoUrl', 'pipelineStateUrl', 'registeredAt'];

// The registry_mode value that marks a squad as opted in (from schema enum).
const PUBLISHING_MODE = 'publishing';

// ─────────────────────────────────────────────────────────────────────────────
// validateSquadFile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a parsed squad file object against the fleet squad schema.
 * @param {object} squad - parsed JSON from a fleet/squads/{id}.json file
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSquadFile(squad) {
  if (!squad || typeof squad !== 'object') {
    return { valid: false, errors: ['squad file must be a JSON object'] };
  }
  const errors = [];
  for (const field of REQUIRED_SQUAD_FIELDS) {
    if (squad[field] === undefined || squad[field] === null || squad[field] === '') {
      errors.push('missing required field: ' + field);
    }
  }
  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchPipelineState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches a pipeline-state.json from a URL or local file path.
 * Returns { stage, health } on success; { stage: 'unknown', health: 'unknown', error } on failure.
 * @param {string} url - HTTP/HTTPS URL or local file path
 * @returns {Promise<{ stage: string, health: string, error?: string }>}
 */
function fetchPipelineState(url) {
  return new Promise(function(resolve) {
    // Local file path (absolute or relative)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      try {
        const raw = fs.readFileSync(url, 'utf8');
        const data = JSON.parse(raw);
        resolve({
          stage:  String(data.stage  || 'unknown'),
          health: String(data.health || 'unknown'),
        });
      } catch (err) {
        resolve({ stage: 'unknown', health: 'unknown', error: 'local file read failed: ' + err.message });
      }
      return;
    }

    // HTTP or HTTPS URL
    const lib = url.startsWith('https://') ? https : http;
    const timeout = 10000; // 10 s per squad (20 squads → well under 60 s total)

    let timedOut = false;
    const req = lib.get(url, { timeout }, function(res) {
      if (res.statusCode !== 200) {
        res.resume(); // discard body
        resolve({ stage: 'unknown', health: 'unknown', error: 'HTTP ' + res.statusCode });
        return;
      }
      const chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve({
            stage:  String(data.stage  || 'unknown'),
            health: String(data.health || 'unknown'),
          });
        } catch (err) {
          resolve({ stage: 'unknown', health: 'unknown', error: 'JSON parse failed: ' + err.message });
        }
      });
      res.on('error', function(err) {
        resolve({ stage: 'unknown', health: 'unknown', error: 'response error: ' + err.message });
      });
    });

    req.on('timeout', function() {
      timedOut = true;
      req.destroy();
      resolve({ stage: 'unknown', health: 'unknown', error: 'request timed out' });
    });

    req.on('error', function(err) {
      if (!timedOut) {
        resolve({ stage: 'unknown', health: 'unknown', error: 'request error: ' + err.message });
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// aggregateFleet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main aggregation function.
 * @param {string} squadsDir  - directory containing fleet squad JSON files
 * @param {string} outputPath - path to write fleet-state.json
 * @param {{ dryRun?: boolean, fetchFn?: function }} [options]
 * @returns {Promise<{ generatedAt: string, squads: object[] }>}
 */
async function aggregateFleet(squadsDir, outputPath, options) {
  const opts = options || {};
  const fetch = opts.fetchFn || fetchPipelineState;

  // Read all *.json files from the squads directory
  let files;
  try {
    files = fs.readdirSync(squadsDir).filter(function(f) { return f.endsWith('.json'); });
  } catch (err) {
    throw new Error('cannot read squads directory ' + squadsDir + ': ' + err.message);
  }

  // Parse and validate each squad file; filter to registry_mode: publishing
  const publishingSquads = [];
  for (const file of files) {
    const filePath = path.join(squadsDir, file);
    let squad;
    try {
      squad = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      process.stderr.write('[fleet-aggregator] WARN: cannot parse ' + file + ': ' + err.message + '\n');
      continue;
    }
    const validation = validateSquadFile(squad);
    if (!validation.valid) {
      process.stderr.write('[fleet-aggregator] WARN: skipping invalid squad file ' + file + ': ' + validation.errors.join(', ') + '\n');
      continue;
    }
    // registry_mode is read from the squad file (mirrors squad's context.yml) — ADR-004
    if (squad.registry_mode !== PUBLISHING_MODE) {
      continue;
    }
    publishingSquads.push(squad);
  }

  // Fetch pipeline state for each publishing squad (in parallel)
  const generatedAt = new Date().toISOString();
  const entries = await Promise.all(publishingSquads.map(async function(squad) {
    const result = await fetch(squad.pipelineStateUrl);
    const entry = {
      squadId:   squad.squadId,
      stage:     result.stage,
      health:    result.health,
      updatedAt: generatedAt,
      sourceUrl: squad.pipelineStateUrl,
    };
    if (result.error) {
      entry.error = result.error;
    }
    return entry;
  }));

  const fleetState = { generatedAt, squads: entries };

  if (!opts.dryRun) {
    fs.writeFileSync(outputPath, JSON.stringify(fleetState, null, 2) + '\n', 'utf8');
    process.stdout.write('[fleet-aggregator] wrote ' + outputPath + ' with ' + entries.length + ' squad(s)\n');
  }

  return fleetState;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry point
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  let squadsDir  = path.join(__dirname, '..', 'fleet', 'squads');
  let outputPath = path.join(__dirname, '..', 'fleet-state.json');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--squads-dir' && args[i + 1]) squadsDir  = args[++i];
    if (args[i] === '--output'     && args[i + 1]) outputPath = args[++i];
  }

  aggregateFleet(squadsDir, outputPath)
    .then(function(state) {
      process.stdout.write('[fleet-aggregator] done — ' + state.squads.length + ' squad(s) in fleet-state.json\n');
      process.exit(0);
    })
    .catch(function(err) {
      process.stderr.write('[fleet-aggregator] ERROR: ' + err.message + '\n');
      process.exit(1);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Module exports (used by tests/check-fleet-aggregation.js)
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateSquadFile,
  fetchPipelineState,
  aggregateFleet,
  REQUIRED_SQUAD_FIELDS,
  PUBLISHING_MODE,
};
