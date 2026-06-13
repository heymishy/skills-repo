// Existing codebase context for IL-S5
// File: src/crm/transcript-store.js (existing module — crm.4 does NOT modify this)

'use strict';

// In-memory store for MVP; will migrate to Azure Cosmos DB in crm.6
const transcripts = new Map();

/**
 * PII field map — these fields are subject to Privacy Act 2020 retention rules.
 * Non-PII fields (caseId, agentId, callDate, durationSeconds, sentimentScore)
 * are retained for the full system lifetime for reporting and compliance purposes.
 *
 * crm.4 will implement the retention enforcement job that redacts/purges records
 * according to Privacy Act 2020 thresholds (confirmed in PIA-2026-14).
 */
const PII_FIELDS = ['customerName', 'accountNumber', 'rawTranscript'];

function save(record) {
  // record shape: { recordId, caseId, agentId, callDate, durationSeconds,
  //                 sentimentScore, customerName, accountNumber, rawTranscript,
  //                 createdAt }
  transcripts.set(record.recordId, { ...record, createdAt: record.createdAt || Date.now() });
}

function findById(recordId) {
  return transcripts.get(recordId) || null;
}

function findAll() {
  return Array.from(transcripts.values());
}

function update(recordId, fields) {
  const existing = transcripts.get(recordId);
  if (!existing) throw new Error(`Record not found: ${recordId}`);
  transcripts.set(recordId, { ...existing, ...fields });
}

function remove(recordId) {
  transcripts.delete(recordId);
}

module.exports = { save, findById, findAll, update, remove, PII_FIELDS };

// ─────────────────────────────────────────────────────────────────────────────
// Retention audit store (separate from transcript store — for crm.4 audit log)
// File: src/crm/retention-audit-store.js (existing stub)
// ─────────────────────────────────────────────────────────────────────────────

// const auditEntries = [];
//
// function append(entry) {
//   // entry shape: { recordId, action, timestamp, triggerAgeDays }
//   auditEntries.push(entry);
// }
//
// function findAll() { return [...auditEntries]; }
//
// module.exports = { append, findAll };
