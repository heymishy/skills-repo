#!/usr/bin/env node
// Syntax-checks all inline <script> blocks in .github/pipeline-viz.html.
// Run: node .github/scripts/check-viz-syntax.js
// Used by: .git/hooks/pre-commit
'use strict';
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execFileSync } = require('child_process');

const root   = path.join(__dirname, '..', '..');
const target = path.join(root, 'dashboards', 'pipeline-viz.html');

if (!fs.existsSync(target)) {
  console.log('[viz-check] pipeline-viz.html not found — skipping.');
  process.exit(0);
}

const html = fs.readFileSync(target, 'utf8');
const re   = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
let block = 0, m;

while ((m = re.exec(html)) !== null) {
  block++;
  const tmp = path.join(os.tmpdir(), 'viz-check-' + block + '.js');
  fs.writeFileSync(tmp, m[1]);
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
    fs.unlinkSync(tmp);
  } catch (e) {
    fs.unlinkSync(tmp);
    process.stderr.write(
      '\n[viz-check] JS syntax error in pipeline-viz.html (script block ' + block + '):\n' +
      (e.stderr ? e.stderr.toString() : e.message) +
      '\nFix the error then re-run git commit.\n\n'
    );
    process.exit(1);
  }
}

console.log('[viz-check] ' + block + ' script block(s) OK — pipeline-viz.html is clean.');
process.exit(0);
