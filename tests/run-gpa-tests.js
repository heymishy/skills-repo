'use strict';
// Runner for GPA governance tests — consolidates multiple test files into one
// node invocation to stay under the Windows 8191-char command-line limit.
var child = require('child_process');
var path = require('path');

var GPA_TESTS = [
  'tests/check-gpa-sc07-inline-js-extraction.js',
  'tests/check-gpa-sc01-trace-contract.js',
  'tests/check-gpa-sc05-skills-init.js',
  'tests/check-gpa-sc06-source-path-guard.js',
  'tests/check-gpa-sc02-unified-gate-evaluator.js',
  'tests/check-pla-s1-posthog-module.js',
];

var failed = false;
GPA_TESTS.forEach(function(t) {
  var result = child.spawnSync('node', [t], {
    stdio: 'inherit',
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
  });
  if (result.status !== 0) {
    failed = true;
  }
});

process.exit(failed ? 1 : 0);
