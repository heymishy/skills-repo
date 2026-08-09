'use strict';
var crypto = require('crypto');

// In-memory store: journeyId → journey object
var _journeys = new Map();

var STAGE_SEQUENCE = [
  'ideate',              // step 1 (optional — may be skipped)
  'discovery',           // step 2a
  'benefit-metric',      // step 2b
  'design',              // step 3
  'definition',          // step 4
  'review',              // step 5 — review before test-plan (review may change story scope)
  'test-plan',           // step 6
  'definition-of-ready'  // step 7
];

// Optional disk adapter — injected by server.js for persistence.
// When set, createJourney / completeStage / markJourneyComplete persist to disk.
var _diskAdapter = null;
function setDiskAdapter(adapter) { _diskAdapter = adapter; }

// Optional PG adapter — injected by server.js when DATABASE_URL is set.
// Writes are async fire-and-forget; reads come from the in-memory map (loaded at startup).
var _pgAdapter = null;
function setPgAdapter(adapter) { _pgAdapter = adapter; }

// Injectable stub for tests — must throw when not wired per D37.
var _pgAdapterForTesting = null;
function setPgAdapterForTesting(adapter) { _pgAdapterForTesting = adapter; }

function _activePgAdapter() { return _pgAdapterForTesting || _pgAdapter; }

// jpws-s1: per-journeyId write-order chain. createJourney and
// setJourneyFields (and completeStage, setActiveSession) each fire an
// independent, unawaited _pgWrite call for the same journeyId in quick
// succession -- without this chain, two concurrent pool.query() calls to
// the same row have no ordering guarantee, and an earlier, incomplete write
// (e.g. createJourney's own initial write, before tenantId/ownerId are set)
// can commit AFTER a later, correct one, silently reverting fields like
// tenantId back to null. Chaining onto a per-journeyId promise ensures each
// write for a given journey only begins once the previous one for that same
// journey has settled -- writes for DIFFERENT journeys remain fully
// concurrent (a Map entry per journeyId, not one global chain).
var _pgWriteChains = new Map(); // journeyId -> Promise

function _pgWrite(journey) {
  var pg = _activePgAdapter();
  if (!pg) return;
  var journeyId = journey.journeyId;
  var prev = _pgWriteChains.get(journeyId) || Promise.resolve();
  var next = prev.then(function() {
    return pg.saveJourney(journey);
  }).catch(function(err) {
    console.error('[journey-store] PG write error:', err.message);
  });
  _pgWriteChains.set(journeyId, next);
}

/**
 * Create a new journey for a feature slug.
 * @param {string} featureSlug
 * @param {string} [productProfile] — product context profile name (default: 'default')
 * @returns {object} journey object
 */
function createJourney(featureSlug, productProfile) {
  var journeyId = crypto.randomUUID();
  var journey = {
    journeyId:      journeyId,
    featureSlug:    featureSlug,
    // fdn-s1: an optional, editable human-readable label -- featureSlug
    // itself stays the durable identifier (disk paths, pipeline-state keys)
    // and is never mutated by renaming this.
    displayName:    null,
    productProfile: productProfile || 'default',
    activeSkill:    null,
    activeSessionId: null,
    completedStages: [],
    mode:           'feature',
    complete:       false,
    completedAt:    null,
    stories:        [],
    currentStoryIndex: 0,
    sessions:       {}
  };
  _journeys.set(journeyId, journey);
  if (_diskAdapter) {
    try { _diskAdapter.saveJourney(journey); } catch (_) {}
  }
  _pgWrite(journey);
  return journey;
}

/**
 * Get a journey by ID.
 * @param {string} journeyId
 * @returns {object|null}
 */
function getJourney(journeyId) {
  return _journeys.get(journeyId) || null;
}

/**
 * Update the active session and skill for a journey.
 * @param {string} journeyId
 * @param {string} sessionId
 * @param {string} skillName
 */
function setActiveSession(journeyId, sessionId, skillName) {
  var journey = _journeys.get(journeyId);
  if (!journey) return;
  journey.activeSessionId = sessionId;
  journey.activeSkill = skillName;
  journey.sessions[sessionId] = skillName;
  _pgWrite(journey);
}

