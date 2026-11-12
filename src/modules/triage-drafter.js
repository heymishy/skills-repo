'use strict';

/**
 * triage-drafter.js (itar-s2)
 *
 * Scores a new incident record's structured tags against every other
 * record in the store via jaccardSimilarity (drift-comparator.js), attaches
 * the top-scoring match(es) above INCIDENT_JACCARD_THRESHOLD as prior-
 * incident links, and drafts a narrative triage summary -- persisted back
 * to the record in the store, not just returned in-memory
 * (product/constraints.md #13).
 *
 * Reference: artefacts/2026-11-08-incident-triage-and-respond/
 *            stories/itar-s2-triage-drafting.md
 */

const { jaccardSimilarity } = require('./drift-comparator');
const { loadIncidentRecords, saveIncidentRecords, withDefaultType } = require('../../scripts/lib/incident-store');

// Domain-tuned threshold -- deliberately NOT inherited from
// drift-comparator.js's DUPLICATE_SIMILARITY_THRESHOLD (0.5), which was
// proven only against longer column-name lists. Incident tag sets are
// typically 2-4 short keywords: 1 shared tag out of a union of 3 scores
// 0.33 (above this threshold), 1 shared out of a union of 5 scores 0.2
// (below it) -- this treats "shares at least one clearly relevant tag, for
// a small tag set" as a match while excluding near-fully-disjoint sets.
// Provisional pending real/fixture data at volume -- see decisions.md's
// 2026-11-09 ASSUMPTION entry and its revisit trigger.
const INCIDENT_JACCARD_THRESHOLD = 0.3;

function buildMatchedSummary(scored) {
  const top = scored[0].record;
  const known = 'What\'s known: a similar prior incident (' + top.id + ') was triggered by "' + top.trigger + '".';
  const tried = top.status
    ? ' What\'s been tried: the matched incident\'s current status is "' + top.status + '"' +
      (top.triageSummary ? ' — ' + top.triageSummary : '') + '.'
    : ' What\'s been tried: no resolution status recorded yet on the matched incident.';
  const next = ' Suggested next step: review incident ' + top.id +
    '\'s own triage notes and prior-incident links before investigating from scratch.';
  return known + tried + next;
}

function draftTriageSummary(newRecordId, filePath) {
  const records = loadIncidentRecords(filePath);
  const newRecord = records.find((r) => r.id === newRecordId);
  if (!newRecord) {
    throw new Error('draftTriageSummary: no record with id ' + newRecordId + ' found in ' + filePath);
  }

  const now = new Date().toISOString();

  if (!Array.isArray(newRecord.tags) || newRecord.tags.length === 0) {
    newRecord.triageSummary = 'Cannot score — no tags present on this record.';
    newRecord.priorIncidentLinks = [];
    newRecord.updatedAt = now;
    saveIncidentRecords(records, filePath);
    return { status: 'cannot-score', triageSummary: newRecord.triageSummary, priorIncidentLinks: [] };
  }

  // iwf-s1: the store also holds deferred-item records, which are not prior
  // incidents. A record with no `type` predates the generalization and counts as an incident.
  const others = records.filter((r) => r.id !== newRecordId && withDefaultType(r).type === 'incident');
  const scored = others
    .map((r) => ({ record: r, score: jaccardSimilarity(newRecord.tags, Array.isArray(r.tags) ? r.tags : []) }))
    .filter((s) => s.score >= INCIDENT_JACCARD_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    newRecord.triageSummary = 'No relevant prior incident was found for this record\'s tags.';
    newRecord.priorIncidentLinks = [];
    newRecord.updatedAt = now;
    saveIncidentRecords(records, filePath);
    return { status: 'no-match', triageSummary: newRecord.triageSummary, priorIncidentLinks: [] };
  }

  newRecord.priorIncidentLinks = scored.map((s) => s.record.id);
  newRecord.triageSummary = buildMatchedSummary(scored);
  newRecord.updatedAt = now;
  saveIncidentRecords(records, filePath);
  return {
    status: 'matched',
    triageSummary: newRecord.triageSummary,
    priorIncidentLinks: newRecord.priorIncidentLinks
  };
}

module.exports = {
  draftTriageSummary,
  INCIDENT_JACCARD_THRESHOLD
};
