# Definition of Ready: Group a story's own bare-slug definition file into its own accordion section

**Story reference:** artefacts/2026-09-05-bare-slug-story-grouping-fix/stories/bsgm-s1-fix-bare-slug-story-file-grouping.md
**Test plan reference:** artefacts/2026-09-05-bare-slug-story-grouping-fix/test-plans/bsgm-s1-test-plan.md
**Review artefact:** artefacts/2026-09-05-bare-slug-story-grouping-fix/review/bsgm-s1-review-1.md
**Contract:** artefacts/2026-09-05-bare-slug-story-grouping-fix/dor/bsgm-s1-dor-contract.md
**Track:** Short-track (test-plan → DoR → coding agent; discovery through review skipped per `CLAUDE.md`)
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

**Contract review:** ✅ Passed — proposed implementation aligns with all 4 ACs and the test plan exactly, a single 1-line predicate extension.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Operator (persona from `product/mission.md`), named |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 2, AC2: 1, AC3: 2, AC4: 1 manual scenario |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | References the confirmed 37-feature defect and this session's own benefit-metric convention |
| H6 | Complexity is rated | ✅ | 1 (well understood), Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `/review` intentionally skipped (short-track) — 0 HIGH, honestly documented, not fabricated |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC1–AC3 fully covered by unit tests; AC4 explicitly gap-typed as `Untestable-by-nature` with a manual verification scenario |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No "Dependencies" section in story — no upstream dependencies |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, references the existing longest-first-match guardrail this fix must preserve; Category E not run (short-track, no `architecture-guardrails.md` Category E findings exist for this story) |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ N/A | No AC in this story is CSS-layout-dependent — pure data-classification logic |
| H-NFR | NFR profile exists | ✅ N/A | Story has no NFRs (pure data-layer bug fix, no performance/security/accessibility surface) — explicitly stated "None — confirmed" in the test plan's own NFR Tests section |
| H-NFR2 | Compliance NFR sign-off documented | ✅ N/A | No compliance NFR applies |
| H-NFR3 | Data classification field not blank | ✅ N/A | No NFR profile required for this story |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank, non-engineer-only entry | ✅ N/A | Short-track — no discovery artefact exists for this feature, per `CLAUDE.md`'s own short-track definition |
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
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM (review skipped) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss an edge case a dedicated walkthrough would catch | Hamish King (Platform Owner) — same solo-operator rationale as this session's other RISK-ACCEPTs; logged in `decisions.md` |
| W5 | No UNCERTAIN items left unaddressed in gap table | ✅ | AC4's gap is explicitly typed and reasoned, not bare "uncertain" | — |

---

## Standards Injection

No `domain` field set on this story — this is a pure adapter/data-layer function with no route/handler, UI, security, or auth surface distinct enough to warrant a domain tag. Skipped silently per the DoR skill's own instruction ("no domain field at all — skip silently, this is a genuinely different case from an unmatched tag").

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Group a story's own bare-slug definition file into its own accordion section — artefacts/2026-09-05-bare-slug-story-grouping-fix/stories/bsgm-s1-fix-bare-slug-story-file-grouping.md
Test plan: artefacts/2026-09-05-bare-slug-story-grouping-fix/test-plans/bsgm-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Change exactly one line in src/web-ui/adapters/feature-story-structure.js:
  the matchedSlug predicate in groupArtefactsByStory. Extend it to also
  match the exact bare "<slug>.md" filename case, without altering or
  removing the existing hyphen-suffix match.
- Do not touch deriveTypeFromPath (artefact-list.js) or any other
  type/label derivation logic -- confirmed unrelated by this story's own
  audit.
- Do not rename any existing story file.
- The existing longest-first slug sort must continue to correctly
  disambiguate p3.1 vs p3.1a for BOTH the old hyphenated case and the new
  bare-filename case -- prove this with a dedicated test (AC3), do not
  assume it from reasoning alone.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low (no security/auth/data-model surface; single, well-understood, fully-tested predicate extension; 37-feature blast radius already quantified and documented — no further human checkpoint required before coding agent proceeds)
**Sign-off required:** No
**Signed off by:** Not required
