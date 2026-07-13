# Definition of Done: Provision an Upstash staging instance for Redis

**PR:** https://github.com/heymishy/skills-repo/pull/448 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.3-upstash-staging-instance.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.3-upstash-staging-instance-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.3-upstash-staging-instance-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | `session-redis.js`/`skill-session-redis.js` build clients solely from `process.env.UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, no hardcoded fallback | automated test (T1); live secrets confirmation is manual-only, DoR-acknowledged | None on the automated portion |
| AC2 | ⚠️ | Module-reload test proves no client-config bleed-through between staging/prod credentials | automated test (T3); live cross-instance write/inspect check is manual-only, DoR-acknowledged | None on the automated portion |
| AC3 | ❌ (structurally, not a failure) | No automatable substitute exists for a real monthly-usage-ceiling check | **Manual only** — DoR contract flags this 🔴 highest-risk item explicitly | Genuinely unverified — see Follow-up actions |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. PR #448 touched only its declared touchpoints (Redis client wiring + new test file).

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 (distinct staging credentials, no hardcoded fallback) | ✅ | ✅ | |
| T3 (module-reload, no client-config bleed-through) | ✅ | ✅ | |
| Remaining unit tests | ✅ | ✅ | |
| Manual Scenario 1 (live secrets confirmation) | ✅ (declared) | N/A — not executed | External-dependency gap, acknowledged |
| Manual Scenario 2 (live cross-instance write/inspect) | ✅ (declared) | N/A — not executed | External-dependency gap, acknowledged |
| Manual Scenario 3 (Upstash dashboard usage review after ~1 week) | ✅ (declared) | N/A — not executed | **External-dependency gap, 🔴 highest risk — no automatable substitute exists at all**, per the DoR contract's own explicit flag |

**Gaps (tests not implemented):** None — all automated tests exist and pass.

**Coverage gap audit (per DoD Step 4):**
- DoR contract quote: "AC3 ... **Manual only**: Scenario 3 — Upstash dashboard usage review after ~1 week of CI cadence (**External-dependency gap, 🔴 highest risk — no automatable substitute**, flagged for a scheduled dashboard check)."
- Was this RISK-ACCEPTed in `/decisions` before coding started? The DoR contract's own flagging stands in for a formal RISK-ACCEPT, but no dedicated `decisions.md` entry names AC3 specifically.
- Was the manual verification scenario actually executed? **No** — no evidence anywhere in the repo (`workspace/state.json` pendingActions, decisions.md, any log file) that this dashboard review has ever been scheduled or performed.
- **This is the single highest unresolved risk across all of Epic 2** — genuinely open, not merely acknowledged-and-closed. Recorded plainly here, not papered over.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Staging Upstash credentials set via Fly secrets, never committed | ✅ | T1 confirms no hardcoded fallback |
| Usage stays within 500K commands/month free tier | ❌ (unverified) | No automatable substitute exists; no real usage data has been reviewed |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — A broken build cannot reach prod | ✅ (0%) | Not yet — this story provides data-layer isolation only | |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- **Action required, no owner yet assigned, highest-risk item in Epic 2:** schedule and run the Upstash dashboard usage review after roughly a week of normal CI cadence, per the DoR contract's own explicit flag that this is the one AC in this story with no automatable substitute at all. Also cover this story's other two manual scenarios (live secrets confirmation, live cross-instance write/inspect check) in the same pass — same open-action class as bri-s2.1 and bri-s2.2.

---

## DoD Observations

1. **This is the only story across all 16 in this DoD sweep where the DoR contract itself explicitly marks an AC "🔴 highest risk" with no automated substitute possible even in principle** (not just "not yet executed" like the other External-dependency gaps). Worth flagging to the operator as the single most time-sensitive follow-up in this entire batch — Upstash's free-tier ceiling is a hard cutoff, not a soft budget, and running past it without ever having checked would be a real production risk for the staging environment's continued availability.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Provision an Upstash staging instance for Redis" (bri-s2.3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is AC3's "no automatable substitute" claim genuinely true, or is there a check that was missed?
Report findings as HIGH / MEDIUM / LOW.
```
