# Definition of Done: YAML lockfile with SHA-256 content hashing and deterministic verify (p4-dist-lockfile)

**PR:** No formal PR — work committed directly to master at `a3b2cd1` | **Merged:** 2026-04-20
**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-lockfile.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-lockfile-test-plan.md
**DoR artefact:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-lockfile-dor.md
**Assessed by:** claude-sonnet-4-6 (agent) + heymishy (operator)
**Date:** 2026-04-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Lockfile contains all 5 required fields: `upstreamSource`, `pinnedRef`, `pinnedAt`, `platformVersion`, `skills` (array with `skillId`, `skillFile`, `contentHash`) | ✅ | T1 passing (`src/distribution/lockfile.js` exists); T2 passing (schema validates valid fixture); T3a/T3b passing (missing field detected with named error naming the specific field) | Automated: `tests/check-p4-dist-lockfile.js` T1–T3b | None |
| AC2 — `verify` re-computes SHA-256 and errors with named skill + expected/actual hashes on mismatch | ✅ | T4 passing (verify with matching hash returns null); T5a passing (verify with mismatching hash returns error); T5b passing (error includes skillId); T5c passing (error includes "expected" and "got") | Automated: T4, T5a–T5c | None |
| AC3 — Hash computation is deterministic for identical content | ✅ | T6 passing (two `computeHash` calls produce same result: `b3fcd67b…`) | Automated: T6 | None |
| AC4 — Tampered sidecar file fails verify; verify does not pass on tampered content | ✅ | T7 passing (verify after tampering returns error — hash mismatch detected); T8 passing (check-p4-dist-lockfile.js covered by npm test script) | Automated: T7, T8 | None |

**ACs satisfied: 4/4**

---

## Scope Deviations

**Deviation 1 — No formal feature branch PR:** Work committed at `a3b2cd1` without a standalone draft PR.

---

## Test Plan Coverage

**Tests from plan implemented:** 13/13 assertions passing
**Assertions passing:** 13/13
**Tests passing in CI (npm test):** 13

| Test ID | Implemented | Passing | Notes |
|---------|-------------|---------|-------|
| T1 — lockfile.js exists | ✅ | ✅ | |
| T2 — validateSchema(valid) returns null | ✅ | ✅ | |
| T3a — validateSchema(missingPinnedRef) returns error | ✅ | ✅ | |
| T3b — error names "pinnedRef" | ✅ | ✅ | |
| T4 — verifyLockfile matching hash → null | ✅ | ✅ | |
| T5a — verifyLockfile mismatch → error | ✅ | ✅ | |
| T5b — error includes skillId | ✅ | ✅ | |
| T5c — error includes "expected" or "got" | ✅ | ✅ | |
| T6 — computeHash is deterministic | ✅ | ✅ | Both calls: b3fcd67b… |
| T7 — pin then tamper then verify → hash mismatch | ✅ | ✅ | |
| T8 — test covered by npm test script | ✅ | ✅ | |
| T-NFR1 — no credential fields in written lockfile | ✅ | ✅ | |
| T-NFR2 — computeHash produces 64-char hex | ✅ | ✅ | SHA-256 = 64 hex chars |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| MC-SEC-02 — No credential fields in lockfile | ✅ | T-NFR1 passing; written lockfile contains no credential-shaped fields |
| SHA-256 produces correct-length output | ✅ | T-NFR2 passing; `computeHash` produces 64-character hex string |
| Tamper detection — verify never passes on modified sidecar | ✅ | T7 passing; end-to-end: pin → tamper → verify produces hash mismatch error |
| Determinism — identical input produces identical hash | ✅ | T6 passing; two independent hash calls on same content produce identical 64-char hex |
