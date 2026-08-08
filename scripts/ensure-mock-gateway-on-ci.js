#!/usr/bin/env node
'use strict';

// ensure-mock-gateway-on-ci.js — mgar-s1
//
// Thin CLI wrapper around tests/e2e/fixtures/ensure-mock-gateway-on.js so
// .github/workflows/e2e.yml can invoke it as a single `node` step, matching
// this repo's existing pattern for small CI-invoked scripts
// (e.g. scripts/purge-e2e-tenants.js). Never exits non-zero -- this step
// exists to prevent an unintended real-call run, not to gate the job on its
// own success; the real Playwright test step that follows is what should
// fail/pass on its own merits per the story's Architecture Constraints.

const { ensureMockGatewayOn } = require('../tests/e2e/fixtures/ensure-mock-gateway-on');

ensureMockGatewayOn()
  .then(function(result) {
    if (result.forcedOn) {
      console.log('[ensure-mock-gateway-on-ci] Mock gateway forced ON before this run.');
    } else {
      console.log('[ensure-mock-gateway-on-ci] Could not force mock gateway on: ' + result.reason);
      console.log('[ensure-mock-gateway-on-ci] Proceeding anyway -- this step is defensive, not a gate. ' +
        'If the mock gateway was already off, the following test step may make real API calls.');
    }
    process.exitCode = 0;
  })
  .catch(function(err) {
    console.log('[ensure-mock-gateway-on-ci] Unexpected error: ' + (err && err.message || err));
    process.exitCode = 0;
  });
