## Test Plan: Expose the real team roster as a read API

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s1.md
**Epic reference:** artefacts/2026-09-23-team-roster-integration/epics/real-team-roster.md
**Test plan author:** Copilot
**Date:** 2026-09-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Read function returns real entries (identity_key + role) for a tenant with 2 resolvable members | 1 test | — | — | — | — | 🟢 |
| AC2 | A `team_memberships` row with no matching `person_identities` row is silently omitted | 1 test | — | — | — | — | 🟢 |
| AC3 | Tenant isolation — only the requested tenant's members are returned | 1 test | — | — | — | — | 🟢 |
| AC4 | `GET /api/team/members` returns a JSON body matching the read function's output | — | 1 test | — | — | — | 🟢 |
| AC5 | Unauthenticated request rejected the same way every other `authGuard`-protected route already is (302 redirect to `/`) | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs are covered by unit or integration tests against real code paths — no CSS-layout-dependent, external-dependency, or untestable-by-nature behaviour in this story (pure read/JSON, no rendered UI).

---

## Test Data Strategy

**Source:** Mocked — a narrow, self-contained in-memory fake `pool` object, following the exact established convention from `tests/check-tir-s3-admin-adds-teammate.js`'s own `makeFakePool()` (normalized-SQL string matching against `people`/`team_memberships`/`person_identities` in-memory arrays), NOT an extension of `src/web-ui/adapters/fake-test-db.js`.
**PCI/sensitivity in scope:** No — identity strings used in tests are synthetic (`alice@example.com`, `<script>alert(1)</script>`, etc.), never real user data.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | 2 synthetic `team_memberships` rows for tenant `tenant-a`, each with a matching `person_identities` row | Synthetic | None | Asserts the returned array has exactly 2 entries with the real `identity_key`/`role` values |
| AC2 | 1 `team_memberships` row for `tenant-a` with NO matching `person_identities` row (person exists in `people`, but `person_identities` has zero rows for that `person_id`) | Synthetic | None | Asserts the row is silently omitted — result length excludes it, no error thrown |
| AC3 | `team_memberships` rows split across `tenant-a` and `tenant-b`, both fully resolvable | Synthetic | None | Asserts calling for `tenant-a` never returns any `tenant-b` entry |
| AC4 | Fake pool wired with AC1's fixture; mocked `req`/`res` (matches `mockReq`/`mockRes` convention in `check-tir-s3-admin-adds-teammate.js`) | Synthetic | None | Asserts response body JSON deep-equals the read function's own direct-call output |
| AC5 | Mocked `req` with `session: {}` (no `accessToken`) | Synthetic | None | Asserts `authGuard` intercepts before the handler runs — 302, `Location: /`, handler body never executes |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `listTeamMembers` returns real identity + role for every resolvable member

- **Verifies:** AC1
- **Precondition:** Fake pool has 2 `team_memberships` rows for `tenant-a` (person_id 1, role `engineer`; person_id 2, role `admin`), each with a matching `person_identities` row (`alice@example.com` → 1, `bob-gh-login` → 2)
- **Action:** Call `listTeamMembers(pool, 'tenant-a')`
- **Expected result:** Resolves to an array of exactly 2 objects, each `{ identity: <identity_key>, role: <role> }`, matching the fixture exactly (order not asserted — content via `assert.deepStrictEqual` on a sorted-by-identity copy)
- **Edge case:** No

### `listTeamMembers` silently omits a `team_memberships` row with no matching `person_identities` row

- **Verifies:** AC2
- **Precondition:** Fake pool has 1 `team_memberships` row for `tenant-a` (person_id 3, role `viewer`) and zero `person_identities` rows for person_id 3
- **Action:** Call `listTeamMembers(pool, 'tenant-a')`
- **Expected result:** Resolves to an empty array (`[]`) — no error thrown, no placeholder entry, no `undefined`/`null` identity value anywhere in the result
- **Edge case:** Yes — the unresolvable-identity case is the story's own named edge case (Architecture Constraints)

### `listTeamMembers` never returns another tenant's members

