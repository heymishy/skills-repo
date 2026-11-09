## Definition of Ready: Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s1-retrospective-dry-run.md
**Test plan reference:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s1-retrospective-dry-run-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-11-09

---

## Contract Proposal

See `artefacts/2026-11-08-programme-entry-points/dor/pep-s1-retrospective-dry-run-dor-contract.md` for the full proposal (What will be built / What will NOT be built / AC verification table / Assumptions / Estimated touch points).

## Contract Review

✅ **Contract review passed** — the proposed implementation (a single read-only write-up artefact derived from phase4's real archived history) aligns with all 4 ACs. No mismatch found between the proposed approach and any AC's stated requirement — each AC asks for a documented verdict derived from real fixture data, and the contract's "What will be built" produces exactly that, nothing more.

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: "platform maintainer validating skill readiness" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | AC1-AC4 each have unit + integration coverage |
| H4 | Out-of-scope populated | ✅ | 3 items listed |
| H5 | Benefit linkage references a named metric | ✅ | "Retrospective dry-run validity (meta)" — confirmed matches `benefit-metric.md`'s "Meta Metric 1: Retrospective dry-run validity" exactly |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | review/pep-s1-review-1.md — PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | "Coverage gaps: None" |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" — no upstream dependency — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated ("None identified" with explicit rationale — a documentation/analysis story that modifies no governed file); no Category E findings in review |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent AC exists in the test plan |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-programme-entry-points/nfr-profile.md` exists, Status: Active |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | NFR profile's Compliance table is empty; "Named sign-off required?" = Not required |
| H-NFR3 | Data classification not blank | ✅ | "Internal" checked in NFR profile |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ | Story's NFR section is populated (not "None"/blank), and the feature NFR profile exists |
| H-GOV | Governance approval | ✅ | `discovery.md`'s `## Approved By`: "Hamish King — Platform Owner — 2026-11-08" — named, non-engineering role, correct format. M1 signal: positive (Platform Owner clearly non-engineering) |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | No `setX()` adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks: 19/19 passed (15 applicable + 4 N/A by trigger condition).**

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ⚠️ | Declared as **Unstable, by design** — pep-s1 is explicitly the story whose own findings determine whether pep-e1's scope needs to change. This is not an undeclared gap; it is the epic's own stated design. Acknowledged, proceeding — the epic-level note already frames this as expected, not a risk requiring a separate RISK-ACCEPT. | Hamish King (Platform Owner), via epic-level design note |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | — | No MEDIUM findings on pep-s1 |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not yet formally reviewed by a second person — this is a personal-scope project with no second contributor. Acknowledged and logged as a shared RISK-ACCEPT in `decisions.md` covering all 3 of this feature's stories (see entry dated 2026-11-09). | Hamish King (Platform Owner) |
| W5 | No UNCERTAIN gap-table items left unaddressed | ✅ | Test plan's own "Test Gaps and Risks" table has 1 entry (prose-actionability can't be fully mechanically verified), with an explicit mitigation (structural proxy + human judgment at verification-script time) — not an UNCERTAIN item left open | — |

**Outstanding decision logged:** A single shared `/decisions` RISK-ACCEPT entry for W4, covering pep-s1, pep-s2, and pep-s3 together, has been appended to `artefacts/2026-11-08-programme-entry-points/decisions.md`.

## Standards injection

Story has no `domain` field — skipped silently.

## READY / BLOCKED

✅ **Definition of ready: PROCEED — Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4**

Hard blocks: 19/19 passed
Warnings: 2 acknowledged (W2, W4) / 0 resolved
Oversight: **Medium**

⚠️ **Outstanding decisions to log** — the W4 RISK-ACCEPT above is already logged (shared entry covering all 3 stories in this feature).

⚠️ **Medium oversight** — share this DoR artefact with the tech lead before assigning to the coding agent. In this solo-operator project, Hamish King (Platform Owner) is the project's own tech-lead-equivalent awareness checkpoint (no separate engineering role exists); no formal sign-off is required beyond this awareness step.

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4 — artefacts/2026-11-08-programme-entry-points/stories/pep-s1-retrospective-dry-run.md
Test plan: artefacts/2026-11-08-programme-entry-points/test-plans/pep-s1-retrospective-dry-run-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's own test runner (node scripts/run-all-tests.js) — no new framework.
- Out of scope: do not patch /programme or /workflow (pep-s2's job); do not validate against any
  historical case other than skills-platform-phase4.
- Read phase4's real git history and file structure directly (git log, file reads) rather than
  hand-typing numbers into the write-up — the integration test asserts computed values match the
  real fixture, not an asserted constant.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not
  introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review (note: this story's only output
  is a new artefact file under artefacts/, which per CLAUDE.md's bookkeeping rule does not strictly
  require a standalone PR — but since it is bundled with no other governed-file change, a lightweight
  branch + PR is still the simplest consistent path; follow the project's established convention).
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the
  ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only)
**Signed off by:** Hamish King (Platform Owner) — awareness confirmed, 2026-11-09
