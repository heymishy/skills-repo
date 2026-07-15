## Test Plan: Create a new GitHub repo directly from product creation

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.1.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-2-full-config-and-bootstrap.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Create-new-repo sets product's repo columns | — | 1 test | — | — | — | 🟢 |
| AC2 | Name collision → clear error, no overwrite | — | 1 test | — | — | — | 🟢 |
| AC3 | No GitHub token → same account-linking prompt as prc-s1.2 AC3 | — | 1 test | — | — | — | 🟢 |
| AC4 | repo_* columns set before bootstrap step is shown | — | 1 test | — | — | — | 🟢 |
| AC5 | D37 wiring: unwired throws, wired resolves 2 calls to 2 distinct results | — | 2 tests | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — mocked `POST /user/repos` GitHub API call, mocked pool.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mocked `POST /user/repos` returning 201 with a repo object | Synthetic | None | |
| AC2 | Mocked `POST /user/repos` returning 422 (name already exists) | Synthetic | None | |
| AC3 | Session without `accessToken` | Synthetic | None | |
| AC4 | Product fixture, assert column state immediately post-creation | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None.

---

## Integration Tests

### Creating a new repo sets the product's repo_* columns to the created repo

- **Verifies:** AC1
- **Components involved:** Create-repo route handler, mocked `POST /user/repos`, mocked pool
- **Precondition:** Mocked GitHub API accepts the create request, returns `{ owner: { login: 'jane' }, name: 'my-product' }`
- **Action:** Submit create-new-repo with name `my-product`
- **Expected result:** Mock pool's `UPDATE` call sets `repo_provider='github'`, `repo_owner='jane'`, `repo_name='my-product'`

### Name collision is rejected with a clear error, not a silent overwrite

- **Verifies:** AC2
- **Components involved:** Route handler, mocked GitHub API returning 422
- **Precondition:** Mocked `POST /user/repos` returns 422 with a "name already exists" error body
- **Action:** Submit create-new-repo with a colliding name
- **Expected result:** Response is an error identifying the name collision specifically (not a generic failure); mock pool records zero writes

### Non-GitHub-authenticated user gets the same account-linking prompt as prc-s1.2

- **Verifies:** AC3
- **Components involved:** Route handler, session without `accessToken`
- **Precondition:** Session is email/Google-authenticated
- **Action:** Attempt to create a new repo
- **Expected result:** Same response shape as `prc-s1.2`'s AC3 test — directs to `GET /settings/link-account/github/start`, reusing the identical prompt/message, not a second, differently-worded implementation

### Product record is fully configured before the bootstrap step begins

- **Verifies:** AC4
- **Components involved:** Route handler, product fixture
- **Precondition:** Create-repo succeeds
- **Action:** Inspect the product row's state at the exact point the handler would hand off to the bootstrap step (`prc-s2.2`)
- **Expected result:** `repo_provider`/`repo_owner`/`repo_name` are already non-null before any bootstrap-related response is sent — no window where the product looks configured but isn't

### Unwired repoAdapter throws, never returns a silent safe-looking value

- **Verifies:** AC5 (D37 wiring, first half)
- **Components involved:** `repo-adapter.js` module before `setCreateRepoAdapter` is called
- **Precondition:** Fresh module load, `setCreateRepoAdapter` never invoked
- **Action:** Call `createRepo` directly
- **Expected result:** Throws `Adapter not wired: createRepoAdapter. Call setCreateRepoAdapter() with a real implementation before use.` — matching this repo's D37 error-message convention exactly

### Wired repoAdapter resolves two different create-repo calls to two different, individually-correct results

- **Verifies:** AC5 (D37 wiring, second half — behavioural correctness, not just "a function reference was assigned")
- **Components involved:** `server.js`'s real wiring of `setCreateRepoAdapter`, two mocked GitHub API responses (one 201 success, one 422 name collision)
- **Precondition:** Adapter wired per `server.js`'s actual production wiring code (`setCreateRepoAdapter(realCreateRepo)`)
- **Action:** One call creates a repo with an available name; a second call attempts a taken name
- **Expected result:** The first call resolves to the created repo's owner/name, the second throws `RepoNameTakenError` — two distinct, independently-correct outcomes from the same wired adapter, not merely proof the setter was called (per CLAUDE.md's D37 wiring-test standard)

---

## NFR Tests

### Repo creation is a single synchronous call, no async job

- **NFR addressed:** Performance
- **Measurement method:** Assert the mocked `POST /user/repos` call and the response are both handled within one request lifecycle
- **Pass threshold:** N/A — structural assertion
- **Tool:** Hand-rolled assertion on call/response ordering

---

## Out of Scope for This Test Plan

- Bootstrap content itself — `prc-s2.2`'s test plan.
- Connect-existing-repo — already covered by `prc-s1.2`'s test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
