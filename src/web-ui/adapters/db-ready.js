'use strict';

/**
 * bri-s2.2 -- connection-readiness helper for Neon's autosuspend cold-start.
 *
 * Bounds an arbitrary connect-shaped function behind a timeout budget
 * (default 10000ms, per AC3 / NFR-Performance -- sourced from Neon's
 * published latency benchmarks: typical 500ms-800ms, 95th percentile 2.6s,
 * worst case 3.1s across a 200-sample benchmark; see decisions.md and
 * the story's NFRs). Resolves with whatever `connectFn` resolves with if
 * it settles within the budget; rejects with a named DbConnectTimeoutError
 * (code DB_CONNECT_TIMEOUT) if it does not -- never hangs indefinitely.
 *
 * Intended for use by downstream staging health checks (S2.5 CI pipeline,
 * S2.6 smoke test) -- not wired into journey-store-pg.js's existing query
 * logic, which is unchanged by this story (see DoR contract "Estimated
 * touch points").
 */

const DEFAULT_TIMEOUT_MS = 10000;

class DbConnectTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`DB_CONNECT_TIMEOUT: database connection did not succeed within ${timeoutMs}ms`);
    this.name = 'DbConnectTimeoutError';
    this.code = 'DB_CONNECT_TIMEOUT';
    this.timeoutMs = timeoutMs;
  }
}

function waitForDbReady(connectFn, timeoutMs) {
  const budget = typeof timeoutMs === 'number' ? timeoutMs : DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new DbConnectTimeoutError(budget));
    }, budget);
    // Intentionally NOT unref()'d: this timer is frequently the only
    // pending handle in a short-lived health-check invocation (e.g. a
    // one-off CI/smoke-test script). An unref'd timer lets Node consider
    // the event loop empty and exit the process before the timeout ever
    // fires, silently skipping the rejection this helper exists to
    // guarantee. Callers that need the process to exit immediately after
    // resolution/rejection should do so explicitly once this promise settles.

    Promise.resolve()
      .then(() => connectFn())
      .then((result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
  });
}

module.exports = { waitForDbReady, DbConnectTimeoutError, DEFAULT_TIMEOUT_MS };
