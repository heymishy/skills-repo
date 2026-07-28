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
 * dsh-s6: seed helper — write a row directly into the archive tier
 * (session_turns_archive), bypassing session_turns entirely. Used only by
 * the local test-seeding endpoint (/test/seed-durable-stage with
 * archived: true) so the archive-fallback tier in getTurnsForStage can be
 * exercised end-to-end without waiting on dsh-s5's real 60-day archival job.
 * Mirrors scripts/archive-session-turns.js's own archiveRow() INSERT shape
 * exactly (id, journey_id, tenant_id, skill_name, turns, created_at) —
 * session_turns_archive.id is a plain INTEGER PRIMARY KEY (not SERIAL):
 * production rows get their id from the original hot-table row being moved,
 * so a seeded row needs an explicit synthetic id instead.
 * @param {{journeyId: string, tenantId: string, skillName: string, turns: Array, id: ?number}} params
 * @returns {Promise<void>}
 */
async function writeSessionTurnsArchive(params) {
  const pool = requireSessionTurnsStore();
  const id = params.id || Date.now();
  await pool.query(
    'INSERT INTO session_turns_archive (id, journey_id, tenant_id, skill_name, turns, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, params.journeyId, params.tenantId, params.skillName, JSON.stringify(params.turns || []), new Date().toISOString()]
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
  if (result.rows.length) return result.rows[0].turns;

  // dsh-s6: hot-table miss -- fall back to the archive tier (dsh-s5's
  // session_turns_archive) before giving up. Only reached when the hot-table
  // query above found zero rows (AC2 -- never query archive on a hot hit).
  // Read-only: never re-promote an archived row back into session_turns
  // (explicit Out of Scope -- avoids the hot table re-growing from repeated
  // views of old stages).
  const archiveResult = await pool.query(
    'SELECT turns FROM session_turns_archive WHERE journey_id = $1 AND skill_name = $2',
    [journeyId, skillName]
  );
  if (!archiveResult.rows.length) return null;
  return archiveResult.rows[0].turns;
}

module.exports = { setSessionTurnsStore, requireSessionTurnsStore, writeSessionTurns, writeSessionTurnsArchive, getTurnsForStage };
