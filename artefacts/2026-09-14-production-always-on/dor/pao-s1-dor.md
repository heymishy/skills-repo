# Definition of Ready Checklist

## Definition of Ready: Keep production's single machine always running instead of scaling to zero

**Story reference:** artefacts/2026-09-14-production-always-on/stories/pao-s1-min-machines-running-one.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator running real work sessions against the live production app" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs (2 static config checks, 2 manual post-deploy verifications) |
| H3 | Every AC has at least one test/verification method | ✅ | AC1/AC2 verified by direct file inspection at commit time; AC3/AC4 are explicit manual post-deploy verification steps (no unit-testable code — this is a pure infra config change) |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track reliability fix — directly closes a gap confirmed via cross-referenced PostHog AI traces + production logs during the operator's own real work session, with explicit operator approval of the cost trade-off |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ N/A | No separate test-plan artefact — see H3; this is a config-only change with manual verification ACs, consistent with this repo's own CSS-layout-AC precedent (manual smoke test in lieu of automated coverage where automated coverage isn't the right tool) |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — explicitly scoped to production only (not staging), and explicitly a single-field change verified not to touch any other `fly.toml` setting |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Not a UI change |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Cost, Availability all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No code/adapter change at all — pure infra config |
| H-INF | Infra-plan gate | ✅ | This IS the infra-plan artefact for this change — `hasInfraTrack` conceptually applies but this repo's own gate-map doesn't require a separate document beyond this story for a single-field `fly.toml` change |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Manual verification steps (AC3/AC4) are the appropriate method for a config-only infra change | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | No test plan gap table — see H8 | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Keep production's single machine always running instead of scaling to zero -- artefacts/2026-09-14-production-always-on/stories/pao-s1-min-machines-running-one.md

Goal:
Change exactly one field in fly.toml. Do not add scope, behaviour, or
structure beyond what the ACs specify.

Constraints:
- In fly.toml, change http_service.min_machines_running from 0 to 1.
- Do NOT change auto_stop_machines, auto_start_machines,
  sticky_sessions, [http_service.concurrency], or [[vm]] -- verify the
  diff touches exactly one line.
- Do NOT touch fly.staging.toml -- explicitly out of scope.
- Append a decisions.md entry recording this as an architectural
  decision (per CLAUDE.md's own "decisions.md is mandatory" rule),
  referencing the 2026-08-31 capture-log entry this resolves.
- This is a state/artefact-adjacent infra change with real production
  deploy impact -- route it through the normal worktree -> PR -> merge
  path (not a direct-to-master bookkeeping commit) so it goes through
  the same CI gate as any other change, even though there's no app
  code to test.
- Open a draft PR when the diff is verified -- do not mark ready for
  review (mark ready immediately after opening, per this session's own
  established practice, given draft PRs cannot be merged on this repo).
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — the operator explicitly approved this specific change, with the specific cost trade-off, directly in conversation on 2026-09-14 after reviewing real Fly Cost Explorer billing data.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14 — operator approval: heymishy, 2026-09-14 (in-conversation)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
