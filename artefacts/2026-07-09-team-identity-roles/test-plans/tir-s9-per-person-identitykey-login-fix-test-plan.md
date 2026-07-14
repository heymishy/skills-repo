## Test Plan: The identityKey passed to login-time role resolution must be each person's own identity, not the shared tenantId

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s9.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Person Y logs in via the real GitHub callback in a shared tenant, resolves own role (engineer), not X's | — | 1 test | — | — | — | 🟢 |
| AC2 | Person X logs in via the real GitHub callback in the same shared tenant, resolves own role (admin) | — | 1 test | — | — | — | 🟢 |
| AC3 | Solo GitHub tenant and email/password login are unaffected (regression) | — | 2 tests | — | — | — | 🟢 |
| AC4 | Google callback passes `sub` explicitly; `req.session.role` is unchanged vs. pre-story behaviour | — | 1 test | — | — | — | 🟢 |
| AC5 (D37) | `server.js` wiring passes `identityKey` through; two identities sharing one `tenantId` resolve to two different, individually-correct roles | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mocked (extends tir-s7's `fake-test-db.js`-style pool mocking; extends `_oauthAdapter`/`_userRoles` monkeypatching already established in `tests/check-lab-s1.3-provider-registry.js`-style `auth.js` tests)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1/AC2 | Two `team_memberships` rows in shared tenant `acme-org` keyed by distinct `person_id`s, resolvable via each person's own GitHub login as `identityKey` (mirrors tir-s7's fixture shape, but exercised through `handleAuthCallback`, not `resolveRoleForPerson` directly) | Synthetic | None | |
| AC3 | One `team_memberships` row for a solo GitHub tenant; one for an email/password tenant | Synthetic | None | |
| AC4 | One `team_memberships` row keyed by a Google `sub` value | Synthetic | None | |
| AC5 | Mocked `_userRolesPool`-equivalent fake pool with two identities sharing one `tenantId`, called through the real wiring closure extracted from `server.js`'s call site | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `getRoleForTenant` accepts and forwards an optional `identityKey` second argument

- **Verifies:** AC5 (D37 mandatory wiring, adapter-level half)
- **Precondition:** `user-roles.js` loaded fresh (`freshRequire`, per repo convention).
- **Action:** Wire a spy via `setGetRoleForTenant`, then call `getRoleForTenant(tenantId, identityKey)`.
- **Expected result:** The spy receives both arguments, in that order; calling `getRoleForTenant(tenantId)` with no second argument still works (backward compatible — `auth-email.js` is unaffected).
- **Edge case:** No.

---

## Integration Tests

### AC1 — Person Y resolves their own role through the real GitHub OAuth callback in a shared tenant

- **Verifies:** AC1
- **Components involved:** `handleAuthCallback` (`routes/auth.js`), `_oauthAdapter` (monkeypatched `providerGetUserIdentity` to return Y's identity), `_userRoles.getRoleForTenant` (monkeypatched to a real `resolveRoleForPerson` bound to a fake pool, exactly as `server.js` wires it), `TENANT_ORG_ALLOWLIST` env var set so `resolveTenant()` returns the shared org `acme-org` for both X and Y.
- **Precondition:** Fake pool has two `team_memberships` rows in tenant `acme-org` (personX -> admin, personY -> engineer), each resolvable via `person_identities` keyed by their own GitHub login.
- **Action:** Drive `handleAuthCallback` end-to-end as person Y (mocked GitHub identity `login: 'person-y'`), with the allowlist matching `acme-org`.
- **Expected result:** `req.session.tenantId === 'acme-org'` (shared, unchanged) AND `req.session.role === 'engineer'` (Y's own role) — proving the `identityKey` passed into role resolution was Y's own login, not the shared tenant string.

### AC2 — Person X resolves their own role through the same real callback

- **Verifies:** AC2
- **Components involved:** Same as above, driven as person X (`login: 'person-x'`).
- **Precondition:** Same fixture.
- **Action:** Drive `handleAuthCallback` as person X.
- **Expected result:** `req.session.tenantId === 'acme-org'` AND `req.session.role === 'admin'` — both people resolve independently through the real production path, not only when the underlying query function is called directly with hand-picked arguments.

### AC3a — Solo GitHub tenant login is unaffected

- **Verifies:** AC3 (GitHub half)
- **Components involved:** `handleAuthCallback`, no `TENANT_ORG_ALLOWLIST` configured.
- **Precondition:** One `team_memberships` row for a solo tenant (`tenant_id` = the person's own login).
- **Action:** Drive `handleAuthCallback` for that person with no allowlist set.
- **Expected result:** `req.session.tenantId` = the person's own login (unchanged), `req.session.role` = their existing role (unchanged) — identical outcome to pre-story behaviour.

### AC3b — Email/password login is unaffected

- **Verifies:** AC3 (email half)
- **Components involved:** `handleEmailLogin` (`routes/auth-email.js`) — NOT modified by this story.
- **Precondition:** One `team_memberships` row keyed by an email-as-tenant_id.
- **Action:** Drive `handleEmailLogin` for that email/password user.
- **Expected result:** `req.session.role` resolves exactly as before — confirms `auth-email.js`'s unmodified single-argument `getRoleForTenant(email)` call sites still work against the extended (but backward-compatible) adapter signature.

### AC4 — Google callback passes `sub` explicitly; role resolution is unchanged

- **Verifies:** AC4
- **Components involved:** `handleAuthGoogleCallback`, `_oauthAdapter.fetchGoogleUserInfo` (monkeypatched).
- **Precondition:** One `team_memberships` row keyed by a Google `sub` value, resolvable via that `sub` as both `identityKey` and `tenantId`.
- **Action:** Drive `handleAuthGoogleCallback` for that person, both before-story (single-arg call, via a saved reference) and after-story (two-arg call) — or equivalently, assert the resolved role and tenantId are identical to what a single-argument call would have produced, since `identityKey === tenantId` for Google in both cases.
- **Expected result:** `req.session.role` and `req.session.tenantId` are unchanged from pre-story behaviour — proves AC4's "no bug, no behaviour change" finding, not just asserts a passing test.

### AC5 — Two identities sharing one tenantId resolve to two different, individually-correct roles through the wired function

- **Verifies:** AC5 (D37, behavioural half — not just "a function reference was assigned")
- **Components involved:** The exact closure `server.js` wires into `setGetRoleForTenant`, extracted and exercised directly against a fake pool (same technique as the unit test above, but asserting real differentiated output, per CLAUDE.md's wiring-test correctness rule).
- **Precondition:** Fake pool has two people in tenant `acme-org`, resolvable via two distinct identity strings.
- **Action:** Call the wired function once with `(tenantId='acme-org', identityKey='person-x')` and once with `(tenantId='acme-org', identityKey='person-y')`.
- **Expected result:** The two calls return two different, individually-correct role values (`admin` and `engineer` respectively) — not merely that both calls returned without throwing, and not merely that the wiring call site references the right function name.

---

## NFR Tests

### Security — no cross-person role resolution on a shared tenant, exercised end-to-end

- **NFR addressed:** Security
- **Measurement method:** AC1/AC2 directly cover this, driven through the real OAuth callback (not the already-corrected query function in isolation) — this is the meaningful strengthening over tir-s7's own test coverage.
- **Pass threshold:** 100% — zero cases where a person's login resolves another person's role.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-tir-s9-per-person-identitykey-login-fix.js`.

### Performance

- **NFR addressed:** Performance — no new query added; only the value of an existing argument changes. No specific threshold identified, per story NFRs.

---

## Regression proof requirement (non-standard test-plan item, added per operator instruction)

Before the fix is applied, AC1 and AC5's tests MUST be run against the pre-fix code and confirmed to FAIL (not error out for unrelated reasons) — proving the new tests actually exercise the bug described in the story, not just a shape that happens to already pass. This is recorded as evidence in the story's verification, not left as an unstated assumption.

---

## Out of Scope for This Test Plan

- Testing `resolveRoleForPerson`, `resolvePersonForIdentity`, or `team_memberships` query logic themselves — tir-s7 already tests that logic; this plan only tests that production callers now pass the correct `identityKey` into it.
- The Google-user-added-to-a-GitHub-org-tenant gap described in the story's Out of Scope section — a distinct bug shape, not fixed or tested here.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | This story's surface area is small (3 call sites + 1 wiring closure) and fully coverable by driving the real callback handlers against a fake pool, matching this repo's existing `auth.js`/`auth-email.js` test conventions | — |
