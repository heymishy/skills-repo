'use strict';

// telemetry-lookup.js -- ddft-s3
//
// Enriches deferred-item scan output with real PostHog pipeline telemetry, keyed
// by the record's exact linkedFeature (never fuzzy matched). Supporting evidence
// for a human reviewer only: never an input to an automated decision.
//
// Real source: PostHog HogQL query API,
//   POST {host}/api/projects/{projectId}/query/   (Authorization: Bearer <personal key>)
// Reading events needs a personal API key; the repo's POSTHOG_KEY is a write-only
// project capture key and cannot be used here. Credentials come from the
// environment (POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, optional POSTHOG_HOST)
// and are never printed. In CI the key must come from a secrets store
// (product/constraints.md #12).
//
// Events consumed (existing emitters in src/web-ui/routes/journey.js, no new
// instrumentation): stage_started, stage_completed (costUsd, inputTokens,
// outputTokens), artefact_commit_succeeded, artefact_commit_failed.

const http = require('http');
const https = require('https');
const store = require('./incident-store');

const EVENTS = ['stage_completed', 'stage_started', 'artefact_commit_succeeded', 'artefact_commit_failed'];
const DEFAULT_HOST = 'https://us.posthog.com';
const SPARSE_INVESTIGATION = 'investigate whether tracking calls are wired into real skill execution';
const SPARSE_TRIGGER = 'ddft-s3: pipeline telemetry returned no events for any linked feature';

function hasLinkedFeature(record) {
  return typeof record.linkedFeature === 'string' && record.linkedFeature.trim() !== '';
}

// Exact equality on a value placeholder: the slug is never interpolated into SQL.
function buildQuery(featureSlug) {
  const list = EVENTS.map((e) => "'" + e + "'").join(', ');
  return {
    kind: 'HogQLQuery',
    query:
      'SELECT event, count() AS n, sum(toFloat(properties.costUsd)) AS cost, ' +
      'sum(toFloat(properties.inputTokens)) AS inTok, sum(toFloat(properties.outputTokens)) AS outTok ' +
      'FROM events WHERE event IN (' + list + ') AND properties.featureSlug = {slug} ' +
      'GROUP BY event ORDER BY event',
    values: { slug: featureSlug },
  };
}

function num(v) {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}

// rows: [[event, n, cost, inTok, outTok], ...] as returned in the query API's `results`.
function summarizeRows(rows) {
  const counts = {};
  let cost = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let total = 0;
  (rows || []).forEach((row) => {
    counts[row[0]] = num(row[1]);
    total += num(row[1]);
    cost += num(row[2]);
    inputTokens += num(row[3]);
    outputTokens += num(row[4]);
  });
  return { found: total > 0, counts: counts, totalEvents: total, costUsd: cost, inputTokens: inputTokens, outputTokens: outputTokens };
}

function formatTelemetry(summary) {
  if (summary.status === 'not-configured') {
    return 'telemetry not configured (set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to enable the lookup)';
  }
  if (summary.status === 'error') {
    return 'telemetry lookup failed: ' + summary.message + ' (this is not evidence either way about the feature)';
  }
  if (!summary.found) {
    return 'no telemetry signal found for this feature (zero matching events can mean sparse instrumentation, not necessarily zero real activity)';
  }
  const parts = EVENTS.filter((e) => summary.counts[e] !== undefined).map((e) => e + ': ' + summary.counts[e]);
  return 'events: ' + parts.join(', ') + '; cost: $' + summary.costUsd + '; tokens: ' + summary.inputTokens + ' in / ' + summary.outputTokens + ' out';
}

// Real client: one POST per looked-up feature. Resolves to the raw result rows.
function createPostHogQueryClient(cfg) {
  const base = new URL(cfg.host || DEFAULT_HOST);
  const lib = base.protocol === 'http:' ? http : https;
  return {
    queryFeature: function (featureSlug) {
      const payload = JSON.stringify({ query: buildQuery(featureSlug) });
      return new Promise((resolve, reject) => {
        const req = lib.request({
          protocol: base.protocol, hostname: base.hostname, port: base.port || undefined,
          path: '/api/projects/' + encodeURIComponent(cfg.projectId) + '/query/', method: 'POST',
          headers: {
            'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload),
            Authorization: 'Bearer ' + cfg.apiKey,
          },
        }, (res) => {
          let data = '';
          res.on('data', (c) => { data += c; });
          res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return reject(new Error('PostHog query returned HTTP ' + res.statusCode));
            }
            try {
              const parsed = JSON.parse(data);
              resolve(Array.isArray(parsed.results) ? parsed.results : []);
            } catch (e) {
              reject(new Error('PostHog query returned an unreadable response'));
            }
          });
        });
        req.setTimeout(15000, () => req.destroy(new Error('PostHog query timed out')));
        // Error messages never include the key (it is only ever in the header).
        req.on('error', (e) => reject(new Error(e.code || e.message)));
        req.end(payload);
      });
    },
  };
}

// Returns null when not configured (the caller reports that honestly).
function clientFromEnv(env) {
  const e = env || process.env;
  if (!e.POSTHOG_PERSONAL_API_KEY || !e.POSTHOG_PROJECT_ID) return null;
  return createPostHogQueryClient({ apiKey: e.POSTHOG_PERSONAL_API_KEY, projectId: e.POSTHOG_PROJECT_ID, host: e.POSTHOG_HOST || DEFAULT_HOST });
}

// Returns the record plus a `telemetry` summary; records with no linkedFeature
// pass through untouched and the client is never called for them.
async function enrichRecord(record, client) {
  if (!hasLinkedFeature(record)) return record;
  if (!client) return Object.assign({}, record, { telemetry: { status: 'not-configured' } });
  try {
    const rows = await client.queryFeature(record.linkedFeature.trim());
    return Object.assign({}, record, { telemetry: Object.assign({ status: 'ok' }, summarizeRows(rows)) });
  } catch (err) {
    return Object.assign({}, record, { telemetry: { status: 'error', message: err.message } });
  }
}

// AC4: the sparse-telemetry finding registers itself as a deferred-item, but only
// on real evidence: at least one lookup succeeded and every successful lookup
// found nothing. Never on not-configured or error, and never twice.
function registerSparseTelemetryFinding(enriched, filePath) {
  const looked = enriched.filter((r) => r.telemetry && r.telemetry.status === 'ok');
  if (looked.length === 0 || looked.some((r) => r.telemetry.found)) return null;
  const existing = store.loadRecords(filePath);
  if (existing.some((r) => r && r.trigger === SPARSE_TRIGGER)) return null;
  const record = store.createDeferredItemRecord({
    trigger: SPARSE_TRIGGER,
    summary: 'The PostHog pipeline-telemetry lookup found zero stage and commit events for ' + looked.length +
      ' linked feature(s). Telemetry events fire too sparsely to rely on.',
    source: 'capture-log',
    revisitCondition: SPARSE_INVESTIGATION,
    linkedFeature: null,
    linkedStory: 'ddft-s3',
  });
  store.appendIncidentRecord(record, filePath);
  return record;
}

module.exports = {
  EVENTS, buildQuery, summarizeRows, formatTelemetry, createPostHogQueryClient,
  clientFromEnv, enrichRecord, registerSparseTelemetryFinding, hasLinkedFeature,
};
