# Definition of Ready Checklist

## Definition of Ready: Stop the skill-turn artefact auto-commit from firing real git commits during tests

**Story reference:** artefacts/2026-07-12-skill-turn-test-isolation/stories/stis-s1-guard-skill-turn-auto-commit.md
**Test plan reference:** artefacts/2026-07-12-skill-turn-test-isolation/test-plans/stis-s1-guard-skill-turn-auto-commit-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-12

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Operational reliability, quantified with this session's actual incident count |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Follows existing D37 pattern |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-12-skill-turn-test-isolation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-07-12)** | No discovery artefact — short-track skips /discovery by design, same precedent as `pcr-s1` |
| H-ADAPTER | D37 adapter wiring check | ✅ | AC1 scopes production wiring, AC2 documents the deliberate stub-doesn't-throw exception, implementation plan will name wiring as a distinct task |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-07-12-skill-turn-test-isolation/decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Stop the skill-turn artefact auto-commit from firing real git commits during tests — artefacts/2026-07-12-skill-turn-test-isolation/stories/stis-s1-guard-skill-turn-auto-commit.md
Test plan: artefacts/2026-07-12-skill-turn-test-isolation/test-plans/stis-s1-guard-skill-turn-auto-commit-test-plan.md
DoR contract: artefacts/2026-07-12-skill-turn-test-isolation/dor/stis-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. This story wraps the
existing "best-effort" git-commit call inside src/web-ui/routes/skills.js's
skill-turn-stream artefact-completion handler in a D37-style injectable
adapter, so tests can stub it while production behaviour (a real commit on
a genuine live server session) is fully preserved.

Constraints:
- Read the current code at src/web-ui/routes/skills.js around the artefact
  auto-save-and-commit block (search for "artefact_auto_amended") before
  writing anything — do not guess at the exact current line numbers or
  surrounding logic, they may have shifted slightly since this story was
  written.
- The adapter's DEFAULT implementation must still perform the real
  execSync git add/git commit exactly as today (including the existing
  try/catch swallow-on-failure behaviour) — this is a deliberate, documented
  exception to the D37 "stub must throw" rule (see AC2's rationale in the
  story) because this adapter's whole purpose is to fail silently and
  safely when git is unavailable in production.
- Do a full, exhaustive search of tests/ for anything that exercises a
  completed skill-turn artefact turn (not just the ~6 candidate files
  already named in the DoR contract) before considering AC3 done.
- U2 (proving the production default still fires a real commit) MUST run
  against a disposable temporary git repository created in test setup,
  NEVER against this real repo checkout — getting this wrong recreates the
  exact contamination bug this story exists to fix.
- Do not fix any of the ~68-70 already-documented pre-existing test
  failures — out of scope, see the story's Out of Scope section.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this story modifies a shared production route file (`src/web-ui/routes/skills.js`) used across many stories, and fixes a defect that has already caused real operational cost this session — warranting tech-lead-equivalent awareness even though it's small and low-risk.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Founder/Operator) — requested this follow-up story directly in-session with full context of the root cause, 2026-07-12
