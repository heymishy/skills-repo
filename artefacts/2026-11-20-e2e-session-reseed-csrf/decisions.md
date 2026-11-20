# Decisions: E2E session re-seed and CSRF (tiso-s1)

## D1. A re-seed of the shared test session keeps its CSRF token, and nothing else (2026-11-20)

**Context:** all `withAuth` specs share one session id, and each spec's setup re-seeds it (`GET /test/session` -> `seedTestSession`, which replaces the whole stored session). The CSRF token lives in that session, so a spec that is part-way through a flow loses the token its page embedded whenever another spec starts on another worker, and its next POST is answered with a plain-text 403. Proved deterministically (302 before a re-seed, 403 `text/plain` after, same token) and seen in the parallel run as `POST /products/<id>/set-default-pod` -> 403 `Forbidden`.
**Decision:** `seedTestSession` carries the existing session's `csrfToken` into the replacement, and replaces every other field with the seed data.
**Rationale:** the re-seed exists to reset session state a spec may have mutated (a logout, a changed role); a CSRF token is not such state, it is generated once per session and reused by design (`generateCsrfToken`), so keeping it loses nothing and removes a cross-spec failure. It is the smallest change that fixes the measured cause, in one function, and the same code serves the staging bypass where the Scenario A and B specs share a session the same way.
**Alternatives rejected:** a separate session id and tenant per spec (the right long-term isolation, and `/test/session` already accepts `?sessionId=&tenantId=`, but it changes every spec's assumptions about the `e2e-tester` tenant and is decided afterwards, from what remains failing); `workers: 1` in CI (slower, and hides the defect); having `withAuth` re-seed only once per worker (specs that mutate session state, such as logout, would leak into the next one); regenerating the token on the client after a 403 (changes product code for a test-only defect).
**Operator go-ahead (2026-11-20, "1 then two"):** to short-track test isolation after the Tab-order story, starting from the `ep2` interference.
**Operator instruction (2026-11-20, "Do after isolation and then update all together"):** the capability-matrix lane changes (the five specs repaired in esh-s1, and `ctab-s1`) wait until after isolation and are made together.

## D2. Capability-matrix lane update after isolation (2026-11-21)

**Context:** the operator asked for the lane changes to wait until after tiso-s1 and then be made together (pull request #1171, merged 2026-11-21, `fa8710708`).
**Decision:** eight specs move from `quarantined` to `extended` (`ep1-s3`, `ep1-s4`, `fpux.1-visual-consistency-theme`, `frsr-s1`, `jcx-s6`, `pnfc-s1`, `kbsf-s1`, `bri-s3.6`); the reasons of `ctab-s1`, `tiso-s1` and `bmau-s1` are rewritten; five specs stay quarantined (`bmau-s1`, `dsa-s2`, `ep3-s1`, `fpd-s4`, `wuce18`). No spec moves to `core`.
**Rationale:** each move rests on the recorded CI E2E reports (master baseline run `44685372791` and the runs for #1168, #1169, #1170); `extended` is non-blocking, so nothing becomes a gate. Lanes do not change what CI runs (`scripts/list-core-specs.js` lists 39 specs before and after).
**Open for the operator:** whether any of the five esh-s1 specs, `ctab-s1` or `tiso-s1` move to `core` (blocking).