- **Verifies:** AC3
- **Precondition:** Fake pool has 1 fully-resolvable `team_memberships`/`person_identities` pair for `tenant-a` and a separate one for `tenant-b`
- **Action:** Call `listTeamMembers(pool, 'tenant-a')`
- **Expected result:** Resolves to an array containing only `tenant-a`'s entry — the `tenant-b` identity string never appears anywhere in the result
- **Edge case:** Yes — cross-tenant leakage is the story's own named security-critical edge case

---

## Integration Tests

### `GET /api/team/members` returns the real roster as JSON for an authenticated request

- **Verifies:** AC4
- **Components involved:** `routes/team-management.js` (new handler, working name `handleGetTeamMembersApi`), `modules/user-roles.js` or a new co-located module exporting `listTeamMembers`, the fake pool
- **Precondition:** Fake pool wired with AC1's 2-member fixture; `mockReq({ session: { accessToken: 'tok', tenantId: 'tenant-a' } })`
- **Action:** Call the new handler directly (matches this repo's own established direct-handler-dispatch integration test convention, e.g. `tests/check-ep2-s4-integration.js`) with the mocked req/res and the fake pool
- **Expected result:** `res.statusCode === 200`; `JSON.parse(res.body)` deep-equals `{ members: [...] }` where `members` is exactly `listTeamMembers(pool, 'tenant-a')`'s own direct-call output — proving the endpoint is a thin wrapper, not a separate/divergent implementation. (Technical-plan decision: the response wraps the array in a named `members` key, matching this repo's own established `{ pods }`/`{ pod_id }`-style JSON envelope convention seen in `routes/pods.js`'s `handleGetPods` — AC4's text "a JSON array matching the read function's own output" is satisfied by the *function's own output* being the bare array; the endpoint's envelope key is an implementation-shape decision made here, not a deviation from the AC.)

### `GET /api/team/members` rejects an unauthenticated request exactly like every other `authGuard`-protected route

- **Verifies:** AC5
- **Components involved:** `authGuard` (`routes/auth.js`), the new route registration in `server.js`
- **Precondition:** `mockReq({ session: {} })` — no `accessToken` (confirmed real `authGuard` behaviour: `if (!hasToken) { res.writeHead(302, { Location: '/' }); res.end(); return; }`, verified by reading `routes/auth.js` lines 534-540 directly — matches `GET /api/pods`'s own identical `authGuard(req, res, ...)` wrapping, confirmed by reading `server.js` line 4279)
- **Action:** Dispatch the request through the real router registration (not just the bare handler) so `authGuard` is actually in the call path
- **Expected result:** `res.statusCode === 302`; `res.headers.Location === '/'`; the handler body (and `listTeamMembers`) is never invoked — assert via a spy/counter that the underlying query function was never called
- **Note:** This closes Run 1's LOW finding `[1-L1]` — the literal expected behaviour (302 redirect to `/`, not a 401 JSON body) is now stated explicitly, sourced from `authGuard`'s real implementation rather than left as "matches every other route."

---

## NFR Tests

### Real-roster read completes well under 1 second

- **NFR addressed:** Performance
- **Measurement method:** Manual timing during live validation (matches this app's own established RISK-ACCEPT pattern for comparably-shaped synchronous NFRs, per `nfr-profile.md`) — no dedicated automated timing assertion, since the query is a single indexed JOIN over two small tables with no realistic tenant size where this would be a bottleneck
- **Pass threshold:** N/A — not automated; live-validated at DoD
- **Tool:** Manual (live Chrome / curl timing at DoD)

### No new auth mechanism introduced

- **NFR addressed:** Security
- **Measurement method:** Covered directly by the AC5 integration test above — the new endpoint reuses `authGuard` unmodified, asserted by dispatching through the real route registration rather than calling the handler in isolation
- **Pass threshold:** `authGuard` intercepts an unauthenticated request exactly as it does for every other route (302/Location:/`)
- **Tool:** `node scripts/run-all-tests.js` (this repo's configured `npm test` runner)

---

## Out of Scope for This Test Plan

- Wiring any picker/page to consume this endpoint — covered by `rtri-s2`'s and `rtri-s3`'s own test plans.
- Any test of `team_memberships`/`person_identities` row creation (invite/add-teammate flow) — this story reads those tables read-only; their write-path tests already exist (`tir-s1`, `tir-s2`, `tir-s3`'s own test suites).
- Pagination/filtering behaviour — explicitly Out of Scope in the story itself.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
