'use strict';

/**
 * Update journey state with a new list of uploaded reference files.
 * Replaces (does not append to) any prior referenceFiles entry — re-upload
 * always reflects the current upload, not cumulative history.
 *
 * @param {object} journeyState — journey object to mutate
 * @param {Array<{path: string, sizeBytes: number}>} files — uploaded file descriptors
 */
function updateJourneyReferenceFiles(journeyState, files) {
  var now = new Date().toISOString();
  journeyState.referenceFiles = (files || []).map(function(f) {
    return {
      path:       f.path,
      uploadedAt: now,
      sizeBytes:  f.sizeBytes
    };
  });
}

module.exports = { updateJourneyReferenceFiles };
