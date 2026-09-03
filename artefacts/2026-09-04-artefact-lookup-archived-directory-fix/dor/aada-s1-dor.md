# Definition of Ready Checklist

## Definition of Ready: Feature artefact lookup falls back to the archived directory when the primary path is gone

**Story reference:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/stories/aada-s1-check-archived-directory-fallback.md
**Test plan reference:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/test-plans/aada-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs (2 + 1 regression guard) |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Time to First Actionable Content — same metric this whole investigation thread has targeted; direct code-reading evidence cited (validate-trace.sh/.ps1's own already-established archived-path convention) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Depends on `2026-09-03-pipeline-state-archive-completed-features` and `fal-s1` — both merged, DoD-complete. No incomplete-upstream risk. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated — single function, single new branch, exact path convention confirmed via direct code reading (not guessed). No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent language — pure filesystem-lookup function |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-04-artefact-lookup-archived-directory-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1/pst-s1/pgft-s1/psbf-s1/ppg-s1/fal-s1/pefl-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to proceed ("let's do this new design and the short track story", confirmed via AskUserQuestion which of three sequencing options to use — "Split into 2-3 bounded short-track stories" selected). Recorded transparently, matching the identical, already-logged H-GOV gap pattern for every prior short-track story in this repo. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced — pure filesystem lookup |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (13 direct passes + 6 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Smallest possible fix (single function, single new branch), mirrors an already-shipped, already-correct convention (validate-trace's own archived-path fallback) rather than inventing new behaviour — minimal room for a missed edge case. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's own Coverage gaps table is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Feature artefact lookup falls back to the archived directory when the primary path is gone — artefacts/2026-09-04-artefact-lookup-archived-directory-fix/stories/aada-s1-check-archived-directory-fallback.md
Test plan: artefacts/2026-09-04-artefact-lookup-archived-directory-fix/test-plans/aada-s1-test-plan.md
DoR contract: artefacts/2026-09-04-artefact-lookup-archived-directory-fix/dor/aada-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

In listLocalArtefacts (src/web-ui/adapters/artefact-list.js): when
path.join(repoRoot, 'artefacts', featureSlug) does not exist, check
path.join(repoRoot, 'artefacts', 'archived', featureSlug) before
returning null. If that archived path exists, walk it with the existing
walkMdFiles helper exactly as the primary path is walked today, and
return its contents in the same {path, type: 'file'}[] shape.

Constraints:
- Do NOT modify listArtefacts's own merge-with-Postgres or GitHub-API
  fallback logic -- untouched.
- Do NOT modify walkMdFiles, deriveTypeFromPath, or the module's exports.
- The primary-path-exists case (the common case) must not perform the
  extra archived-path existsSync check at all -- write a test asserting
  this if not already covered by the test plan's own AC1 (it is).
- No new npm dependencies. No schema or query change.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — single function, single new conditional branch, mirrors an already-shipped convention verified via direct code reading; minimal blast radius (only reached when the primary path is already confirmed absent).
**Sign-off required:** No
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-04.
