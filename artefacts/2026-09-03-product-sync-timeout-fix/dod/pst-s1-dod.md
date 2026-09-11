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
| AC4 | ✅ | 3 backend tests (endpoint exists, tenant-scoped 404, `inProgress:false` reporting) + 4 frontend tests (script renders `pshTriggerSync`, fetches `/sync/status`, contains a real polling construct, reloads on completion) + **live Chrome verification 2026-09-11** (see DoD Observation #3) confirming real-browser polling and auto-reload-on-completion against `wuce-staging.fly.dev`'s real `skills-framework` product | automated tests + live browser verification | None remaining — see DoD Observation #3 for the one residual sub-case (Scenario 3, the mid-sync-reload regression guard) that was code-path-confirmed rather than live-timed, because this environment's sync completes faster than the tool round-trip needed to catch it in flight. |
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
None implemented-but-missing. One named, pre-accepted gap from the test plan: AC4's real-browser polling cadence and reload-on-completion timing is DOM-behaviour, untestable in this repo's Node test runner (no E2E framework configured for this route). Handling per test plan: manual verification scenario (`artefacts/2026-09-03-product-sync-timeout-fix/verification-scripts/pst-s1-verification.md`). **Executed live 2026-09-11** — Scenario 1 (immediate response) and Scenario 2 (auto-reload on completion) confirmed directly via live Chrome against `wuce-staging.fly.dev`; Scenario 3 (mid-sync reload) confirmed via direct code-path inspection rather than live timing (the real sync completes too fast in this environment to catch in flight through browser tool round-trips); the Edge case (forcing a real sync failure) was not independently reproducible without breaking real GitHub token/repo access. Full detail in DoD Observation #3. This closes the outstanding manual-verification gap for all practical purposes — the one residual item (live-timing Scenario 3, as opposed to code-path-confirming it) is a tooling-environment limitation, not an unverified behaviour.

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
1. ~~Run the manual verification scenario~~ — done, 2026-09-11 (see DoD Observation #3). Scenarios 1 and 2 confirmed live; Scenario 3 confirmed via direct code-path inspection (live timing not achievable in this environment — see Observation #3); the Edge case remains not independently reproducible via live Chrome alone (would require breaking real GitHub token/repo access), consistent with its coverage already resting on AC3's automated test.
2. **Approve `promote-to-prod`** in GitHub Actions (workflow run `33715340515`, job "Promote to production (manual approval required)") to actually ship this fix to `skills-framework.fly.dev` — the deployment the original bug was reported and reproduced against. Owner: Hamish King (the `environment: production` protection rule requires his explicit reviewer approval; this is a human action the agent cannot and should not perform). **Until this runs, the live production bug this story fixes is still present in production**, even though the fix is merged to master and live on staging.

---

## DoD Observations

1. **Deploy-topology gap discovered during this DoD's own live verification attempt.** Attempted a live smoke test against `skills-framework.fly.dev` (the exact deployment the original bug was reproduced on) immediately after merge, assuming push-to-master would deploy there. It does not: `.github/workflows/staging-deploy.yml` auto-deploys only to `wuce-staging` on push to master; `skills-framework` (production) deploys only via the separate, manually-gated `promote-to-prod` job. The live attempt against `skills-framework.fly.dev` reproduced the *original* bug symptom (page became unresponsive clicking Refresh) — expected, since that deployment is still running pre-fix code, not a sign the fix is broken. Confirmed via `gh run view` that `deploy-staging` and `smoke-test` both succeeded for this merge's commit (`ffe7fd1d`) and `promote-to-prod` is sitting in `waiting` status pending approval. **Tag as an /improve candidate**: this deploy topology (auto-staging, manual-prod) is a reasonable and intentional safety design, but nothing in this pipeline's own skills (verify-completion, branch-complete, DoD) currently prompts an agent to check deploy-gate status before attempting a live post-merge smoke test on what the operator calls "production" — worth adding a check or at least a documented convention to `verify-completion` or `definition-of-done`'s SKILL.md so a future agent doesn't spend time diagnosing an apparent regression that is actually just an unpromoted deploy.
2. **Backfilled 2026-09-11, following a repo-wide DoD-verification-method stocktake.** Executed the previously-outstanding manual verification scenario live against `wuce-staging.fly.dev`'s real `skills-framework` product (`a09b38fe-53bb-4f17-9597-fc6dd60d3dfc`, the same product used for this repo's own `sob-*` spot-checks and the exact product the original bug was reproduced against).
   - **Scenario 1 (AC1–3, immediate response):** the Refresh button's `onclick` handler (`pshTriggerSync`) did not register from a raw `computer.left_click` (same tool limitation seen elsewhere this session) — worked around by calling `window.pshTriggerSync('a09b38fe-53bb-4f17-9597-fc6dd60d3dfc')` directly via JS. Confirmed within 300ms: button text → `"Syncing…"`, `disabled: true`. Network capture showed exactly the expected pair: `POST /products/.../sync` → 202, `GET /products/.../sync/status` → 200 — confirming AC1's response-shape change (202, not the old 200) live, not just in the unit test.
   - **Scenario 2 (AC4, auto-reload on completion):** after the sync genuinely completed (`GET /sync/status` → `{"inProgress":false}`), a network capture showed a real, self-initiated `GET` to the product page's own document URL — fired automatically between two status polls, with no manual navigation performed. The page's own text confirmed the result: `"Last synced just now · unknown: 124 · complete: 459 · not-started: 10"`. This is Scenario 2 confirmed live: the client-side poll loop's own `window.location.reload()` (products.js:1120) genuinely fires and genuinely refreshes the displayed counts.
   - **Scenario 3 (AC5 regression guard, reload mid-sync):** attempted twice — trigger a fresh sync, then reload immediately (once via separate tool calls, once via a single `browser_batch` to minimise latency). Both times the button showed `"Refresh"`/`disabled: false` on reload, meaning the sync had already completed before the reload landed — this repo's real sync (skills-repo, 543 stories, GitHub Contents/Git Blobs API) completes in well under the round-trip time between a trigger and a reload tool call in this environment. Live timing of this scenario was not achievable. Instead, directly verified the underlying code path in `src/web-ui/routes/products.js`: `_renderProductView`'s `refreshLabel`/`refreshDisabledAttr` (line 977–978) are driven by an `isSyncing` parameter computed synchronously at page-render time via `_productRollup.isSyncInProgress(productId)` (line 2498) — and the route's own code comment (line 2639–2642) confirms `triggerProductSync`'s in-flight guard (`_syncsInProgress`) is set synchronously before its first `await`, so `isSyncInProgress()` is guaranteed to already reflect "in progress" for any request — including a page reload — that lands while a sync is genuinely running. This is a code-path confirmation, not a live-observed one; recorded honestly as such rather than claimed as equivalent to the other two scenarios.
   - **Edge case (sync failure leaves page usable):** not attempted live — would require deliberately breaking real GitHub token/repo access against a real product, which was out of scope for this verification pass. Coverage rests on AC3's existing automated test (`handlePostProductSync: background failure is logged via console.error, not swallowed`), which was not re-run here but was already passing in CI at merge time and has not changed since.
   - This closes the deploy-topology-adjacent uncertainty from Observation #1 about whether the *fix itself* behaves correctly under real conditions (it does, on staging) — separately from the still-open question of whether it has reached production, which remains Follow-up action #2.
3. **Guardrails schema violation self-corrected before merge.** The DoR sign-off's guardrails write (H9/H-NFR/H-NFR2/H-NFR3) initially used an invented `{name, notes}` shape instead of the schema's required `{id, category, label, status}` fields, which failed the "Validate traceability chain" CI check with 8 violations after the PR was opened. Fixed in commit `a2212b24` before merge (re-verified 0 violations via a manual Node-based schema check, since `python3` is non-functional in this local Windows environment — same root cause as the known pre-existing `tests/check-p3.5-validate-trace.js` failure). No lasting impact since it was caught and fixed pre-merge, but worth noting for /trace's own audit trail.

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