/**
 * Find a journey by its active session ID.
 * @param {string} sessionId
 * @returns {object|null}
 */
function getJourneyBySession(sessionId) {
  for (var journey of _journeys.values()) {
    if (journey.activeSessionId === sessionId) return journey;
  }
  return null;
}

/**
 * frsr-s1 — find a journey by its featureSlug, for resolving which session
 * produced a given completed stage's conversation (see completeStage's
 * sessionId field). If more than one journey shares a featureSlug (e.g. a
 * re-run), the most recently created one wins (later Map insertions are
 * visited last).
 * @param {string} featureSlug
 * @returns {object|null}
 */
/**
 * alrf-s4 — read a journey's durably-saved artefact content back from
 * Postgres (populated by adapters/journey-store-pg.js's saveArtefact() on
 * every stage completion when DATABASE_URL is set -- see routes/skills.js's
 * "Persist artefact content to Postgres so cross-device / post-deploy
 * resume works" comment, wsm.1-era). Local disk is NOT durable across a
 * redeploy on this deployment topology (see decisions.md D3/D4); Postgres
 * already is, and was already being written to -- nothing was reading it
 * back for the feature-index page until this. Returns [] when no pg
 * adapter is wired (local dev, disk-only mode) rather than throwing --
 * callers already treat [] as "nothing found here, keep looking."
 * @param {string} journeyId
 * @returns {Promise<Array<{skill_name: string, artefact_path: string, content: string}>>}
 */
async function getArtefactsForJourney(journeyId) {
  var adapter = _activePgAdapter();
  if (!adapter || !journeyId) return [];
  return adapter.getArtefactsForJourney(journeyId);
}

/**
 * alrf-s10 — hard-delete a journey: removes it from the in-memory store, the
 * durable store (Postgres, when wired -- journey rows + all its artefact
 * rows), and the disk adapter's on-disk record (local-dev-only). Never
 * touches artefacts/<slug>/ on local disk deliberately -- that path is not a
 * durable store on any deployed surface (see decisions.md D3/D4,
 * 2026-07-26-canvas-render-and-story-extraction-fix), so there is nothing
 * real to clean up there beyond what a future redeploy already wipes.
 * @param {string} journeyId
 * @returns {Promise<{deleted: boolean}>}
 */
async function deleteJourney(journeyId) {
  var journey = _journeys.get(journeyId);
  var featureSlug = journey ? journey.featureSlug : null;
  _journeys.delete(journeyId);

  var pgDeleted = false;
  var adapter = _activePgAdapter();
  if (adapter && adapter.deleteJourney) {
    var pgResult = await adapter.deleteJourney(journeyId);
    pgDeleted = !!(pgResult && pgResult.deleted);
  }

  var diskDeleted = false;
  if (_diskAdapter && featureSlug && _diskAdapter.deleteJourney) {
    try {
      var diskResult = _diskAdapter.deleteJourney(featureSlug);
      diskDeleted = !!(diskResult && diskResult.deleted);
    } catch (_) {}
  }

  return { deleted: !!journey || pgDeleted || diskDeleted };
}

function getJourneyByFeatureSlug(featureSlug) {
  var match = null;
  for (var journey of _journeys.values()) {
    if (journey.featureSlug === featureSlug) match = journey;
  }
  return match;
}

/**
 * Record a completed stage on the journey.
 * @param {string} journeyId
 * @param {string} skillName
 * @param {string} artefactPath
 * @param {{ costUsd?: number, model?: string, input_tokens?: number, output_tokens?: number }} [usageSummary]
 * @param {string} [sessionId] — frsr-s1: the session that produced this stage's
 *   conversation, so a later "resume conversation" link can resolve which
 *   /skills/:skillName/sessions/:sessionId/chat to point at. Optional so
 *   existing callers that don't have a sessionId in scope are unaffected.
 */
