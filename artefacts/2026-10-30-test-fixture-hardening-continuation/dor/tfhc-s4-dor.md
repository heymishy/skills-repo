## Definition of Ready: Classify the 5 journey-related E2E seed endpoints as redundant or legitimate

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s4-journey-seed-endpoint-classification.md
**Test plan reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s4-journey-seed-endpoint-classification-test-plan.md
**Review artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/review/tfhc-s4-review-1.md
**Contract Proposal:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s4-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-30

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. The contract explicitly separates what is automatable (artefact completeness/cross-reference) from what requires human domain judgment (the classification's substantive correctness), matching this story's own read-only investigation shape.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "platform maintainer who owns the long-term health of this repo's test infrastructure" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 4 ACs covered |
| H4 | Out-of-scope section populated | ✅ | Names 2 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "Journey-seed-endpoint classification completeness (m4)" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None (the one open item — verdict correctness — is explicitly a human-review gap, documented in the test plan's own Test Gaps and Risks table, not a silent omission) |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies block states "None" — no upstream story referenced |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | "None identified — read-only investigation, no implementation" |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-30-test-fixture-hardening-continuation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform Owner — 2026-10-30 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No `setX()` adapter introduced |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ N/A | All three track flags absent |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | — (0 MEDIUM) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases before coding begins | **RISK-ACCEPT logged in `decisions.md`, 2026-10-30 — covers tfhc-s1/s2/s3/s4 as one entry** |
| W5 | No UNCERTAIN items left in gap table | ✅ | — | — (one gap present, but explicitly handled — manual verification step named, not left uncertain) |

---

## Oversight level

**Oversight:** Medium (from parent epic `fixture-divergence-closure`)

---

## Standards injection

Domain tags: `[testing]`
Matched standards files: `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Classify the 5 journey-related E2E seed endpoints as redundant or legitimate — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s4-journey-seed-endpoint-classification.md
Test plan: artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s4-journey-seed-endpoint-classification-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- This is a read-only investigation story — no production code is written. The deliverable is a classification artefact plus a small structural self-check script (tests/check-tfhc-s4-journey-seed-classification.js) that verifies the artefact's own completeness.
- Files in scope: one new classification artefact under artefacts/2026-10-30-test-fixture-hardening-continuation/research/ (new path, pick a clear filename), tests/check-tfhc-s4-journey-seed-classification.js (new), benefit-metric.md (modified — Metric 4 evidence field only).
- Read each of the 5 real endpoint handlers directly in src/web-ui/server.js (lines ~2431, ~2598, ~2663, ~2852, ~2971) before writing any verdict — do not classify from the story text's own endpoint names alone.
- If any endpoint is judged redundant, name the specific other endpoint it's redundant with and a real caller count, not a vague note.
- Out of scope: consolidating or modifying any endpoint; classifying the 8 non-journey-related /test/seed-* endpoints.
- Architecture standards: .github/standards/testing/test-design-patterns.md injected below.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

## Applicable standards

### .github/standards/testing/test-design-patterns.md (domain: testing)
[Full text injected at DoR time.]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (Medium oversight)
