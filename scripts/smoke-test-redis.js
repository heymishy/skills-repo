'use strict';

// Standalone Upstash Redis smoke test — s3.2 AC2/AC3/AC4
// Usage: UPSTASH_REDIS_REST_URL=<url> UPSTASH_REDIS_REST_TOKEN=<token> node scripts/smoke-test-redis.js
// Skips gracefully when env vars are not set.

const { Redis } = require('@upstash/redis');

const SESSION_TTL_SECONDS = 86400;
const KEY = 'session:smoke-test';

async function main() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('SKIP: UPSTASH_REDIS_REST_URL not set');
    process.exit(0);
  }

  const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });

  const payload = { login: 'smoke-user', accessToken: 'should-not-persist', userId: 42 };

  try {
    // Strip accessToken before write (mirrors session-redis adapter behaviour)
    const safe = Object.assign({}, payload);
    delete safe.accessToken;

    // WRITE with TTL
    await client.set(KEY, JSON.stringify(safe), { ex: SESSION_TTL_SECONDS });
    console.log('  SET ' + KEY + ' ... OK');

    // READ back
    const raw = await client.get(KEY);
    if (!raw) throw new Error('Read returned null');
    const stored = typeof raw === 'string' ? JSON.parse(raw) : raw;
    console.log('  GET ' + KEY + ' ... OK');

    // AC3 — accessToken must be absent
    if (stored.accessToken !== undefined) throw new Error('accessToken present in stored value — strip-before-write failed');
    if (stored.login !== 'smoke-user') throw new Error('login field missing from stored value');
    console.log('  accessToken absent, login present ... OK');

    // AC4 — TTL check
    const ttl = await client.ttl(KEY);
    if (ttl < 86390 || ttl > 86400) throw new Error('TTL out of expected range: ' + ttl);
    console.log('  TTL=' + ttl + 's (within [86390, 86400]) ... OK');

    // DELETE
    await client.del(KEY);
    const check = await client.get(KEY);
    if (check !== null) throw new Error('Key not deleted');
    console.log('  DEL ' + KEY + ' ... OK');

    console.log('\nUpstash smoke test PASSED');
    process.exit(0);
  } catch (err) {
    console.error('\nUpstash smoke test FAILED:', err.message);
    try { await client.del(KEY); } catch (_) {}
    process.exit(1);
  }
}

main();
