## Test Plan: Automatically reflect a web-UI journey stage completion in pipeline-state.json

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s2-web-ui-journey-reflects-on-pipeline-state.md
**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## REVISED 2026-10-24 — see `decisions.md` ARCH entry "css-s2, pre-code discovery"

Most of this story's mechanism shipped between this test plan's original authoring (2026-08-07) and now, under `wsd-s1`/`wsd-s2`/`wsd-s4`/`owle.6`/`dcuf-s1`/`acdg-s1`/`acdg-s2`. AC1 is already fully covered by `tests/check-wsd-s2-github-pipeline-state-writer.js` and `tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js` — no new test needed. AC4 is superseded by already-shipped, already-relied-upon auto-create behaviour and will not be implemented as originally written — no new test for it either. Only AC2 (latency NFR) and AC3's `sync_log` gap-logging half are genuinely new; the original AC3 tests below are revised to target the real new module (`sync-log.js`) and the real call site (`journey.js`'s existing `pipeline_state_write_failed` catch block), not a nonexistent `pipeline-state-commit-writer.js`.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Stage completion writes to `pipeline-state.json` via Contents API using the authenticated user's own token; commit author matches | Already covered (`check-wsd-s2-github-pipeline-state-writer.js`, `check-wsd-s4-...js`) | Already covered | — | 1 scenario | External-dependency | 🟡 |
| AC2 | Additional latency is no more than 2x `das-s1`'s own artefact-commit latency | 1 test (new) | — | — | — | — | 🟢 |
| AC3 | Retries exhausted → stage completion still succeeds, gap logged to `sync_log`, no credential persisted | 1 test (new) | 1 test (new) | — | — | — | 🟢 |
| AC4 | No corresponding `pipeline-state.json` entry → no write attempted, not an error | Superseded — see `decisions.md` | — | — | — | — | — |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Real GitHub Contents API commit-author verification | AC1 | External-dependency | The real GitHub API and OAuth token exchange cannot run inside the automated suite — asserting the *actual* commit author identity in GitHub history requires a real API call | Automated tests mock the Contents API call and assert the correct token/header is passed; a manual scenario (below) verifies the real commit author in GitHub history post-merge, per ADR-020's own stated DoD requirement |

---

## Test Data Strategy

**Source:** Mixed — synthetic + mocked externals
**PCI/sensitivity in scope:** No
**Availability:** Available now for automated tests; the manual AC1 scenario requires a real authenticated web-UI session (available once staging exists)
**Owner:** Self-contained (automated); Hamish King (manual scenario, post-merge)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked `req.session.accessToken`; a mocked GitHub Contents API client capturing the `Authorization` header and commit payload | Synthetic + mocked HTTP client | Mocked token value only, never real | Never a real token in test fixtures |
| AC2 | Simulated latency values for `das-s1`'s artefact-commit call and this story's `pipeline-state.json` write call | Synthetic timing fixtures | None | |
| AC3 | Mocked Contents API client configured to fail N times, then either succeed or exhaust the retry budget | Synthetic + mocked HTTP client | None | |
| AC4 | A synthetic `pipeline-state.json` fixture with no entry for the journey's feature slug | Synthetic fixture | None | |

### PCI / sensitivity constraints

None. Mocked token values only — never a real OAuth token in any committed fixture.

### Gaps

None beyond the AC1 manual-verification gap already noted above.

---

## Unit Tests

### AC1 — already covered, no new test

Covered by `tests/check-wsd-s2-github-pipeline-state-writer.js` (T1-T10: authenticated-user token used as `Authorization` header, commit author/committer resolved from `/user`, sha-based optimistic concurrency, retry-on-conflict) and `tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js`. See `decisions.md` ARCH entry for the full audit.

### syncLog_logsReconciliationGap_withFeatureSlugAndGateName

- **Verifies:** AC3
- **Precondition:** A fake pool object installed via `sync-log.js`'s own `_setPoolForTesting({ query: async function(sql, params) {...} })`, matching `journey-store-pg.js`'s own established test convention (`tests/check-ppc-s1-journey-store-helpers.js`) — no real Postgres connection in any automated test
- **Action:** Call the new `sync-log.js` module's gap-logging function directly with a feature slug, tenant ID, and gate/stage name
- **Expected result:** The fake pool's captured `query` call's SQL text references `sync_log` and `INSERT`; captured params include `entry_type = 'gap'`, the given `feature_slug`, and a `created_at`-equivalent timestamp
- **Edge case:** No

