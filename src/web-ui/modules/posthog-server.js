'use strict';

var PRIVACY_MODE = process.env.POSTHOG_PRIVACY_MODE === 'true';

var https = require('https');

/**
 * Fire-and-forget PostHog event capture from the server.
 * No-ops when POSTHOG_KEY is not set.
 * Uses the US ingestion endpoint to match the client-side config.
 */
function capture(distinctId, event, properties, groups) {
  var key = process.env.POSTHOG_KEY;
  if (!key) return;

  var merged = Object.assign({ $lib: 'posthog-node-manual' }, properties || {});
  if (groups) { merged.$groups = groups; }

  var body = JSON.stringify({
    api_key: key,
    event: event,
    distinct_id: distinctId || 'anonymous',
    properties: merged
  });

  var req = https.request({
    hostname: 'us.i.posthog.com',
    path: '/capture/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  });
  req.on('error', function() {});
  req.write(body);
  req.end();
}

/**
 * Identify a user in PostHog.
 * No-ops when POSTHOG_KEY is not set.
 */
function identify(distinctId, props) {
  var key = process.env.POSTHOG_KEY;
  if (!key) return;

  var body = JSON.stringify({
    api_key: key,
    event: '$identify',
    distinct_id: distinctId || 'anonymous',
    properties: Object.assign({ $lib: 'posthog-node-manual' }, props || {})
  });

  var req = https.request({
    hostname: 'us.i.posthog.com',
    path: '/capture/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  });
  req.on('error', function() {});
  req.write(body);
  req.end();
}

/**
 * Identify a group in PostHog.
 * No-ops when POSTHOG_KEY is not set.
 */
function groupIdentify(groupType, groupKey, groupProps) {
  var key = process.env.POSTHOG_KEY;
  if (!key) return;

  var body = JSON.stringify({
    api_key: key,
    event: '$groupidentify',
    distinct_id: groupType + '_' + groupKey,
    properties: {
      $lib: 'posthog-node-manual',
      $group_type: groupType,
      $group_key: groupKey,
      $group_set: groupProps || {}
    }
  });

  var req = https.request({
    hostname: 'us.i.posthog.com',
    path: '/capture/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  });
  req.on('error', function() {});
  req.write(body);
  req.end();
}

/**
 * Capture an exception in PostHog.
 * No-ops when POSTHOG_KEY is not set.
 */
function captureException(err, distinctId, extraProps) {
  var key = process.env.POSTHOG_KEY;
  if (!key) return;

  var baseProps = {
    $lib: 'posthog-node-manual',
    $exception_type: (err && err.constructor && err.constructor.name) || 'Error',
    $exception_message: (err && err.message) || String(err),
    $exception_stack_trace_raw: (err && err.stack) || ''
  };
  var mergedProps = Object.assign(baseProps, extraProps || {});

  var body = JSON.stringify({
    api_key: key,
    event: '$exception',
    distinct_id: distinctId || 'anonymous',
    properties: mergedProps
  });

  var req = https.request({
    hostname: 'us.i.posthog.com',
    path: '/capture/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  });
  req.on('error', function() {});
  req.write(body);
  req.end();
}

module.exports = { capture, identify, groupIdentify, captureException, PRIVACY_MODE };
