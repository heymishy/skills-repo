# Test Plan: Restore same-tenant journey access under POLICY.TENANT

**Story reference:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/stories/jatg-s1-restore-same-tenant-journey-access.md`
**Epic reference:** None — short-track bug fix, no parent epic.
**Test plan author:** Copilot
**Date:** 2026-08-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Same-tenant non-owner under `POLICY.TENANT` → access granted | 1 test | — | — | — | — | 🟢 |
| AC2 | Different-tenant non-owner under `POLICY.TENANT` → 404 | 1 test | — | — | — | — | 🟢 |
| AC3 | Same-tenant non-owner under `POLICY.OWNER` → still denied | 1 test | — | — | — | — | 🟢 |
| AC4 | All 11 existing `POLICY.TENANT` call sites regression-check | 5 tests (existing-behaviour guards) | 1 test | — | — | — | 🟢 |
| AC5 | `check-wsm2-collaborative-sessions.js` T2/T4 now pass | — | 1 test (existing file re-run) | — | — | — | 🟢 |

---

## Coverage gaps

None. Every AC has at least one automated test; AC4's full 11-call-site regression claim is additionally covered by a full-suite run (all 11 sites share the single `requireJourneyAccess()` function under test, so unit-level coverage of that function is structurally exhaustive for the logic itself — the integration/full-suite run confirms no caller-specific assumption breaks).

---

## Test Data Strategy

**Source:** Synthetic — plain in-memory JS objects (`journey`, `session`) constructed directly in each test, matching the pattern already used by `tests/check-wsm2-collaborative-sessions.js` and the story's own root-cause reproduction. No database, no fixtures, no mocking framework.
**PCI/sensitivity in scope:** No — `journey`/`session` test objects use placeholder identifiers (`user-A`, `acme`, etc.), no real user data.
**Availability:** Available now.
**Owner:** Self-contained — every test constructs and discards its own objects; no shared state between tests.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `journey` with `ownerId`/`tenantId` set; `session` with matching `tenantId`, different `login` | Inline object literal | None | |
| AC2 | Same `journey`; `session` with a different `tenantId` | Inline object literal | None | |
| AC3 | Same `journey`/`session` as AC1, called with `POLICY.OWNER` | Inline object literal | None | |
| AC4 | Existing test suites already covering `journey.js`'s 11 `POLICY.TENANT` routes (`check-a4-*`, `check-ougl*`, `check-wsm2-*`, etc.) | Repo's own existing test files, unmodified | None | Full-suite regression run, not new fixtures |
| AC5 | Existing `check-wsm2-collaborative-sessions.js` fixtures, unmodified | Repo's own existing test file | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data is self-contained and available now.

---

## Unit Tests

### `requireJourneyAccess grants access to a same-tenant non-owner under POLICY.TENANT`

- **Verifies:** AC1
- **Precondition:** `journey = { ownerId: 'user-A', tenantId: 'acme' }`; `session = { accessToken: 'tok', login: 'user-B', tenantId: 'acme' }`.
- **Action:** Call `requireJourneyAccess(journey, session, POLICY.TENANT)`.
- **Expected result:** Returns (does not throw).
- **Edge case:** No — this is the core bug being fixed.

### `requireJourneyAccess denies a different-tenant non-owner under POLICY.TENANT (404)`

- **Verifies:** AC2
- **Precondition:** Same `journey`; `session = { accessToken: 'tok', login: 'user-C', tenantId: 'other-tenant' }`.
- **Action:** Call `requireJourneyAccess(journey, session, POLICY.TENANT)`; catch the thrown error and pass it to `asHttpResponse(err, POLICY.TENANT)`.
- **Expected result:** `requireJourneyAccess` throws `{ code: 'FORBIDDEN' }`; `asHttpResponse` returns `404`.
- **Edge case:** Yes — the negative case guarding against over-broad access (must not accidentally grant cross-tenant access while fixing the same-tenant case).

### `requireJourneyAccess still denies a same-tenant non-owner under POLICY.OWNER`

- **Verifies:** AC3
- **Precondition:** `journey = { ownerId: 'user-A', tenantId: 'acme' }`; `session = { accessToken: 'tok', login: 'user-B', tenantId: 'acme' }`.
- **Action:** Call `requireJourneyAccess(journey, session, POLICY.OWNER)`.
- **Expected result:** Throws `{ code: 'FORBIDDEN' }` — the fix must not weaken `POLICY.OWNER`'s stricter semantics.
- **Edge case:** Yes — regression guard for `handlePostJourneyRecommit`/`handlePostJourneyStageCommit` (the two real `POLICY.OWNER` call sites), which must remain owner-only.

### `requireJourneyAccess still grants the journey owner access under both policies`

- **Verifies:** AC4 (existing-behaviour regression guard)
- **Precondition:** `journey = { ownerId: 'user-A', tenantId: 'acme' }`; `session = { accessToken: 'tok', login: 'user-A', tenantId: 'acme' }` (the owner themselves).
- **Action:** Call `requireJourneyAccess(journey, session, POLICY.TENANT)` and separately with `POLICY.OWNER`.
- **Expected result:** Both calls return (do not throw) — unchanged from current behaviour.
- **Edge case:** Yes — confirms the fix's new `policy === POLICY.TENANT && isSameTenant(...)` branch is additive, not a replacement for the existing owner-match early return.

### `requireJourneyAccess still grants access when journey.ownerId is null (unowned/public journey)`

- **Verifies:** AC4 (existing-behaviour regression guard)
- **Precondition:** `journey = { ownerId: null, tenantId: 'acme' }`; any authenticated `session`.
- **Action:** Call `requireJourneyAccess(journey, session, POLICY.TENANT)`.
- **Expected result:** Returns (does not throw) — unchanged from current behaviour.
- **Edge case:** Yes — confirms the fix doesn't disturb the existing `journey.ownerId == null` early return.

### `requireJourneyAccess still throws NOT_FOUND for a null journey`

- **Verifies:** AC4 (existing-behaviour regression guard)
- **Precondition:** `journey = null`.
- **Action:** Call `requireJourneyAccess(null, session, POLICY.TENANT)`.
- **Expected result:** Throws `{ code: 'NOT_FOUND' }` — unchanged from current behaviour.
- **Edge case:** Yes.

### `requireJourneyAccess still throws UNAUTHENTICATED for a missing session/accessToken`

- **Verifies:** AC4 (existing-behaviour regression guard)
- **Precondition:** `session = null` (or `session.accessToken` absent).
- **Action:** Call `requireJourneyAccess(journey, null, POLICY.TENANT)`.
- **Expected result:** Throws `{ code: 'UNAUTHENTICATED' }` — unchanged from current behaviour.
- **Edge case:** Yes.

---

## Integration Tests

### `journey.js's 11 POLICY.TENANT call sites have no regression after the fix`