function completeStage(journeyId, skillName, artefactPath, usageSummary, sessionId) {
  var journey = _journeys.get(journeyId);
  if (!journey) return;
  var entry = { skillName: skillName, artefactPath: artefactPath, completedAt: new Date().toISOString() };
  if (sessionId) entry.sessionId = sessionId;
  if (usageSummary && usageSummary.costUsd != null) {
    entry.costUsd  = usageSummary.costUsd;
    entry.model    = usageSummary.model    || null;
    entry.inputTokens  = usageSummary.input_tokens  || 0;
    entry.outputTokens = usageSummary.output_tokens || 0;
  }
  journey.completedStages.push(entry);
  var diskEntry = { status: 'complete', artefactPath: artefactPath, completedAt: entry.completedAt };
  if (entry.costUsd != null) {
    diskEntry.costUsd      = entry.costUsd;
    diskEntry.model        = entry.model;
    diskEntry.inputTokens  = entry.inputTokens;
    diskEntry.outputTokens = entry.outputTokens;
  }
  if (_diskAdapter) {
    try { _diskAdapter.updateStage(journey.featureSlug, skillName, diskEntry); } catch (_) {}
  }
  _pgWrite(journey);
}

/**
 * Get the next stage after the given stage name.
 * @param {string} currentStage
 * @returns {string|null}
 */
function getNextStage(currentStage) {
  var idx = STAGE_SEQUENCE.indexOf(currentStage);
  if (idx === -1 || idx === STAGE_SEQUENCE.length - 1) return null;
  return STAGE_SEQUENCE[idx + 1];
}

/**
 * Get the list of stories for a journey (ougl.6).
 * @param {string} journeyId
 * @returns {Array}
 */
function getJourneyStories(journeyId) {
  var journey = _journeys.get(journeyId);
  if (!journey) return [];
  return journey.stories || [];
}

/**
 * Advance to the next story in the journey (ougl.6).
 * @param {string} journeyId
 * @returns {string|null} next story slug or null if all done
 */
function advanceToNextStory(journeyId) {
  var journey = _journeys.get(journeyId);
  if (!journey) return null;
  journey.currentStoryIndex = (journey.currentStoryIndex || 0) + 1;
  var stories = journey.storyList || journey.stories || [];
  if (journey.currentStoryIndex >= stories.length) return null;
  return stories[journey.currentStoryIndex];
}

/**
 * Set the story list for per-story routing (ougl.6).
 * @param {string} journeyId
 * @param {string[]} storyList
 */
function setStoryList(journeyId, storyList) {
  var journey = _journeys.get(journeyId);
  if (!journey) return;
  journey.storyList = storyList;
  journey.mode = 'story';
  journey.currentStoryIndex = 0;
}

/**
 * Get the current story slug for per-story routing (ougl.6).
 * @param {string} journeyId
 * @returns {string|null}
 */
function getCurrentStory(journeyId) {
  var journey = _journeys.get(journeyId);
  if (!journey) return null;
  var list = journey.storyList || journey.stories || [];
  if (journey.currentStoryIndex >= list.length) return null;
  return list[journey.currentStoryIndex] || null;
}

/**
 * Mark journey as complete (ougl.7).
 * Idempotent — safe to call multiple times.
 * @param {string} journeyId
 */
function markJourneyComplete(journeyId) {
  var journey = _journeys.get(journeyId);
  if (!journey || journey.complete) return;
  journey.complete = true;
  journey.completedAt = new Date().toISOString();
}

/**
 * List all journeys — from disk if adapter is set, otherwise from in-memory map.
 * D37: throws when neither disk nor PG adapter is configured AND the in-memory map
 * is empty. This surfaces misconfiguration early (test isolation guard).
 * @param {string} [repoRoot]
 * @returns {object[]}
 */
function listJourneys(repoRoot) {
  if (_diskAdapter) {
    try { return _diskAdapter.listJourneys(repoRoot); } catch (_) {}
  }
  var inMem = Array.from(_journeys.values());
  if (!_activePgAdapter() && inMem.length === 0) {
    throw new Error('Adapter not wired: listJourneys. Call setDiskAdapter() or setPgAdapter() before use.');
  }
  return inMem;
}

