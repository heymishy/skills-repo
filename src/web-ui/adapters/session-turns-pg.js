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

/**
 * dsh-s2: a single, tenant-scoped read path for a completed stage's turns.
 * Prefers the live in-memory session (freshest) over the durable Postgres
 * row, falling back to Postgres only when no matching in-memory session is
 * resident in this process. Never throws on denial or not-found -- returns
 * null so the caller maps that to a 404 (FORBIDDEN-vs-NOT_FOUND policy).
 * @param {string} journeyId
 * @param {string} skillName
 * @param {object} requestingSession
 * @returns {Promise<Array|null>}
 */
async function getTurnsForStage(journeyId, skillName, requestingSession) {
  const journeyStore = require('../modules/journey-store');
  const { requireJourneyAccess, POLICY } = require('../middleware/journey-access');

  const journey = journeyStore.getJourney(journeyId);
  try {
    requireJourneyAccess(journey, requestingSession, POLICY.TENANT);
  } catch (_) {
    return null;
  }

  // Lazy require: routes/skills.js already requires this module at its
  // write call site, so a top-level require here would be circular.
  const routesSkills = require('../routes/skills');
  const liveEntry = routesSkills._listHtmlSessions().find(function(entry) {
    return entry.session.journeyId === journeyId && entry.session.skillName === skillName;
  });
  if (liveEntry) return liveEntry.session.turns || [];

  const pool = requireSessionTurnsStore();
  const result = await pool.query(
    'SELECT turns FROM session_turns WHERE journey_id = $1 AND skill_name = $2',
    [journeyId, skillName]
  );
  if (!result.rows.length) return null;
  return result.rows[0].turns;
}

module.exports = { setSessionTurnsStore, requireSessionTurnsStore, writeSessionTurns, getTurnsForStage };
