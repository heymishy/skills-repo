## Definition of Ready: Provision an Upstash staging instance for Redis

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.3-upstash-staging-instance.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.3-upstash-staging-instance-test-plan.md
**Contract reference:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.3-upstash-staging-instance-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator)..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | AC1–AC3 |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: T1/T2 + Scenario 1; AC2: T3 + Scenario 2; AC3: Scenario 3 (manual-only, acknowledged) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Persistence/backup and shared-instance excluded |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 (see W3 note) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 (2026-07-09): 0 HIGH, 1 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 3 ACs covered; AC3's live-usage check is a fully-manual External-dependency gap, explicitly acknowledged (🔴-flagged) in the test plan rather than silently dropped |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (no Fly-managed Redis, decisions.md free-tier validation); review Category E clean |
| H-E2E | CSS-layout-dependent AC gap check | ✅ (N/A) | Infrastructure story |

**Hard block result: PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review Run 1 finding 1-M1 — Benefit Linkage is dependency-flavoured ("Completes the data-layer isolation started in S2.2") — same recurring pattern as bri-s2.1/bri-s2.2. Low risk per review, not yet logged in `decisions.md`. | Not yet |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not reviewed by a domain expert — standing W4 solo-operator posture applies | Hamish King (standing W4 RISK-ACCEPT posture) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ⚠️ | AC3 (monthly usage ceiling) is flagged 🔴 — the highest risk rating across all 6 Epic 2 stories, with "no automatable substitute at all." It IS handled (scheduled manual dashboard check + recurring reminder if usage trends near the ceiling), so this is an acknowledged gap rather than a silently-dropped one — but the elevated risk rating and the real cost/availability exposure if missed warrant flagging here rather than treating it as routine. Recommend Hamish set an explicit calendar reminder for the week-1 dashboard check. | Flagged for operator follow-through, not a decisions.md RISK-ACCEPT requirement |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Provision an Upstash staging instance for Redis — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.3-upstash-staging-instance.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.3-upstash-staging-instance-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Do not introduce a hardcoded Upstash REST URL/token anywhere in tracked source — both must derive exclusively from process.env.UPSTASH_REDIS_REST_URL/TOKEN
- Do not change the existing lazy-singleton client pattern in a way that could cache a client built under one credential config and reuse it after env vars change
- No Upstash credential committed to any tracked file
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness (per epic rationale)
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed 2026-07-10

**Overall determination: READY**

**Operator follow-up note:** Schedule a manual Upstash usage-dashboard check ~1 week after CI first starts running against `wuce-staging`, per AC3/W5 above.
