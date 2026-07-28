'use strict';

/**
 * session-turns-pg.js — dsh-s1: durably persist a completed stage's
 * conversation turns to Postgres, matching journey-store-pg.js's exact
 * D37 injectable-adapter convention.
 */

let _dbConnection = null;

function setSessionTurnsStore(adapter) {
  _dbConnection = adapter;
}

function requireSessionTurnsStore() {
  if (!_dbConnection) {
    throw new Error('Adapter not wired: sessionTurnsStore. Call setSessionTurnsStore() with a real implementation before use.');
  }
  return _dbConnection;
}

/**
 * Persist a completed stage's turns. Upserts on (journey_id, skill_name).
 * @param {{journeyId: string, tenantId: string, skillName: string, turns: Array}} params
 * @returns {Promise<void>}
 */
async function writeSessionTurns(params) {
  const pool = requireSessionTurnsStore();
  await pool.query(
    'INSERT INTO session_turns (journey_id, tenant_id, skill_name, turns) VALUES ($1, $2, $3, $4) ' +
    'ON CONFLICT (journey_id, skill_name) DO UPDATE SET turns = $4, tenant_id = $2',
    [params.journeyId, params.tenantId, params.skillName, JSON.stringify(params.turns || [])]
  );
}

module.exports = { setSessionTurnsStore, requireSessionTurnsStore, writeSessionTurns };
