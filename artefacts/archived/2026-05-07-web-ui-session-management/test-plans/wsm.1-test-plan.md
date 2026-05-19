# Test Plan: wsm.1 — Session persistence

**Story:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.1-session-persistence.md
**Test file:** tests/check-wsm1-session-persistence.js

---

## Technical Test Plan

### T1 — Session write-on-mutation: turn appended to disk immediately

**Type:** Unit (with fs spy)
**Setup:** Journey session in memory with two existing turns. `_sessionStore` adapter wired to a temp directory.
**Action:** POST a new turn to the journey.
**Assert:** After the POST returns, the session file in the temp directory contains all three turns (two prior + new). The write happened synchronously within the request cycle, not deferred.

---

### T2 — accessToken is NOT written to disk

**Type:** Security / unit
**Setup:** Session in memory with `accessToken: "ghs_secret_token"` and `featureSlug: "test"`.
**Action:** Trigger a write (new turn appended).
**Assert:** (a) The session file on disk exists. (b) The file content does NOT contain the string `ghs_secret_token` or the key `accessToken`. (c) Parsing the JSON does not reveal an `accessToken` field.

---

### T3 — Server restart restores all sessions from disk

**Type:** Integration
**Setup:** Temp `SESSION_STORE_PATH` with two pre-written valid session JSON files (no `accessToken` field). Simulate server startup (call the load-sessions-from-disk function).
**Assert:** Both sessions are present in the in-memory store after load. Session IDs and turn histories match the disk files.

---

### T4 — Invalid JSON session file is skipped on startup (no crash)

**Type:** Unit
**Setup:** `SESSION_STORE_PATH` contains one valid session file and one file containing `{invalid json`.
**Action:** Call startup session loader.
**Assert:** (a) No exception thrown. (b) One valid session loaded into memory. (c) A WARN log entry references the invalid file path.

---

### T5 — Stale sessions deleted on startup

**Type:** Unit
**Setup:** `SESSION_MAX_AGE_DAYS=1`. Session file with `lastUpdated` 8 days ago. Session file with `lastUpdated` today.
**Action:** Run startup session loader.
**Assert:** (a) Stale file is deleted from disk. (b) A log entry records the deletion. (c) Fresh session is still present.

---

### T6 — Non-existent SESSION_STORE_PATH is created on startup

**Type:** Unit
**Setup:** `SESSION_STORE_PATH` set to a path that does not exist.
**Action:** Run startup session loader.
**Assert:** Directory is created; no exception thrown; server continues.

---

### T7 — Write failure does not crash server; mutation completes in memory

**Type:** Unit (error injection)
**Setup:** Stub `fs.writeFile` to throw a permissions error.
**Action:** POST a new turn.
**Assert:** (a) Turn is present in the in-memory session. (b) HTTP response to the caller is the normal turn response. (c) An ERROR log entry records the file write failure.

---

### T8 — Session restored after restart lacks accessToken; re-auth required

**Type:** Integration
**Setup:** Session restored from disk (no accessToken in file). Route that requires `req.session.accessToken` to be set.
**Action:** Call an authenticated route with the restored session.
**Assert:** Route returns a 401 or redirect to login — not a 500 or silent failure.

---

## Plain-language AC Verification Script

**Before coding agent runs:** T1–T8 must all fail.

**After implementation — human smoke test steps:**

1. Start the server. Open a journey and complete 3 turns. Stop the server.
2. Open `./sessions-store/` and confirm a JSON file exists for the journey ID.
3. Open the file in an editor. Confirm no `accessToken` field.
4. Restart the server. Open the journey URL. Confirm all 3 prior turns are visible.
5. Set `SESSION_MAX_AGE_DAYS=0` and restart. Confirm the session file is deleted (stale cleanup).
6. Delete the sessions store directory. Restart. Confirm the directory is recreated (no error).
