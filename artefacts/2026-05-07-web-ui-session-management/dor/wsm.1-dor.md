# Definition of Ready: Session persistence (wsm.1)

**Story reference:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.1-session-persistence.md
**Test plan reference:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.1-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.1-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-session-management/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- Injectable adapter `_sessionStore` with throwing stub default: `throw new Error('Adapter not wired: sessionStore. Call setSessionStore() before use.')`.
- `setSessionStore(fn)` export.
- `_sessionStore.write(sessionId, data)` — writes session data as JSON to `<SESSION_STORE_PATH>/<sessionId>.json`, stripping `accessToken` from the serialised object before every write.
- `_sessionStore.read(sessionId)` — reads and parses the session file; returns null if file absent.
- `_sessionStore.list()` — lists all `.json` files in SESSION_STORE_PATH.
- Session store path: `process.env.SESSION_STORE_PATH || path.join(repoRoot, 'sessions-store')`. Auto-created on first write.
- Mutation hooks: after every route handler that mutates journey state or skill session state, call `_sessionStore.write(sessionId, sessionData)` (synchronous). Write failures are logged at ERROR level but do not crash the server.
- Server startup restore: read all valid `.json` files from SESSION_STORE_PATH; load into in-memory session store; skip files with invalid JSON (log WARN); delete session files where `lastUpdated < Date.now() - (SESSION_MAX_AGE_DAYS * 86400000)` (default 7 days).
- Real implementation wired in `server.js`: `setSessionStore(require('./adapters/session-store'))`.
- `NODE_ENV=test`: wiring uses a no-op or in-memory-only store.

**What will NOT be built:**
- Restoring `accessToken` on restore (re-auth required after restart — by design).
- Encrypting session data at rest (not in MVP scope).
- Cross-machine session sharing (local disk only).
- A session management UI.

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — persisted on mutation | T1: trigger mutation, assert session file written to SESSION_STORE_PATH | Integration |
| AC2 — accessToken excluded | T2: set accessToken on session, trigger mutation, read file, assert no accessToken key in JSON | Security |
| AC3 — restored on startup | T3: write session file, restart server (in-process re-init), assert session in memory | Integration |
| AC4 — invalid JSON skipped | T4: write corrupt file to store, restart, assert server starts + WARN logged + valid sessions loaded | Integration |
| AC5 — stale sessions deleted | T5: write session file with lastUpdated = 8 days ago, restart, assert file deleted | Integration |
| AC6 — stub default throws | T6: call _sessionStore without wiring, assert throws "not wired" | Unit |
| AC7 — write failure non-fatal | T7: make SESSION_STORE_PATH unwritable, trigger mutation, assert no crash + ERROR logged | Integration |
| AC8 — SESSION_STORE_PATH created | T8: start with non-existent SESSION_STORE_PATH, trigger mutation, assert directory created | Integration |

**Assumptions:**
- Session data is the full `sessionData` object passed to the adapter (all fields except `accessToken`).
- `sessionId` is already available in all route handlers (from the existing session middleware).
- `lastUpdated` is a field written by this adapter on every write (ISO 8601 timestamp).

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — add mutation hooks (write call after every state-mutating operation)
- `src/web-ui/routes/skills.js` — add mutation hooks (write call after every session mutation)
- `src/web-ui/adapters/session-store.js` — new file (real implementation)
- `src/web-ui/server.js` — wire adapter, startup restore, NODE_ENV test stub

---

## Contract Review

✅ **Contract review passed** — accessToken exclusion is in the serialiser, not route handlers (enforced at adapter boundary). Stub throws (D37). Write failure is non-fatal per design. Startup restore correctly handles missing/invalid files. Stale cleanup runs on startup.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator running a pipeline session**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 8 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1–T8 cover all 8 ACs |
| H4 | Out-of-scope populated | ✅ PASS | accessToken restore, encryption, cross-machine sharing, management UI excluded |
| H5 | Benefit linkage | ✅ PASS | "Session continuity and recovery rate" named |
| H6 | Complexity rated | ✅ PASS | Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 8 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1–7 code deps only. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | D37 adapter pattern, accessToken exclusion at serialiser, non-fatal write failure |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-sec-no-accesstoken-disk, NFR-rel-session-write-failure, NFR-rel-invalid-json-startup |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling; accessToken excluded; local disk only |
| H-NFR-profile | NFR profile presence | ✅ PASS | artefacts/2026-05-07-web-ui-session-management/nfr-profile.md exists |
| H-GOV | Approved By | ✅ PASS | Hamis — Platform operator / product owner — 2026-05-07 |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS | AC6 = stub throws. AC1+T1 = write called on mutation. server.js wiring is separate task. All three D37 conditions met. |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | NFR-sec-no-accesstoken-disk, NFR-rel-session-write-failure, NFR-rel-invalid-json-startup in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** High
**Rationale:** Introduces disk persistence of session state. The `accessToken` exclusion is a hard security requirement — a mistake here persists credentials to disk. Startup restore and stale cleanup run on every server restart. Correctness is critical.

🔴 **High oversight** — sign-off: Hamis (sole operator and product owner).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Session persistence — artefacts/2026-05-07-web-ui-session-management/stories/wsm.1-session-persistence.md
Test plan: artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.1-test-plan.md

Goal:
Make every test in tests/check-wsm1-session-persistence.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Create src/web-ui/adapters/session-store.js (new file — real implementation).
- Create/export setSessionStore(fn) and _sessionStore (default throws) in src/web-ui/routes/journey.js (and skills.js if needed).
- CRITICAL — stub must throw (D37): default _sessionStore throws with "Adapter not wired: sessionStore. Call setSessionStore() before use."
- CRITICAL — accessToken exclusion (AC2): The serialiser in session-store.js MUST strip accessToken from the data object before JSON.stringify. This must happen inside the adapter, not in the route handlers. Test T2 reads the disk file and asserts no accessToken key.
- SESSION_STORE_PATH: path.join(repoRoot, 'sessions-store') unless process.env.SESSION_STORE_PATH is set. Auto-create directory with fs.mkdirSync({recursive:true}) on first write.
- Write failure is non-fatal (AC7): catch errors from fs.writeFileSync, log at ERROR level, do NOT rethrow.
- Startup restore: call in server.js startup before listening. Read all .json files, load valid ones, skip + WARN invalid JSON, delete files where lastUpdated < Date.now() - SESSION_MAX_AGE_DAYS * 86400000.
- NODE_ENV=test: adapter is wired to an in-memory stub that does not write to disk.
- Add mutation hooks in journey.js route handlers (after state changes, call _sessionStore.write).
- Architecture: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — named approver
**Signed off by:** Hamis — Platform operator / product owner — 2026-05-08
