## Definition of Ready: A production-wiring smoke test in the unit chain that fails when an adapter is unwired or a route answers a hostile request with a 5xx

**Story reference:** artefacts/2026-11-17-production-wiring-smoke-test/stories/pws-s1-production-wiring-smoke-test.md
**Test plan reference:** artefacts/2026-11-17-production-wiring-smoke-test/test-plans/pws-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-production-wiring-smoke-test/dor/pws-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Three new files plus a decisions file; all 6 acceptance criteria (AC) map to a named test. The exclusion list names the production modules; the tests only read them, so there is no assertion against an excluded file (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 T6 |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Replaces the per-PR signal that `sep-s1` would remove |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []` |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; D37 is the rule enforced; operator decision (fail, not warn) recorded |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No UI |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | |
| H-ADAPTER | Injectable adapter (D37) | ✅ | No adapter is introduced or wired; the story enforces the rule |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ✅ | No live check needed; the check runs in CI |
| W5 | ⚠️ Accepted | Wiring that exists only under a real production environment is out of the check's reach; stated in the story |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - adds a test and a script only; no production code change. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-production-wiring-smoke-test/stories/pws-s1-production-wiring-smoke-test.md
Test plan: artefacts/2026-11-17-production-wiring-smoke-test/test-plans/pws-s1-test-plan.md
Contract: artefacts/2026-11-17-production-wiring-smoke-test/dor/pws-s1-dor-contract.md
Goal: write the three new files; confirm T1 (empty allow-list) and T5 fail first for the right reason, then fill the allow-list with reasoned entries.
Constraints:
- Do NOT edit any production module. The check reads them and boots server.js in a child process.
- The allow-list lives at the top of the test file; every entry has the adapter, the reason and the owner story, and a stale entry fails.
- The test writes nothing inside the repo (temp dirs only; set SKILLS_ARTEFACT_SAVE_ROOT in the probe).
- A genuine 5xx found by the sweep is reported to the operator with the request, not silently allow-listed.
- Stage only the files you changed. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
