# Definition of Done: Keep production's single machine always running instead of scaling to zero

**PR:** https://github.com/heymishy/skills-repo/pull/885 | **Merged:** 2026-09-14T18:41:03Z
**Merge commit:** 2fac9c19c027e46e4a40c40b5ebe451f6a2ca00f
**Story:** artefacts/2026-09-14-production-always-on/stories/pao-s1-min-machines-running-one.md
**Test plan:** artefacts/2026-09-14-production-always-on/test-plans/pao-s1-test-plan.md
**DoR:** artefacts/2026-09-14-production-always-on/dor/pao-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `fly.toml` `http_service.min_machines_running` is `1` (was `0`) — confirmed via `git diff` at commit time and re-confirmed reading merged `fly.toml` on master | Static diff check | None |
| AC2 | ✅ | Diff touches exactly one line; `auto_stop_machines`, `auto_start_machines`, `sticky_sessions`, `[http_service.concurrency]`, `[[vm]]` all unchanged | Static diff check + `tests/check-bri-s2.1-fly-staging-app.js` regression (confirms every other `[http_service]` key still matches `fly.staging.toml` exactly) | None |
| AC3 | ⚠️ Pending | Not yet verifiable — requires production deploy, which is a separate manual "Promote to production" step not yet taken | Manual, post-deploy (per DoR H3) | RISK-ACCEPT: expected and by design (see story's own AC3 framing) — tracked as DoD Observation 1 below, not silently treated as satisfied |
| AC4 | ⚠️ Pending | Not yet verifiable — requires production deploy | Manual, post-deploy (per DoR H3) | RISK-ACCEPT: expected and by design (see story's own AC4 framing) — tracked as DoD Observation 1 below, not silently treated as satisfied |

**2 of 4 ACs satisfied at merge time; the remaining 2 are explicitly manual, post-deploy verifications by design** (see story AC3/AC4 framing and DoR H3) — not a gap introduced by this DoD, but the normal shape of a short-track infra story where "PR merged" (this DoD's own entry condition) precedes "deployed to production" (a separate gate).

---

## Scope Deviations

**Unplanned but necessary:** two CI gate failures surfaced when the PR was opened, neither anticipated by the original story/DoR: `tests/check-bri-s2.1-fly-staging-app.js` asserted exact `fly.toml`/`fly.staging.toml` parity (broken by this story's own intentional `min_machines_running` divergence), and the traceability chain's `test_plan_coverage` check required a test-plan artefact this story's DoR had marked N/A without creating one. Both fixed correctly (test updated to allowlist the documented divergence; `pao-s1-test-plan.md` retrofitted) rather than worked around — see `decisions.md`'s second entry. No scope change to the story's own ACs.

---

## Test Plan Coverage

**Tests passing:** `tests/check-bri-s2.1-fly-staging-app.js` — 8/8, re-run fresh 2026-09-15 against merged master (commit `2fac9c19`).

**Regression coverage:** Full suite re-run fresh on master post-merge (both `pao-s1` and `ltd-s1`): 660 files, 1 failure (`tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake), 0 new regressions.

**Gaps:** None against AC1/AC2. AC3/AC4 have no automated coverage by design (pure infra/manual verification, per DoR H3/H8).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Expected improvement (eliminates cold-resume latency) — not independently measured, consistent with story's own NFR framing |
| Cost | ✅ | Operator-approved based on real Fly Cost Explorer data reviewed in-session; actual impact to be confirmed by the operator after a full billing cycle (not blocking) |
| Availability | ⏳ | Directly targets the confirmed failure mode; final confirmation is AC3/AC4 (pending post-deploy) |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature. Directly resolves the deferred 2026-08-31 capture-log entry and the third confirmed occurrence of the Fly auto-suspend disconnect risk class this session.

---

## Outcome

**COMPLETE (merge-time scope)** — AC1/AC2 fully verified; AC3/AC4 explicitly deferred to post-deploy per the story's own design, tracked below as follow-up actions, not treated as silently satisfied.

---

## DoD Observations

1. **Follow-up Action — promote to production, then complete AC3/AC4.** This change takes effect only after the separate "Promote to production" approval step. Once deployed: (a) run `fly status --app skills-framework` after an idle period and confirm the machine shows `started`, not `suspended`; (b) run a long skill turn (e.g. a test-plan continue-chain) end-to-end and confirm no `sse_client_disconnect` appears in production logs for that session.
2. **Follow-up Action — resolve `2026-08-31` capture-log entry.** Per this story's own Architecture Constraints, the `workspace/capture-log.md` 2026-08-31 deferred-decision entry should be marked resolved by this story now that it's merged.
3. This story's CI-fix commit (`f46b259d` → squashed/merged as part of `2fac9c19`) also closes a real governance gap independent of this story: `tests/check-bri-s2.1-fly-staging-app.js` now correctly allowlists intentional prod/staging divergence instead of requiring blind parity forever.
