# Definition of Ready: Audit and fix the navigation path into `/features/:slug`

**Story reference:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.2-audit-and-fix-nav-path.md
**Test plan reference:** artefacts/2026-09-05-feature-page-ux-redesign/test-plans/fpux.2-test-plan.md
**Review artefact:** artefacts/2026-09-05-feature-page-ux-redesign/review/fpux.2-review-1.md
**Contract:** artefacts/2026-09-05-feature-page-ux-redesign/dor/fpux.2-dor-contract.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

**Contract review:** ✅ Passed — aligns with all 4 ACs; AC3's open-ended "TBD" test approach matches the story's own explicitly-declared, reasoned gap (not an unacknowledged mismatch).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Operator (Developer/Engineer or Tech Lead) / prospective client — named, from discovery |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 1 manual scenario, AC2: 3 E2E, AC3: acknowledged gap (defect-dependent), AC4: 1 unit |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | M3 |
| H6 | Complexity is rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH; 1 MEDIUM (AC2 testability) fixed outright via reword, not just acknowledged; 3 LOW retrospective |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC1 (manual, untestable-by-nature) and AC3 (external-dependency, defect-unknown) are both explicitly typed and reasoned in the gap table |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies block: "None" |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 3 constraints populated; review Category E: 0 HIGH |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ N/A | No AC in this story is CSS-layout-dependent (routing/link correctness only) |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-05-feature-page-ux-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR with named regulatory clause has documented human sign-off | ✅ N/A | The WCAG 2.1 AA compliance NFR in the shared profile applies to `fpux.1` only — not listed against this story |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence check | ✅ | Profile exists |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank, non-engineer-only entry | ✅ | Same shared discovery artefact as `fpux.1` — updated to "Hamish King — Platform Owner — 2026-09-05" during this DoR run |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | The 1 MEDIUM (AC2 testability) was fixed outright, not just risk-accepted — stronger than acknowledgement | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss an edge case a dedicated walkthrough would catch | Hamish King (Platform Owner) — RISK-ACCEPT logged in `decisions.md`, 2026-09-05 (same entry covers both `fpux.1` and `fpux.2`) |
| W5 | No UNCERTAIN items left unaddressed in gap table | ✅ | Both gaps (AC1, AC3) are reasoned and typed, not bare "uncertain" | — |

---

## Standards Injection

Domain tags: `[web-ui, ui]`
Matched standards files:
- `.github/standards/web-ui/web-ui-patterns.md` (web-ui) — includes the entry inventory guidance ("inventory every render site of a shared component... repo-wide, not just files already under discussion") directly relevant to this story's own entry-point audit
- `.github/standards/ui/ui-standards.md` (ui) — ⚠️ still unfilled placeholder boilerplate; injected per the matching algorithm but not authoritative

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Audit and fix the navigation path into /features/:slug — artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.2-audit-and-fix-nav-path.md
Test plan: artefacts/2026-09-05-feature-page-ux-redesign/test-plans/fpux.2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- AC1 first: trace the actual route/link chain in src/web-ui for every real
  way to reach /features/:slug (dashboard, product page, story DoD, and any
  other you find) — grep -rn "features/" across src/web-ui/routes/ and
  src/web-ui/views/, not just the three files this story's ACs mention
  (per .github/standards/web-ui/web-ui-patterns.md's own inventory-completeness
  guidance). Document the full list in the story file itself.
- AC2: write E2E tests (Playwright) following each confirmed entry point,
  asserting a direct arrival at /features/:slug (200, no dead-end).
- AC3: only if AC1/AC2's audit finds an actual broken/dead-end hop, fix it
  in the relevant route/view file and add a regression test for that
  specific defect. If no defect is found, record "no defect found" — do not
  fabricate a fix for a problem that doesn't exist.
- AC4: update benefit-metric.md's M3 row with the real baseline/target
  established by the audit — remove the placeholder "Not yet established"/
  "TBD" text.
- Do not modify visual/CSS — that is fpux.1's scope. This story is routing/
  link correctness only.
- Any shell-level navigation structure change must go through html-shell.js
  or its documented wrapper (renderShellWithNav in products.js) — not a
  second, parallel nav-rendering path.
- Applicable standards: .github/standards/web-ui/web-ui-patterns.md (real
  guidance) and .github/standards/ui/ui-standards.md (placeholder — disregard).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech-lead awareness required before assignment
**Confirmed by:** Hamish King (Platform Owner) — 2026-09-05, via active review of this DoR run
