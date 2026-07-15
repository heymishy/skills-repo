'use strict';

// prc-s1.3: Sign-off write-back to product's own repo
// Tests for AC1–AC4: parameterized commitSignOff accepting owner/repo,
// fail-closed behaviour when no repo configured, and unchanged identity attribution.

const assert = require('assert');
const { commitSignOff } = require('../src/web-ui/adapters/sign-off-writer');

let passed = 0, failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function createMockFetch() {
  let mockFetchCalls = [];
  return {
    calls: mockFetchCalls,
    fetch: async function(url, options = {}) {
      mockFetchCalls.push({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body
      });

      // Mock GET /user — authenticated user identity
      if (url.includes('/user') && (!options.method || options.method === 'GET')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com'
          })
        };
      }

      // Mock PUT /repos/{owner}/{repo}/contents/{path}
      if (url.includes('/repos/') && url.includes('/contents/') && options.method === 'PUT') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ sha: 'new-sha-123' })
        };
      }

      // Fallback
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' })
      };
    }
  };
}

(async function() {
  const originalFetch = global.fetch;

  // AC1: commitSignOff with owner/repo params targets the specified product repo
  try {
    const mockFetch = createMockFetch();
    global.fetch = mockFetch.fetch;

    const payload = {
      content: 'Test\n\n## Approved by\n\nTest User — 2026-07-15T10:00:00Z\n',
      sha: 'oldsha123'
    };

    await commitSignOff('artefacts/test/discovery.md', payload, 'fake-token', 'acme', 'widgets');

    const putCall = mockFetch.calls.find(
      c => c.method === 'PUT' && c.url.includes('/contents/')
    );
    assert(putCall, 'Should have made a PUT request to Contents API');
    assert(
      putCall.url.includes('/repos/acme/widgets/'),
      `PUT should target /repos/acme/widgets/, got ${putCall.url}`
    );
    pass('AC1: commitSignOff with owner/repo params targets the specified product repo');
  } catch (err) {
    fail('AC1: commitSignOff with owner/repo params targets the specified product repo', err);
  } finally {
    global.fetch = originalFetch;
  }

  // AC2: Two products' sign-offs land in separate repos, never crossing
  try {
    const mockFetch = createMockFetch();
    global.fetch = mockFetch.fetch;

    const payload1 = {
      content: 'Product A\n\n## Approved by\n\nTest User — 2026-07-15T10:00:00Z\n',
      sha: 'sha1'
    };
    const payload2 = {
      content: 'Product B\n\n## Approved by\n\nTest User — 2026-07-15T10:01:00Z\n',
      sha: 'sha2'
    };

    // Track all calls across both sign-offs
    await commitSignOff('artefacts/a/discovery.md', payload1, 'fake-token', 'org-a', 'repo-a');
    await commitSignOff('artefacts/b/discovery.md', payload2, 'fake-token', 'org-b', 'repo-b');

    // Verify two separate PUT calls to different repos
    const putCalls = mockFetch.calls.filter(c => c.method === 'PUT');
    assert.equal(putCalls.length, 2, `Should have made 2 PUT requests, got ${putCalls.length}`);
    assert(
      putCalls[0].url.includes('/repos/org-a/repo-a/'),
      `First call should target org-a/repo-a, got ${putCalls[0].url}`
    );
    assert(
      putCalls[1].url.includes('/repos/org-b/repo-b/'),
      `Second call should target org-b/repo-b, got ${putCalls[1].url}`
    );
    pass('AC2: Two products\' sign-offs land in separate repos, never crossing');
  } catch (err) {
    fail('AC2: Two products\' sign-offs land in separate repos, never crossing', err);
  } finally {
    global.fetch = originalFetch;
  }

  // AC3: No repo configured → rejected before any API call
  try {
    const mockFetch = createMockFetch();
    global.fetch = mockFetch.fetch;

    const payload = {
      content: 'Test\n\n## Approved by\n\nTest User — 2026-07-15T10:00:00Z\n',
      sha: 'oldsha123'
    };

    let threw = null;
    try {
      await commitSignOff('artefacts/test/discovery.md', payload, 'fake-token', null, null);
    } catch (err) {
      threw = err;
    }

    assert(threw, 'Should have thrown an error for missing owner/repo');
    assert(
      threw.message.includes('owner') || threw.message.includes('repo'),
      `Error should mention missing owner/repo, got: ${threw.message}`
    );
    assert.equal(
      mockFetch.calls.length,
      0,
      `No API calls should be made when owner/repo missing, but ${mockFetch.calls.length} were made`
    );
    pass('AC3: No repo configured → rejected before any API call');
  } catch (err) {
    fail('AC3: No repo configured → rejected before any API call', err);
  } finally {
    global.fetch = originalFetch;
  }

  // AC4: Commit author/committer identity unchanged — still the authenticated user
  try {
    const mockFetch = createMockFetch();
    global.fetch = mockFetch.fetch;

    const payload = {
      content: 'Test\n\n## Approved by\n\nTest User — 2026-07-15T10:00:00Z\n',
      sha: 'oldsha123'
    };

    await commitSignOff('artefacts/test/discovery.md', payload, 'fake-token', 'acme', 'widgets');

    const putCall = mockFetch.calls.find(c => c.method === 'PUT');
    assert(putCall, 'Should have made a PUT request');

    const body = JSON.parse(putCall.body);
    assert.deepStrictEqual(
      body.author,
      { name: 'Test User', email: 'test@example.com' },
      'Author should be the authenticated user'
    );
    assert.deepStrictEqual(
      body.committer,
      { name: 'Test User', email: 'test@example.com' },
      'Committer should be the authenticated user'
    );
    pass('AC4: Commit author/committer identity unchanged — still the authenticated user');
  } catch (err) {
    fail('AC4: Commit author/committer identity unchanged — still the authenticated user', err);
  } finally {
    global.fetch = originalFetch;
  }

  console.log(`\n[prc-s1.3 test suite] ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
