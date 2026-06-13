// Existing codebase context for IL-T1
// File: src/payments/queue.js (excerpt — existing module the implementation integrates with)
// The implementing agent is creating a NEW file (failure-classifier.js) that will
// be consumed by this existing queue module.

'use strict';

const QUEUE_STATUS = {
  PENDING: 'pending',
  RETRYABLE: 'retryable',
  PERMANENT: 'permanent',
  PROCESSING: 'processing',
};

/**
 * The failed payments queue. Each entry has:
 *   { id, amount, merchantId, failureCode, status, retryCount, createdAt }
 *
 * The classifier (to be built in retry.1) is called with a queue entry and
 * must return a modified entry with status and retryCount set.
 */
class FailedPaymentsQueue {
  constructor() {
    this._entries = [];
  }

  enqueue(payment) {
    this._entries.push({ ...payment, status: QUEUE_STATUS.PENDING, retryCount: 0 });
  }

  processNext(classifyFn) {
    const next = this._entries.find(e => e.status === QUEUE_STATUS.PENDING);
    if (!next) return null;
    const classified = classifyFn(next);
    const idx = this._entries.indexOf(next);
    this._entries[idx] = classified;
    return classified;
  }

  getManualReviewQueue() {
    return this._entries.filter(e => e.status === QUEUE_STATUS.PERMANENT);
  }

  getRetryQueue() {
    return this._entries.filter(e => e.status === QUEUE_STATUS.RETRYABLE);
  }
}

module.exports = { FailedPaymentsQueue, QUEUE_STATUS };
