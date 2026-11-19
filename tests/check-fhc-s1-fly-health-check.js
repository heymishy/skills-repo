#!/usr/bin/env node
// check-fhc-s1-fly-health-check.js -- AC verification for fhc-s1
// (production declares a Fly health check on /health). fly.toml is read as
// text; no network. AC4 calls the existing health handler with a fake response.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const prod = fs.readFileSync(path.join(root, 'fly.toml'), 'utf8');
const staging = fs.readFileSync(path.join(root, 'fly.staging.toml'), 'utf8');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

// The text of one [[http_service.checks]] block (up to the next table header), or null.
function checkBlock(toml) {
  const m = toml.match(/^\s*\[\[http_service\.checks\]\][^\n]*\n([\s\S]*?)(?=^\s*\[|(?![\s\S]))/m);
  return m ? m[1] : null;
}
function value(block, key) {
  const m = block && block.match(new RegExp('^\\s*' + key + '\\s*=\\s*([^\\n#]+)', 'm'));
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
}
// Fly accepts durations such as '60s' or '1m'; a bare number is milliseconds-free seconds here.
function seconds(v) {
  const m = v && String(v).match(/^(\d+(?:\.\d+)?)\s*(ms|s|m)?$/);
  if (!m) return NaN;
  const n = Number(m[1]);
  return m[2] === 'ms' ? n / 1000 : m[2] === 'm' ? n * 60 : n;
}

const block = checkBlock(prod);

console.log('T1 (AC1): fly.toml declares a GET /health check');
ok(block !== null, 'a [[http_service.checks]] entry exists');
ok(value(block, 'method') === 'GET' || (value(block, 'method') || '').toUpperCase() === 'GET', "method is 'GET'");
ok(value(block, 'path') === '/health', "path is '/health'");

console.log('T2 (AC2): the check timings');
const grace = seconds(value(block, 'grace_period'));
const interval = seconds(value(block, 'interval'));
const timeout = seconds(value(block, 'timeout'));
ok(grace >= 60, 'grace_period is at least 60 seconds');
ok(interval >= 10 && interval <= 30, 'interval is between 10 and 30 seconds');
ok(timeout < interval, 'timeout is under the interval');

console.log('T3 (AC3, baseline): app and the other http_service settings are unchanged');
ok(/^app = 'skills-framework'$/m.test(prod), "app = 'skills-framework'");
ok(/^\s*internal_port = 3000$/m.test(prod), 'internal_port = 3000');
ok(/^\s*force_https = true$/m.test(prod), 'force_https = true');
ok(/^\s*auto_stop_machines = 'suspend'$/m.test(prod), "auto_stop_machines = 'suspend'");
ok(/^\s*min_machines_running = 1$/m.test(prod), 'min_machines_running = 1');

console.log('T4 (AC4, baseline): /health answers 200 {"status":"ok"} with no session and no database');
const handlerSource = fs.readFileSync(path.join(root, 'src', 'web-ui', 'routes', 'health.js'), 'utf8');
const { healthCheckHandler } = require('../src/web-ui/routes/health');
let status = null; let body = null;
healthCheckHandler({ session: undefined }, {
  writeHead: function (s) { status = s; },
  end: function (b) { body = b; }
});
ok(status === 200, 'answers 200 with no session');
ok(body === JSON.stringify({ status: 'ok' }), 'body is {"status":"ok"}');
ok(!/require\(/.test(handlerSource), 'the handler requires nothing, so it cannot reach the database');

console.log('T5 (AC5, baseline): fly.staging.toml declares no health check');
ok(!/\[\[http_service\.checks\]\]/.test(staging), 'no [[http_service.checks]] entry in fly.staging.toml');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
