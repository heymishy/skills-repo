# Test Plan: Lockfile structure, pinning, and transparency

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-lockfile.md
**Epic:** E2 — Distribution model
**Complexity:** 2 (Unstable — schema fields determined by Spike C)
**Test type:** Unit + integration (fixture-based)

---

## Test matrix

| ID | Description | Type | AC | Method | Pass condition |
|----|-------------|------|----|--------|----------------|
| T1 | lockfile module exists | Unit | — | `fs.existsSync` | `src/distribution/lockfile.js` present |
| T2 | `validateSchema` with complete valid lockfile fixture → passes | Unit | AC1 | Pass fixture with all 5 required fields | Returns null / no error |
| T3 | `validateSchema` with missing required field → named error | Unit | AC1 | Remove `pinnedRef` from fixture | Error names the missing field |
| T4 | `verifyLockfile` with matching hashes → passes | Integration | AC2 | Fixture lockfile + matching skill file | Returns null / no error |
| T5 | `verifyLockfile` with mismatching hash → named error with skillId and hashes | Integration | AC2 | Modify skill file after pinning | Error contains `skillId`, `expected_hash`, `actual_hash` |
| T6 | Hash computation is deterministic — same content produces same hash | Unit | AC3 | Compute SHA-256 of same buffer twice | Hashes are equal |
| T7 | `verifyLockfile` detects tampered skill file | Integration | AC4 | Pin, then modify skill file byte, then verify | Verify fails with hash mismatch error |
| T8 | JSON Schema validation enforced by test suite (MC-CORRECT-02) | Governance | AC1 | Confirm `check-p4-dist-lockfile.js` runs in npm test | Test present in package.json scripts or tests/ |
| T-NFR1 | Lockfile fixture contains no credentials or personal data | Security | NFR | Inspect lockfile fields | No token, key, email, or tenant ID |
| T-NFR2 | `computeHash` uses SHA-256 (not MD5, not SHA-1) | Security | NFR | Source-scan or inspect hash output length (64 hex chars) | Hash output is 64-character hex string |

---

## Test descriptions

### T1 — Module exists
`src/distribution/lockfile.js` must exist. If absent, all remaining tests fail.

### T2 — Valid lockfile passes schema
Use fixture: `{ upstreamSource: "https://example.com/repo.git", pinnedRef: "main@abc1234", pinnedAt: "2026-04-19T12:00:00Z", platformVersion: "4.0.0", skills: [{ skillId: "discovery", skillFile: ".github/skills/discovery/SKILL.md", contentHash: "a".repeat(64) }] }`.
`validateSchema(fixture)` must return null.

### T3 — Missing field → named error
Remove `pinnedRef` from the fixture and call `validateSchema`. Expect error message containing `"pinnedRef"`.

### T4 — verifyLockfile with matching hash
Create a temp skill file with known content. Compute its SHA-256 hash. Write a lockfile with that hash. `verifyLockfile(lockfile, root)` must return null.

### T5 — Hash mismatch error format
Modify the fixture skill file (append one byte). Re-run `verifyLockfile`. Error message must contain:
- The `skillId` field value
- The string `"expected"` followed by the lockfile hash
- The string `"got"` followed by the computed actual hash

### T6 — Deterministic hashing
Call `computeHash(buffer)` twice on the same `Buffer`. Both calls must return the same hex string.

### T7 — Tampered file detected
Pin a skill file to a lockfile. Modify the skill file (change one character). Run `verifyLockfile`. Must return/throw a hash mismatch error for the tampered skill.

### T8 — CI schema check present
`package.json` must include `check-p4-dist-lockfile.js` in the test pipeline (directly or via a glob pattern). Alternatively, confirm `tests/check-p4-dist-lockfile.js` is present and would be picked up by `npm test`.

### T-NFR1 — No credentials in lockfile
Inspect the fixture lockfile written by `writeLockfile`. Fields must not include any of: `token`, `password`, `secret`, `email`, `tenantId`. Hash values are permitted.

### T-NFR2 — SHA-256 algorithm
`computeHash(Buffer.from('test'))` must return a 64-character hex string (SHA-256 output length). Any shorter string indicates MD5 (32 chars) or SHA-1 (40 chars).

---

## Coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T3, T8 |
| AC2 | T4, T5 |
| AC3 | T6 |
| AC4 | T7 |
| NFR: Security | T-NFR1, T-NFR2 |
| NFR: Correctness | T8 |
