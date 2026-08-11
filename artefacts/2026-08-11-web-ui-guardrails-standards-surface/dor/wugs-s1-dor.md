## Definition of Ready: Extend the artefact-fetcher adapter to read arbitrary repo files and folders

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s1-extend-artefact-fetcher-arbitrary-paths.md
**Test plan reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s1-extend-artefact-fetcher-arbitrary-paths-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-11

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs; no mismatches between the Contract Proposal and the test plan's stated approach.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with named persona | ✅ | Persona: tech lead |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | 7 tests across 6 ACs |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 (visibility), framed as technical-dependency per template guidance |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: "None" (upstream) — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites ADR-012, CLAUDE.md D37 |
| H-E2E | CSS-layout-dependent gap check | ✅ | No layout-dependent ACs in this story |
| H-NFR | NFR profile exists or story has "None — reviewed" | ✅ | `nfr-profile.md` exists at feature level |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs — N/A |
| H-NFR3 | Data classification not blank | ✅ | "Internal" in nfr-profile.md |
| H-NFR-profile | NFR profile presence (B1) | ✅ | Story NFRs non-blank; feature nfr-profile.md exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | "Hamish King — Platform owner — 2026-08-11" (M1 signal: role unverified for independent sign-off, "Platform owner" not unambiguously non-engineering) |
| H-ADAPTER | Injectable adapter wiring check | ✅ | `setFetchRepoPath` introduced; AC6 (added during this DoR run) scopes production wiring with a differentiating-outcome test, matching D37 requirement 4 |
| H-INF | Infra-plan gate | ✅ | `hasInfraTrack` not set — skipped |
| H-MIG | Migration-review gate | ✅ | `hasMigrationTrack` not set — skipped |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | No MEDIUM findings on this story | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not yet reviewed by anyone other than the author | Acknowledged — proceeding; Hamish King as sole operator is both author and reviewer here |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Oversight level

**Medium** (per Epic 1) — DoR artefact shared with tech lead (Hamish King, confirmed).

---

## Standards injection

Domain tags: `[web-ui]`
Matched standards files: `standards/saas-gui/POLICY.md` (surface-type floor, `quality-assurance` surface-variant) — content not embedded here per token-policy overlay; coding agent reads directly at implementation time per the Coding Agent Instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend the artefact-fetcher adapter to read arbitrary repo files and folders — artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s1-extend-artefact-fetcher-arbitrary-paths.md
Test plan: artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s1-extend-artefact-fetcher-arbitrary-paths-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Extend src/web-ui/adapters/artefact-fetcher.js — do not create a second,
  parallel GitHub-API-calling module (ADR-012).
- Follow the injectable-adapter pattern already used by
  src/web-ui/adapters/pipeline-state-fetch-adapter.js (stub throws, setX/getX).
- Reuse the existing ArtefactNotFoundError/ArtefactFetchError classes — do not
  create duplicates.
- Verify the real GitHub folder-listing response shape with at least one live
  API call during implementation before trusting the mocked test shape
  (CLAUDE.md mock-shape-verification rule).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce anti-patterns or violate mandatory
  constraints or Active ADRs (ADR-012 applies directly).
- Read standards/saas-gui/POLICY.md (web-ui domain match).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing it and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only)
**Signed off by:** Hamish King — Platform owner — 2026-08-11 (DoR artefact reviewed directly)

**PROCEED: Yes**
