# Definition of Done: wsm.1 — Session persistence

**PR:** https://github.com/heymishy/skills-repo/pull/336 | **Merged:** 2026-05-08
**Story:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.1-session-persistence.md
**Test plan:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.1-test-plan.md
**DoR artefact:** artefacts/2026-05-07-web-ui-session-management/dor/wsm.1-dor.md
**Assessed by:** Copilot
**Date:** 2026-05-08

---

## Outcome: COMPLETE ✅

All 7 ACs satisfied. 23/23 tests passing on master (post-fix commit `5019679`).

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: Journey and session turns persisted across server restart | ✅ | T3 — loadSessions restores sessions to in-memory store (PASS) | Automated test | None |
| AC2: `accessToken` never written to disk | ✅ | T2 — accessToken excluded from disk write (PASS); file content asserted to have no `accessToken` key | Automated test (security) | None |
| AC3: Existing session files loaded on startup | ✅ | T3a/T3b — both pre-written sessions loaded, IDs and turn histories match | Automated test | None |
| AC4: Invalid JSON session file skipped on startup, WARN logged | ✅ | T4a/T4b/T4c — no exception, valid session loaded, WARN logged | Automated test | None |
| AC5: Stale sessions deleted on startup per SESSION_MAX_AGE_DAYS | ✅ | T5a/T5b/T5c — stale file deleted, deletion logged, fresh session retained | Automated test | None |
| AC6: Session file updated synchronously in same request cycle | ✅ | T1 — mutation hook writes session to disk after turn; file contains all turns immediately after POST returns | Automated test | None |
| AC7: Non-existent SESSION_STORE_PATH created automatically | ✅ | T6a/T6b — no exception, directory created | Automated test | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8/8
**Tests passing in CI:** 23/23 assertions (all 8 test groups pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — Write-on-mutation | ✅ | ✅ | |
| T2 — accessToken excluded from disk write | ✅ | ✅ | |
| T3 — Server restart restores sessions | ✅ | ✅ | |
| T4 — Invalid JSON skipped, WARN logged | ✅ | ✅ | |
| T5 — Stale sessions deleted | ✅ | ✅ | |
| T6 — Non-existent path created | ✅ | ✅ | |
| T7 — Write failure non-fatal, ERROR logged | ✅ | ✅ | |
| T8 — Restored session (no accessToken) → auth redirect | ✅ | ✅ | |

**Gaps:** None.

**Note:** A conflict marker residue (`=======\n>>>>>>>`) was found in `src/web-ui/routes/journey.js` on master after wsm.3 PR merged — root cause: orphaned marker from cherry-pick resolution during stacked PR rebase. Fixed by commit `5019679` before running test verification. All wsm.1 tests passed clean after fix.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| NFR-sec-no-accesstoken-disk: accessToken MUST NOT be written to disk | ✅ | T2 — file content asserted; key absent confirmed |
| NFR-rel-session-write-failure: write failure must not crash server | ✅ | T7 — write failure injected; server continues, ERROR logged |
| NFR-rel-invalid-json-startup: corrupt file must not prevent startup | ✅ | T4 — WARN logged, startup completes |
| NFR-nodeps-wsm: zero new npm dependencies | ✅ | `src/web-ui/adapters/session-store.js` uses `fs`, `path`, `os` only |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Session continuation rate (journeys spanning >1 server process lifetime) | ❌ No baseline — feature not previously possible | After first real multi-session delivery run | Infrastructure now in place; measurement requires a real operator session that spans a server restart |
