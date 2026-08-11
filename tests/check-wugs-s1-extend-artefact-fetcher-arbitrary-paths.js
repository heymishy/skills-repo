'use strict';
// check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js -- wugs-s1
//
// Tests the new fetchRepoPath adapter added to artefact-fetcher.js, which
// generalises the existing fetchArtefact() single-path fetch into an
// arbitrary file/folder read (needed by the guardrails/standards feature to
// read .github/architecture-guardrails.md and standards/ from a connected
// repo). This file grows task-by-task across wugs-s1's implementation plan:
// Task 1 covers only AC5 (unwired stub throws); later tasks add AC1-AC4/AC6.
const assert = require('assert');
let passed = 0, failed = 0;
// wugs-s1 Task 2: check() is awaited by every call site below (an async fn's
// body runs synchronously up to its first await, so a non-awaited call can
// still silently miss a later rejected assertion). Making check() async and
// awaiting every invocation ensures async test bodies are actually watched
// to completion before the summary line prints. Awaiting a synchronous fn's
// return value (e.g. the AC5 test, which returns undefined) is a no-op, so
// this is safe for the existing synchronous test too.
async function check(name, fn) {
  try { await fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

// Fresh require each time to reset the module's internal adapter state
function freshModule() {
  delete require.cache[require.resolve('../src/web-ui/adapters/artefact-fetcher')];
  return require('../src/web-ui/adapters/artefact-fetcher');
}

// wugs-s1 Task 4: extracted after the freshModule()/save-global.fetch/
// try-finally-restore scaffold reached its third verbatim occurrence
// (AC1, AC2, AC3), per Task 3's own code-quality review flagging this as
// the threshold to extract at. mockFn replaces global.fetch for the
// duration of testFn(mod); the original is always restored, including if
// testFn itself throws.
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

(async () => {
  await check('AC5: fetchRepoPath_unwired_throwsExplicitError', () => {
    const mod = freshModule();
    assert.throws(
      () => mod.fetchRepoPath('owner', 'repo', 'some/path', 'tok'),
      /Adapter not wired: fetchRepoPath/,
      'expected the unwired stub to throw immediately (synchronous), not return a rejected promise silently'
    );
  });

  await check('AC1: realFetchRepoPath_singleFile_returnsDecodedContent', () => withMockedFetch(
    async (url, opts) => {
      assert.ok(url.includes('/repos/acme/widget/contents/.github/architecture-guardrails.md'));
      assert.strictEqual(opts.headers['Authorization'], 'Bearer tok123');
      return {
        status: 200,
        ok: true,
        json: async () => ({
          content: Buffer.from('# Guardrails\n\nSome content.').toString('base64'),
          type: 'file'
        })
      };
    },
    async (mod) => {
      const result = await mod.realFetchRepoPath('acme', 'widget', '.github/architecture-guardrails.md', 'tok123');
      assert.strictEqual(result, '# Guardrails\n\nSome content.');
    }
  ));

  await check('AC2: realFetchRepoPath_folder_returnsEntryArray', () => withMockedFetch(
    async (url) => {
      assert.ok(url.includes('/repos/acme/widget/contents/standards'));
      return {
        status: 200,
        ok: true,
        json: async () => ([
          { name: 'data', path: 'standards/data', type: 'dir', sha: 'abc' },
          { name: 'devops', path: 'standards/devops', type: 'dir', sha: 'def' }
        ])
      };
    },
    async (mod) => {
      const result = await mod.realFetchRepoPath('acme', 'widget', 'standards', 'tok123');
      assert.ok(Array.isArray(result), 'expected an array for a folder path');
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].name, 'data');
      assert.strictEqual(result[0].type, 'dir');
    }
  ));

  await check('AC3: realFetchRepoPath_missingPath_throwsArtefactNotFoundError', () => withMockedFetch(
    async () => ({ status: 404, ok: false, json: async () => ({ message: 'Not Found' }) }),
    async (mod) => {
      await assert.rejects(
        () => mod.realFetchRepoPath('acme', 'widget', 'nonexistent.md', 'tok123'),
        mod.ArtefactNotFoundError
      );
    }
  ));

  await check('AC4: realFetchRepoPath_apiError_throwsArtefactFetchError', () => withMockedFetch(
    async () => ({ status: 500, ok: false, json: async () => ({ message: 'Internal error' }) }),
    async (mod) => {
      await assert.rejects(
        () => mod.realFetchRepoPath('acme', 'widget', 'some/path.md', 'tok123'),
        (err) => {
          assert.ok(err instanceof mod.ArtefactFetchError, 'expected an ArtefactFetchError instance');
          assert.strictEqual(err.cause, 'Internal error', 'expected the underlying GitHub error message to be preserved in .cause, per AC4');
          return true;
        }
      );
    }
  ));

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
