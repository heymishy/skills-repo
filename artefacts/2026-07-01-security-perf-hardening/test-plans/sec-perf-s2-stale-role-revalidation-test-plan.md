# Test Plan — Re-validate admin role on every gated request

**Feature slug:** 2026-07-01-security-perf-hardening
**Story:** sec-perf-s2 — artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s2.md
**Author:** Claude Sonnet 5 — 2026-07-14
**Short-track:** test-plan → DoR → implementation

---

## Scope

`req.session.role` is set once at login and never re-checked. `addOrUpdateTeammate` (tir-s3) can change a person's role in `team_memberships` without touching their live session, so a demoted admin keeps stale admin access for the life of their session cookie. This story adds a live, per-request role re-check to `requireAdmin` (`src/web-ui/middleware/require-admin.js`), wired in `server.js` to the same `getRoleForTenant` adapter already used at login.

---

## Test strategy

Node.js unit/integration tests only — no browser, no live Redis or Postgres dependency. The DB pool is stubbed via the existing `resolveRoleForPerson`/`getRoleForTenant` adapter seam (D37). One new test file: `tests/check-sec-perf-s2-stale-role-revalidation.js`.

---

## Test data

- Two synthetic sessions: `{ userId: 'person-A', tenantId: 'acme', role: 'admin' }` (stale-admin fixture) and `{ userId: 'person-B', tenantId: 'acme', role: 'user' }` (stale-user/promotion fixture).
- A stub role-lookup function standing in for the wired `getRoleForTenant`/`resolveRoleForPerson` chain, returning a controllable "live" role per call — lets tests simulate a role change happening *between* two `requireAdmin` invocations on the same session object, without a real Postgres instance.
- No reset needed between scenarios — each test constructs its own session/stub pair via `freshRequire`, matching the existing `arl-s2`/`tir-s4` test file convention in this repo.

---

## Test files and acceptance criteria

### `tests/check-sec-perf-s2-stale-role-revalidation.js`

| Test | AC | Description | Assertion |
|------|----|-------------|-----------|
| T1 | AC1 | Demoted admin's next request is denied | Session cached `role: 'admin'`; stub live-lookup returns `'engineer'`; `requireAdmin` called (awaited) → `next()` NOT called, `res._status === 403`, body `{"error":"Forbidden"}` |
| T2 | AC2 | Session role self-heals after denial | Same setup as T1; after the call, `req.session.role === 'engineer'` (not left at the stale `'admin'`) |
| T3 | AC3 | Promoted user's next request is granted | Session cached `role: 'user'`; stub live-lookup returns `'admin'`; `requireAdmin` called (awaited) → `next()` IS called, `res._status === null` |
| T4 | AC3 | Live check works both directions in sequence | Same session object: call 1 with stub returning `'admin'` → granted; mutate stub to return `'engineer'`; call 2 on the SAME session object → denied. Proves per-request re-evaluation, not a cached decision |
| T5 | AC4 | Unwired adapter preserves pre-story behaviour (admin) | Fresh module, `setGetCurrentRole` never called; session `{ userId: 1, role: 'admin' }` → `next()` called synchronously, no DB stub invoked |
| T6 | AC4 | Unwired adapter preserves pre-story behaviour (non-admin) | Fresh module, unwired; session `{ userId: 1, role: 'user' }` → 403, matches pre-story `arl-s2` T5 exactly |
| T7 | AC4 | Unwired adapter preserves pre-story behaviour (no session) | Fresh module, unwired; `session: null` → 403, matches pre-story `arl-s2` T4 exactly |
| T8 | AC5 | Wiring forwards to the same adapter used at login, not a new code path | Stub `getRoleForTenant`-shaped function wired via `setGetCurrentRole`; two DIFFERENT sessions sharing one tenantId but mapped by the stub to two DIFFERENT roles both resolve correctly through the wired closure — not merely "a function reference was assigned" (CLAUDE.md D37 wiring-test rule) |
| T9 | AC5 | `server.js` static wiring check | Read `src/web-ui/server.js` source; assert it references `setGetCurrentRole` and passes `getRoleForTenant` (or an equivalent closure calling it) — confirms the two adapters share one resolution path, not two |
| T10 | AC6 | Adapter rejection fails closed | Stub `_getCurrentRole` rejects with an `Error`; session cached `role: 'admin'`; `requireAdmin` called (awaited) → `next()` NOT called, `res._status === 403` (not a 500, not fallback-to-cached-admin) |
| T11 | — (regression) | `server.js` awaits every `requireAdmin` call site | Read `src/web-ui/server.js` source; assert every one of the 5 existing `requireAdmin(req, res, ...)` call sites is preceded by `await` — guards against the classic "fire-and-forget async middleware" bug where `_raOk` would be read before the live DB lookup resolves |
| T12 | — (audit, NFR) | Denial audit log still fires on live-demotion denial | Wire a spy logger via `setLogger`; trigger the AC1 scenario; assert `admin_access_denied` was logged with `personId`/`tenantId`/`timestamp` |

---

## AC coverage table

| AC | Covered by |
|----|-----------|
| AC1 | T1 |
| AC2 | T2 |
| AC3 | T3, T4 |
| AC4 | T5, T6, T7 |
| AC5 | T8, T9 |
| AC6 | T10 |

**Gaps:** None.

---

## NFRs

- Every `requireAdmin`-gated request performs at most one live-role lookup; no retries, no caching (Out of Scope per story).
- Fail-closed on adapter error (T10) — never falls back to a stale cached role on a DB failure.
- Unwired-adapter fallback (T5–T7) is exercised explicitly to prove zero regression for `arl-s2`/`tir-s4`/`tir-s5`, none of which are modified by this story.

---

## Files touched

| File | Change |
|------|--------|
| `src/web-ui/middleware/require-admin.js` | AC1–AC4, AC6: add `setGetCurrentRole`/`_getCurrentRole` adapter; make `requireAdmin` re-check role live when wired, self-heal `req.session.role`, fail closed on error; fall back to cached-role behaviour when unwired |
| `src/web-ui/server.js` | AC5: wire `setGetCurrentRole` to `getRoleForTenant`; add `await` to all 5 existing `requireAdmin(...)` call sites |
| `tests/check-sec-perf-s2-stale-role-revalidation.js` | New test file (T1–T12) |