- **Verifies:** AC4
- **Components involved:** `src/web-ui/middleware/journey-access.js`, `src/web-ui/routes/journey.js` (all 11 `POLICY.TENANT` call sites), every existing test file exercising those routes.
- **Precondition:** Fix applied to `requireJourneyAccess()`.
- **Action:** Run the full repo test suite (`node scripts/run-all-tests.js`).
- **Expected result:** The set of failing files matches the pre-existing baseline exactly (`check-pipeline-state-integrity.js`'s 3 known C3 entries, plus `check-p3.5-validate-trace.js`/`check-p4-enf-decision.js`, both unrelated) — no file that previously passed now fails, and `check-wsm2-collaborative-sessions.js` moves from failing to passing (see next test).

### `check-wsm2-collaborative-sessions.js T2/T4 pass after the fix`

- **Verifies:** AC5
- **Components involved:** `tests/check-wsm2-collaborative-sessions.js` (unmodified).
- **Precondition:** Fix applied.
- **Action:** Run `node tests/check-wsm2-collaborative-sessions.js`.
- **Expected result:** `T2b`, `T2c`, `T2d`, `T4a`, `T4b` (currently failing with 404s) all pass; all previously-passing tests in the same file (T1, T3, T5-T8) remain passing — 22/22.

---

## NFR Tests

None — confirmed with story owner. This story's own NFR section states "None identified" for Performance/Accessibility/Audit, and Security is the fix itself (AC2/AC3 above are the security regression guards — a same-tenant grant must not become a cross-tenant grant, and `POLICY.OWNER` must not weaken).

---

## Out of Scope for This Test Plan

- Testing `requireGrantAccess`/the `agency-client-organisations` relationship-grant extension in the same file — unrelated code path, matching the story's own Out of Scope.
- A full behavioural re-review of each of the 11 `POLICY.TENANT` callers' business logic beyond confirming the shared access-guard change doesn't regress them (the integration test above is a regression check, not a re-audit of each route).
- Production `journey_store`/database audit for historical wrongly-denied access attempts — matching the story's own Out of Scope; a separate follow-up if desired.

---

## Test Gaps and Risks

None — every AC has direct automated coverage, and the fix's correctness is exhaustively testable at the unit level since all 11 real call sites share one function.
