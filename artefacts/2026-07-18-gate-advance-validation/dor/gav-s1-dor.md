# Definition of Ready Checklist

## Definition of Ready: Extend gate-advance structural validation to all 7 canonical gate names

**Story reference:** artefacts/2026-07-18-gate-advance-validation/stories/gav-s1.md
**Test plan reference:** artefacts/2026-07-18-gate-advance-validation/test-plans/gav-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-18

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Governance gate integrity |
| H6 | Complexity is rated | ✅ | Rating 3, Unstable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Follows existing H1-H9 pattern, CLAUDE.md cdg.7 |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-18-gate-advance-validation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-07-18)** | No discovery artefact — short-track skips /discovery by design, same precedent as `pcr-s1`/`stis-s1` |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Unstable, per Complexity Rating 3 | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case in the newly-designed AC2-AC6 criteria | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-07-18-gate-advance-validation/decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's gap table names the risk with an explicit mitigation | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend gate-advance structural validation to all 7 canonical gate names — artefacts/2026-07-18-gate-advance-validation/stories/gav-s1.md
Test plan: artefacts/2026-07-18-gate-advance-validation/test-plans/gav-s1-test-plan.md
DoR contract: artefacts/2026-07-18-gate-advance-validation/dor/gav-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Extend
src/enforcement/cli-outer-loop.js's validate() function to support all 7
canonical gate names from src/enforcement/gate-map.js, in addition to the
existing 'definition-of-ready' string (kept as a permanent alias of the new
'dor-signed-off' name, both routed through the unchanged H1-H9 logic).

Constraints:
- Read src/enforcement/cli-outer-loop.js and src/enforcement/gate-map.js in
  full before writing anything. Do not guess at the current H1-H9
  implementation's exact shape or exit-code constants.
- Each new gate's validation function must return the same
  { exitCode, stdout, stderr } shape as the existing H1-H9 checks, and use
  a similarly typed exit code (add new EXIT constants as needed, following
  the existing H1..H7_THROUGH_H9/SYSTEM naming pattern — do not collide with
  existing exit code numbers).
- Preserve the existing OWASP A01 path-traversal guard for every new gate
  branch — every new artefact-path resolution must be checked against
  repoRoot the same way the existing code does. Write a dedicated test per
  new gate confirming this (see test plan IT1) — do not assume it's covered
  by copying the pattern.
- Given Complexity Rating 3 / Scope stability Unstable on this story: if a
  real fixture (e.g. an actual merged story/discovery/DoD artefact from this
  repo) doesn't cleanly satisfy a proposed AC criterion (e.g. what exactly
  counts as "non-blank," or a section heading variant the checks don't
  anticipate), log the specific mismatch and the adjustment made in
  artefacts/2026-07-18-gate-advance-validation/decisions.md as a GAP entry,
  update the specific unit test and story AC text together, and continue —
  do not silently loosen a check to make a fixture pass without recording why.
- This story does NOT wire gate-advance calls into any SKILL.md's own
  instructions — that adoption work is explicitly out of scope (see story's
  Out of Scope section). Do not touch any file under skills/.
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

**Oversight level:** Medium — this story modifies a shared platform-governance file (`src/enforcement/cli-outer-loop.js`) that gates every future feature's stage advances, and carries genuine design ambiguity (Complexity Rating 3) in what the new gate criteria should exactly check — warranting tech-lead-equivalent awareness even though the blast radius of a mistake is limited to gate-advance calls (which nothing currently invokes in practice).
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Founder/Operator) — requested this follow-up story directly via `/improve`, with full context of the gap already established, 2026-07-18
