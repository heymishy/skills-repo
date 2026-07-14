# Definition of Ready: Resolve journey.js's local artefact writes to the product's own repo (prc-s2.4)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.4.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.4-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s2.4-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Contract review

✅ **Contract review passed** — AC4's adopted interpretation is explicit in both the contract and the RISK-ACCEPT, not silently assumed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | 4 integration tests |
| H4 | Out-of-scope populated | ✅ | Read-side rework, in-flight session migration |
| H5 | Benefit linkage names a metric | ✅ | Metric 1 |
| H6 | Complexity rated | ✅ | Rating 3, Unstable — most call sites of any story in the feature |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 1 MEDIUM (1-M1, commit granularity) |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s1.1, prc-s1.2/prc-s2.1, prc-s2.2 |
| H9 | Architecture Constraints populated | ✅ | ADR-020 cited, explicitly names `repo-root.js`'s superseded mechanism; Category E 5/5 |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | No new injectable adapter — reuses `prc-s2.2`'s Contents/Git Data API mechanism |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1, W2, W5 | Pass cleanly | ✅ | N/A |
| W3 | MEDIUM findings acknowledged | ⚠️→✅ | `decisions.md`, W3 RISK-ACCEPT (3 stories), 2026-07-14 |
| W4 | Verification script reviewed | ⚠️→✅ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |

---

## Oversight level

**Medium** (per `epic-2-full-config-and-bootstrap.md`).

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
Story: Resolve journey.js's local artefact writes to the product's own repo — artefacts/2026-07-14-product-repo-config/stories/prc-s2.4.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Convert journey.js's fs.writeFileSync artefact-write call sites to the
  Contents/Git Data API, reusing prc-s2.2's mechanism -- do not build a
  third, separate write path.
- The Postgres backup write (journey-store-pg.js's saveArtefact) is
  UNCHANGED -- keep it running alongside the new git write, do not replace it.
- Fail closed: reject session initiation entirely (before any state is
  created) if the product has no repo configured.
- Commit granularity: one commit per named artefact file (e.g. discovery.md,
  a story file) -- not per autosave, not batched per session. This
  interpretation was RISK-ACCEPTed at DoR; if implementation reveals it
  doesn't hold up, flag in a PR comment rather than silently picking a
  different granularity.
- Depends on prc-s1.1, prc-s1.2/prc-s2.1, and prc-s2.2 being signed-off/
  merged first (schemaDepends: dorStatus).
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
