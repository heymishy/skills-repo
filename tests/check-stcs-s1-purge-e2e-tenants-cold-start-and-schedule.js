/**
 * check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js
 *
 * stcs-s1 - purge-e2e-tenants.js must retry its initial DB connection to
 * tolerate a Neon cold-start reactivation, its overall deadline must be
 * configurable and default to a value safely below the CI step's own
 * timeout-minutes: 2, its timeout log message must distinguish "nothing
 * found yet" from "found N, didn't finish", and a new scheduled workflow
 * must exist to run the purge independently of any single CI job's own
 * timeout budget.
 *
 * Run: node tests/check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule]';
let failures = 0;

function pass(id, msg) {
  console.log(`${SUITE} PASS ${id}: ${msg}`);
}

function fail(id, msg) {
  failures++;
  console.error(`${SUITE} FAIL ${id}: ${msg}`);
}

async function test(id, desc, fn) {
  try {
    await fn();
    pass(id, desc);
  } catch (err) {
    fail(id, `${desc} -- ${err.message}`);
  }
}

const purgeModule = require('../scripts/purge-e2e-tenants.js');
const { connectWithRetry, getConfiguredTimeoutMs, formatPurgeFailureMessage, DEFAULT_TIMEOUT_MS } = purgeModule;

(async () => {
  // T1 - AC1: retry tolerates a cold-start-like transient failure
  await test('T1', 'connectWithRetry succeeds when the 3rd attempt succeeds after 2 failures', async () => {
    let attempts = 0;
    const connect = async () => {
      attempts++;
      if (attempts < 3) throw new Error('cold start (attempt ' + attempts + ')');
      return 'connected';
    };
    const result = await connectWithRetry(connect, 3, [1, 1, 1]);
    if (result !== 'connected') throw new Error('expected "connected", got ' + JSON.stringify(result));
    if (attempts !== 3) throw new Error('expected exactly 3 attempts, got ' + attempts);
  });

  // T2 - AC1 regression: exhausting all retries still fails gracefully (rejects), not hangs
  await test('T2', 'connectWithRetry rejects with the last error after exhausting all attempts, does not hang', async () => {
    let attempts = 0;
    const connect = async () => {
      attempts++;
      throw new Error('always fails (attempt ' + attempts + ')');
    };
    let threw = false;
    try {
      await connectWithRetry(connect, 3, [1, 1, 1]);
    } catch (err) {
      threw = true;
      if (!/attempt 3/.test(err.message)) throw new Error('expected the last (3rd) attempt error, got: ' + err.message);
    }
    if (!threw) throw new Error('expected connectWithRetry to reject after exhausting attempts');
    if (attempts !== 3) throw new Error('expected exactly 3 attempts, got ' + attempts);
  });

  // T3 - AC2: default timeout is 90000ms when env var unset
  await test('T3', 'getConfiguredTimeoutMs() defaults to 90000ms when PURGE_E2E_TENANTS_TIMEOUT_MS is unset', async () => {
    const prev = process.env.PURGE_E2E_TENANTS_TIMEOUT_MS;
    delete process.env.PURGE_E2E_TENANTS_TIMEOUT_MS;
    try {
      const ms = getConfiguredTimeoutMs();
      if (ms !== 90000) throw new Error('expected 90000, got ' + ms);
      if (DEFAULT_TIMEOUT_MS !== 90000) throw new Error('expected DEFAULT_TIMEOUT_MS === 90000, got ' + DEFAULT_TIMEOUT_MS);
    } finally {
      if (prev !== undefined) process.env.PURGE_E2E_TENANTS_TIMEOUT_MS = prev;
    }
  });

  // T4 - AC2: env var override honoured
  await test('T4', 'getConfiguredTimeoutMs() honours PURGE_E2E_TENANTS_TIMEOUT_MS when set', async () => {
    const prev = process.env.PURGE_E2E_TENANTS_TIMEOUT_MS;
    process.env.PURGE_E2E_TENANTS_TIMEOUT_MS = '5000';
    try {
      const ms = getConfiguredTimeoutMs();
      if (ms !== 5000) throw new Error('expected 5000, got ' + ms);
    } finally {
      if (prev === undefined) delete process.env.PURGE_E2E_TENANTS_TIMEOUT_MS;
      else process.env.PURGE_E2E_TENANTS_TIMEOUT_MS = prev;
    }
  });

  // T5 - AC3: message includes found count when tenants were already found
  await test('T5', 'formatPurgeFailureMessage includes the found tenant count when foundTenantIds is non-null', async () => {
    const msg = formatPurgeFailureMessage(new Error('purgeE2eTenants timed out after 90000ms'), ['e2e-test-a@example.test', 'e2e-test-b@example.test']);
    if (!/found 2 tenant/.test(msg)) throw new Error('expected message to mention "found 2 tenant", got: ' + msg);
    if (!/timed out after 90000ms/.test(msg)) throw new Error('expected original error message preserved, got: ' + msg);
  });

  // T6 - AC3 regression: message does not falsely claim 0 tenants when find itself never completed
  await test('T6', 'formatPurgeFailureMessage does not claim a tenant count when foundTenantIds is null (find step itself timed out)', async () => {
    const msg = formatPurgeFailureMessage(new Error('findE2eTenantIds timed out after 90000ms'), null);
    if (/found \d+ tenant/.test(msg)) throw new Error('expected no false tenant-count claim, got: ' + msg);
    if (!/before any tenants were found/.test(msg)) throw new Error('expected "before any tenants were found" phrasing, got: ' + msg);
  });

  // T7 - AC4: scheduled workflow exists with the right shape
  await test('T7', 'purge-e2e-tenants-scheduled.yml exists, has a cron trigger, and invokes the purge script against staging', async () => {
    const wfPath = path.join(__dirname, '..', '.github', 'workflows', 'purge-e2e-tenants-scheduled.yml');
    if (!fs.existsSync(wfPath)) throw new Error('purge-e2e-tenants-scheduled.yml does not exist');
    const content = fs.readFileSync(wfPath, 'utf8');
    if (!/schedule:\s*\n\s*-\s*cron:/.test(content)) throw new Error('no schedule: cron: trigger found');
    if (!/run:\s*node scripts\/purge-e2e-tenants\.js/.test(content)) throw new Error('does not invoke scripts/purge-e2e-tenants.js');
    if (!/DATABASE_URL:\s*\$\{\{\s*secrets\.STAGING_DATABASE_URL\s*\}\}/.test(content)) {
      throw new Error('does not wire DATABASE_URL from secrets.STAGING_DATABASE_URL, the same secret name the existing CI wiring uses');
    }
  });

  console.log(`${SUITE} ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
})();
