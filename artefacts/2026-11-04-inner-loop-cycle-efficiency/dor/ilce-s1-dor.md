# Definition of Ready: Add structured per-skill timing writes to pipeline-timings.jsonl

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s1-timing-writes.md
**Test plan reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s1-test-plan.md
**Contract proposal:** artefacts/2026-11-04-inner-loop-cycle-efficiency/dor/ilce-s1-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-11-04

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs (AC1 revised during this DoR run to add `fullSuite`; test plan updated to match — see `decisions.md` SCOPE entry 2026-11-04).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator running the inner loop |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 9 tests covering 4 ACs |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Meta Metric 1 |
| H6 | Complexity is rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH, Run 1 |
| H8 | Test plan has no uncovered ACs | ✅ | None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: "None" — no upstream dependency declared, schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites `decisions.md` ARCH entry + platform change policy |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-04-inner-loop-cycle-efficiency/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence (story declares real NFRs) | ✅ | Profile exists |
| H-GOV | Discovery `Approved By` has ≥1 non-blank, non-purely-engineering entry | ✅ | "Hamish King — Product/Engineering" — judgment call: not a purely-engineering title (e.g. not "Lead Engineer"/"Tech Lead"/"Developer"); confirmed, not overridden |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | No `setX()` adapters introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No MEDIUM findings (only 1 LOW) | — |
| W4 | Verification script reviewed by a domain expert | ✅ | — | Reviewed by Hamish King, 2026-11-04 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | Gap table: "None" |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add structured per-skill timing writes to pipeline-timings.jsonl — artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s1-timing-writes.md
Test plan: artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only (require(), no ES modules, no TypeScript) — per product/tech-stack.md runtime constraints
- Do not modify what any of the 5 skills' own core logic does beyond adding the one new timing-write step
- Do not build a rollup/query script — out of scope for this story
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- The new log file (`.github/pipeline-timings.jsonl`) must never contain secrets, tokens, or session content — only skill/story/stage/timestamp metadata
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness (no formal sign-off) — solo repo, same person as approver; acknowledged per the already-logged self-review risk
**Signed off by:** Hamish King, 2026-11-04