### syncLog_neverWritesTokenOrCredentialShapedValue

- **Verifies:** AC3 (no credential storage)
- **Precondition:** Same as above
- **Action:** Inspect the written `sync_log` row's full column set
- **Expected result:** No column or JSONB field anywhere in the row contains a session token or any credential-shaped value — the function's own signature never accepts a token parameter in the first place (confirmed by reading its signature, not just its output)
- **Edge case:** No

---

## Integration Tests

### AC1 — already covered, no new test

Covered by `tests/check-wsd-s2-github-pipeline-state-writer.js`'s factory-selection tests (T3/T4) plus `journey.js`'s own existing call-site wiring (unchanged by this story). See `decisions.md` ARCH entry.

### stageCompletionRequest_succeedsForOperator_andLogsGap_whenPipelineStateWriteFails

- **Verifies:** AC3
- **Components involved:** `src/web-ui/routes/journey.js` (`handlePostGateConfirm`'s existing `pipeline_state_write_failed` catch block, lines ~2799-2818), the already-wired `_pipelineStateWriter` adapter (mocked to throw), the new `sync-log.js` module (real, unmocked logic — exercised against a fake pool, not mocked out entirely, so the actual SQL/params this story writes are the thing being proven)
- **Precondition:** A repo-connected journey completing a stage; `_pipelineStateWriter` mocked to throw (simulating retries already exhausted inside the writer itself — that retry behaviour is `wsd-s2`'s own, already tested); `sync-log.js`'s fake pool installed via `_setPoolForTesting`
- **Action:** Send the stage-completion request end-to-end through the route handler
- **Expected result:** The HTTP response still reports success to the operator (stage completion is not blocked by this write's failure — `das-s1`'s artefact commit, which runs earlier in the same handler, is unaffected); a `sync_log` row exists afterward with `entry_type = 'gap'` and the correct `feature_slug`

---

## NFR Tests

### pipelineStateWrite_addsNoMoreThan2xDasS1Latency

- **NFR addressed:** Performance
- **Measurement method:** Simulate `das-s1`'s artefact-commit call at a fixed mocked latency (e.g. 200ms); measure the total request latency with this story's `pipeline-state.json` write added (also mocked, sequenced after the artefact commit)
- **Pass threshold:** Total added latency for this story's write is ≤ 2x the simulated `das-s1` latency (i.e. ≤ 400ms in the 200ms baseline case) — a relative bound, not an invented absolute number, per this story's own AC2
- **Tool:** `scripts/run-all-tests.js` timing assertion

### commitAuthor_isAuthenticatedUser_notServiceAccount — already covered, no new test

Covered by `tests/check-wsd-s2-github-pipeline-state-writer.js` T1 (asserts the captured `Authorization` header matches the session token).

### reconciliationGapLog_isQueryable

- **NFR addressed:** Audit
- **Measurement method:** Reuses `syncLog_logsReconciliationGap_withFeatureSlugAndGateName`'s own fake-pool assertion above — the captured `INSERT` statement and params ARE the queryability evidence (a real `sync_log` row with these columns is trivially queryable by any SQL client)
- **Pass threshold:** Exactly one `INSERT` call captured, with `feature_slug`, `entry_type`, and a timestamp field all present in its params
- **Tool:** `scripts/run-all-tests.js` assertion

---

## Out of Scope for This Test Plan

- Real GitHub Contents API commit-author verification in automated tests — covered by the manual scenario below and by ADR-020's own DoD requirement (compare commit author in real GitHub history against the authenticated user's login).
- Background/queued retry beyond the request's lifetime — explicitly out of scope for this story per the Step 1.5 architecture decision; nothing to test here since it does not exist.
- Any gate type beyond what exercises the write path generically — full-vocabulary coverage is css-s4's test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real commit-author identity in GitHub history | Requires a real authenticated web-UI session and a real GitHub repo — not available inside the automated test suite | Manual verification scenario (Scenario 1, AC1) run post-merge on staging, matching ADR-020's own stated DoD check |
| Real `das-s1` baseline latency for the 2x threshold | `das-s1`'s own overhead has not yet been measured in a real environment — PR #674 still blocked on the GitHub Actions outage | Re-verify the NFR test's simulated baseline against real measurements once staging is reachable, per `nfr-profile.md`'s own flagged gap |
