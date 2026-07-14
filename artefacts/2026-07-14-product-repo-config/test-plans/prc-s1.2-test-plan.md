## Test Plan: Connect an existing GitHub repo to a product

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.2.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-1-walking-skeleton.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Valid owner/repo with access → repo_* columns set, confirmation shown | — | 2 tests | — | — | — | 🟢 |
| AC2 | Owner/repo without access → rejected, no columns written | — | 1 test | — | — | — | 🟢 |
| AC3 | No GitHub token in session → "link your GitHub account" prompt | — | 1 test | — | — | — | 🟢 |
| AC4 | Re-linking to a different repo updates the association | — | 1 test | — | — | — | 🟢 |
| AC5 | D37 wiring: unwired throws, wired resolves 2 sessions to 2 distinct results | — | 2 tests | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — mocked GitHub API responses (`fetch`/`https.request` intercepted at the module boundary, matching this repo's `check-wuce26-*.js` T9/T10 precedent) and a mocked `pg` pool for the product row.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A session with a fake GitHub OAuth token; a mocked `GET /repos/{owner}/{repo}` returning 200 | Synthetic | None (fake token string only) | |
| AC2 | Mocked `GET /repos/{owner}/{repo}` returning 404 | Synthetic | None | |
| AC3 | A session with `login`/`google-sub`/`email` set but no `accessToken` | Synthetic | None | |
| AC4 | A product row with an existing repo association already set | Synthetic fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — the meaningful behaviour is the integration between the route handler, the D37 repo-connection adapter, and the mocked GitHub API.

---

## Integration Tests

### Connecting a repo the user has access to sets the product's repo columns

- **Verifies:** AC1
- **Components involved:** Repo-connection route handler, D37 adapter (`setRepoAdapter`), mocked GitHub API, mocked pool
- **Precondition:** Session has a valid GitHub token; mocked `GET /repos/acme/widgets` returns 200
- **Action:** POST the connect-repo request with `owner=acme`, `repo=widgets`
- **Expected result:** Mock pool receives an `UPDATE products SET repo_provider='github', repo_owner='acme', repo_name='widgets' WHERE product_id=$1`; response confirms success

### Confirmation is shown after a successful connection

- **Verifies:** AC1
- **Components involved:** Route handler response body/redirect
- **Precondition:** Same as above, request succeeds
- **Action:** Inspect the response
- **Expected result:** Response indicates success (e.g. 200/302 with a confirmation flag or redirect to the product view) — not a bare empty 200

### Connecting a repo without access is rejected and writes nothing

- **Verifies:** AC2
- **Components involved:** Route handler, mocked GitHub API returning 404
- **Precondition:** Mocked `GET /repos/acme/private-thing` returns 404
- **Action:** POST the connect-repo request for that owner/repo
- **Expected result:** Response is an error (4xx) with a clear message; mock pool records zero `UPDATE`/`INSERT` calls

### Non-GitHub-authenticated user is redirected to account-linking, not silently blocked

- **Verifies:** AC3
- **Components involved:** Route handler, session without `accessToken`
- **Precondition:** Session has `login: 'jane@example.com'` (email auth), no `accessToken`
- **Action:** Attempt to connect a repo
- **Expected result:** Response directs the user to `GET /settings/link-account/github/start` (verified real route, per Category E finding 1-L1) with a clear message; mock pool records zero writes

### Re-connecting to a different repo updates, not duplicates, the association

- **Verifies:** AC4
- **Components involved:** Route handler, mocked pool with a product row already pointing at `acme/widgets`
- **Precondition:** Product's `repo_owner`/`repo_name` already set to `acme`/`widgets`
- **Action:** POST connect-repo with `owner=acme`, `repo=widgets-v2`
- **Expected result:** Mock pool's `UPDATE` call reflects the new values (`widgets-v2`), not a second row or an error for "already connected"

### Unwired repoAdapter throws, never returns a silent safe-looking value

- **Verifies:** AC5 (D37 wiring, first half)
- **Components involved:** `repoAdapter` module before `setRepoAdapter` is called
- **Precondition:** Fresh module load, `setRepoAdapter` never invoked
- **Action:** Call any function that would use the adapter (e.g. the repo-access check)
- **Expected result:** Throws `Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.` — matching this repo's D37 error-message convention exactly

### Wired repoAdapter resolves two different sessions to two different, individually-correct results

- **Verifies:** AC5 (D37 wiring, second half — behavioural correctness, not just "a function reference was assigned")
- **Components involved:** `server.js`'s real wiring of `setRepoAdapter`, two mocked GitHub API responses (one 200, one 404)
- **Precondition:** Adapter wired per `server.js`'s actual production wiring code
- **Action:** Session A checks access to a repo it has access to; Session B (different mocked token) checks access to a repo it does NOT have access to
- **Expected result:** Session A's check resolves to "access granted," Session B's resolves to "access denied" — two distinct, independently-correct outcomes from the same wired adapter, not merely proof the setter was called (per CLAUDE.md's D37 wiring-test standard, sourced from the `tir-s1`/`tir-s7` precedent)

---

## NFR Tests

### Repo-access verification completes synchronously within the request

- **NFR addressed:** Performance
- **Measurement method:** Assert no async job/queue is enqueued — the mocked GitHub call resolves and the response is sent within the same request handler invocation
- **Pass threshold:** N/A (no numeric target set at story level — this is a structural assertion, not a timing threshold)
- **Tool:** Hand-rolled assertion on mock call order

### The OAuth token itself is never written to the products table

- **NFR addressed:** Security
- **Measurement method:** Inspect every `INSERT`/`UPDATE` SQL param passed to the mock pool across all 4 integration tests above
- **Pass threshold:** Zero occurrences of the fake token string in any SQL params
- **Tool:** Hand-rolled assertion (`params.every(p => p !== fakeToken)`)

---

## Out of Scope for This Test Plan

- Creating a new repo (prc-s2.1's test plan).
- Real GitHub API calls — all GitHub interaction is mocked per Test Data Strategy.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | | |
