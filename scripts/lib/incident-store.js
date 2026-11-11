'use strict';

const fs = require('fs');
const crypto = require('crypto');

const MAX_TAG_FIELD_LENGTH = 200;

class IncidentTagFieldTooLongError extends Error {
  constructor(length, max) {
    super(`Incident tags field length ${length} exceeds MAX_TAG_FIELD_LENGTH (${max})`);
    this.name = 'IncidentTagFieldTooLongError';
  }
}

function normalizeTags(tags) {
  return tags.map((t) => String(t).trim().toLowerCase());
}

function createIncidentRecord(input) {
  const normalizedTags = normalizeTags(input.tags || []);
  const joined = normalizedTags.join(',');
  if (joined.length > MAX_TAG_FIELD_LENGTH) {
    throw new IncidentTagFieldTooLongError(joined.length, MAX_TAG_FIELD_LENGTH);
  }

  const now = new Date().toISOString();
  const type = input.type || 'incident';

  const record = {
    id: crypto.randomUUID(),
    type: type,
    trigger: input.trigger,
    summary: input.summary || '',
    tags: normalizedTags,
    priorIncidentLinks: [],
    status: 'open',
    triageSummary: null,
    confirmationStatus: null,
    createdAt: now,
    updatedAt: now,
  };

  // ddft-s1: deferred-item-specific fields only apply when type is
  // 'deferred-item' -- never leak onto an 'incident' record, so existing
  // itar-s1 callers that never pass `type` see no new keys at all.
  if (type === 'deferred-item') {
    record.source = input.source || null;
    record.revisitCondition = input.revisitCondition || null;
    record.linkedFeature = input.linkedFeature || null;
    record.linkedStory = input.linkedStory || null;
  }

  return record;
}

// ddft-s1: generalized schema's type-conditional required-field check.
// An 'incident' record is never required to supply source/revisitCondition/
// linkedFeature/linkedStory; a 'deferred-item' record must supply `source`.
function validateRecord(record) {
  if (record.type === 'deferred-item' && !record.source) {
    throw new Error('Deferred-item record missing required field: source');
  }
}

// ddft-s1: convenience wrapper for the deferred-item case, always
// validating before returning so a caller never silently ships an
// incomplete deferred-item record.
function createDeferredItemRecord(input) {
  const record = createIncidentRecord(Object.assign({}, input, { type: 'deferred-item' }));
  validateRecord(record);
  return record;
}

// ddft-s1: migration helper for a record written to disk before this
// generalization existed -- defaults a missing `type` key to 'incident'
// without altering any other field.
function withDefaultType(record) {
  return Object.assign({}, record, { type: record.type || 'incident' });
}

function _readRecords(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.trim().length > 0 ? JSON.parse(raw) : [];
}

// ddft-s1: generic read primitive shared with appendIncidentRecord --
// extracted rather than duplicated, so both paths stay in sync.
function loadRecords(filePath) {
  return _readRecords(filePath);
}

function appendIncidentRecord(record, filePath) {
  const records = _readRecords(filePath);
  records.push(record);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2) + '\n');
  return records;
}

// itar-s2: additive read/write helpers for stories that need to load the
// full record set (to match against) or persist mutations to existing
// records (e.g. attaching a triage summary) -- distinct from
// appendIncidentRecord, which only ever adds a new record.
function loadIncidentRecords(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.trim().length > 0 ? JSON.parse(raw) : [];
}

function saveIncidentRecords(records, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2) + '\n');
  return records;
}

module.exports = {
  createIncidentRecord,
  appendIncidentRecord,
  createDeferredItemRecord,
  validateRecord,
  withDefaultType,
  loadRecords,
  loadIncidentRecords,
  saveIncidentRecords,
  MAX_TAG_FIELD_LENGTH,
  IncidentTagFieldTooLongError,
};
