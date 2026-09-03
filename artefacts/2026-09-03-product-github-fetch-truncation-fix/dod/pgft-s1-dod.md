# Definition of Done: Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion

**PR:** https://github.com/heymishy/skills-repo/pull/820 | **Merged:** 2026-09-03
**Story:** artefacts/2026-09-03-product-github-fetch-truncation-fix/stories/pgft-s1-retry-github-fetch-truncation.md
**Test plan:** artefacts/2026-09-03-product-github-fetch-truncation-fix/test-plans/pgft-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-03-product-github-fetch-truncation-fix/dor/pgft-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `realFetchPipelineState: recovers from a thrown network error on retry` and `...recovers from a JSON-parse failure on retry` | automated test (`tests/check-pgft-s1-fetch-retry.js`) | None |
| AC2 | ✅ | `realFetchPipelineState: diagnostic detail (bytes received, Content-Length) in the final error` | automated test | None |
| AC3 | ✅ | `realFetchPipelineState: non-ok HTTP response fails immediately, never retried` | automated test | None |
| AC4 (regression) | ✅ | `pst-s1 background-failure logging still catches an exhausted-retries failure` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

One recorded, non-blocking deviation: the DoR contract named only two pre-existing test mocks as needing the `res.json()` → `res.text()` fidelity fix (T3/T6 in `tests/check-pr-s2-pipeline-state-fetch-adapter.js`). A full-suite run (part of `/verify-completion`, not scope-creep exploration) surfaced that `src/web-ui/adapters/export-data-source.js` also reuses `realFetchPipelineState`, and 3 more pre-existing test files mocked its `ok:true` response with the same outdated `.json()`-only shape:
- `tests/check-emss-s1-select-story-for-saas-export.js`
- `tests/check-mtrr-s1-tenant-scoped-repo-resolution.js`
- `tests/check-rb-s4-saas-connected-bootstrap.js`

Confirmed as the complete set via `grep -rl "contents/.github/pipeline-state.json" tests/*.js` (exactly 4 files, all fixed). This is not new functionality or behavioural scope creep — the same, already-approved mock-fidelity fix applied everywhere it was actually needed, discovered by execution rather than static analysis at DoR time. Recorded here per DoD convention, not silently absorbed. No revert or follow-up story needed.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A/B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 network-error retry | ✅ | ✅ | |
| AC1 JSON-parse-failure retry | ✅ | ✅ | |
| AC2 diagnostic detail on exhaustion | ✅ | ✅ | |
| AC3 non-ok status never retried | ✅ | ✅ | |
| AC4 regression guard (pst-s1 logging) | ✅ | ✅ | |

**Gaps (tests not implemented):**
None. The one named residual uncertainty from the test plan — whether retry-with-backoff fully resolves the live production incident — is explicitly a post-merge production-observation item, not a test-plan gap (the retry *mechanism* itself is fully covered and proven correct by the 5 tests above).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — worst-case added latency <2s on full retry exhaustion | ✅ | Fixed backoff schedule (500ms + 1000ms = 1500ms worst case), confirmed by code review |
| Security — no new external input or attack surface | ✅ | Same `Authorization: Bearer [token]` header and endpoint reused unchanged across retries |
| Availability — sync success rate for large repos (this story's own core motivation) | ⚠️ Partially evidenced | Retry *mechanism* proven correct (unit tests); whether it resolves the real production incident is not yet observable — **production does not have this fix yet** (see DoD Observations) |
| Data residency | ✅ N/A | No new data storage or cross-border transfer |
| Compliance | ✅ N/A | No named regulatory clause |

`nfr-profile.md` status remains `Active` (not `Verified`) — the Availability NFR's own Gap ("whether retry-with-backoff fully resolves the production incident") is explicitly not closeable until a post-merge production observation happens, and that observation cannot happen until `promote-to-prod` is approved (see below).

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `pgft-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Approve `promote-to-prod`** in GitHub Actions (workflow run `33722553905`, job "Promote to production (manual approval required)") for this specific merge commit (`4477f8df`) — separate from the earlier approval that shipped `pst-s1`'s own fix. `wuce-staging.fly.dev` is confirmed running this fix (`deploy-staging` succeeded, `@mocked` smoke-test suite passed); `skills-framework.fly.dev` (production — the exact deployment where this story's own bug was discovered) is not. Owner: Hamish King.
2. **Observe production logs after promotion.** Once promoted, watch `flyctl logs --app skills-framework` for `[product-sync] background sync failed` recurrence on the `skills-framework` product. If it recurs identically (same "Unexpected end of JSON input" signature, now with the new byte-count/Content-Length diagnostic detail this story adds), that is new evidence for a harder root cause than a transient network blip — worth a follow-up investigation. If it does not recur, or recovers via retry (observable indirectly: "Last synced" updates without any failure log at all), this story's fix is confirmed working in the exact environment it was designed for. Owner: Hamish King.

---

## DoD Observations

1. **Same deploy-topology gap as `pst-s1`, now confirmed as a repeating pattern, not a one-off.** This is the second consecutive short-track story in this incident chain where the merged fix landed on `wuce-staging` automatically but required a *separate*, manually-gated `promote-to-prod` approval to reach the actual production deployment (`skills-framework.fly.dev`) the bug was reported against. Each story's own merge produces its own `staging-deploy.yml` run with its own independent `promote-to-prod` gate — approving one merge's promotion does not carry forward to the next merge's own gate. **Tag as an /improve candidate** (reinforcing the same tag already raised in `pst-s1`'s own DoD): worth deciding, at a platform level, whether every short-track hotfix in an active incident chain should require this same manual round-trip, or whether a documented "fast-follow" promotion path is warranted for same-day, same-incident merges — a process decision for the operator, not something to change unilaterally here.
2. **This story is a direct, causal continuation of `pst-s1` — a real illustration of the pipeline's own layered fix-and-verify feedback loop working as intended.** `pst-s1`'s AC3 (background-failure logging) is precisely what surfaced this story's own root cause: before `pst-s1`, this exact same underlying GitHub-fetch truncation was indistinguishable from the client-facing timeout bug (both manifested identically as "Unexpected end of JSON input" in the browser). Only after `pst-s1` shipped and the operator tested it live in production did the *now-visible* server-side log reveal a second, distinct failure one layer deeper. Worth noting in this repo's own delivery-pattern records as a positive example of incremental diagnosability improving fix quality, not just a coincidental two-bug session.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion" (pgft-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is it clear that production (skills-framework.fly.dev) still does not have this fix until promote-to-prod is approved for THIS specific merge commit (4477f8df), separately from pst-s1's own earlier promotion?
Report findings as HIGH / MEDIUM / LOW.
```
