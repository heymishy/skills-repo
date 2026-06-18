'use strict';
/**
 * journey-disk.js — disk persistence adapter for journey state.
 *
 * Journeys are stored as JSON files at:
 *   workspace/journeys/{featureSlug}/journey.json
 *
 * All functions accept an optional repoRoot parameter; when omitted the
 * default is resolved from COPILOT_REPO_PATH env var or the repository root.
 *
 * This module is a pure I/O adapter — it has no business logic and does not
 * import journey-store. The caller (journey-store or server.js) wires the two.
 */

var fs   = require('fs');
var path = require('path');
var crypto = require('crypto');

var STAGE_SEQUENCE = [
  'ideate',
  'discovery',
  'benefit-metric',
  'design',
  'definition',
  'test-plan',
  'review',
  'definition-of-ready'
];

function _root(override) {
  return override || process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../..');
}

function _journeyDir(featureSlug, repoRoot) {
  return path.join(_root(repoRoot), 'workspace', 'journeys', featureSlug);
}

function _journeyPath(featureSlug, repoRoot) {
  return path.join(_journeyDir(featureSlug, repoRoot), 'journey.json');
}

/**
 * Build a fresh journey object with all stages set to 'pending'.
 */
function _newJourney(featureSlug, productProfile) {
  var stages = {};
  STAGE_SEQUENCE.forEach(function(s) { stages[s] = { status: 'pending' }; });
  return {
    journeyId:      crypto.randomUUID(),
    featureSlug:    featureSlug,
    productProfile: productProfile || 'default',
    createdAt:      new Date().toISOString(),
    currentStage:   STAGE_SEQUENCE[0],
    stages:         stages
  };
}

/**
 * Create a new journey on disk for featureSlug.
 * Throws if a journey already exists for the slug.
 * @param {string} featureSlug
 * @param {string} [productProfile]
 * @param {string} [repoRoot]
 * @returns {object} the created journey object
 */
function createJourney(featureSlug, productProfile, repoRoot) {
  var dir = _journeyDir(featureSlug, repoRoot);
  fs.mkdirSync(dir, { recursive: true });
  var journey = _newJourney(featureSlug, productProfile);
  fs.writeFileSync(_journeyPath(featureSlug, repoRoot), JSON.stringify(journey, null, 2), 'utf8');
  return journey;
}

/**
 * Load a journey from disk. Returns null if not found or parse error.
 * @param {string} featureSlug
 * @param {string} [repoRoot]
 * @returns {object|null}
 */
function loadJourney(featureSlug, repoRoot) {
  var p = _journeyPath(featureSlug, repoRoot);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) { return null; }
}

/**
 * Save (overwrite) a journey to disk. Creates the directory if missing.
 * @param {object} journey — must have featureSlug
 * @param {string} [repoRoot]
 */
function saveJourney(journey, repoRoot) {
  if (!journey || !journey.featureSlug) throw new Error('journey.featureSlug is required');
  var dir = _journeyDir(journey.featureSlug, repoRoot);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(_journeyPath(journey.featureSlug, repoRoot), JSON.stringify(journey, null, 2), 'utf8');
}

/**
 * List all journeys found under workspace/journeys/.
 * Returns an array of journey objects (skips any that fail to parse).
 * @param {string} [repoRoot]
 * @returns {object[]}
 */
function listJourneys(repoRoot) {
  var base = path.join(_root(repoRoot), 'workspace', 'journeys');
  if (!fs.existsSync(base)) return [];
  var results = [];
  var entries;
  try { entries = fs.readdirSync(base); } catch (_) { return []; }
  entries.forEach(function(slug) {
    var p = path.join(base, slug, 'journey.json');
    if (!fs.existsSync(p)) return;
    try { results.push(JSON.parse(fs.readFileSync(p, 'utf8'))); } catch (_) {}
  });
  return results;
}

/**
 * Check whether a journey file exists for a feature slug.
 * @param {string} featureSlug
 * @param {string} [repoRoot]
 * @returns {boolean}
 */
function journeyExists(featureSlug, repoRoot) {
  return fs.existsSync(_journeyPath(featureSlug, repoRoot));
}

/**
 * Apply a partial update to one stage within a journey and save.
 * Merges update into the existing stage object.
 * @param {string} featureSlug
 * @param {string} stageName
 * @param {object} stageUpdate  — e.g. { status: 'complete', artefactPath: '...', completedAt: ISO }
 * @param {string} [repoRoot]
 * @returns {object|null} updated journey, or null if not found
 */
function updateStage(featureSlug, stageName, stageUpdate, repoRoot) {
  var journey = loadJourney(featureSlug, repoRoot);
  if (!journey) return null;
  if (!journey.stages[stageName]) journey.stages[stageName] = {};
  Object.assign(journey.stages[stageName], stageUpdate);
  if (stageUpdate.status === 'complete' || stageUpdate.status === 'active') {
    journey.currentStage = stageName;
  }
  saveJourney(journey, repoRoot);
  return journey;
}

/**
 * Set the active session ID on a journey and save.
 * @param {string} featureSlug
 * @param {string} stageName
 * @param {string} sessionId
 * @param {string} [repoRoot]
 */
function setActiveSession(featureSlug, stageName, sessionId, repoRoot) {
  return updateStage(featureSlug, stageName, { status: 'active', sessionId: sessionId }, repoRoot);
}

module.exports = {
  createJourney,
  loadJourney,
  saveJourney,
  listJourneys,
  journeyExists,
  updateStage,
  setActiveSession,
  STAGE_SEQUENCE
};
