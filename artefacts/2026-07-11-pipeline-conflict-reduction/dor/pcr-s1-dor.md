# Definition of Ready Checklist

## Definition of Ready: Remove the three recurring merge-conflict hotspots in parallel-wave inner-loop delivery

**Story reference:** artefacts/2026-07-11-pipeline-conflict-reduction/stories/pcr-s1-reduce-merge-conflict-hotspots.md
**Test plan reference:** artefacts/2026-07-11-pipeline-conflict-reduction/test-plans/pcr-s1-reduce-merge-conflict-hotspots-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-11

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Operational-efficiency metric, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | "None identified — checked" |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-11-pipeline-conflict-reduction/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-07-11)** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via operator's direct in-session instruction to proceed; logged as a genuine skill-design gap for future SKILL.md revision, not silently bypassed. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (17 direct passes + 2 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case for a mechanism affecting every future story | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` (2026-07-11) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Remove the three recurring merge-conflict hotspots in parallel-wave inner-loop delivery — artefacts/2026-07-11-pipeline-conflict-reduction/stories/pcr-s1-reduce-merge-conflict-hotspots.md
Test plan: artefacts/2026-07-11-pipeline-conflict-reduction/test-plans/pcr-s1-reduce-merge-conflict-hotspots-test-plan.md
DoR contract: artefacts/2026-07-11-pipeline-conflict-reduction/dor/pcr-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. This story removes three
recurring merge-conflict hotspots (package.json's test chain, pipeline-state.json's
feature-level updatedAt, decisions.md's append conflicts) — see the story and
DoR contract for the full mechanism each fix uses.

Constraints:
- Read bin/skills's actual source before touching it — do not guess at where
  the feature-level updatedAt bump happens; the DoR contract's Assumptions
  section names this as the one open code-reading question for this story.
- The grandfather-list of 16 non-check-*.js files in the test chain (named
  explicitly in the DoR contract's "What will be built" section) must all
  keep running exactly as they do today — verify via IT1 (verdict parity)
  before considering AC1 done.
- Do not split pipeline-state.json's file structure — out of scope per the story.
- Do not touch decisions.md's content schema or the /decisions skill.
- Do not modify any currently-open bri-* branch or PR.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — this story changes shared governance tooling (test runner, pipeline-state write path, git merge config) used by every future story in this repo, warranting tech-lead-equivalent awareness even though it is bounded and low-risk. No formal named sign-off required beyond the operator's own direct review in this session.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Founder/Operator) — reviewed story, contract, and this DoR directly in-session, 2026-07-11
