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
 * Record a completed stage on the journey.
 * @param {string} journeyId
 * @param {string} skillName
 * @param {string} artefactPath
 * @param {{ costUsd?: number, model?: string, input_tokens?: number, output_tokens?: number }} [usageSummary]
 */
function completeStage(journeyId, skillName, artefactPath, usageSummary) {
  var journey = _journeys.get(journeyId);
  if (!journey) return;
  var entry = { skillName: skillName, artefactPath: artefactPath, completedAt: new Date().toISOString() };
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
 * @param {string} [repoRoot]
 * @returns {object[]}
 */
function listJourneys(repoRoot) {
  if (_diskAdapter) {
    try { return _diskAdapter.listJourneys(repoRoot); } catch (_) {}
  }
  return Array.from(_journeys.values());
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
}

/**
 * Reset all state (test helper).
 */
function _clear() {
  _journeys.clear();
}

module.exports = {
  createJourney,
  getJourney,
  setActiveSession,
  getJourneyBySession,
  completeStage,
  getNextStage,
  getJourneyStories,
  advanceToNextStory,
  setStoryList,
  getCurrentStory,
  markJourneyComplete,
  setDiskAdapter,
  loadAllFromDisk,
  listJourneys,
  setJourneyFields,
  _clear
};
