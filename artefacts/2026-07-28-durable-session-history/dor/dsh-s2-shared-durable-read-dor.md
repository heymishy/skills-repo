# Definition of Ready: dsh-s2 — A single, tenant-scoped read path for a completed stage's turns

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s2-shared-durable-read.md
**Test plan reference:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s2-shared-durable-read-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | Technical Enabler framing, honest per template guidance |
| H2 | ≥3 ACs in G/W/T | ✅ | 5 |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | |
| H5 | Benefit linkage names a metric | ✅ | Indirect linkage, explicitly labelled per Technical Enabler section |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ N/A | Upstream dependency (dsh-s1) is a database table, not a pipeline-state.schema.json field — H8-ext's premise doesn't match this context |
| H9 | Architecture Constraints, no Cat E HIGH | ✅ | ADR-025/027 cited |
| H-E2E | Layout-dependent gap check | ✅ | None |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | No external regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-GOV | Discovery Approved By populated | ✅ | Same as dsh-s1 |
| H-ADAPTER | N/A | ✅ N/A | No new `setX()` adapter — reuses dsh-s1's |

---

## Warnings

All resolved (same basis as dsh-s1: W4 confirmed by operator, W1/W2/W3/W5 satisfied).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: dsh-s2 — A single, tenant-scoped read path for a completed stage's turns — artefacts/2026-07-28-durable-session-history/stories/dsh-s2-shared-durable-read.md
Test plan: artefacts/2026-07-28-durable-session-history/test-plans/dsh-s2-shared-durable-read-test-plan.md

Goal:
Make every test in the test plan pass. This is a Technical Enabler story — see
its own "Technical Enabler" section before implementing; it has no independent
UI surface.

Constraints:
- Add getTurnsForStage(journeyId, skillName, requestingSession) to the SAME
  adapter module dsh-s1 created (src/web-ui/adapters/session-turns-pg.js) —
  do not introduce a second, parallel adapter for reads.
- Must enforce the existing requireJourneyAccess/isSameTenant guard exactly as
  used elsewhere in this codebase — return null on cross-tenant/not-found, let
  the caller map that to a 404 (FORBIDDEN-vs-NOT_FOUND policy, CLAUDE.md).
- Prefer in-memory session data over Postgres when both exist (freshest wins).
- Do not implement archive-tier fallback — that's dsh-s6, a later story.
- Security standards: parameterised queries only; deny-by-default access.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — solo-operator posture.
**Signed off by:** Hamish King — Platform owner — 2026-07-28
