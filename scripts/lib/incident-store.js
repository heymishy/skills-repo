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

  return {
    id: crypto.randomUUID(),
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
}

function appendIncidentRecord(record, filePath) {
  let records = [];
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    records = raw.trim().length > 0 ? JSON.parse(raw) : [];
  }
  records.push(record);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2) + '\n');
  return records;
}

module.exports = {
  createIncidentRecord,
  appendIncidentRecord,
  MAX_TAG_FIELD_LENGTH,
  IncidentTagFieldTooLongError,
};
