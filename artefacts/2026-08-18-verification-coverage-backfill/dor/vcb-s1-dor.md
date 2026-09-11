# Definition of Ready Checklist

## Definition of Ready: Backfill rpc-s1's missing accessibility test and jrf-s1's narrower-than-required regression pass

**Story reference:** artefacts/2026-08-18-verification-coverage-backfill/stories/vcb-s1-backfill-rpc-s1-and-jrf-s1-verification-gaps.md
**Test plan reference:** artefacts/2026-08-18-verification-coverage-backfill/test-plans/vcb-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-11

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "platform maintainer" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 3/3 |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track — closes two self-documented coverage gaps, no new metric |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated. One deviation from the literal AC2 wording, explicitly justified in the test plan's own Scope note: a full-suite-spawn-from-within-a-test-file would reintroduce a known, already-fixed CPU-contention anti-pattern (`check-md-3-adr.js`/`mar-s1`), so AC2 is satisfied via the story's own named alternative ("a clearly-scoped, correctly-baselined subset") instead of a literal full 639-file run |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Markup-presence assertions (aria-label strings, subprocess exit codes), not CSS-layout-dependent |
| H-NFR | NFR profile or explicit "None" field | ✅ | Accessibility is the substantive NFR (AC1 itself) |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track — no feature-level NFR profile, consistent with every other short-track story in this repo's history |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapters — test-file-only change |
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
| W4 | Verification script reviewed by a domain expert | ✅ N/A | No manual verification script required — fully covered by automated tests | — |
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
Story: Backfill rpc-s1's missing accessibility test and jrf-s1's narrower-than-required regression pass — artefacts/2026-08-18-verification-coverage-backfill/stories/vcb-s1-backfill-rpc-s1-and-jrf-s1-verification-gaps.md
Test plan: artefacts/2026-08-18-verification-coverage-backfill/test-plans/vcb-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The ENTIRE change is scoped to two existing test files: tests/check-rpc-s1-connect-repo.js and tests/check-jrf-s1-new-feature-redirect.js. Do NOT touch any production code under src/web-ui/ — both underlying fixes are already confirmed correct.
- AC1: add a new NFR-Accessibility test to check-rpc-s1-connect-repo.js asserting the already-shipped aria-label attributes on the Connect-repo form's three inputs (rpc-connect-owner, rpc-connect-repo, rpc-create-name) are present and non-empty.
- AC2: add a new IT6 to check-jrf-s1-new-feature-redirect.js that spawns (via execFileSync) every test file found by `grep -rl "handlePostProductFeature" tests/*.js` (excluding this file itself) and asserts all pass. Do NOT spawn the full npm test suite from within this file — that reintroduces a known, already-fixed CPU-contention anti-pattern (check-md-3-adr.js/mar-s1). Keep the original IT5 as-is (do not delete it), add IT6 alongside it.
- Open a draft PR when tests pass — do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, well-scoped, test-file-only short-track fix; operator has authorized "further waves" of this DoD-triage sweep, including this candidate, generally)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-11 — proceeding under the operator's standing authorization to continue triage waves autonomously

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
