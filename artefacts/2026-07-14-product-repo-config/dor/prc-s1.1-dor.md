# Definition of Ready: Add repo association columns to the products table (prc-s1.1)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.1.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.1-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s1.1-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 3 ACs. No CSS-layout-dependent, no UI surface, no mismatch between the contract's stated test approach and the test plan's actual coverage.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As/Want/So format with a named persona | ✅ | "As a tenant admin configuring a new product..." |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 3 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | 3 integration tests, 1 per AC |
| H4 | Out-of-scope section is populated | ✅ | Populating columns, UI — both correctly deferred |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 2 |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | All 3 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" (upstream) — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025 cited, Category E score 5/5 in review |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs — N/A |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs (as "None identified" — populated, not blank); profile exists |
| H-GOV | Governance approval check | ✅ | Discovery `## Approved By`: "Hamish King — Founder/Operator — 2026-07-14" — non-blank, present |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | No new injectable adapter introduced by this story |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | N/A — populated |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ | — | N/A — 0 MEDIUM findings, nothing to acknowledge |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Accepted — see `decisions.md`, "RISK-ACCEPT | /definition-of-ready — W4... all 14 stories," 2026-07-14 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | N/A — no gaps |

---

## Oversight level

**Medium** (per `epic-1-walking-skeleton.md`) — "touches the write-back mechanism governed by ADR-020... first time per-product repo resolution exists." Tech lead awareness required (solo-operator context: the operator is their own awareness confirmation).

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY — all hard blocks pass, all warnings resolved or explicitly acknowledged.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add repo association columns to the products table — artefacts/2026-07-14-product-repo-config/stories/prc-s1.1.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Follow this repo's existing idempotent-migration convention exactly
  (ALTER TABLE ... ADD COLUMN IF NOT EXISTS), matching the pattern already
  used for credits/stripe_events/user_roles tables in server.js.
- Do not populate the new columns in this story — that is prc-s1.2's scope.
- No UI work — this story has no user-facing surface.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing, in particular ADR-025 (application-layer tenant scoping).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off required for Medium — tech lead awareness only
**Signed off by:** Hamish King (Founder/Operator), 2026-07-14
