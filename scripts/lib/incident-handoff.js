'use strict';

/**
 * incident-handoff.js (itar-s4)
 *
 * Handoff of an incident's triage context into the existing short-track
 * pipeline, and post-fix confirmation once the linked story reaches
 * dodStatus: complete. Called by scripts/handoff-incident.js and
 * scripts/confirm-incident-fix.js.
 *
 * Applies to records of type 'incident' only (a record with no type counts as
 * an incident). A deferred-item record is never handed off or confirmed.
 *
 * Confirmation has two explicit, separate branches, recorded in
 * confirmationMethod: 'automated' (a check function is registered for the
 * incident's trigger) and 'manual' (none is; a person supplies the result).
 *
 * Reference: artefacts/2026-11-08-incident-triage-and-respond/
 *            stories/itar-s4-handoff-and-post-fix-confirmation.md
 */

const fs = require('fs');
const path = require('path');
const { loadIncidentRecords, saveIncidentRecords, withDefaultType } = require('./incident-store');
const { getCheckForTrigger } = require('./incident-detection-registry');

const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

function findIncident(records, id) {
  const rec = records.find((r) => r.id === id);
  if (!rec) throw new Error('no record with id ' + id);
  if (withDefaultType(rec).type !== 'incident') {
    throw new Error('record ' + id + ' is type "' + rec.type + '", not an incident; only incidents can be handed off or confirmed');
  }
  return rec;
}

function buildHandoffPayload(record, storySlug) {
  if (!record.triageSummary) {
    throw new Error('incident ' + record.id + ' has no triage summary to hand off');
  }
  return {
    incidentId: record.id,
    storySlug: storySlug,
    trigger: record.trigger,
    summary: record.summary,
    tags: record.tags || [],
    priorIncidentLinks: record.priorIncidentLinks || [],
    triageSummary: record.triageSummary
  };
}

function renderHandoffContext(payload) {
  return [
    '# Incident handoff context: ' + payload.storySlug,
    '',
    'Source incident: ' + payload.incidentId + ' (workspace/incidents.json)',
    '',
    '**Trigger:** ' + payload.trigger,
    '',
    '**Summary:** ' + (payload.summary || '(none)'),
    '',
    '**Tags:** ' + (payload.tags.join(', ') || '(none)'),
    '',
    '**Known prior incidents:** ' + (payload.priorIncidentLinks.join(', ') || '(none)'),
    '',
    '## Triage summary (known context and suggested next step)',
    '',
    payload.triageSummary,
    '',
    'Use this as context for /test-plan and /definition-of-ready. When this story reaches dodStatus: complete, run `node scripts/confirm-incident-fix.js --incident ' + payload.incidentId + '`.',
    ''
  ].join('\n');
}

