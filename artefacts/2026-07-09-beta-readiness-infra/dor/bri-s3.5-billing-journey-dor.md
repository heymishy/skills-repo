# Definition of Ready: Billing journey spec (bri-s3.5)

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.5-billing-journey.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.5-billing-journey-test-plan.md
**Verification script reference:** artefacts/2026-07-09-beta-readiness-infra/verification-scripts/bri-s3.5-billing-journey-verification.md
**Review artefact:** artefacts/2026-07-09-beta-readiness-infra/review/bri-s3.5-review-1.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.5-billing-journey-dor-contract.md
**Assessed by:** Copilot (agent)
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a first beta customer, I want... So that..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (AC1–AC5) |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1 integration+E2E; AC2 unit+E2E; AC3–AC4 integration+E2E; AC5 E2E |
| H4 | Out-of-scope section is populated | ✅ | Real Stripe webhook (`@live`) testing and per-seat billing named explicitly |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 4 — Risk-critical journeys have deterministic E2E coverage |
| H6 | Complexity is rated | ✅ | Rating 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1, 2026-07-09 — PASS, 0 HIGH findings (confirmed, not re-checked this run) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` declared for bri-s3.1; field confirmed present in schema (see dor-contract) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-018 cited, plus Stripe test-mode / mocked-webhook constraints; no Category E HIGH findings from review |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT blocks sign-off | ✅ | No CSS-layout-dependent AC gap type. E2E tooling confirmed configured repo-wide (Playwright, `tests/e2e/`, ADR-018) — passes cleanly. |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists, lists this story under Security (no real Stripe secret/webhook signing secret) |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; nfr-profile.md exists |
| H-GOV | Governance approval check | ✅ | Confirmed PASSED — not re-checked this run |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | No new injectable adapter introduced by this story |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set — skipped |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set — skipped |

**All hard blocks pass. No blockers.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | N/A — populated |
| W2 | Scope stability is declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings reported for this story's review pass (Run 1). | N/A |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script has not been reviewed by a domain expert. Given this story's own framing ("a billing bug... directly costs the business money and trust... the same way the recent GitHub-OAuth-first-login and plan-limit bugs did"), an unreviewed script carries real risk of missing an edge case in the exact area with the worst recent track record. | Not yet done — outstanding for all 6 Epic 3 stories. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan: "Gap: None identified." | N/A |

**Outstanding warnings requiring action:** W4 (verification script domain-expert review — recommend prioritising given this story's stated bug history).

---

## Oversight level

**Medium** (per `epic-3-test-suite.md`). Share this DoR artefact with the tech lead before assigning. No formal sign-off required.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY

All hard blocks pass. One warning (W4) is outstanding — recommend resolving given this story's own framing around recent billing bugs, though it does not formally block sign-off.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Billing journey spec — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.5-billing-journey.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.5-billing-journey-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Playwright spec under tests/e2e/, devDependency only, per ADR-018.
- Stripe test mode ONLY — never a live/real Stripe secret key or webhook signing secret in this @mocked/@billing variant. Verify configured key prefixes are test-mode (sk_test_...) before considering AC5 satisfied.
- Webhook events must be mocked/synthetic payloads (checkout.session.completed, payment-failure, cancellation) — do not wire this spec to any real Stripe webhook delivery.
- The usage-gate function's blocked-action error must remain human-readable, consistent with the existing plan-limit fix (f87bd515) — do not regress to a raw error code.
- Real Stripe webhook delivery testing (@live) and per-seat/usage-based billing are explicitly out of scope — do not build them here.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not violate ADR-018. If the file does not exist, note this in a PR comment.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (share DoR artefact with tech lead before assigning)
