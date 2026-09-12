# Definition of Ready Checklist

## Definition of Ready: Add journeyId and timestamp fields to the artefact-save/materiality-check audit log events

**Story reference:** artefacts/2026-09-12-res-s2-audit-log-fields/stories/ral-s1-audit-log-journey-id-and-timestamp.md
**Test plan reference:** artefacts/2026-09-12-res-s2-audit-log-fields/test-plans/ral-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator auditing artefact-revision activity in production logs" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 4/4 |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Closes `res-s2`'s own DoD-recorded NFR gap |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — three named log call sites, no new events |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Backend-only, logging-only story |
| H-NFR | NFR profile or explicit "None" field | ✅ | Security/Audit explicitly addressed; Performance/Accessibility N/A |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No new data classification introduced |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — existing `console.info`/`console.warn` calls only |
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
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Small, fully self-verifying logging fix (tests either pass or fail) | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[web-ui, security, audit]`
**Matched standards files:** none additional beyond `res-s2`'s own already-matched set

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add journeyId and timestamp fields to the artefact-save/materiality-check audit log events — artefacts/2026-09-12-res-s2-audit-log-fields/stories/ral-s1-audit-log-journey-id-and-timestamp.md
Test plan: artefacts/2026-09-12-res-s2-audit-log-fields/test-plans/ral-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- src/web-ui/routes/skills.js only -- three existing log call sites
  (artefact_auto_amended/artefact_auto_saved, materiality_check_hook_failed).
  No new events, no change to console.info/console.warn method choice.
- journeyId must be session.journeyId || null -- never throw on a
  session with no journey.
- timestamp must be a real new Date().toISOString() call at the point
  the event fires.
- Do not touch artefact_path_traversal_rejected or artefact_disk_save_failed.
- Re-run tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
  unmodified -- all tests must still pass.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, well-scoped logging fix using an already-proven test harness, operator explicitly requested this backlog item be worked)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
