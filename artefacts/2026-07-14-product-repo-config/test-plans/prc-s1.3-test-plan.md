## Test Plan: Resolve sign-off write-back to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.3.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-1-walking-skeleton.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Sign-off commit lands in the product's own repo | — | 1 test | — | — | — | 🟢 |
| AC2 | Two products' sign-offs never cross into each other's repo | — | 1 test | — | — | — | 🟢 |
| AC3 | No repo configured → rejected, no fallback to global env var | — | 1 test | — | — | — | 🟢 |
| AC4 | Commit identity/attribution unchanged (still the real user) | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — `commitSignOff`'s GitHub Contents API calls mocked at the `fetch` boundary (matching `sign-off-writer.js`'s existing test suite convention), plus a mocked pool for product→repo resolution.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | One product with `repo_owner='acme'`, `repo_name='widgets'` | Synthetic fixture | None | |
| AC2 | Two products, two different repos | Synthetic fixture | None | |
| AC3 | One product with null repo columns | Synthetic fixture | None | |
| AC4 | Mocked `GET /user` returning a fake authenticated identity | Synthetic | None (fake login/email only) | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — `commitSignOff`'s per-product resolution is only meaningfully testable as an integration between the route handler, the resolution logic, and the (mocked) Contents API.

---

## Integration Tests

### Sign-off commit targets the product's own connected repo

- **Verifies:** AC1
- **Components involved:** `routes/sign-off.js`, `sign-off-writer.js`'s `commitSignOff` (now accepting owner/repo params), mocked Contents API, mocked pool
- **Precondition:** Product configured with `repo_owner='acme'`, `repo_name='widgets'`
- **Action:** Perform a sign-off action for that product's artefact
- **Expected result:** The mocked `PUT /repos/{owner}/{repo}/contents/{path}` call was made with `owner='acme'`, `repo='widgets'` — not whatever `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` happen to be set to in the test environment

### Two products' sign-offs land in two different repos, never crossing

- **Verifies:** AC2
- **Components involved:** Same as above, two product fixtures
- **Precondition:** Product A → `acme/widgets`, Product B → `other-org/gadgets`
- **Action:** Sign off an artefact for Product A, then for Product B
- **Expected result:** Two separate mocked Contents API calls recorded, each targeting its own product's repo — assert the call for Product A never referenced `other-org/gadgets` and vice versa

### Sign-off with no repo configured is rejected, not silently fallen back

- **Verifies:** AC3
- **Components involved:** Route handler, product fixture with null repo columns
- **Precondition:** Product has `repo_owner: null`
- **Action:** Attempt a sign-off for that product
- **Expected result:** Request rejected with a "no repo configured" error; zero calls made to the mocked Contents API (proving no silent fallback to a global env var, even if one happens to be set in the test process's environment)

### Commit author/committer identity is unchanged — still the real authenticated user

- **Verifies:** AC4
- **Components involved:** `commitSignOff`, mocked `GET /user`
- **Precondition:** Mocked `GET /user` returns `{ login: 'jane', name: 'Jane Doe', email: 'jane@example.com' }`
- **Action:** Perform a sign-off
- **Expected result:** The Contents API `PUT` body's `author`/`committer` fields are `{ name: 'Jane Doe', email: 'jane@example.com' }` — unchanged from `commitSignOff`'s pre-existing behaviour, only the target `owner`/`repo` changed

---

## NFR Tests

### No silent fallback to the shared repo (fail-closed)

- **NFR addressed:** Security
- **Measurement method:** Same assertion as the AC3 integration test above (zero Contents API calls when no repo is configured) — this NFR test asserts only the fail-closed property in isolation, not the full AC3 flow
- **Pass threshold:** Zero API calls
- **Tool:** Hand-rolled assertion on mock call count

---

## Out of Scope for This Test Plan

- Annotation write-back (prc-s2.3's test plan).
- Local artefact writes via `journey.js` (prc-s2.4's test plan).
- Formal cross-tenant E2E proof — this plan's AC2 test is integration-level, the formal E2E spec is prc-s4.3.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
