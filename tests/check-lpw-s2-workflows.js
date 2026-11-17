'use strict';
// lpw-s2 T5 (AC1, AC6) -- workflow text: the core job blocks, the all-specs job is unchanged, and the measurement
// workflow cannot run on a push to master or on a schedule. Plain Node script; the project has no YAML parser, so the
// workflow text is read by hand. Run: node tests/check-lpw-s2-workflows.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n'); }

/** Return the text of one job (from its `  key:` line to the next job key at the same indent). */
function jobBlock(text, jobName) {
  const jobsAt = text.indexOf('\njobs:');
  const lines = (jobsAt === -1 ? text : text.slice(jobsAt)).split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[i])) {
      const next = lines.slice(i + 1, i + 6).join('\n');
      if (new RegExp('^\\s+name:\\s*[\'"]?' + jobName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'"]?\\s*$', 'm').test(next)) { start = i; break; }
    }
  }
  if (start === -1) return '';
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) { if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[j])) { end = j; break; } }
  return lines.slice(start, end).join('\n');
}

test('T5a e2e.yml has a Core browser tests job that blocks: no continue-on-error, 15 minute limit, runs the core list', function () {
  const job = jobBlock(read('.github/workflows/e2e.yml'), 'Core browser tests');
  assert.ok(job, 'no job named "Core browser tests"');
  assert.ok(!/continue-on-error/.test(job), 'the core job must not have continue-on-error');
  assert.ok(/timeout-minutes:\s*15\b/.test(job), 'timeout-minutes must be 15');
  assert.ok(/scripts\/list-core-specs\.js/.test(job), 'must run the files from scripts/list-core-specs.js');
  assert.ok(/NODE_ENV:\s*test/.test(job), 'NODE_ENV must be test');
  assert.ok(/upload-artifact/.test(job), 'must upload the report');
});

test('T5b the core job never points at shared staging', function () {
  const job = jobBlock(read('.github/workflows/e2e.yml'), 'Core browser tests');
  assert.ok(job && !/E2E_STAGING_BASE_URL/.test(job) && !/wuce-staging\.fly\.dev/.test(job));
});

test('T5c the all-specs job is unchanged: still one continue-on-error, still the whole suite', function () {
  const job = jobBlock(read('.github/workflows/e2e.yml'), 'Playwright E2E smoke tests');
  assert.ok(job, 'no job named "Playwright E2E smoke tests"');
  assert.strictEqual((job.match(/continue-on-error:\s*true/g) || []).length, 1);
  assert.ok(/npm run test:e2e/.test(job));
});

test('T5d the measurement workflow runs only on its own files changing or by hand, with a limit and a pinned c8', function () {
  const rel = '.github/workflows/playwright-spec-coverage.yml';
  assert.ok(fs.existsSync(path.join(root, rel)), rel + ' does not exist');
  const t = read(rel);
  const on = t.split(/\njobs:/)[0];
  assert.ok(/pull_request:/.test(on) && /workflow_dispatch:/.test(on));
  assert.ok(!/^\s*push:/m.test(on), 'must not run on push');
  assert.ok(!/schedule:/.test(on), 'must not run on a schedule');
  const paths = (on.match(/paths:\n((?:\s+- .*\n?)+)/) || [])[1] || '';
  const items = paths.split('\n').map(function (l) { return l.replace(/^\s+- /, '').replace(/['"]/g, '').trim(); }).filter(Boolean);
  assert.deepStrictEqual(items.sort(), ['.github/workflows/playwright-spec-coverage.yml', 'scripts/measure-playwright-spec-coverage.js']);
  const limit = (t.match(/timeout-minutes:\s*(\d+)/) || [])[1];
  assert.ok(limit && Number(limit) <= 60, 'timeout-minutes must be at most 60, got ' + limit);
  assert.ok(/c8@10\.1\.3/.test(fs.readFileSync(path.join(root, 'scripts', 'measure-playwright-spec-coverage.js'), 'utf8')), 'the script must run c8 pinned to 10.1.3');
  assert.ok(!/npx[^\n]*\bc8\b(?!@)/.test(t), 'the workflow must not run an unpinned c8');
  assert.ok(!/E2E_STAGING_BASE_URL/.test(t));
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s2] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s2] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s2] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
