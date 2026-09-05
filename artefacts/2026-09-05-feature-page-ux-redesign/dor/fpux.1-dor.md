# Definition of Ready: Unify `/features/:slug`'s visual language across feature-level and per-story sections

**Story reference:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.1-unify-feature-page-visual-language.md
**Test plan reference:** artefacts/2026-09-05-feature-page-ux-redesign/test-plans/fpux.1-test-plan.md
**Review artefact:** artefacts/2026-09-05-feature-page-ux-redesign/review/fpux.1-review-1.md
**Contract:** artefacts/2026-09-05-feature-page-ux-redesign/dor/fpux.1-dor-contract.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

**Contract review:** ✅ Passed — proposed implementation aligns with all 5 ACs and the test plan exactly, no mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Prospective client (primary), Developer/Engineer + Tech Lead (secondary) — all named, from `product/mission.md`/discovery |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 3, AC2: 2, AC3: 2, AC4: 2, AC5: 1 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | M1, M2, M4 |
| H6 | Complexity is rated | ✅ | 1 (downgraded from 2 after `/design`) |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH, 0 open MEDIUM, 3 LOW (retrospective only) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | No gaps — every AC has automated coverage |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies block: "None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 5 constraints populated, referencing `design.md`; review Category E: 0 HIGH, 1 LOW (guardrail applicability note) |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ PASS | AC1–AC4 are CSS-layout-dependent, but Playwright (ADR-018) is configured and used for all four — the blocking condition ("no tooling") is not met; no RISK-ACCEPT needed |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-05-feature-page-ux-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR with named regulatory clause has documented human sign-off | ✅ | WCAG 2.1 AA — **signed off by Hamish King (Platform Owner), 2026-09-05**, recorded in `nfr-profile.md` |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence check | ✅ | Profile exists |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank, non-engineer-only entry | ✅ | Updated to "Hamish King — Platform Owner — 2026-09-05" (was "Operator/Engineer"; corrected during this DoR run per operator instruction, matching the sibling `web-ui-navigation-legibility` feature's own precedent) |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No injectable adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM findings | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss an edge case the operator would have caught in a dedicated walkthrough | Hamish King (Platform Owner) — RISK-ACCEPT logged in `decisions.md`, 2026-09-05 |
| W5 | No UNCERTAIN items left unaddressed in gap table | ✅ N/A | No gaps exist for this story | — |

---

## Standards Injection

Domain tags: `[web-ui, ui]`
Matched standards files:
- `.github/standards/web-ui/web-ui-patterns.md` (web-ui) — substantive, real content; includes the `html-shell.js` single-canonical-source rule this story's own Architecture Constraints already cite
- `.github/standards/ui/ui-standards.md` (ui) — ⚠️ still unfilled placeholder boilerplate (references React/Zustand, not this repo's actual stack); injected as-is per the matching algorithm, but the coding agent should disregard its framework-specific guidance and rely on the story's own Architecture Constraints and `design.md` instead

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Unify /features/:slug's visual language across feature-level and per-story sections — artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.1-unify-feature-page-visual-language.md
Test plan: artefacts/2026-09-05-feature-page-ux-redesign/test-plans/fpux.1-test-plan.md
Design: artefacts/2026-09-05-feature-page-ux-redesign/design.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Add .sw-epic-group and .sw-story-row to src/web-ui/utils/html-shell.js's
  DESIGN_SYSTEM_CSS constant — do NOT add page-local <style> content to
  features.js. This is the single canonical source for shared styles
  (.github/architecture-guardrails.md).
- Reuse existing tokens only (--ink, --muted, --surface, --line, --accent,
  etc.) — introduce zero new color/spacing/radius literals. Both light and
  dark theme (and the unstamped system-default state) must resolve correctly.
- No CSS framework, no icon font/library — hand-authored CSS and a CSS-drawn
  or Unicode-glyph chevron only.
- Export renderStory from features.js (currently module-private) so the
  test plan's Unit Tests can call it directly.
- Out of scope: do not touch _renderArtefactListByType, getFeatureStoryStructure,
  groupArtefactsByStory, or any data-fetching code. Do not modify .sw-card,
  .sw-section-title, or .sw-list.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing — specifically the "single canonical source" pattern and the
  "Ad-hoc cross-cutting surface changes without a story" anti-pattern entry,
  both already cited in this story's own Architecture Constraints.
- Applicable standards: .github/standards/web-ui/web-ui-patterns.md (real
  guidance) and .github/standards/ui/ui-standards.md (placeholder — disregard
  its React/Zustand-specific content, follow this story's own constraints
  and design.md instead).
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
