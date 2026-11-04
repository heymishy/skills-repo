'use strict';

function isFresh(record, context) {
  if (!record) return false;
  if (record.stage !== 'verify-completion') return false;
  if (!record.fullSuite) return false;
  const recordTime = new Date(record.timestamp).getTime();
  const commitTime = new Date(context.lastCommitTimestamp).getTime();
  return commitTime <= recordTime;
}

module.exports = { isFresh };
