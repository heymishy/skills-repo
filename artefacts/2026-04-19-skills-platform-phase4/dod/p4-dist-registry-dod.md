# Definition of Done: Fleet registry with stale detection and governance schema validation (p4-dist-registry)

**PR:** No formal PR — work committed directly to master at `a3b2cd1` | **Merged:** 2026-04-20
**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-registry.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-registry-test-plan.md
**DoR artefact:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-registry-dor.md
**Assessed by:** claude-sonnet-4-6 (agent) + heymishy (operator)
**Date:** 2026-04-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Registry entry contains all 5 required fields: `consumerSlug`, `lockfileVersion`, `upstreamSource`, `lastSyncDate`, `syncStatus` | ✅ | T1 passing (`scripts/update-fleet-registry.js` exists); T1c/T1d passing (`addConsumerEntry` and `computeSyncStatus` exported); T2a passing (entry returned); T2 passing for all 5 fields (consumerSlug: "heymishy/sample-repo", lockfileVersion: "3.9.0", upstreamSource: "https://upstream.example.com/skills.git", lastSyncDate: ISO 8601, syncStatus: "clean") | Automated: `tests/check-p4-dist-registry.js` T1–T2 | None |
| AC2 — Consumer behind by more than stale threshold → `syncStatus: "stale"` + `versionsBehind`; fresh consumer → `syncStatus: "clean"`, no `versionsBehind` field | ✅ | T4a passing (syncStatus: "stale" when 2 behind with threshold 2); T4b passing (versionsBehind: 2); T5a passing (syncStatus: "clean" when 0 behind); T5b passing (clean result omits versionsBehind) | Automated: T4a, T4b, T5a, T5b | None |
| AC3 — npm test governance check validates all fleet-state.json entries against JSON Schema; invalid entries produce named errors | ✅ | T3 passing (governance validation names missing "upstreamSource" field); T7a passing (invalid syncStatus "outdated" triggers error); T7b passing (error names syncStatus and invalid value); T8a passing (non-ISO lastSyncDate triggers error); T8b passing (error mentions date format) | Automated: T3, T7a, T7b, T8a, T8b | None |
| AC4 — Absent `distribution.fleet.stale_threshold` → default of 2 releases applied | ✅ | T6a passing (1 behind with default threshold → clean); T6b passing (2 behind with default threshold → stale) | Automated: T6a, T6b | None |

**ACs satisfied: 4/4**

---

## Scope Deviations

**Deviation 1 — No formal feature branch PR:** Work committed at `a3b2cd1` without a standalone draft PR.

---

## Test Plan Coverage

**Tests from plan implemented:** 27/27 assertions passing
**Assertions passing:** 27/27
**Tests passing in CI (npm test):** 27

| Test ID | Implemented | Passing | Notes |
|---------|-------------|---------|-------|
| T1 — update-fleet-registry.js exists | ✅ | ✅ | |
| T1c — addConsumerEntry exported | ✅ | ✅ | |
| T1d — computeSyncStatus exported | ✅ | ✅ | |
| T2a — addConsumerEntry returns entry | ✅ | ✅ | |
| T2 — entry has "consumerSlug" | ✅ | ✅ | heymishy/sample-repo |
| T2 — entry has "lockfileVersion" | ✅ | ✅ | 3.9.0 |
| T2 — entry has "upstreamSource" | ✅ | ✅ | https://upstream.example.com/skills.git |
| T2 — entry has "lastSyncDate" | ✅ | ✅ | ISO 8601 |
| T2 — entry has "syncStatus" | ✅ | ✅ | clean |
| T4a — syncStatus "stale" when 2 behind (threshold 2) | ✅ | ✅ | |
| T4b — versionsBehind is 2 | ✅ | ✅ | |
| T5a — syncStatus "clean" when 0 behind | ✅ | ✅ | |
| T5b — clean omits versionsBehind | ✅ | ✅ | got: undefined |
| T3 — validation names missing "upstreamSource" | ✅ | ✅ | |
| T7a — invalid syncStatus "outdated" triggers error | ✅ | ✅ | |
| T7b — error names syncStatus / invalid value | ✅ | ✅ | |
| T8a — non-ISO lastSyncDate triggers error | ✅ | ✅ | |
| T8b — error mentions date format | ✅ | ✅ | |
| T6a — 1 behind with default threshold → clean | ✅ | ✅ | |
| T6b — 2 behind with default threshold → stale | ✅ | ✅ | |
| T-NFR1 — no PII field "name" | ✅ | ✅ | |
| T-NFR1 — no PII field "email" | ✅ | ✅ | |
| T-NFR1 — no PII field "userId" | ✅ | ✅ | |
| T-NFR1 — no PII field "teamName" | ✅ | ✅ | |
| T-NFR1 — no PII field "author" | ✅ | ✅ | |
| T-NFR1 — no PII field "owner" | ✅ | ✅ | |
| T-NFR2 — no nested loop over entries array | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| MC-SEC-02 — No PII fields in registry entries | ✅ | T-NFR1 passing across all 6 PII field variants (name, email, userId, teamName, author, owner) |
| Performance — no O(n²) nested loop over entries | ✅ | T-NFR2 passing; no nested loop over entries array found in registry script |
| Governance enforcement — schema validated in npm test | ✅ | T3, T7a/T7b, T8a/T8b passing; invalid entries fail validation with named field-level errors |
| Default threshold applied when config absent | ✅ | T6a/T6b passing; default of 2 releases used when `distribution.fleet.stale_threshold` absent from context.yml |
