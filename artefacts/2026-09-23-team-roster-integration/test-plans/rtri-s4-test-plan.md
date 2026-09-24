## Test Plan: Backfill person_identities on login so existing real memberships become resolvable

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s4.md
**Epic reference:** artefacts/2026-09-23-team-roster-integration/epics/real-team-roster.md
**Test plan author:** Copilot
**Date:** 2026-09-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Backfill fires on all 4 real login call sites (GitHub, Google, email sign-in, email sign-up) | 2 tests | 4 tests | — | — | — | 🟢 |
| AC2 | Backfilled identity becomes visible in `listTeamMembers` (rtri-s1) | 1 test | — | — | — | — | 🟢 |
| AC3 | Idempotent — no duplicate row, no error on repeat login | 1 test | — | — | — | — | 🟢 |
| AC4 | Unknown identity never backfilled | 1 test | — | — | — | — | 🟢 |
| AC5 | Existing 3 write sites (linkIdentity, team-invitations, client-invitations) unaffected | — | 3 tests (regression, existing suites) | — | — | — | 🟢 |

---

## Coverage gaps

None. AC5's coverage is the 3 already-existing, already-passing test suites for those write sites (`tests/check-tir-s2-cross-provider-linking.js` and equivalents for the 2 invitation modules) — this test plan does not duplicate them, only confirms via `/verify-completion`'s full-suite run that they still pass unmodified.

---

## Test Data Strategy

**Source:** Mocked — the same narrow in-memory fake `pool` convention as `rtri-s1`'s test plan (`people`/`team_memberships`/`person_identities` fixtures), extended with a `_seedResolvableFallback(tenantId, personId)` helper (a person resolvable only via the `team_memberships.tenant_id` fallback — no explicit `person_identities` row — exactly reproducing the live-verified gap).
**PCI/sensitivity in scope:** No — synthetic identities only.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fake pool with a fallback-resolvable person (no explicit `person_identities` row); mocked `req`/`res` for each of the 4 real call sites | Synthetic | None | 4 separate test cases, one per real call site, each asserting the correct `provider` value lands in the new row |
| AC2 | Fake pool as above, after backfill runs; `listTeamMembers` (rtri-s1, already merged) called on the same pool/tenant | Synthetic | None | Proves the fix actually closes the live-verified gap, not just that a row gets written |
| AC3 | Fake pool with an identity that ALREADY has an explicit `person_identities` row | Synthetic | None | Asserts zero new rows, no thrown error, on a second login |
| AC4 | Fake pool with no `people`/`team_memberships`/`person_identities` row for a given identity at all | Synthetic | None | Asserts `resolvePersonForIdentity` still returns null and no backfill is attempted |
| AC5 | Existing suites, run as-is | N/A | None | Regression only, via `/verify-completion`'s full-suite run |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `backfillIdentityIfNeeded` writes a real person_identities row when none exists

- **Verifies:** AC1 (core logic, provider-agnostic)
- **Precondition:** Fake pool has a `people` row (id 1) and a `team_memberships` row (tenant `acme`, person_id 1) — no `person_identities` row for any identity resolving to person 1
- **Action:** Call `identityLinks.backfillIdentityIfNeeded(pool, 'acme', 1, 'github')`
- **Expected result:** Resolves `{ backfilled: true }`; fake pool's `person_identities` now contains `{ identity_key: 'acme', person_id: 1, provider: 'github' }`
- **Edge case:** No

### `backfillIdentityIfNeeded` is idempotent — no duplicate row on repeat call

- **Verifies:** AC3
- **Precondition:** Fake pool already has a `person_identities` row for `identity_key: 'acme'`
- **Action:** Call `identityLinks.backfillIdentityIfNeeded(pool, 'acme', 1, 'github')` again
- **Expected result:** Resolves `{ backfilled: false }`; fake pool's `person_identities` still contains exactly 1 row for `identity_key: 'acme'` — no duplicate, no thrown error
- **Edge case:** Yes — the story's own named idempotency requirement (AC3)

---

## Integration Tests

### `resolveRoleForPerson` backfills on the fallback-resolution path, for each of the 4 real call shapes

