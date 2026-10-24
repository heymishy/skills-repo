'use strict';

// sync-log.js — css-s2: writes reconciliation-gap entries to the shared
// sync_log table (migrated in server.js, shared with css-s3's own conflict
// entries via the entry_type discriminator). Mirrors journey-store-pg.js's
// own Pool/_setPoolForTesting convention exactly (own singleton pool, local-
// host SSL exemption, test-only override) -- NOT a D37 injectable adapter,
// since no new adapter seam is being introduced: the existing
// setPipelineStateWriter()/getPipelineStateWriter() seam in journey.js
// already satisfies D37 for this mechanism (see decisions.md ARCH entry,
// "css-s2, pre-code discovery").
//
// This module never accepts or stores a token/credential parameter -- its
// signature is deliberately (featureSlug, tenantId, gateName) only.

const { Pool } = require('pg');

let _pool = null;
let _poolForTesting = null;

function _setPoolForTesting(pool) {
  _poolForTesting = pool;
}

// Mirrors journey-store-pg.js's own _isLocalHost exemption exactly -- a
// plain local Postgres rejects an SSL handshake outright, so this scopes the
// SSL option to non-local hosts only (ncdv-s2).
function _isLocalHost(connectionString) {
  try {
    const hostname = new URL(connectionString).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
  } catch (_) {
    return false;
  }
}

function _getPool() {
  if (_poolForTesting) return _poolForTesting;
  if (!_pool && process.env.DATABASE_URL) {
    const poolConfig = {
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000
    };
    if (!_isLocalHost(process.env.DATABASE_URL)) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
    _pool = new Pool(poolConfig);
  }
  return _pool;
}

/**
 * Logs a reconciliation-gap entry: a pipeline-state.json write that failed
 * after its own writer's internal retries were exhausted (wsd-s2's
 * pipeline-state-github-writer.js already retries before this is ever
 * called). Never throws -- callers (journey.js's existing
 * pipeline_state_write_failed catch block) must not have their own
 * already-non-blocking failure path turned into a hard failure by this
 * logging call itself.
 * @param {string} featureSlug
 * @param {string|null} tenantId
 * @param {string} gateName - the gate/stage name that failed to sync (session.skillName)
 * @returns {Promise<void>}
 */
async function logReconciliationGap(featureSlug, tenantId, gateName) {
  const pool = _getPool();
  if (!pool) return;
  await pool.query(
    'INSERT INTO sync_log (feature_slug, tenant_id, entry_type, journey_value, created_at) VALUES ($1, $2, $3, $4, NOW())',
    [featureSlug, tenantId || null, 'gap', JSON.stringify({ gateName: gateName })]
  );
}

module.exports = { logReconciliationGap, _setPoolForTesting };
