## Definition of Ready: Provision the wuce-staging Fly app

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.1-fly-staging-app.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.1-fly-staging-app-test-plan.md
**Contract reference:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.1-fly-staging-app-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator), I want..., So that..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | AC1–AC3, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: T1/T2 + Scenario 1; AC2: T3/T4 + Scenario 2; AC3: NFR3 config proxy + Scenario 3 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Custom domain/DNS, multi-region excluded |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 — A broken build cannot reach prod (see W3 note on phrasing quality) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 (2026-07-09): 0 HIGH, 1 MEDIUM, 2 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 3 ACs covered; the two External-dependency gaps (live Fly build, live billing) are explicitly acknowledged in the test plan's Coverage gaps table with manual-scenario handling |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (no Fly-managed Postgres/Redis; near-zero cost constraint); review Category E clean |
| H-E2E | CSS-layout-dependent AC gap check | ✅ (N/A) | Infrastructure story, no UI/CSS surface |

**Hard block result: PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review Run 1 finding 1-M1 (Benefit Linkage reads as dependency-flavoured — "this story is the foundational infrastructure the rest of the epic builds on" — rather than a direct metric-movement statement) is NOT yet logged as a RISK-ACCEPT or resolved in `decisions.md`. Low risk per the review's own assessment; the metric linkage is directionally correct. | Not yet — recommend a one-line RISK-ACCEPT entry or wording tightening before/at PR time |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed by a domain expert for any of the 6 Epic 2 stories (solo-operator context — W4 is the standing accepted posture per `.github/architecture-guardrails.md` Operating Posture section) | Hamish King (standing W4 RISK-ACCEPT posture, solo operator) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | The two Coverage gaps (live Fly build success, live billing) are External-dependency gaps with explicit manual-scenario handling — acknowledged and handled, not open-uncertain | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Provision the wuce-staging Fly app — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.1-fly-staging-app.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.1-fly-staging-app-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Create `fly.staging.toml` at repo root, reusing the same Dockerfile as `fly.toml`
- `[build]`, `[http_service]` (incl. scale-to-zero settings), and `[[vm]]` sections must match `fly.toml` exactly
- Only `app` name and, if genuinely needed, a documented staging-only `[env]` key may differ
- No secrets/connection strings committed to `fly.staging.toml` (T5 is a regression guard on this)
- Do not modify `fly.toml` (prod) as part of this story
- Do not run a real `fly deploy` as part of the automated test suite — that is a manual verification step
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness (per epic's Medium oversight rationale — misconfigured promote-adjacent infrastructure risk)
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed 2026-07-10

**Overall determination: READY**
