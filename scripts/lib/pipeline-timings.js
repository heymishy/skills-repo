'use strict';
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', '..', '.github', 'pipeline-timings.jsonl');
const ALLOWED_FIELDS = ['skill', 'featureSlug', 'storySlug', 'stage', 'timestamp', 'dispatchCount', 'fullSuite'];
const REQUIRED_FIELDS = ['skill', 'featureSlug', 'storySlug', 'stage', 'timestamp'];

function validateRecord(record) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in record)) {
      return { valid: false, reason: 'missing required field: ' + field };
    }
  }
  return { valid: true };
}

function sanitizeRecord(record) {
  const clean = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in record) clean[field] = record[field];
  }
  return clean;
}

function appendTimingRecord(record, logPath) {
  const target = logPath || LOG_PATH;
  try {
    const full = Object.assign({ timestamp: new Date().toISOString() }, record);
    const validation = validateRecord(full);
    if (!validation.valid) {
      console.warn('[pipeline-timings] WARNING: ' + validation.reason + ' -- skipping write');
      return false;
    }
    const clean = sanitizeRecord(full);
    fs.appendFileSync(target, JSON.stringify(clean) + '\n', 'utf8');
    return true;
  } catch (err) {
    console.warn('[pipeline-timings] WARNING: failed to write timing record -- ' + err.message);
    return false;
  }
}

module.exports = { appendTimingRecord, validateRecord, sanitizeRecord, LOG_PATH, ALLOWED_FIELDS, REQUIRED_FIELDS };
