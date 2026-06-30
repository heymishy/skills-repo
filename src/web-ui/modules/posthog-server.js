'use strict';

var https = require('https');

/**
 * Fire-and-forget PostHog event capture from the server.
 * No-ops when POSTHOG_KEY is not set.
 * Uses the US ingestion endpoint to match the client-side config.
 */
function capture(distinctId, event, properties) {
  var key = process.env.POSTHOG_KEY;
  if (!key) return;

  var body = JSON.stringify({
    api_key: key,
    event: event,
    distinct_id: distinctId || 'anonymous',
    properties: Object.assign({ $lib: 'posthog-node-manual' }, properties || {})
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

module.exports = { capture };
