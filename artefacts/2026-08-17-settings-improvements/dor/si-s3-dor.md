## Definition of Ready: Confirm the Stripe billing portal satisfies the "manage my plan" ask

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s3-confirm-billing-portal-sufficient.md
**Test plan reference:** artefacts/2026-08-17-settings-improvements/test-plans/si-s3-test-plan.md
**Contract proposal:** artefacts/2026-08-17-settings-improvements/dor/si-s3-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-17

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "wuce account owner/admin" |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | 1 automated + 2 manual scenarios + 1 procedural |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | "Original beta-reported friction resolved" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | 2 gaps (AC2/AC3), both explicitly acknowledged — AC3's fixture question now resolved |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies name external stories (bpe-s1/bse-s1) but no schema field dependency — `schemaDepends: []` declared |
| H9 | Architecture Constraints populated, no Cat. E HIGH | ✅ | "None new — verifies existing merged code"; review Cat. E score 4, 0 HIGH |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | Gap type is External-dependency, not CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-17-settings-improvements/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By populated | ✅ | M1 signal recorded, not blocking |
| H-ADAPTER | New adapter wiring | ✅ N/A | No new code, no new adapter |

**All hard blocks PASS.**

**PROCEED-BLOCKED condition (from review 1-M1) — RESOLVED:** Operator confirmed a staging account with a configured Stripe test-mode customer ID exists (2026-08-17). Account identity intentionally not recorded in this artefact — obtain from operator at verification time.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | Review Run 1's 1-M1 (fixture gate) — resolved above, RISK-ACCEPT logged in `decisions.md` | Hamish King |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss a live-check nuance | Acknowledged — RISK-ACCEPT logged in `decisions.md`, consistent with si-s1/si-s2 |
| W5 | No UNCERTAIN gap-table items | ✅ | Both gaps have explicit handling decisions | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Confirm the Stripe billing portal satisfies the "manage my plan" ask — artefacts/2026-08-17-settings-improvements/stories/si-s3-confirm-billing-portal-sufficient.md
Test plan: artefacts/2026-08-17-settings-improvements/test-plans/si-s3-test-plan.md

Goal:
This is a VERIFICATION-ONLY story — no source code changes are expected.
Do not write new application code unless AC2 or AC3 reveals a genuine
regression or gap; if so, stop and log it as a new artefacts/feedback/
entry per AC4 rather than fixing inline.

Steps:
1. Re-run tests/check-bpe-s1-billing-portal-error-handling.js and
   tests/check-bse-s1-billing-settings-error-banner.js unmodified.
   Confirm all previously-passing assertions still pass (AC1).
2. Obtain the two staging account identities (one with no Stripe customer
   ID, one with a configured Stripe test-mode customer ID) from the
   operator directly — these are intentionally not recorded in any
   committed artefact.
3. Perform the two live scenarios in
   artefacts/2026-08-17-settings-improvements/verification-scripts/si-s3-verification.md
   against wuce-staging.fly.dev (AC2, AC3).
4. Record the outcome (portal sufficient vs. genuine gap found) in this
   story's DoD per AC4. If a gap is found, log it as a new
   artefacts/feedback/ entry, not a silent scope expansion of this story.

Constraints:
- No source file changes expected. If AC1's regression re-run fails,
  stop and report — do not silently patch the sibling stories' tests.
- Architecture standards: read .github/architecture-guardrails.md before
  any code change, if one becomes necessary.
- Open a draft PR only if AC4 requires a code fix; otherwise this story's
  "PR" may be the DoD artefact commit itself (state/artefact-only change,
  no standalone review cycle required per CLAUDE.md's state-and-artefact
  policy).
- If you encounter an ambiguity not covered by the ACs: add a note in the
  DoD rather than guessing.

Applicable standards (payments):
- No logging of full PANs, CVVs, or expiry dates
- No storing CVVs under any circumstances
- No client-side payment logic that bypasses the gateway
- (Most of payments-standards.md is unfilled placeholder text for this
  repo — only the "Prohibited patterns" bullets above are real, filled
  content; not directly triggered by this story since no payment code
  is touched, included for awareness given the domain tag)

Applicable standards (web-ui):
- If any code change does become necessary: every HTML route view MUST
  import renderShell()/escHtml() from src/web-ui/utils/html-shell.js —
  never duplicate or reimplement either function

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
