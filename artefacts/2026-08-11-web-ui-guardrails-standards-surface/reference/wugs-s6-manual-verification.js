'use strict';

// wugs-s6-manual-verification.js — one-off manual verification tool.
// Not a test (no assertions, no pass/fail exit code) -- calls the REAL
// guardrail-pr-adapter against a REAL sandbox GitHub repo and prints the raw
// API response shapes at each step, so you can read them and compare against
// what tests/check-wugs-s6-branch-pr-creation-adapter.js mocks.
//
// Usage:
//   GITHUB_TOKEN=ghp_xxx GITHUB_OWNER=your-username GITHUB_REPO=sandbox-repo \
//     node artefacts/2026-08-11-web-ui-guardrails-standards-surface/reference/wugs-s6-manual-verification.js
//
// Requires: a disposable GitHub repo you own (public or private, doesn't
// matter -- create a throwaway one, e.g. "wugs-s6-sandbox"), with at least
// one commit on its default branch so a branch ref exists to read.
// The token needs "repo" scope (classic PAT) or Contents+Pull-requests
// read/write (fine-grained PAT), scoped to that one repo.
//
// This performs REAL writes: it creates a real branch, commits a real file,
// and opens a real PR on the target repo. That's the point -- it's exercising
// the exact code path production will use. Use a repo you're fine leaving a
// test branch/PR/file in (or clean up after).

const { realCreateGuardrailPr } = require('../../../src/web-ui/adapters/guardrail-pr-adapter');

const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

if (!token || !owner || !repo) {
  console.error('Missing required env vars. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.');
  process.exit(1);
}

// Wrap fetch to log every raw request/response shape as it happens --
// this is the actual thing being verified: does the real GitHub API return
// what the mocked tests assumed it would?
const originalFetch = global.fetch;
let stepNum = 0;
global.fetch = async function (url, opts) {
  stepNum++;
  const method = (opts && opts.method) || 'GET';
  console.log(`\n--- Step ${stepNum}: ${method} ${url} ---`);
  const res = await originalFetch(url, opts);
  const cloned = res.clone();
  let bodyPreview;
  try {
    bodyPreview = await cloned.json();
  } catch (_) {
    bodyPreview = await cloned.text();
  }
  console.log(`status: ${res.status}`);
  console.log('body:', JSON.stringify(bodyPreview, null, 2).slice(0, 2000));
  return res;
};

(async () => {
  const targetPath = `standards/wugs-s6-manual-verification-${Date.now()}.md`;
  const content = `# Manual verification\n\nThis file was created by wugs-s6's manual sandbox verification script on ${new Date().toISOString()}. Safe to delete this file, its branch, and its PR once you've confirmed the response shapes match the mocks.\n`;

  console.log(`Calling realCreateGuardrailPr against ${owner}/${repo}, path: ${targetPath}`);
  console.log('Compare each step\'s logged shape against tests/check-wugs-s6-branch-pr-creation-adapter.js\'s mockFetchSequence() bodies for the equivalent step.');

  try {
    const result = await realCreateGuardrailPr(token, owner, repo, targetPath, content, {
      tenantId: 'manual-verification',
      productId: 'manual-verification',
      posthog: { capture: function () { /* no-op -- don't pollute real PostHog with this manual run */ } }
    });
    console.log('\n=== SUCCESS ===');
    console.log('Returned:', result);
    console.log(`\nCheck the real PR: ${result.prUrl}`);
    console.log('If every logged step shape above matches the equivalent mock in the test file, the verification passes.');
    console.log('Record the outcome in decisions.md (the wugs-s6 post-merge RISK-ACCEPT entry) and in PR #726\'s description/comments.');
  } catch (err) {
    console.error('\n=== FAILED ===');
    console.error(err);
    console.error('\nThis is exactly the scenario the manual verification exists to catch -- a real API response shape');
    console.error('the adapter did not expect. Compare the failing step\'s logged shape above against the code\'s');
    console.error('expectations in src/web-ui/adapters/guardrail-pr-adapter.js, and fix the adapter accordingly.');
    process.exitCode = 1;
  } finally {
    global.fetch = originalFetch;
  }
})();
