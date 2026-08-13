'use strict';
// check-wugs-s14-fetch-timeout.js -- wugs-s14
//
// Tests the AbortController-based fetch timeout added to
// fetchGithubContentsResponse() in artefact-fetcher.js -- the single shared
// GitHub Contents API adapter both fetchArtefact() and realFetchRepoPath()
// call through. AC1-AC4 per
// artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s14-fetch-timeout-test-plan.md
const assert = require('assert');
let passed = 0, failed = 0;

// wugs-s1 Task 2 convention: check() is awaited by every call site below (an
// async fn's body runs synchronously up to its first await, so a
// non-awaited call can still silently miss a later rejected assertion).
async function check(name, fn) {
  try { await fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

// Fresh require each time to reset the module's internal adapter state
// (matches tests/check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js
// convention).
function freshModule() {
  delete require.cache[require.resolve('../src/web-ui/adapters/artefact-fetcher')];
  return require('../src/web-ui/adapters/artefact-fetcher');
}

// wugs-s1 convention: mockFn replaces global.fetch for the duration of
// testFn(mod); the original is always restored, including if testFn itself
// throws.
async function withMockedFetch(mockFn, testFn) {
  const mod = freshModule();
  const originalFetch = global.fetch;
  global.fetch = mockFn;
  try {
    await testFn(mod);
  } finally {
    global.fetch = originalFetch;
  }
}

// A fetch mock that never settles on its own -- it deliberately does NOT
// use a real but small setTimeout to fake a "slow" response, because that
// would make this test racy against the timeout under test. Instead it
// respects the AbortSignal the same way the real global fetch() does: when
// the AbortController's signal fires, the returned promise rejects with an
// AbortError. This lets the implementation's own timeout mechanism (not a
// coincidental mock resolution) be what drives the throw, while keeping the
// test itself fast and deterministic -- the promise only ever settles via
// the abort listener below, so the test process never hangs.
function hangingFetchRespectingAbort() {
  return (url, opts) => new Promise((resolve, reject) => {
    if (opts && opts.signal) {
      opts.signal.addEventListener('abort', () => {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        reject(err);
      });
    }
    // No resolve/reject here -- this promise only ever settles through the
    // abort listener above.
  });
}

function validContentsResponse(text) {
  return {
    status: 200,
    ok: true,
    json: async () => ({ content: Buffer.from(text).toString('base64'), type: 'file' })
  };
}

(async () => {
  await check('AC1: fetchGithubContentsResponse_requestHangs_abortsAndThrowsClearTimeoutError', () => withMockedFetch(
    hangingFetchRespectingAbort(),
    async (mod) => {
      await assert.rejects(
        () => mod.fetchGithubContentsResponse(
          'https://api.github.com/repos/acme/widget/contents/foo.md',
          'tok',
          ['acme/widget', 'foo.md'],
          'Network error fetching artefact',
          50
        ),
        (err) => {
          assert.ok(err instanceof mod.ArtefactFetchError, 'expected an ArtefactFetchError instance, got: ' + err.constructor.name);
          assert.ok(/timeout/i.test(err.message), 'expected the error message to clearly state a timeout occurred, got: ' + err.message);
          return true;
        }
      );
    }
  ));

  await check('AC2: fetchGithubContentsResponse_normalFastResponse_behaviourUnchanged', () => withMockedFetch(
    async () => validContentsResponse('# Hello'),
    async (mod) => {
      const data = await mod.fetchGithubContentsResponse(
        'https://api.github.com/repos/acme/widget/contents/foo.md',
        'tok',
        ['acme/widget', 'foo.md'],
        'Network error fetching artefact'
      );
      assert.strictEqual(data.content, Buffer.from('# Hello').toString('base64'));
      assert.strictEqual(data.type, 'file');
    }
  ));

  await check('AC3a: fetchGithubContentsResponse_normalResponse_timeoutTimerCleared', () => withMockedFetch(
    async () => validContentsResponse('# Hello'),
    async (mod) => {
      const originalClearTimeout = global.clearTimeout;
      let clearTimeoutCalled = false;
      global.clearTimeout = (id) => { clearTimeoutCalled = true; return originalClearTimeout(id); };
      try {
        await mod.fetchGithubContentsResponse(
          'https://api.github.com/repos/acme/widget/contents/foo.md',
          'tok',
          ['acme/widget', 'foo.md'],
          'Network error fetching artefact'
        );
      } finally {
        global.clearTimeout = originalClearTimeout;
      }
      assert.ok(clearTimeoutCalled, 'expected clearTimeout to be called on the success path so no timer is left dangling (AC3)');
    }
  ));

  await check('AC3b: fetchGithubContentsResponse_timeoutFires_noDoubleErrorOrLateResolution', () => withMockedFetch(
    hangingFetchRespectingAbort(),
    async (mod) => {
      let unhandled = null;
      const onUnhandledRejection = (err) => { unhandled = err; };
      process.on('unhandledRejection', onUnhandledRejection);
      try {
        await assert.rejects(
          () => mod.fetchGithubContentsResponse(
            'https://api.github.com/repos/acme/widget/contents/foo.md',
            'tok',
            ['acme/widget', 'foo.md'],
            'Network error fetching artefact',
            50
          )
        );
        // Wait well past where the (never-resolving) original fetch "would
        // have" resolved, to prove there is no second settle/late
        // resolution after the timeout has already thrown.
        await new Promise((resolve) => setTimeout(resolve, 200));
      } finally {
        process.removeListener('unhandledRejection', onUnhandledRejection);
      }
      assert.strictEqual(unhandled, null, 'expected no unhandled rejection from a late/second settle of the underlying fetch promise (AC3)');
    }
  ));

  await check('AC4: bothCallers_fetchArtefactAndRealFetchRepoPath_inheritTimeoutIdentically', () => withMockedFetch(
    hangingFetchRespectingAbort(),
    async (mod) => {
      const assertTimeoutShape = (err) => {
        assert.ok(err instanceof mod.ArtefactFetchError, 'expected an ArtefactFetchError instance, got: ' + err.constructor.name);
        assert.ok(/timeout/i.test(err.message), 'expected a timeout-shaped message, got: ' + err.message);
        return true;
      };

      await assert.rejects(
        () => mod.fetchArtefact('2026-01-01-example-feature', 'discovery', 'tok', undefined, 50),
        assertTimeoutShape
      );

      await assert.rejects(
        () => mod.realFetchRepoPath('acme', 'widget', 'some/path.md', 'tok', 50),
        assertTimeoutShape
      );
    }
  ));

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