/**
 * Load all journeys from disk into the in-memory store.
 * Called once at server startup after setDiskAdapter().
 * Journeys already in memory are skipped (startup only).
 * @param {string} [repoRoot]
 */
function loadAllFromDisk(repoRoot) {
  if (!_diskAdapter) return;
  var all;
  try { all = _diskAdapter.listJourneys(repoRoot); } catch (_) { return; }
  all.forEach(function(diskJourney) {
    if (!diskJourney.journeyId || _journeys.has(diskJourney.journeyId)) return;
    // Merge disk fields into a full in-memory journey object
    var journey = {
      journeyId:         diskJourney.journeyId,
      featureSlug:       diskJourney.featureSlug,
      productProfile:    diskJourney.productProfile || 'default',
      activeSkill:       diskJourney.currentStage || null,
      activeSessionId:   null,
      completedStages:   [],
      mode:              'feature',
      complete:          false,
      completedAt:       null,
      stories:           [],
      currentStoryIndex: 0,
      sessions:          {},
      ownerId:           diskJourney.ownerId  || null,
      tenantId:          diskJourney.tenantId || null
    };
    // Rebuild completedStages from disk stages
    var stages = diskJourney.stages || {};
    Object.keys(stages).forEach(function(stageName) {
      var s = stages[stageName];
      if (s.status === 'complete') {
        var _entry = { skillName: stageName, artefactPath: s.artefactPath || null, completedAt: s.completedAt || null };
        if (s.costUsd != null)  { _entry.costUsd = s.costUsd; _entry.model = s.model || null; _entry.inputTokens = s.inputTokens || 0; _entry.outputTokens = s.outputTokens || 0; }
        journey.completedStages.push(_entry);
      }
    });
    _journeys.set(journey.journeyId, journey);
  });
}

/**
 * Persist an arbitrary field update to the journey (e.g. clarifyDone, estimateDone).
 * Mutates the in-memory journey and flushes to disk if a disk adapter is set.
 * @param {string} journeyId
 * @param {object} fields — key/value pairs to merge onto the journey
 */
function setJourneyFields(journeyId, fields) {
  var journey = _journeys.get(journeyId);
  if (!journey) return;
  Object.assign(journey, fields);
  if (_diskAdapter) {
    try { _diskAdapter.saveJourney(journey); } catch (_) {}
  }
  _pgWrite(journey);
}

/**
 * Load all journeys from Postgres into the in-memory store.
 * Called once at server startup after setPgAdapter().
 * @returns {Promise<void>}
 */
async function loadAllFromPg() {
  var pg = _activePgAdapter();
  if (!pg) return;
  var rows;
  try { rows = await pg.listJourneys(); } catch (err) {
    console.error('[journey-store] loadAllFromPg error:', err.message);
    return;
  }
  rows.forEach(function(row) {
    if (!row.journeyId || _journeys.has(row.journeyId)) return;
    _journeys.set(row.journeyId, Object.assign({
      activeSessionId:   null,
      mode:              'feature',
      complete:          false,
      completedAt:       null,
      stories:           [],
      currentStoryIndex: 0,
      sessions:          {},
      productProfile:    'default'
    }, row));
  });
}

/**
 * Reset all state (test helper — also clears PG stub state).
 */
function _clear() {
  _journeys.clear();
}

/** Clear in-memory map (test helper, preserves adapter wiring). */
function _clearForTesting() {
  _journeys.clear();
  _pgWriteChains.clear();
}

module.exports = {
  createJourney,
  getJourney,
  setActiveSession,
  getJourneyBySession,
  getJourneyByFeatureSlug,
  getArtefactsForJourney,
  deleteJourney,
  completeStage,
  getNextStage,
  getJourneyStories,
  advanceToNextStory,
  setStoryList,
  getCurrentStory,
  markJourneyComplete,
  setDiskAdapter,
  loadAllFromDisk,
  setPgAdapter,
  setPgAdapterForTesting,
  loadAllFromPg,
  listJourneys,
  setJourneyFields,
  _clear,
  _clearForTesting
};
