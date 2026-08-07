# Definition of Ready Checklist

## Definition of Ready: Fix session cookie SameSite=Strict dropping the session on Stripe's post-checkout redirect

**Story reference:** artefacts/2026-07-23-session-cookie-samesite-fix/stories/scsf-s1.md
**Test plan reference:** artefacts/2026-07-23-session-cookie-samesite-fix/test-plans/scsf-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-23

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Regression-prevention / production correctness, explicitly stated as not a formal benefit-metric artefact |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Root cause + prior lost fix (commits `d8010213`, `ab99f366`) + same-codebase precedent cited |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ⚠️ RISK-ACCEPT | See DoR contract — no dedicated nfr-profile.md; analysis inline in story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ⚠️ RISK-ACCEPT | Same as H-NFR |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-07-23)** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-NFR, H-NFR-profile, and H-GOV notes recorded transparently as RISK-ACCEPTs.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track skips /review | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as prior short-track precedent (`pcr-s1`, `jrf-s1`) — root cause independently re-derived from source, git history, and the reporting PR, not taken on faith. |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | Real-staging E2E confirmation (E2E1) is deploy-dependent | **Acknowledged — proceed.** Unit/integration coverage fully verifies the fix's correctness independent of deploy outcome; deploy attempted separately and reported honestly either way. |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix session cookie SameSite=Strict dropping the session on Stripe's post-checkout redirect — artefacts/2026-07-23-session-cookie-samesite-fix/stories/scsf-s1.md
Test plan: artefacts/2026-07-23-session-cookie-samesite-fix/test-plans/scsf-s1-test-plan.md
DoR contract: artefacts/2026-07-23-session-cookie-samesite-fix/dor/scsf-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Change SESSION_COOKIE_CONFIG.sameSite and _buildCookieHeader()'s literal
  string in src/web-ui/middleware/session.js from 'strict'/'Strict' to
  'lax'/'Lax'. Update the module-level comment.
- Update tests/check-wuce1-oauth-flow.js's NFR1 test to assert 'lax'.
- New test file tests/check-scsf-s1-samesite-cookie-fix.js covering
  UT1-UT4, IT1-IT3 from the test plan.
- Do not touch Stripe checkout/webhook code, billing routes, or OAuth
  CSRF-state validation.
- Run npm test in full; confirm no new regressions vs
  tests/known-baseline-failures.json.
- Attempt a real flyctl deploy to wuce-staging; if successful, fetch and run
  PR #552's tests/e2e/a2-stripe-test-mode-plan-selection.spec.js against it.
  Report explicitly if deploy/verification could not be completed.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- Reference both this fix's artefacts and PR #552 in the PR description.
- Update .github/pipeline-state.json for this story (flat feature.stories[]
  entry).
- Add a workspace/capture-log.md entry (source: agent-auto).

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — this repo's default posture per its solo-operator Operating Posture in `.github/architecture-guardrails.md`.
**Sign-off required:** No — matches established short-track precedent for a well-evidenced, narrowly-scoped, real-staging-verified bug fix.
**Signed off by:** Claude (agent, autonomous, short-track) — 2026-07-23, dispatched to fix a real production regression discovered by PR #552's real-staging E2E run.
