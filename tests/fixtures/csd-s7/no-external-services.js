'use strict';

// Fixture for csd-s7 AC3 -- a real file with zero allowlisted external
// service requires. Only node builtins and internal relative requires,
// none of which are on the fixed allowlist (stripe, pg, ioredis/redis,
// @octokit/*, @anthropic-ai/sdk, posthog-node).

const path = require('path');
const fs = require('fs');
const helper = require('./some-internal-helper');

function noop() {
  return path.join(fs && helper ? '.' : '.');
}

module.exports = { noop };