- **Verifies:** AC1 (4 separate test cases, one per real login call site — per Run 1/2 review's own LOW finding [1-L1]/[2-L1], not one test standing in for all four)
- **Components involved:** `user-roles.js`'s `resolveRoleForPerson` (extended with the optional `provider` argument), `identity-links.js`'s `backfillIdentityIfNeeded`, the fake pool
- **Precondition:** Fake pool has a fallback-resolvable person (person_id 1, `team_memberships.tenant_id = 'acme'`, no explicit `person_identities` row)
- **Action (test case 1 — GitHub):** Call `resolveRoleForPerson(pool, 'acme', 'acme', 'github')` (mirrors `auth.js`'s real GitHub call shape: `identityKey` and `tenantId` both resolve to the same tenant string for a solo/personal tenant)
- **Action (test case 2 — Google):** Same shape, `provider: 'google'`
- **Action (test case 3 — email sign-in):** Same shape, `provider: 'email'` (mirrors `auth-email.js`'s sign-in call, where `identityKey` is omitted and falls back to `tenantId` — test this exact omitted-identityKey shape, not just a supplied one)
- **Action (test case 4 — email sign-up):** Fake pool has NO existing person for the identity at all (a true brand-new signup) — call with `provider: 'email'`
- **Expected result (cases 1-3):** `person_identities` gains exactly one new row with the correct `identity_key`/`provider` for that call shape
- **Expected result (case 4):** `person_identities` gains ZERO rows — `resolvePersonForIdentity` returns null for a genuinely unknown identity, so the backfill is never attempted, matching AC4 exactly (this test case doubles as AC4's own coverage, using the real call shape rather than a synthetic one)
- **Edge case:** Yes — case 4 is the story's own named negative-case requirement

### Backfilled identity becomes visible in `listTeamMembers`

- **Verifies:** AC2 — closes the exact live-verified gap
- **Components involved:** `identity-links.js`'s `backfillIdentityIfNeeded`, `user-roles.js`'s `resolveRoleForPerson`, `team-management.js`'s `listTeamMembers` (rtri-s1, already merged), the fake pool
- **Precondition:** Fake pool has a fallback-resolvable person (person_id 1, `team_memberships.tenant_id = 'acme'`, role `engineer`, no explicit `person_identities` row) — exactly reproducing the live-verified `wuce-staging.fly.dev` scenario
- **Action:** (1) Call `listTeamMembers(pool, 'acme')` — expect `[]` (the pre-fix state, matching what was live-observed). (2) Call `resolveRoleForPerson(pool, 'acme', 'acme', 'github')` (simulating the person's next login). (3) Call `listTeamMembers(pool, 'acme')` again on the SAME pool instance
- **Expected result:** Step 1 returns `[]`; step 3 returns `[{ identity: 'acme', role: 'engineer' }]` — the exact before/after this story exists to fix
- **Edge case:** No — this is the story's own primary, direct proof of benefit

### Existing `getRoleForTenant`/`resolveRoleForPerson` callers that omit the new `provider` argument are unaffected

- **Verifies:** Backward compatibility (Architecture Constraints — extending, not breaking, the existing D37 adapter signature)
- **Components involved:** `user-roles.js`'s `getRoleForTenant`/`resolveRoleForPerson`
- **Precondition:** Fake pool with a fallback-resolvable person, same as above
- **Action:** Call `resolveRoleForPerson(pool, 'acme', 'acme')` — 3 arguments only, `provider` omitted entirely (matching every pre-`rtri-s4` test and call site in the codebase)
- **Expected result:** Resolves the correct role exactly as before (no regression); `person_identities` gains ZERO new rows — omitting `provider` correctly skips the backfill rather than erroring or backfilling with a garbage provider value
- **Edge case:** Yes — proves the "optional, backward-compatible" claim in Architecture Constraints is actually true, not just asserted

---

## NFR Tests

### Backfill adds negligible login latency

- **NFR addressed:** Performance
- **Measurement method:** Manual observation during live validation (matches this app's own established RISK-ACCEPT pattern) — one extra `SELECT` + conditional `INSERT`, same shape as `resolveRoleForPerson`'s own existing queries.
- **Pass threshold:** N/A — not automated.
- **Tool:** Manual (live staging check at DoD, matching how this gap was originally found).

### No new identity source or trust boundary

- **NFR addressed:** Security
- **Measurement method:** Covered by the "existing callers unaffected" integration test above (no new input path) plus AC4's negative-case test (unknown identities never get a row).
- **Pass threshold:** Zero new rows for any identity that doesn't already resolve via the existing, already-trusted `team_memberships` fallback.
- **Tool:** `node scripts/run-all-tests.js`

### Audit logging (conditional — see decisions.md / DoR)

- **NFR addressed:** Audit
- **Measurement method:** If implemented, a test asserting `backfillIdentityIfNeeded` logs `identity_backfilled` with person id + SHA-256 identity hash + provider + timestamp, matching `linkIdentity`'s own established audit convention exactly (never the raw identity string).
- **Pass threshold:** To be confirmed at DoR — this NFR was left conditionally open in the story itself (Run 1 review LOW finding [1-L2]/[2-L2]).
- **Tool:** `node scripts/run-all-tests.js`

---

## Out of Scope for This Test Plan

- Any test of `linkIdentity`, `team-invitations.js`, or `client-invitations.js`'s own write paths — already covered by their own existing test suites (AC5 relies on those, not new tests here).
- Any test of `listTeamMembers`'s own AC1-AC3 correctness — already covered by `rtri-s1`'s own test plan; this plan's AC2 test reuses `listTeamMembers` as an oracle, not re-verifies its independent correctness.
- Retroactive batch-backfill for users who never log in again — explicitly Out of Scope in the story itself.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Audit NFR's exact scope is not yet finalized | Story's own Architecture Constraints leave it conditionally open pending DoR | Resolve at `/definition-of-ready`; if scoped down to "no audit," update this test plan's Audit NFR Test section accordingly before `/implementation-plan` |
