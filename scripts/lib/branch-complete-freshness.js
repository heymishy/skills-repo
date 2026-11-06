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

function defaultExecGitLog() {
  const { execSync } = require('child_process');
  return execSync(
    "git log -1 --format=%cI -- . ':!.github/pipeline-state.json' ':!.github/pipeline-timings.jsonl'",
    { encoding: 'utf8' }
  );
}

function getLastCodeCommitTimestamp(execGitLog = defaultExecGitLog) {
  const output = execGitLog().trim();
  return output.length > 0 ? output : null;
}

function decideSkipOrRun(record, context) {
  return { skipped: isFresh(record, context) };
}

module.exports = { isFresh, decideSkipOrRun, getLastCodeCommitTimestamp };
