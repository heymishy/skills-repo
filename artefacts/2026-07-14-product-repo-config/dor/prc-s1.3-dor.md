# Definition of Ready: Resolve sign-off write-back to the product's own repo (prc-s1.3)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.3.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.3-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s1.3-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Contract review

✅ **Contract review passed** — aligns with all 4 ACs. No new D37 adapter introduced (modifies an existing, already-wired `commitSignOff`'s parameters — grepped story for "D37"/"setX"/"injectable adapter", no match, matches the systematic check done for `prc-s1.2`).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | "As a web UI operator running the outer loop..." |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | 4 integration tests |
| H4 | Out-of-scope populated | ✅ | Annotation, journey.js writes deferred |
| H5 | Benefit linkage names a metric | ✅ | Metric 1 + Metric 3 |
| H6 | Complexity rated | ✅ | Rating 2, Unstable |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0/0/0 |
| H8 | No uncovered ACs | ✅ | All 4 covered |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s1.1, prc-s1.2 signing off first. Field valid in schema. |
| H9 | Architecture Constraints populated, no Category E HIGH | ✅ | ADR-020 cited; Category E 5/5 |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A — no such ACs |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | Discovery Approved By populated |
| H-ADAPTER | D37 wiring check | N/A | No new adapter — modifies existing `commitSignOff` parameters |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1 | NFRs identified | ✅ | N/A |
| W2 | Scope stability declared | ✅ | N/A |
| W3 | MEDIUM findings acknowledged | ✅ | N/A — 0 MEDIUM |
| W4 | Verification script reviewed | ⚠️ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |
| W5 | No unaddressed UNCERTAIN gaps | ✅ | N/A |

---

## Oversight level

**Medium** (per `epic-1-walking-skeleton.md`).

---

## Standards injection

No `domain` field — skipped.

---

## READY / BLOCKED determination

## ✅ READY

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Resolve sign-off write-back to the product's own repo — artefacts/2026-07-14-product-repo-config/stories/prc-s1.3.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Modify commitSignOff's signature to accept owner/repo as parameters --
  do not introduce a second, parallel write-back function.
- Fail closed: a product with no repo configured must reject the sign-off
  before any Contents API call, never fall back to a global env var.
- Commit author/committer identity logic (GET /user) is unchanged -- only
  the target owner/repo resolution changes.
- Depends on prc-s1.1 and prc-s1.2 being signed-off/merged first
  (schemaDepends: dorStatus).
- Architecture standards: read .github/architecture-guardrails.md (ADR-020).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off required for Medium
**Signed off by:** Hamish King (Founder/Operator), 2026-07-14
