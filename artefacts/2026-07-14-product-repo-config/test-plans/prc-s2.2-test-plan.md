## Test Plan: Bootstrap a newly created repo with the skills framework

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.2.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-2-full-config-and-bootstrap.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Bootstrap commits the skills framework content, real identity | — | 1 test | — | — | — | 🟢 |
| AC2 | API-only path genuinely attempted | — | 1 test | — | — | — | 🟢 |
| AC3 | Bootstrap output matches `platform-init.js`'s structure | — | 1 test | — | — | — | 🟢 |
| AC4 | Fallback path (if used) still uses the user's own token | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. AC2 was corrected in the story artefact on 2026-07-14 (see `decisions.md`) to remove the independent-testability issue `/review` finding 1-M1 identified — this test plan targets the corrected wording directly, no workaround needed.

---

## Test Data Strategy

**Source:** Synthetic — mocked GitHub Contents/Git Data API (tree/blob/commit endpoints) at the `fetch` boundary; mocked `platform-init.js` file listing for structural comparison.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fresh/empty repo fixture, mocked tree/blob/commit API responses | Synthetic | None | |
| AC2 | Spy on the API-call sequence to confirm it was attempted | Synthetic | None | |
| AC3 | The real `scripts/platform-init.js`'s `COPY_DIRS` list, read directly, compared against bootstrap's file manifest | Real source file (not mocked — this is the actual list to structurally match against) | None | |
| AC4 | A forced-fallback scenario (mocked API failure) to exercise the local-clone path if implemented | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's meaningful behaviour is only testable as an integration between the bootstrap orchestration logic and the (mocked) GitHub API.

---

## Integration Tests

### Bootstrap commits the skills framework content under the operator's identity

- **Verifies:** AC1
- **Components involved:** Bootstrap orchestration function, mocked Git Data API (tree/blob/commit), mocked `GET /user`
- **Precondition:** Empty repo fixture; mocked API accepts all calls
- **Action:** Run bootstrap against the fixture repo
- **Expected result:** A commit is created via the mocked API with author/committer matching the mocked `GET /user` identity; the commit's tree includes files matching `.github/skills/`, `.github/templates/`, `scripts/`

### API-only path is genuinely attempted

- **Verifies:** AC2
- **Components involved:** Bootstrap orchestration function, spy on the Git Data API call sequence
- **Precondition:** Mocked API accepts all calls (primary path succeeds)
- **Action:** Run bootstrap
- **Expected result:** A tree/blob/commit call sequence is recorded via the mocked Git Data API — regardless of whether a fallback code path exists elsewhere in the codebase, this test proves the primary path was actually invoked for this run, not skipped

### Bootstrap output structurally matches platform-init.js's file set

- **Verifies:** AC3
- **Components involved:** Bootstrap orchestration function, `scripts/platform-init.js`'s `COPY_DIRS` constant (read directly, not re-implemented)
- **Precondition:** Bootstrap has run against the fixture repo (reuses AC1's setup)
- **Action:** Compare the set of file paths in the bootstrap commit's tree against `platform-init.js`'s `COPY_DIRS` source directories' actual file listing
- **Expected result:** The two file-path sets match exactly (same relative paths under `.github/skills/`, `.github/templates/`, `scripts/`)

### Fallback path, if exercised, still uses the operator's own OAuth token

- **Verifies:** AC4
- **Components involved:** Bootstrap orchestration function, forced API failure to trigger fallback (if a fallback code path exists)
- **Precondition:** Mocked Git Data API returns a persistent failure (e.g. 500) to force the fallback branch
- **Action:** Run bootstrap
- **Expected result:** IF a fallback path exists and fires: the resulting commit (via whatever mechanism the fallback uses) is still attributed to the operator's identity, never a service account token — assert no `GITHUB_TOKEN`-style env var is referenced in the fallback code path. IF no fallback path exists yet (API-only implementation): this test should be marked pending with a comment explaining AC4 is conditional on the fallback existing at all.

---

## NFR Tests

### Bootstrap completes within a reasonable time budget

- **NFR addressed:** Performance
- **Measurement method:** Time the mocked bootstrap run (mocked API calls resolve near-instantly, so this test is really asserting the orchestration logic itself doesn't introduce unnecessary serialization/delay, not a real-world timing measurement)
- **Pass threshold:** Structural — no unnecessary sequential `await` where calls could be batched/parallelized
- **Tool:** Hand-rolled call-timing assertion

---

## Out of Scope for This Test Plan

- Standards content bootstrap — Epic 3's own stories.
- Per-tenant customization of bootstrap content.
- A real (non-mocked) bootstrap run against a real GitHub repo — that level of proof belongs to `prc-s1.4`'s pattern if ever extended to cover bootstrap, or a future DoD smoke test.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's test may be N/A depending on implementation choice | Fallback path is optional per `/clarify`'s resolution (API-only preferred) | Test explicitly conditional; not a real gap if API-only implementation is chosen and documented |
