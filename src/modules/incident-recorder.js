'use strict';

/**
 * incident-recorder.js (iwf-s1)
 *
 * The single entry point that records a new incident and triages it:
 * builds the record, stores it, then runs the itar-s2 triage drafter on it.
 * Before this existed nothing outside tests created an incident record or
 * called draftTriageSummary.
 *
 * The incident is stored before it is triaged, so a failure while drafting
 * never loses it.
 *
 * Reference: artefacts/2026-11-12-itar-wiring-fix/
 *            stories/iwf-s1-wire-triage-drafting-to-incident-creation.md
 */

const path = require('path');
const {
  createIncidentRecord,
  appendIncidentRecord,
  loadIncidentRecords
} = require('../../scripts/lib/incident-store');
const { draftTriageSummary } = require('./triage-drafter');

const DEFAULT_INCIDENTS_FILE = path.join(__dirname, '..', '..', 'workspace', 'incidents.json');

// options.draft defaults to the real drafter; it exists so a test can make
// drafting fail, not to stub the production behaviour.
function recordIncident(input, filePath, options) {
  const target = filePath || DEFAULT_INCIDENTS_FILE;
  const draft = (options && options.draft) || draftTriageSummary;

  const record = createIncidentRecord(input);
  appendIncidentRecord(record, target);
  draft(record.id, target);

  return loadIncidentRecords(target).find((r) => r.id === record.id);
}

module.exports = {
  recordIncident,
  DEFAULT_INCIDENTS_FILE
};
