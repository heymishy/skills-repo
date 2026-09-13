# Definition of Ready Checklist

## Definition of Ready: Lazily refresh a tenant's local repo checkout on active web UI access

**Story reference:** artefacts/2026-09-13-repo-checkout-lazy-refresh/stories/rclr-s1-lazy-git-pull-on-active-session.md
**Test plan reference:** artefacts/2026-09-13-repo-checkout-lazy-refresh/test-plans/rclr-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator viewing pipeline-state-derived data... in the live web app" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 8/8, AC2/AC6 each get 2 dedicated tests |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track infrastructure fix — directly closes a real gap the operator found first-hand this session |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — the safety-critical `--ff-only` constraint was identified specifically because `skills.js` already commits real local-only work to this same checkout; confirmed via direct grep before writing the story |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No rendered UI — backend adapter module only |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Availability all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | `ensureRepoFresh(repoRoot, deps)` takes per-call optional overrides for testability, not a global mutable `let _x = defaultFn; function setX(fn)` adapter seam — D37's checklist targets that specific pattern, which this does not use |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Behavioural tests against injected fake `exec`/`now` — fully self-verifying, no real git process executed in tests | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Lazily refresh a tenant's local repo checkout on active web UI access -- artefacts/2026-09-13-repo-checkout-lazy-refresh/stories/rclr-s1-lazy-git-pull-on-active-session.md
Test plan: artefacts/2026-09-13-repo-checkout-lazy-refresh/test-plans/rclr-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New module: src/web-ui/adapters/repo-freshness.js, exporting
  ensureRepoFresh(repoRoot, deps) and a test-only _resetForTesting().
  deps (all optional): now, exec, ttlMs (default 2 minutes = 120000).
- MUST use exactly 'git pull --ff-only' -- never rebase or a hard
  reset. This checkout can hold real local-only commits from
  skills.js's own artefact-save flow (git add/commit around line
  1480-1481) -- --ff-only fails safely instead of discarding them.
- ensureRepoFresh must NEVER throw -- catch any exec failure and
  return a result object instead.
- Track last-refresh-attempt time per repoRoot independently (an
  in-memory map keyed by the resolved path) -- no global single
  timestamp, no background timer/cron of any kind.
- Wire into src/web-ui/routes/journey.js's _readPipelineFeatures(root)
  -- call ensureRepoFresh(root || _repoRoot || '') before the
  existsSync check, wrapped so any unexpected throw from the adapter
  still lets the file read proceed.
- Do NOT touch getRepoRoot's own resolution logic or skills.js's
  existing git add/commit flow.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — a small, well-scoped backend fix with a specifically identified safety constraint already designed around; operator explicitly requested this fix and refined its scope themselves)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-13

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
