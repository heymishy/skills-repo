'use strict';
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', '..', '.github', 'pipeline-timings.jsonl');
const ALLOWED_FIELDS = ['skill', 'featureSlug', 'storySlug', 'stage', 'timestamp', 'dispatchCount', 'fullSuite', 'skipped', 'startedAt', 'durationMs'];
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
    // fsae-3: duration, derived from an optional caller-supplied `startedAt`
    // against this record's own `timestamp` -- never required, since a
    // skill that only knows "now" at completion (the common case) still
    // gets a valid, duration-less record. Invalid or nonsensical input
    // (unparseable startedAt, or startedAt after timestamp -- clock skew or
    // a caller mistake) silently omits durationMs rather than persisting a
    // misleading value; it must never throw, the same non-fatal contract as
    // the rest of this function.
    if ('startedAt' in full && !('durationMs' in full)) {
      const startedMs = Date.parse(full.startedAt);
      const endedMs = Date.parse(full.timestamp);
      if (!isNaN(startedMs) && !isNaN(endedMs) && endedMs >= startedMs) {
        full.durationMs = endedMs - startedMs;
      }
    }
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

function getMostRecentRecord(filter, logPath) {
  const target = logPath || LOG_PATH;
  try {
    if (!fs.existsSync(target)) {
      return null;
    }
    const content = fs.readFileSync(target, 'utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    let best = null;
    for (const line of lines) {
      let record;
      try {
        record = JSON.parse(line);
      } catch (_) {
        continue;
      }
      const matches = Object.keys(filter || {}).every(key => record[key] === filter[key]);
      if (!matches) continue;
      if (!best || new Date(record.timestamp) > new Date(best.timestamp)) {
        best = record;
      }
    }
    return best;
  } catch (err) {
    console.warn('[pipeline-timings] WARNING: failed to read timing log -- ' + err.message);
    return null;
  }
}

module.exports = { appendTimingRecord, validateRecord, sanitizeRecord, getMostRecentRecord, LOG_PATH, ALLOWED_FIELDS, REQUIRED_FIELDS };
