# Definition of Ready Checklist

## Definition of Ready: Verify and wire the correct skills directory for this repo's own production deployment

**Story reference:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/stories/csdg-s1-verify-and-wire-skills-dir-in-production.md
**Test plan reference:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/test-plans/csdg-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-11

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "external API consumer calling POST /api/skills/:name/sessions" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1/AC2 closed via live investigation (recorded in test plan); AC3/AC4/AC5 have automated tests |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | "JSON API availability / correctness for POST /api/skills/:name/sessions" |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — `src/adapters/skill-discovery.js`'s `listAvailableSkills()` named directly |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Backend directory-resolution logic, not CSS-layout-dependent |
| H-NFR | NFR profile or explicit "None" field | ✅ | Story states "None identified" across all 4 categories |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track — no NFRs beyond "None" |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapters — modifies existing default-resolution logic in a pure function, no new injectable seam |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ | AC1/AC2's live production investigation (flyctl secrets list + real authenticated fetch against skills-framework.fly.dev) was explicitly operator-authorized in-session before being performed — see decisions.md | Hamish King |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Verify and wire the correct skills directory for this repo's own production deployment — artefacts/2026-08-22-copilot-skills-dirs-prod-gap/stories/csdg-s1-verify-and-wire-skills-dir-in-production.md
Test plan: artefacts/2026-08-22-copilot-skills-dirs-prod-gap/test-plans/csdg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The ENTIRE code change is scoped to src/adapters/skill-discovery.js's listAvailableSkills default-resolution logic. Do NOT touch handlePostSkillSessionHtml or any other route/handler.
- Fix approach: when COPILOT_SKILLS_DIRS is unset, check whether <repoPath>/skills/ exists; if so use it, else fall back to <repoPath>/.github/skills/ exactly as today. An explicit COPILOT_SKILLS_DIRS value must always win regardless of either directory's existence.
- Do NOT set any Fly secret or touch any deployment configuration -- this is a code-only fix.
- Re-run the existing tests/skill-discovery.test.js (18 tests) unmodified -- all must still pass, confirming zero regression to already-covered behaviour.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, well-scoped code fix; the one action requiring real judgment, the live production investigation, was explicitly operator-authorized in-session before being performed)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-11 — proceeding under the operator's standing authorization to continue triage waves autonomously, plus explicit in-session authorization for the production sign-in/investigation step

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
