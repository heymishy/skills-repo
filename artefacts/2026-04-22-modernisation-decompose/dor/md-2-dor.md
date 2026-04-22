# Definition of Ready: Register `/modernisation-decompose` in `check-skill-contracts.js`

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-2-skill-contracts.md
**Test plan reference:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-2-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-04-22

---

## Contract Proposal

**What will be built:**
An updated `scripts/check-skill-contracts.js` (or `tests/check-skill-contracts.js` — whichever path the file currently lives at) containing a new contract entry for the `modernisation-decompose` skill. The entry follows the existing registry pattern for other skills: a skill name key, with at least one structural marker requirement that the `## State update — mandatory final step` section must be present in the SKILL.md. Additional required structural markers (entry condition, completion output) matching the sections committed in md-1 should also be registered.

**What will NOT be built:**
Changes to any other governance check scripts. Changes to `check-pipeline-artefact-paths.js`. Changes to any SKILL.md file. Any new npm dependencies.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — npm test passes with new skill registered | Run `npm test`; confirm `[skill-contracts]` shows 38 skills, 0 failures | Integration |
| AC2 — Remove State update section → named failure | Temporarily remove section from SKILL.md; run `npm test`; confirm failure message names both the marker and the skill name `modernisation-decompose` | Integration |
| AC3 — 0 regressions to prior 37 skills | Run full `npm test`; confirm all previously passing skills still pass | Integration |

**Assumptions:**
- md-1 SKILL.md will be committed before this story is coded. The marker names to register are known from the md-1 implementation.
- The existing contract pattern (array of required marker strings per skill) is the established approach.

**Estimated touch points:**
Files: `scripts/check-skill-contracts.js` (or `tests/check-skill-contracts.js`) — modify. Services: None. APIs: None.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So with named persona | ✅ | "platform maintainer" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ | All 3 ACs covered — 3 integration + 1 NFR |
| H4 | Out-of-scope section populated | ✅ | 2 items listed |
| H5 | Benefit linkage references a named metric | ✅ | M2 named |
| H6 | Complexity rated | ✅ | Complexity 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH findings (review run 1) |
| H8 | Test plan covers all ACs or gaps acknowledged | ✅ | No gaps — all ACs covered by integration tests |
| H8-ext | Cross-story schema dependency check | ✅ | Dependency on md-1 is delivery-order only (SKILL.md markers must be finalized first); no pipeline-state.json fields read from md-1 — schemaDepends: [] |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 3 constraints; 0 Category E HIGH findings |
| H-E2E | No CSS-layout-dependent ACs without E2E coverage | ✅ | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists; story NFRs populated | ✅ | 1 NFR (no-dep constraint); nfr-profile.md exists |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | No regulated data NFRs |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Classification: Public — confirmed in nfr-profile.md |

**All 14 hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | 0 MEDIUM findings (review run 1 returned 1 LOW only) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Hamish — acknowledged for personal pipeline |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps table entries for this story | — |

---

## Oversight Level

**Medium** — Human oversight level set by parent epic e1-modernisation-pipeline-bridging. Share this DoR artefact with the tech lead before assigning to the coding agent.

For this personal pipeline, Hamish acts as both operator and tech lead. DoR artefact reviewed and awareness confirmed.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Register /modernisation-decompose in check-skill-contracts.js — artefacts/2026-04-22-modernisation-decompose/stories/md-2-skill-contracts.md
Test plan: artefacts/2026-04-22-modernisation-decompose/test-plans/md-2-test-plan.md

Goal:
Update check-skill-contracts.js to register the modernisation-decompose skill
such that all 3 integration tests in the test plan pass.

Constraints:
- Modify ONE existing file: scripts/check-skill-contracts.js (confirm exact path
  before editing; it may be under tests/)
- Follow the existing pattern exactly — add a new entry for modernisation-decompose
  using the same data structure as existing skill entries
- Required structural markers to register: at minimum "## State update — mandatory
  final step" — add any additional markers present in the committed md-1 SKILL.md
  (entry condition section, completion output section, triggers block)
- Do not add any new require() calls for external npm packages
- Do not modify any other file
- Architecture standards: read .github/architecture-guardrails.md before
  implementing; do not violate any active ADR or mandatory constraint
- Sequencing: md-1 SKILL.md must be committed before this story begins
- Open a draft PR when tests pass — do not mark ready for review
- Oversight: MEDIUM — platform maintainer must review the PR before merge
- If you encounter ambiguity not covered by the ACs or tests:
  add a PR comment and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only)
**Signed off by:** Hamish (operator + tech lead) — 2026-04-22
