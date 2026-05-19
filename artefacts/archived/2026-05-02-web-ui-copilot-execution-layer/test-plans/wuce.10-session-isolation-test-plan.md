# Test Plan: wuce.10 — Per-user session isolation via COPILOT_HOME

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.10-session-isolation.md
**Epic:** wuce-e3
**Framework:** Jest + Node.js (filesystem operations; real `fs` + `tmp` in unit tests; no mocking of `fs.mkdtemp`)
**Test data strategy:** Temporary directories created and cleaned up within each test; no committed fixtures needed

---

## AC coverage summary

| AC | Description | Coverage type | Gap |
|---|---|---|---|
| AC1 | `createSession(userId)` creates unique dir at correct path; returns absolute path | Unit (real fs, temp base dir) | None |
| AC2 | Two concurrent users have distinct `COPILOT_HOME` paths; no shared files | Unit (two sessions created, paths compared) | None |
| AC3 | `cleanupSession(path)` deletes entire dir within 5 seconds | Unit (real fs; verify dir gone after call) | None |
| AC4 | Path traversal check on cleanup — only paths within temp base dir are cleaned | Unit (mock/real fs; validate rejection) | None |
| AC5 | Startup cleanup of orphaned dirs older than 24 hours | Unit (real fs; manually set mtime to >24h ago) | None |

---

## Unit tests

### T1 — `createSession(userId)` path structure (AC1)

**T1.1 — returned path starts with temp base directory**
- Setup: configure temp base as a controlled test directory (e.g. `os.tmpdir() + '/wuce10-test/'`); call `createSession("user-alice")`
- Expected: returned path starts with the configured temp base; path includes `sha256("user-alice")` as a directory component; a unique UUID segment follows the hash

**T1.2 — returned directory exists on the filesystem**
- Setup: call `createSession("user-alice")`; capture returned path
- Expected: `fs.existsSync(returnedPath)` is `true`; `fs.statSync(returnedPath).isDirectory()` is `true`
- Teardown: `cleanupSession(returnedPath)`

**T1.3 — two calls for the same user produce different session directories**
- Setup: call `createSession("user-alice")` twice
- Expected: the two returned paths are not equal (UUID component differs)
- Rationale: sessions must be unique even for the same user running concurrently
- Teardown: clean up both paths

### T2 — Concurrent isolation (AC2)

**T2.1 — two different users produce paths with different hash segments**
- Setup: call `createSession("user-alice")` and `createSession("user-bob")`
- Expected: the `sha256` path component differs between the two results (because the inputs differ)
- Teardown: clean up both paths

**T2.2 — session directories for different users share no files**
- Setup: create sessions for two users; write a file into each session dir
- Expected: the file written into alice's session dir does not appear in bob's session dir; filesystem isolation confirmed
- Teardown: clean up both paths

### T3 — `cleanupSession(sessionPath)` (AC3)

**T3.1 — directory and all contents are deleted**
- Setup: call `createSession("user-cleanup")`; write a nested file inside the returned path
- Action: call `cleanupSession(returnedPath)`
- Expected: `fs.existsSync(returnedPath)` is `false` after cleanup; no files remain

**T3.2 — cleanup resolves within 5 seconds (timing bound)**
- Setup: create a session dir containing 10 files
- Action: `const start = Date.now(); await cleanupSession(path); const elapsed = Date.now() - start;`
- Expected: `elapsed < 5000`
- Rationale: AC3 specifies "within 5 seconds"

### T4 — Path traversal protection on cleanup (AC4)

**T4.1 — path outside temp base is rejected**
- Setup: configure temp base as `/tmp/copilot-sessions-test`; call `cleanupSession("/etc/passwd")`
- Expected: function rejects with a path-validation error; no filesystem deletion attempted outside temp base

**T4.2 — path traversal via `../` in session path is rejected**
- Setup: call `cleanupSession("/tmp/copilot-sessions-test/abc/../../../etc")`
- Expected: resolved absolute path does NOT start with temp base; function rejects with path-validation error

**T4.3 — path within temp base is accepted**
- Setup: `createSession("user-alice")`; call `cleanupSession` with the returned path
- Expected: function resolves; no rejection

### T5 — Startup cleanup of orphaned sessions (AC5)

**T5.1 — directory older than 24 hours is deleted on startup cleanup**
- Setup: create a temp directory inside the test temp base; manually set its `mtime` to `Date.now() - (25 * 60 * 60 * 1000)` (25 hours ago)
- Action: call `cleanupOrphanedSessions(tempBase)`
- Expected: the old directory no longer exists after cleanup

**T5.2 — directory younger than 24 hours is retained**
- Setup: create a temp directory with `mtime` set to 1 hour ago
- Action: call `cleanupOrphanedSessions(tempBase)`
- Expected: the young directory still exists after cleanup

**T5.3 — startup cleanup logs user ID hash and session ID for each deleted dir**
- Setup: create an old orphaned dir; spy on logger
- Action: call `cleanupOrphanedSessions(tempBase)`
- Expected: logger called with the session path (containing only the hash, not raw user ID); no raw user identifier in log

---

## Integration tests

### IT1 — Full session lifecycle: create → use → cleanup (AC1, AC2, AC3)

- Setup: configured temp base; call `createSession`; confirm dir exists; call `cleanupSession`; confirm dir gone
- Expected: clean lifecycle with no orphaned directories; all assertions pass

### IT2 — Startup cleanup integration with real temp dirs (AC5)

- Setup: create 3 dirs: one > 24h old, one < 24h old, one exactly 24h old (should be cleaned — boundary)
- Action: call `cleanupOrphanedSessions`
- Expected: 2 dirs removed (old + boundary); 1 dir retained (young)

---

## NFR tests

### NFR1 — Audit log contains hash not raw user ID

- Setup: spy on audit logger; call `createSession("user-alice@example.com")`
- Expected: `"user-alice@example.com"` does NOT appear in any log call; a SHA-256 hex string IS present

### NFR2 — Session creation and deletion each complete under 100ms

- Setup: benchmark `createSession` and `cleanupSession` on a minimal session dir
- Expected: each operation completes in under 100ms

---

## Coverage gaps

| Gap | Reason | Mitigation |
|---|---|---|
| AC2 — true concurrent subprocess isolation | Multi-process concurrency requires spawning real subprocesses | IT1 verifies path uniqueness and filesystem non-overlap; true concurrent subprocess isolation is tested in the wuce.9/wuce.10 combined integration smoke test (documented in wuce.9 verification script) |

---

## Test count

| Category | Count |
|---|---|
| Unit tests | 13 |
| Integration tests | 2 |
| NFR tests | 2 |
| **Total** | **17** |

**acTotal: 5**
