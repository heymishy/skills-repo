# Definition of Done: Make product sync fire-and-forget with client-side polling

**PR:** https://github.com/heymishy/skills-repo/pull/819 | **Merged:** 2026-09-03
**Story:** artefacts/2026-09-03-product-sync-timeout-fix/stories/pst-s1-make-product-sync-async-with-polling.md
**Test plan:** artefacts/2026-09-03-product-sync-timeout-fix/test-plans/pst-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-03-product-sync-timeout-fix/dor/pst-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `handlePostProductSync: responds 202 before the background fetch resolves` | automated test (`tests/check-pst-s1-sync-async-polling.js`) | Response shape changed from `200 {synced:true, rollup}` to `202 {started:true}` — an intentional consequence of the fix, not a violation of AC1's own text, and not consumed by any other caller (verified via grep before implementation) |
| AC2 | ✅ | `handlePostProductSync: background success still writes exactly one product_rollups row, unchanged shape` | automated test | None |
| AC3 | ✅ | `handlePostProductSync: background failure is logged via console.error, not swallowed` | automated test | None |
| AC4 | ✅ (automatable portion) | 3 backend tests (endpoint exists, tenant-scoped 404, `inProgress:false` reporting) + 4 frontend tests (script renders `pshTriggerSync`, fetches `/sync/status`, contains a real polling construct, reloads on completion) | automated tests | Real-browser polling cadence/reload timing verified only via CI's `@mocked` Playwright smoke-test suite against `wuce-staging.fly.dev` (passed) — the manual verification scenario named in the test plan's own DOM-behaviour gap has not yet been run by a human. See Test Plan Coverage and DoD Observations below. |
| AC5 (regression) | ✅ | `_renderProductView: Refresh control still renders disabled/shows "Syncing…" when isSyncing=true` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. All 6 commits on `feature/pst-s1` map cleanly to implementation-plan tasks — confirmed at `/verify-completion` via `git log --oneline`.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A/B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 immediate response | ✅ | ✅ | |
| AC3 background failure logged | ✅ | ✅ | |
| AC2 background success write (integration) | ✅ | ✅ | |
| AC4 backend status endpoint (export, tenant-scope, in-progress reporting) | ✅ | ✅ | |
| AC4 frontend polling script (shape/presence) | ✅ | ✅ | |
| AC5 regression guard | ✅ | ✅ | |
| NFR-Performance (<1000ms ack) | ✅ | ✅ | |

**Gaps (tests not implemented):**
None implemented-but-missing. One named, pre-accepted gap from the test plan: AC4's real-browser polling cadence and reload-on-completion timing is DOM-behaviour, untestable in this repo's Node test runner (no E2E framework configured for this route). Handling per test plan: manual verification scenario (`artefacts/2026-09-03-product-sync-timeout-fix/verification-scripts/pst-s1-verification.md`). **Not yet executed by a human as of this DoD.** No RISK-ACCEPT was logged in `/decisions` for this gap because the test plan itself already classified it as 🟡 (lower severity, not CSS-layout-dependent) with a named handling path, not as an open, unaddressed risk — but the manual scenario's actual execution remains outstanding. Flagged as a follow-up action below, not silently deferred.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — immediate ack <1s regardless of background duration | ✅ | `nfr-results` test: deferred-promise mock proves decoupling, not just fast-in-practice timing |
| Security — new status endpoint tenant-scoped, no new attack surface | ✅ | `handleGetProductSyncStatus: 404 for a product outside the caller's tenant` test |
| Availability — sync success rate for large repos (this story's own core motivation) | ✅ (fix confirmed live on staging) | Root cause fixed; CI's `deploy-staging` + `@mocked` smoke-test suite passed against `wuce-staging.fly.dev` running this exact merged commit. **Production (`skills-framework.fly.dev`) has not yet received this fix** — see DoD Observations. |
| Data residency | ✅ N/A | No new data storage or cross-border transfer |
| Compliance | ✅ N/A | No named regulatory clause |
| Accessibility — "Syncing…" state remains a real disabled-button state | ✅ | Shared with AC5's own regression-guard test |

`nfr-profile.md` status remains `Active` (not `Verified`) — per the skill's own rule, the profile can only be marked Verified once *all* its NFRs are confirmed, and the one named Gap in that file (real-browser polling timing) is not yet closed. It carries forward as this DoD's own outstanding follow-up action, not silently cleared.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `pst-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Run the manual verification scenario** (`artefacts/2026-09-03-product-sync-timeout-fix/verification-scripts/pst-s1-verification.md`) against `wuce-staging.fly.dev` — confirms real-browser polling cadence and reload-on-completion timing, the one gap this DoD could not close with automated evidence alone. Owner: Hamish King (named in `nfr-profile.md`).
2. **Approve `promote-to-prod`** in GitHub Actions (workflow run `33715340515`, job "Promote to production (manual approval required)") to actually ship this fix to `skills-framework.fly.dev` — the deployment the original bug was reported and reproduced against. Owner: Hamish King (the `environment: production` protection rule requires his explicit reviewer approval; this is a human action the agent cannot and should not perform). **Until this runs, the live production bug this story fixes is still present in production**, even though the fix is merged to master and live on staging.

---

## DoD Observations

1. **Deploy-topology gap discovered during this DoD's own live verification attempt.** Attempted a live smoke test against `skills-framework.fly.dev` (the exact deployment the original bug was reproduced on) immediately after merge, assuming push-to-master would deploy there. It does not: `.github/workflows/staging-deploy.yml` auto-deploys only to `wuce-staging` on push to master; `skills-framework` (production) deploys only via the separate, manually-gated `promote-to-prod` job. The live attempt against `skills-framework.fly.dev` reproduced the *original* bug symptom (page became unresponsive clicking Refresh) — expected, since that deployment is still running pre-fix code, not a sign the fix is broken. Confirmed via `gh run view` that `deploy-staging` and `smoke-test` both succeeded for this merge's commit (`ffe7fd1d`) and `promote-to-prod` is sitting in `waiting` status pending approval. **Tag as an /improve candidate**: this deploy topology (auto-staging, manual-prod) is a reasonable and intentional safety design, but nothing in this pipeline's own skills (verify-completion, branch-complete, DoD) currently prompts an agent to check deploy-gate status before attempting a live post-merge smoke test on what the operator calls "production" — worth adding a check or at least a documented convention to `verify-completion` or `definition-of-done`'s SKILL.md so a future agent doesn't spend time diagnosing an apparent regression that is actually just an unpromoted deploy.
2. **Guardrails schema violation self-corrected before merge.** The DoR sign-off's guardrails write (H9/H-NFR/H-NFR2/H-NFR3) initially used an invented `{name, notes}` shape instead of the schema's required `{id, category, label, status}` fields, which failed the "Validate traceability chain" CI check with 8 violations after the PR was opened. Fixed in commit `a2212b24` before merge (re-verified 0 violations via a manual Node-based schema check, since `python3` is non-functional in this local Windows environment — same root cause as the known pre-existing `tests/check-p3.5-validate-trace.js` failure). No lasting impact since it was caught and fixed pre-merge, but worth noting for /trace's own audit trail.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Make product sync fire-and-forget with client-side polling" (pst-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is it clear that production (skills-framework.fly.dev) still has the original bug until promote-to-prod is approved?
Report findings as HIGH / MEDIUM / LOW.
```
