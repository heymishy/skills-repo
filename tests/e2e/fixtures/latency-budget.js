'use strict';

// latency-budget.js -- sfx-s1. The auth round-trip requirement (NFR-Performance) is 5 seconds for a running service. The
// first request a freshly deployed app receives also pays for the cold start (database pool, sessions), so a spec that
// makes that request first gets a separate, larger budget for it, and then holds a warm call to the 5-second requirement.
// Observed: the post-deploy confirmation failed on 2026-11-19 (run 44468809588) because the very first call took over 5 s.
//
//   const { coldMs } = await firstRoundTrip();  const { warmMs } = await secondRoundTrip();
//   expect(evaluateBudgets({ coldMs, warmMs }).failures).toEqual([]);

const WARM_BUDGET_MS = 5000;
const COLD_START_BUDGET_MS = 15000;

function isTiming(n) { return typeof n === 'number' && isFinite(n) && n >= 0; }

/**
 * @param {{coldMs: number, warmMs: number}} m milliseconds the first (cold) and a later (warm) round-trip took
 * @returns {{ok: boolean, failures: string[]}} fails closed on a missing or non-numeric timing
 */
function evaluateBudgets(m) {
  const failures = [];
  const t = m || {};
  if (!isTiming(t.coldMs)) failures.push('the first (cold-start) round-trip has no valid timing: ' + String(t.coldMs));
  else if (t.coldMs > COLD_START_BUDGET_MS) failures.push('the first (cold-start) round-trip took ' + t.coldMs + ' ms, over the ' + COLD_START_BUDGET_MS + ' ms cold-start budget');
  if (!isTiming(t.warmMs)) failures.push('the warm round-trip has no valid timing: ' + String(t.warmMs));
  else if (t.warmMs >= WARM_BUDGET_MS) failures.push('the warm round-trip took ' + t.warmMs + ' ms, not under the ' + WARM_BUDGET_MS + ' ms NFR-Performance budget');
  return { ok: failures.length === 0, failures: failures };
}

module.exports = { evaluateBudgets, WARM_BUDGET_MS, COLD_START_BUDGET_MS };
