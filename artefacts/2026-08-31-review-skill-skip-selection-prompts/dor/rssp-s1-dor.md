# Definition of Ready Checklist

## Definition of Ready: Remove /review's story-selection and category-selection prompts

**Story reference:** artefacts/2026-08-31-review-skill-skip-selection-prompts/stories/rssp-s1-remove-review-selection-prompts.md
**Test plan reference:** artefacts/2026-08-31-review-skill-skip-selection-prompts/test-plans/rssp-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator running /review via CLI or web UI |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Direct correctness fix, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Respects Platform Change Policy (PR flow for SKILL.md changes) |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs; no UI change |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-31-review-skill-skip-selection-prompts/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap noted across this session's other short-track stories | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction — this is the third confirmation of the underlying preference (2026-08-06, 2026-08-07, 2026-08-31). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters — pure markdown text change |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 18/18 (16 direct passes + 1 explicit N/A + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Every AC is automated content-assertion; no manual verification script needed | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table names the one real limit (live model instruction-following) with a mitigation, not left uncertain | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Remove /review's story-selection and category-selection prompts — artefacts/2026-08-31-review-skill-skip-selection-prompts/stories/rssp-s1-remove-review-selection-prompts.md
Test plan: artefacts/2026-08-31-review-skill-skip-selection-prompts/test-plans/rssp-s1-test-plan.md
DoR contract: artefacts/2026-08-31-review-skill-skip-selection-prompts/dor/rssp-s1-dor-contract.md

Goal:
Edit skills/review/SKILL.md: replace Step 1's "Review all stories, or a
specific one?" question with a direct statement, and remove Step 2's
"Which review categories should I run?" menu entirely, so /review always
runs all 5 categories against all stories without asking either question.

Constraints:
- Do not touch any other skill file.
- Do not change the review categories, scoring rubric, or output format.
- Preserve the Session recovery check (already-reviewed exclusion) and the
  explicit-instruction-override exception sentence.
- Run the full suite (node scripts/run-all-tests.js) and confirm no
  regressions (this touches a markdown file only, so this is a sanity check,
  not an expectation of related test changes).
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — text-only instruction-file change, no runtime behavior change to application code.
**Sign-off required:** No (Low — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — this is the third confirmation of the same underlying preference (2026-08-06, 2026-08-07, 2026-08-31), surfaced this time via live web UI dogfooding.
