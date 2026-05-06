'use strict';
var crypto = require('crypto');

// In-memory store: journeyId → journey object
var _journeys = new Map();

var STAGE_SEQUENCE = [
  'discovery',
  'benefit-metric',
  'definition',
  'test-plan',
  'definition-of-ready'
];

/**
 * Create a new journey for a feature slug.
 * @param {string} featureSlug
 * @returns {{ journeyId: string, featureSlug: string, activeSkill: null, activeSessionId: null, completedStages: [], mode: string }}
 */
function createJourney(featureSlug) {
  var journeyId = crypto.randomUUID();
  var journey = {
    journeyId: journeyId,
    featureSlug: featureSlug,
    activeSkill: null,
    activeSessionId: null,
    completedStages: [],
    mode: 'feature',
    complete: false,
    completedAt: null,
    stories: [],
    currentStoryIndex: 0,
    sessions: {}
  };
  _journeys.set(journeyId, journey);
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
 */
function completeStage(journeyId, skillName, artefactPath) {
  var journey = _journeys.get(journeyId);
  if (!journey) return;
  journey.completedStages.push({ skillName: skillName, artefactPath: artefactPath });
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
  _clear
};