// Writes the context file into the story's artefact folder, then links the
// incident record to the story slug. The link is only persisted after the
// context file is on disk.
function linkIncidentToStory(incidentId, storySlug, filePath, artefactsDir) {
  if (typeof storySlug !== 'string' || !SLUG_PATTERN.test(storySlug) || storySlug.indexOf('..') >= 0) {
    throw new Error('invalid story slug: ' + storySlug);
  }
  const records = loadIncidentRecords(filePath);
  const rec = findIncident(records, incidentId);
  if (rec.linkedStory) {
    throw new Error('incident ' + incidentId + ' is already linked to story ' + rec.linkedStory);
  }
  const payload = buildHandoffPayload(rec, storySlug);

  const base = path.resolve(artefactsDir);
  const dir = path.resolve(base, storySlug);
  if (dir.indexOf(base + path.sep) !== 0) {
    throw new Error('invalid story slug: ' + storySlug);
  }
  const contextFile = path.join(dir, 'incident-handoff.md');
  if (fs.existsSync(contextFile)) {
    throw new Error('handoff context already exists: ' + contextFile);
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(contextFile, renderHandoffContext(payload));

  const now = new Date().toISOString();
  rec.linkedStory = storySlug;
  rec.handoffAt = now;
  rec.updatedAt = now;
  saveIncidentRecords(records, filePath);
  return { record: rec, payload: payload, contextFile: contextFile };
}

function _storyMatches(story, ref) {
  return story && (story.id === ref || story.slug === ref);
}

// Finds a story by id or slug in features[].stories and features[].epics[].stories.
function findStory(state, ref) {
  const features = (state && state.features) || [];
  for (const f of features) {
    const lists = [f.stories || []].concat((f.epics || []).map((e) => e.stories || []));
    for (const list of lists) {
      const hit = list.find((s) => _storyMatches(s, ref));
      if (hit) return hit;
    }
  }
  return null;
}

function isLinkedStoryDone(stateFile, storyRef) {
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const story = findStory(state, storyRef);
  if (!story) throw new Error('linked story ' + storyRef + ' not found in ' + stateFile);
  return story.dodStatus === 'complete';
}

// Picks the branch. options.registry maps trigger -> check function;
// options.manualResult is 'pass' | 'fail' for the manual branch.
function postFixCheck(record, options) {
  const opts = options || {};
  const check = getCheckForTrigger(record.trigger, opts.registry);
  if (check) {
    const ok = check(record) === true;
    return { confirmationMethod: 'automated', result: ok ? 'pass' : 'fail', prompt: null };
  }
  const manual = opts.manualResult || null;
  return {
    confirmationMethod: 'manual',
    result: manual,
    prompt: 'No automated re-check exists for trigger "' + record.trigger + '". Manually confirm whether the original symptom is gone, then re-run with --result pass or --result fail.'
  };
}

// Persists the confirmation outcome. 'pass' -> confirmed; 'fail' -> not-confirmed,
// top-level status becomes 'flagged' (never 'closed') and a fix attempt is logged.
function updateIncidentConfirmationStatus(incidentId, outcome, filePath) {
  if (outcome.result !== 'pass' && outcome.result !== 'fail') {
    throw new Error('result must be pass or fail');
  }
  const records = loadIncidentRecords(filePath);
  const rec = findIncident(records, incidentId);
  const now = new Date().toISOString();
  const confirmed = outcome.result === 'pass';

  rec.confirmationStatus = confirmed ? 'confirmed' : 'not-confirmed';
  rec.confirmationMethod = outcome.confirmationMethod;
  rec.confirmedAt = now;
  rec.status = confirmed ? 'confirmed' : 'flagged';
  rec.fixAttempts = Array.isArray(rec.fixAttempts) ? rec.fixAttempts : [];
  rec.fixAttempts.push({
    story: rec.linkedStory,
    at: now,
    method: outcome.confirmationMethod,
    outcome: confirmed ? 'confirmed' : 'tried-but-unsuccessful'
  });
  rec.updatedAt = now;
  saveIncidentRecords(records, filePath);
  return rec;
}

// Full flow used by scripts/confirm-incident-fix.js.
// Returns { done: false, prompt } when the manual branch has no result yet (nothing written).
function confirmIncidentFix(incidentId, filePath, stateFile, options) {
  const opts = options || {};
  const records = loadIncidentRecords(filePath);
  const rec = findIncident(records, incidentId);
  if (!rec.linkedStory) throw new Error('incident ' + incidentId + ' has no linked story; run scripts/handoff-incident.js first');
  if (rec.confirmationStatus === 'confirmed') throw new Error('incident ' + incidentId + ' is already confirmed');
  if (!isLinkedStoryDone(stateFile, rec.linkedStory)) {
    throw new Error('linked story ' + rec.linkedStory + ' has not reached dodStatus: complete');
  }
  const outcome = postFixCheck(rec, opts);
  if (outcome.result === null) {
    return { done: false, confirmationMethod: outcome.confirmationMethod, prompt: outcome.prompt };
  }
  const updated = updateIncidentConfirmationStatus(incidentId, outcome, filePath);
  return { done: true, confirmationMethod: outcome.confirmationMethod, record: updated };
}

module.exports = {
  buildHandoffPayload,
  renderHandoffContext,
  linkIncidentToStory,
  findStory,
  isLinkedStoryDone,
  postFixCheck,
  updateIncidentConfirmationStatus,
  confirmIncidentFix,
  SLUG_PATTERN
};
