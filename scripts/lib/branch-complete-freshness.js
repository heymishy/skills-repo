'use strict';

function isFresh(record, context) {
  if (!record) return false;
  if (record.stage !== 'verify-completion') return false;
  if (!record.fullSuite) return false;
  const recordTime = new Date(record.timestamp).getTime();
  const commitTime = new Date(context.lastCommitTimestamp).getTime();
  if (Number.isNaN(recordTime) || Number.isNaN(commitTime)) {
    const invalid = [];
    if (Number.isNaN(recordTime)) invalid.push(`record.timestamp (${record.timestamp})`);
    if (Number.isNaN(commitTime)) invalid.push(`context.lastCommitTimestamp (${context.lastCommitTimestamp})`);
    console.warn(
      `[branch-complete-freshness] WARNING: invalid timestamp in freshness check -- treating as not fresh (${invalid.join(', ')})`
    );
    return false;
  }
  return commitTime <= recordTime;
}

module.exports = { isFresh };
