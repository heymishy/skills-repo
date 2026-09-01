# Definition of Ready Checklist

## Definition of Ready: Move das-s1's GitHub-commit dual-write to the point where a stage actually first completes

**Story reference:** artefacts/2026-09-01-das-s1-github-commit-unreachable-fix/stories/dcuf-s1-move-github-commit-to-real-completion-point.md
**Test plan reference:** artefacts/2026-09-01-das-s1-github-commit-unreachable-fix/test-plans/dcuf-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-09-01

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: real SaaS operator running a pipeline through the live web UI |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track; discovery reference provided instead |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: das-s1 (adapters reused unchanged); no overlap with lpmf-s1/wsap-s1/srar-s1 |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Exact AC1/AC2/AC4 contract preservation, first-completion-only scoping, and journey.js/stis-s1 no-touch boundaries explicitly stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ N/A | Inherits das-s1's own NFR guarantees via reused adapters |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap already logged this session for rssp-s1/sstr-s1/ssdo-s1/lpmf-s1/wsap-s1/srar-s1 | A discovery artefact exists (artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md) documenting the investigation, but was not run through formal /benefit-metric approval — short-track, operator explicitly requested the fix in-session after the root cause was confirmed ("Yes please"). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new adapter — reuses das-s1's existing D37-compliant adapters unchanged |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass — 15/15 (13 direct passes + 1 explicit N/A-with-note + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Coverage gaps: None | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Move das-s1's GitHub-commit dual-write to the point where a stage actually first completes — artefacts/2026-09-01-das-s1-github-commit-unreachable-fix/stories/dcuf-s1-move-github-commit-to-real-completion-point.md
Test plan: artefacts/2026-09-01-das-s1-github-commit-unreachable-fix/test-plans/dcuf-s1-test-plan.md
DoR contract: artefacts/2026-09-01-das-s1-github-commit-unreachable-fix/dor/dcuf-s1-dor-contract.md

Goal:
In src/web-ui/routes/skills.js's handlePostTurnStreamHtml, das-s1's
GitHub-commit dual-write (ownerRepoForFeature + commitArtefact, exactly as
journey.js's handlePostGateConfirm already uses them) is currently
unreachable in real usage because journey.js's own guard
(if (!session._stageDone)) always sees _stageDone already true by the time
gate-confirm runs -- this function sets it first. Move an equivalent
first-completion-only commit attempt into THIS function, at the point
_stageDone is actually first set, preserving das-s1's exact AC1/AC2/AC4
contract (dual-write; commit failure blocks completion with an SSE error
event and leaves _stageDone unset; repo-less/unresolvable proceeds
unchanged).

Constraints:
- Do NOT touch journey.js, export-data-source.js, or artefact-commit-writer.js.
- Do NOT touch the local-only _skillTurnGitCommit/stis-s1 call earlier in
  this same function.
- Scope the new commit attempt to first-completion only (!_existingStageEntry).
- tests/check-das-s1-commit-artefact-git-fallback.js,
  tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js,
  tests/check-ssdo-s1-sse-client-disconnect-logging.js,
  tests/check-wsap-s1-story-scoped-artefact-paths.js, and
  tests/check-srar-s1-idempotent-turn-reconnect.js must all still pass
  unmodified.
- Add tests/check-dcuf-s1-github-commit-real-completion-point.js covering
  AC1-AC4.
- Run the full suite (node scripts/run-all-tests.js) and confirm no
  regressions.
- Register the new feature/story in .github/pipeline-state.json on this
  branch before opening the PR (CI's assurance-gate trace-report step
  hard-fails otherwise -- confirmed earlier this session).
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — this closes a real, confirmed, silent durability-guarantee failure affecting every real feature completed through the live web UI, on the single most heavily-used code path in the application, touching the same function as 3 other stories shipped earlier this session; correctness here is not internal-tooling-scoped, it's a production data-durability fix.
**Sign-off required:** Yes — operator explicitly requested this fix in-session ("Yes please") after being shown the fully-traced, confirmed root cause and its severity (affects every real feature, not just the one investigated).
**Signed off by:** Hamish King (Platform Owner) — 2026-09-01 (2026-08-31 in this session's earlier local time references), following direct investigation together that identified and confirmed the root cause live.
