'use strict';
// write-ci-trace.js
// Writes one JSONL record to workspace/traces/ on every CI run (post-merge push).
// Called by .github/workflows/trace-commit.yml before the assurance-trace artifact
// download step, ensuring a fresh trace record exists even when the artifact is absent.
//
// Security: never logs env vars containing TOKEN, SECRET, or KEY to stdout, stderr,
// or the output file. Output path base is hardcoded — never derived from user input.

var fs = require('fs');
var path = require('path');

var runId    = process.env.GITHUB_RUN_ID  || 'local';
var sha      = process.env.GITHUB_SHA     || 'unknown';
var headRef  = process.env.GITHUB_REF     || 'unknown';
var ts       = new Date().toISOString();

var record = {
  runId:     runId,
  commitSha: sha,
  headRef:   headRef,
  trigger:   'post-merge',
  timestamp: ts,
  verdict:   'trace-committed',
  surface:   'ci-trace-commit',
};

// Derive filename: ISO timestamp with colons replaced by dashes + 8-char sha
var tsPart  = ts.replace(/:/g, '-');
var shaPart = sha.slice(0, 8);
var filename = tsPart + '-ci-' + shaPart + '.jsonl';

// Output path is hardcoded — never derived from user-controlled input
var tracesDir = path.join('workspace', 'traces');
var outPath   = path.join(tracesDir, filename);

try {
  fs.mkdirSync(tracesDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(record) + '\n');
  process.exit(0);
} catch (err) {
  process.stderr.write('write-ci-trace error: ' + err.message + '\n');
  process.exit(1);
}
