# Definition of Ready: Prove the walking skeleton end-to-end with a real commit (prc-s1.4)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.4.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.4-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s1.4-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## ⚠️ Read this first

This is a manual-verification-only story (no automated tests, by design — see the test plan). H3/H8 pass on the basis of manual scenario coverage, matching the AC Coverage table's "Manual" column, consistent with this template's own supported coverage types.

---

## Contract review

✅ **Contract review passed** — no code is built, so no mismatch is possible between implementation and ACs; the manual verification approach matches the story's own stated nature.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | "As a web UI operator running the outer loop..." |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has a test | ✅ | 3 manual scenarios, 1 per AC (Gap type: External-dependency, by design) |
| H4 | Out-of-scope populated | ✅ | Automating as CI (deferred to prc-s4.3) |
| H5 | Benefit linkage names a metric | ✅ | Metric 1 |
| H6 | Complexity rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 1 MEDIUM (1-M1, environment ambiguity) |
| H8 | No uncovered ACs | ✅ | All 3 have manual scenarios, explicitly acknowledged as External-dependency gap type, not silent |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s1.1, prc-s1.2, prc-s1.3 |
| H9 | Architecture Constraints populated | ✅ | "None identified beyond what prc-s1.1-1.3 already established" — correctly explicit, not blank |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | No adapter — this story writes no code |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1 | NFRs identified | ✅ | N/A |
| W2 | Scope stability declared | ✅ | N/A |
| W3 | MEDIUM findings acknowledged | ⚠️→✅ | `decisions.md`, "RISK-ACCEPT | /definition-of-ready — W3... 3 stories," 2026-07-14 |
| W4 | Verification script reviewed | ⚠️→✅ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |
| W5 | No unaddressed UNCERTAIN gaps | ✅ | Gap explicitly typed and reasoned, not left uncertain |

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
Story: Prove the walking skeleton end-to-end with a real commit — artefacts/2026-07-14-product-repo-config/stories/prc-s1.4.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.4-test-plan.md

Goal:
This is a manual verification story, not a code-writing story. Follow the
AC verification script exactly: connect a real disposable test product to a
real GitHub repo, perform a real sign-off through the actual web UI, and
confirm the commit's content and authorship match exactly.

Constraints:
- Do not mock or simulate any part of this -- the whole point is proving
  the real mechanism works, not a synthetic proxy for it.
- Choose a genuinely disposable test repo/product; note the cleanup step
  taken afterward.
- Record the result (commit SHA, date) in
  artefacts/2026-07-14-product-repo-config/benefit-metric.md's coverage
  matrix for Metric 1 -- this is this story's actual deliverable.
- Depends on prc-s1.1, prc-s1.2, prc-s1.3 being signed-off/merged first
  (schemaDepends: dorStatus).
- No draft PR needed for this story unless the benefit-metric.md update
  itself needs one per this repo's bookkeeping conventions (it does not --
  artefact-only changes push directly).

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off required for Medium
**Signed off by:** Hamish King (Founder/Operator), 2026-07-14
