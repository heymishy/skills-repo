# Definition of Done: Provision the wuce-staging Fly app

**PR:** https://github.com/heymishy/skills-repo/pull/442 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.1-fly-staging-app.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.1-fly-staging-app-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.1-fly-staging-app-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | `fly.staging.toml` exists, declares `app = 'wuce-staging'`, distinct from prod's app name | automated test (T1/T2); real `fly deploy` + Fly dashboard confirmation is **External-dependency gap, acknowledged** per DoR contract | See NFR/Coverage gap note below |
| AC2 | ✅ | `[build]`/`[http_service]`/`[[vm]]` sections identical to `fly.toml`; `[env]` key-set diff limited to documented staging-only keys | automated test (T3, T4) | None |
| AC3 | ⚠️ | `auto_stop_machines`/`min_machines_running` present and matching prod (scale-to-zero config proxy) | automated test (NFR3); real Fly billing review ~1 week post-deploy is **External-dependency gap, acknowledged** per DoR contract | See NFR/Coverage gap note below |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. PR #442 touched only `fly.staging.toml` and its new test file.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1/T2 (distinct app builds/starts — static) | ✅ | ✅ | |
| T3/T4 (config parity) | ✅ | ✅ | |
| NFR3 (scale-to-zero config proxy) | ✅ | ✅ | |
| T5 (no hardcoded secret-shaped literals) | ✅ | ✅ | |
| Manual Scenario 1 (real `fly deploy` + dashboard) | ✅ (declared) | N/A — not executed | External-dependency gap, acknowledged (DoR contract) |
| Manual Scenario 3 (real Fly billing review) | ✅ (declared) | N/A — not executed | External-dependency gap, acknowledged (DoR contract) |

**Gaps (tests not implemented):** None — all automated tests exist and pass. The 2 manual scenarios are a **known, DoR-acknowledged gap in execution environment**, not a missing implementation.

**Coverage gap audit (per DoD Step 4):**
- DoR contract quote: "Manual: Scenario 1 — real `fly deploy` + Fly dashboard confirmation (**External-dependency gap, acknowledged**)"; same phrasing for Scenario 3 (billing review). "Contract Review: Checked against the story's 3 ACs and the test plan's AC Coverage table — no mismatch found. Every AC maps to at least one automated test plus an acknowledged manual scenario for the External-dependency portions (live Fly.io build/billing)."
- Were these RISK-ACCEPTed in `/decisions` before coding started? The DoR contract's own "acknowledged" language stands in for a formal RISK-ACCEPT entry, but no explicit `decisions.md` RISK-ACCEPT line names these two specific manual scenarios.
- Was the manual verification scenario actually executed during pre-code sign-off or post-merge smoke test? **No** — no evidence anywhere in this repo (decisions.md, `workspace/state.json` pendingActions, or any log file) that either manual scenario has been run against real Fly.io infrastructure.
- **This is recorded as an open gap, not silently passed over.** See Follow-up actions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Staging app secrets set via `fly secrets set`, never committed | ✅ | T5: no hardcoded secret-shaped literals in `fly.staging.toml` |
| Near-zero idle compute cost | ⚠️ | Config proxy (scale-to-zero settings) confirmed; **real billing evidence does not yet exist** — not yet independently verified against an actual Fly invoice |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — A broken build cannot reach prod | ✅ (0%) | Not yet — this story provides the deploy target only; the actual staging-then-promote gate is bri-s2.6 | This story lays the infrastructure foundation; the metric isn't independently observable from bri-s2.1 alone |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- **Action required, no owner yet assigned:** run the two DoR-acknowledged manual scenarios (real `fly deploy` + Fly dashboard build confirmation; real Fly billing review after ~1 week of deploy cadence) against actual Fly.io infrastructure. Until that happens, AC1 and AC3 remain evidenced only by static config proxies, not live confirmation. This is a real, still-open gap — not a defect in what shipped, but genuinely unverified against production infrastructure.

---

## DoD Observations

1. **This is the first of three Epic-2 stories (bri-s2.1, bri-s2.2, bri-s2.3) carrying the same class of DoR-acknowledged external-dependency gap.** All three should be closed together once real Fly/Neon/Upstash infrastructure is actually exercised — a single operator action covering all three would be more efficient than three separate manual passes. See the feature-level `SUMMARY.md` for the consolidated list.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Provision the wuce-staging Fly app" (bri-s2.1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
