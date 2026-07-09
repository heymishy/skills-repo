# Definition of Ready: Auth journey spec (bri-s3.6)

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.6-auth-journey.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.6-auth-journey-test-plan.md
**Verification script reference:** artefacts/2026-07-09-beta-readiness-infra/verification-scripts/bri-s3.6-auth-journey-verification.md
**Review artefact:** artefacts/2026-07-09-beta-readiness-infra/review/bri-s3.6-review-2.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.6-auth-journey-dor-contract.md
**Assessed by:** Copilot (agent)
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a first beta customer, I want... So that..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (AC1–AC5) |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC2 integration+E2E; AC3 E2E; AC4 unit+integration+E2E; AC5 integration+E2E |
| H4 | Out-of-scope section is populated | ✅ | `TENANT_ORG_ALLOWLIST` path and admin-bypass dedicated assertion named explicitly |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 4 — Risk-critical journeys have deterministic E2E coverage |
| H6 | Complexity is rated | ✅ | Rating 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2, 2026-07-09 — PASS, 0 HIGH, 0 MEDIUM, 0 LOW findings (confirmed, not re-checked this run) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` declared for bri-s3.1; field confirmed present in schema (see dor-contract) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-018 cited; the "Correction from original brief" note correctly distinguishes this feature's ARCH-002 (Path C, no Better Auth) from the unrelated global ADR-002, and this story's session-security constraint IDs from the unrelated global MC-SEC-01/02 — both distinctions explicitly drawn to avoid ID-space conflation; no Category E HIGH findings from review |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT blocks sign-off | ✅ | No CSS-layout-dependent AC gap type. E2E tooling confirmed configured repo-wide (Playwright, `tests/e2e/`, ADR-018) — passes cleanly. |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists, lists this story under Security (Authentication, Audit — accessToken/rotateSessionId constraints) |
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
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | Run 1 had one MEDIUM finding (an ADR-002 citation collision with the unrelated global ADR-002); Run 2 (the current review) resolved it by relabelling the citation as `landing-auth-billing/decisions.md`'s ARCH-002 with an explicit disambiguation note. 0 MEDIUM findings remain as of Run 2 — nothing outstanding to acknowledge. | N/A — resolved, not merely acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script has not been reviewed by a domain expert. Given this story exists specifically to catch a repeat of the `f845caf7` regression class, an unreviewed script risks missing a subtly different variant of that same bug (e.g. a redirect edge case not covered by Scenario 1/2's binary first-time/returning framing). | Not yet done — outstanding for all 6 Epic 3 stories. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan: "Gap: None identified." | N/A |

**Outstanding warnings requiring action:** W4 (verification script domain-expert review — recommend prioritising given this story's direct regression-prevention purpose).

---

## Oversight level

**Medium** (per `epic-3-test-suite.md`). Share this DoR artefact with the tech lead before assigning. No formal sign-off required.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY

All hard blocks pass. One warning (W4) is outstanding — recommend resolving given this story's direct link to a recent production regression, though it does not formally block sign-off.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Auth journey spec — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.6-auth-journey.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.6-auth-journey-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Playwright spec under tests/e2e/, devDependency only, per ADR-018.
- This repo does NOT use Better Auth — the actual stack is Path C (roll-your-own OAuth via fetch(), staying CJS), per landing-auth-billing/decisions.md ARCH-002. Do not introduce Better Auth or assume its ESM/CJS behaviour.
- rotateSessionId MUST be called after every provider login (GitHub, Google, email/password) — assert this structurally, do not merely trust it.
- accessToken must never appear in the HTML response body or captured logs, for any provider — this is a hard structural check (AC4), not a trust-based assumption.
- The GitHub org allowlist (TENANT_ORG_ALLOWLIST) path and a dedicated admin-bypass assertion are explicitly out of scope — do not build them; the admin-bypass path is already covered by check-arl-s4-admin-billing-bypass.js.
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
