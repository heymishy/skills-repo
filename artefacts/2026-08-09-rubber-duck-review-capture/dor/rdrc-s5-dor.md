# Definition of Ready: Suggest rubber-duck review for eligible hero/customer-facing stories

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s5-suggest-review-for-eligible-stories.md
**Test plan reference:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s5-test-plan.md
**Contract proposal:** artefacts/2026-08-09-rubber-duck-review-capture/dor/rdrc-s5-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "developer/operator running the outer loop" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 4 ACs covered |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 named exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Meta Metric 3 |
| H6 | Complexity is rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 1 MEDIUM (fixed inline post-review), 0 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | No gaps — "Coverage gaps: None" |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: Upstream `rdrc-s2`. `schemaDepends: ["acVerified", "dodStatus"]` declared below — both fields confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Corrected post-review to name CLAUDE.md's Platform change policy + ADR-011 for the SKILL.md modification; review Category E: 0 findings after fix |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-09-rubber-duck-review-capture/nfr-profile.md |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification field not blank | ✅ | Confidential (feature-level default; this story itself handles no sensitive content) |
| H-NFR-profile | NFR profile presence (story declares real NFRs) | ✅ | Profile exists at the path above |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank named entry | ✅ | Same as rdrc-s1 — M1 signal already recorded for this feature |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No `setX()` adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**Dependency declaration (H8-ext):** `schemaDepends: ["acVerified", "dodStatus"]` — this story does not begin implementation until `rdrc-s2`'s `acVerified`/`dodStatus` fields confirm it has shipped.

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | The one MEDIUM finding (1-M1, missing SKILL.md governance note) was fixed directly in the story text at review time, not deferred — no RISK-ACCEPT needed | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged — RISK-ACCEPT-1 in decisions.md (covers all 5 rdrc stories) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | No gaps in this story's test plan | — |

---

## Standards injection

Domain tags: none — this story has no `domain` field (a conditional text addition to existing skill output, not a tagged surface change). Skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Suggest rubber-duck review for eligible hero/customer-facing stories — artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s5-suggest-review-for-eligible-stories.md
Test plan: artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Do NOT begin this story until rdrc-s2 has shipped (check
  pipeline-state.json's rdrc-s2 acVerified/dodStatus fields).
- This story modifies a governed SKILL.md file (skills/definition-of-done/
  or skills/branch-complete/) — per CLAUDE.md's Platform change policy
  (Phase 2+), this change must go through the standard PR-review inner
  loop (which it already will, per this repo's normal flow) — do not
  commit directly to master.
- The eligibility rule must be an explicit, separately-editable list or
  config (e.g. a named constant, or a context.yml entry) — never hardcoded
  inline in the skill's own instruction prose (AC4).
- The suggestion must name only modes that actually exist at
  implementation time — if rdrc-s3/rdrc-s4 haven't shipped yet, only
  name the human-narrated mode.
- Declining/ignoring the suggestion must never block, degrade, or add a
  new gate to the underlying skill's own completion (AC3) — this is a
  nudge, not a disguised gate.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead (operator) awareness required.
**Signed off by:** N/A — proceed directly per Medium oversight rules.

**PROCEED: Yes**
