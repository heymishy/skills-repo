'use strict';
// caption-transcript.js -- fpd-s2: D37 injectable adapter for machine-generated
// captions + a standalone transcript, generated for every video (including
// silent recordings -- AC4). Mirrors field-suggestion-ai.js's own
// throw-on-unwired stub default, set/get pair, separate "real" implementation
// wired in server.js as its own D37 task (CLAUDE.md's Injectable adapter rule).

let _generateCaptionsAndTranscript = function () {
  throw new Error('Adapter not wired: generateCaptionsAndTranscript. Call setGenerateCaptionsAndTranscript() with a real implementation before use.');
};

function generateCaptionsAndTranscript(videoPath, interactionSequenceText) {
  return getGenerateCaptionsAndTranscript()(videoPath, interactionSequenceText);
}

function setGenerateCaptionsAndTranscript(impl) {
  _generateCaptionsAndTranscript = impl;
}

function getGenerateCaptionsAndTranscript() {
  return _generateCaptionsAndTranscript;
}

function formatVttTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  return `${h}:${m}:${s}.000`;
}

const SECONDS_PER_STEP = 4;

/**
 * Real implementation -- derives captions + a standalone transcript directly
 * from the scripted interaction-sequence text (the same per-AC evidence text
 * fpd-s1's own capture already scripts from), not from audio transcription.
 * A silent recording still produces a real, traceable transcript (AC4) since
 * nothing here depends on an audio track existing. No external speech-to-text
 * provider dependency (decisions.md, fpd-s2 architecture note).
 * @param {string} videoPath
 * @param {string} [interactionSequenceText]
 * @returns {{captions: string, transcript: string}}
 */
function realGenerateCaptionsAndTranscript(videoPath, interactionSequenceText) {
  const steps = (interactionSequenceText || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (steps.length === 0) {
    return { captions: 'WEBVTT\n', transcript: `No narration or interaction-sequence text available for ${videoPath}.` };
  }
  const vttLines = ['WEBVTT', ''];
  steps.forEach((step, i) => {
    vttLines.push(`${formatVttTime(i * SECONDS_PER_STEP)} --> ${formatVttTime((i + 1) * SECONDS_PER_STEP)}`, step, '');
  });
  return { captions: vttLines.join('\n'), transcript: steps.join('\n\n') };
}

module.exports = {
  generateCaptionsAndTranscript, setGenerateCaptionsAndTranscript, getGenerateCaptionsAndTranscript,
  realGenerateCaptionsAndTranscript,
};
