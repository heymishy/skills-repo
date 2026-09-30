'use strict';
/**
 * signals.js -- ep1-s2: GET /api/signals route handler. Calls ep1-s1's
 * signals aggregator on every request (on-demand, no caching) and returns
 * the result as JSON. No auth guard, matching this story's own explicit
 * scope (persona: "Solo operator (you, today)"; no auth-related AC or test
 * in the story/test plan; multi-tenant isolation explicitly out of scope) --
 * see decisions.md.
 */
const path = require('path');

let _signalsAggregatorOverride = null;
function setSignalsAggregator(fn) { _signalsAggregatorOverride = fn; }
function _resetSignalsAggregatorForTesting() { _signalsAggregatorOverride = null; }

function _getRepoPath() {
  return process.env.CLAUDE_REPO_PATH || process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../..');
}

async function handleGetSignals(req, res) {
  try {
    const getSignals = _signalsAggregatorOverride || require('../modules/signals-aggregator').getSignals;
    const signals = getSignals(_getRepoPath());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(signals));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message, timestamp: new Date().toISOString() }));
  }
}

module.exports = { handleGetSignals, setSignalsAggregator, _resetSignalsAggregatorForTesting };
