#!/usr/bin/env node
'use strict';

// deferred-item-scan.js -- ddft-s2
//
// Triggered, bounded scan (product/constraints.md #11 -- never a standing
// watcher). Reads workspace/incidents.json, keeps every record with
// type "deferred-item" whose status is not already resolved, and prints each
// one for a human to judge.
//
// Surfacing only: it never resolves, ranks, or prioritises a record, and it
// never parses or evaluates a record's revisitCondition prose -- that text is
// printed exactly as written (confirmed infeasible to automate at discovery).
// Stateless by design: nothing is remembered between runs, so an unresolved
// record reappears on every run until a human marks it resolved.
//
// Usage:
//   node scripts/lib/deferred-item-scan.js [--file <path-to-incidents.json>] [--telemetry]
//
// Read-only by default. With --telemetry (ddft-s3) each record that has a
// linkedFeature is enriched with real PostHog pipeline figures (see
// telemetry-lookup.js), and if every successful lookup finds nothing, the
// sparse-telemetry finding registers itself once as a new deferred-item record.
// No external npm dependencies.

const path = require('path');
const { loadRecords } = require('./incident-store');
const telemetry = require('./telemetry-lookup');

const DEFAULT_FILE = path.resolve(__dirname, '..', '..', 'workspace', 'incidents.json');
const RESOLVED_STATUS = 'resolved';

function isResolved(record) {
  return typeof record.status === 'string' && record.status.toLowerCase() === RESOLVED_STATUS;
}

// Three-way filter: type, then resolved-ness. A missing optional field or a
// missing status never excludes a record.
function filterUnresolvedDeferredItems(records) {
  return records.filter((r) => r && r.type === 'deferred-item' && !isResolved(r));
}

function line(label, value) {
  return '  ' + label + ': ' + (value === null || value === undefined ? '(none)' : value);
}

function formatRecord(record) {
  const linked = [record.linkedFeature, record.linkedStory].filter(Boolean).join(' / ');
  return [
    'Deferred item ' + record.id,
    line('Status', record.status),
    line('Source', record.source),
    line('Linked', linked || null),
    line('Trigger', record.trigger),
    line('Summary', record.summary),
    // Verbatim -- never trimmed, parsed, or classified.
    line('Revisit condition (as written)', record.revisitCondition),
  ].concat(record.telemetry ? [line('Telemetry', telemetry.formatTelemetry(record.telemetry))] : []).join('\n');
}

function renderScan(records) {
  const unresolved = filterUnresolvedDeferredItems(records);
  if (unresolved.length === 0) {
    return 'No unresolved deferred-item records.\n';
  }
  const header = unresolved.length + ' unresolved deferred-item record(s) surfaced for review:\n\n';
  return header + unresolved.map(formatRecord).join('\n\n') + '\n';
}

function scanFile(filePath) {
  return renderScan(loadRecords(filePath));
}

// ddft-s3: enrich every surfaced record (records without linkedFeature pass
// through untouched), render, then self-register the sparse-telemetry finding.
async function scanFileWithTelemetry(filePath, client) {
  const unresolved = filterUnresolvedDeferredItems(loadRecords(filePath));
  const enriched = [];
  for (const r of unresolved) {
    enriched.push(await telemetry.enrichRecord(r, client));
  }
  const out = renderScan(enriched);
  telemetry.registerSparseTelemetryFinding(enriched, filePath);
  return out;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--telemetry') {
      args.telemetry = true;
      continue;
    }
    if (argv[i] === '--file') {
      args.file = argv[i + 1];
      i++;
    }
  }
  return args;
}

async function main(argv) {
  const args = parseArgs(argv);
  try {
    const file = args.file || DEFAULT_FILE;
    process.stdout.write(args.telemetry
      ? await scanFileWithTelemetry(file, telemetry.clientFromEnv())
      : scanFile(file));
  } catch (err) {
    process.stderr.write('deferred-item-scan: ' + err.message + '\n');
    process.exit(1);
  }
}

module.exports = { filterUnresolvedDeferredItems, formatRecord, renderScan, scanFile, scanFileWithTelemetry };

if (require.main === module) {
  main(process.argv.slice(2));
}
