# Definition of Ready: ep1-s5 — Error Handling and Graceful Degradation

**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Story:** ep1-s5 — Error Handling and Graceful Degradation
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s5-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-01

---

## Contract Proposal → Contract Review

See `artefacts/new-feature-af17f555/dor/ep1-s5-dor-contract.md`.

**Contract review:** ✅ PASS — the per-condition error boundary + logging + single disclosure model directly implements AC1's five named error conditions and the non-blocking degradation requirement. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ⚠️ PASS (1 AC present, covering 5 named error conditions; design spec compensates — same precedent as prior stories) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (11 tests: 8 unit, 3 integration — covering AC1) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Metric 2: Feature Discoverability — Load Success Rate, ≥95% target, and Metric 3: Handoff Context Load Success, ≥98% target — this story's graceful degradation is the mechanism that keeps failures from tanking either rate) |
| H6 | Complexity rated | ✅ PASS (Complexity: 1) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH, 0 MEDIUM, 1 LOW-mitigated) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists `ep1-s2, ep1-s3, ep1-s4` (this story wraps their call sites, not a schema field read). `schemaDepends: [stage]` — error logging includes pipeline-state.json's `stage` field, confirmed present in schema. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (ADR-009 referenced — error handling preserves injectable adapter pattern, errors caught not propagated — Active) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable; disclosure is plain text, verifiable without a real browser (see test plan's E2E Analysis) |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS (NFRs embedded in story) |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (synthetic test data only) |
| H-NFR-profile | NFR profile presence | ✅ PASS (story NFR field populated) |
| H-GOV | Approved By section | ✅ PASS (discovery.md's Approved By — same basis as prior stories) |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS — this story explicitly preserves ADR-009's injectable adapter pattern (errors caught, not propagated) rather than introducing a new adapter; no new `setX()` function is introduced |
| H-INF | Infra-plan check | ✅ PASS (hasInfraTrack: false) |
| H-MIG | Migration-review check | ✅ PASS (hasMigrationTrack: false) |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None" | ✅ ACKNOWLEDGED (populated) |
| W2 | Scope stability declared | ✅ ACKNOWLEDGED (Stable) |
| W3 | MEDIUM review findings | ✅ NOT APPLICABLE (none) |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — same RISK-ACCEPT basis as prior stories in this epic |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED ("None" gap table) |

---

## Oversight Level

**Epic-declared oversight:** Medium — self-acknowledged by the operator (Hamish King), same basis as prior stories.

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

```
STORY: ep1-s5 — Error Handling and Graceful Degradation

ACCEPTANCE CRITERIA:
Given any error: pipeline-state.json unreachable, artefact file missing,
artefact file unreadable, journey backfill fails, stage routing indeterminate,
When error occurs,
Then web UI logs error to server stdout and PostHog, excludes affected
component, allows session to start. Operator receives minimal, non-blocking
disclosure if critical data missing (e.g., "Feature history incomplete --
some prior artefacts could not be loaded.").

SCOPE BOUNDARIES:
- Do NOT implement automatic retry or exponential backoff
- Do NOT implement a user-initiated "reload artefacts" button
- Do NOT implement an admin error-monitoring dashboard
- Do NOT implement email/Slack alerting

You will build an error-handling wrapper layer that:
1. Catches each of the 5 named error conditions at its own call site
   (ep1-s1's pipeline-state read, ep1-s2's artefact resolution, ep1-s3's
   journey backfill, ep1-s4's stage routing)
2. Logs featureSlug, stage, errorType, timestamp to server stdout for every
   caught error
3. Emits a fire-and-forget PostHog event (artefact_load_error,
   journey_backfill_error, or stage_routing_error) -- a PostHog failure
   itself must never block session start
4. Shows exactly one combined disclosure message in the session header when
   critical data is missing -- never a stack of repeated messages

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Error boundary around ep1-s1's pipeline-state.json read
2. Task 2: Error boundary around ep1-s2's artefact resolution (per-file,
   not per-stage -- one bad file must not drop the whole stage's artefacts)
3. Task 3: Error boundary around ep1-s3's journey backfill
4. Task 4: Error boundary around ep1-s4's stage routing
5. Task 5: Combined, deduplicated operator disclosure in session header
6. Task 6: PostHog fire-and-forget wiring (3 event types)

VERIFICATION:
Run the test suite (11 tests from test plan).

NFR TARGETS:
- No error blocks session start (0 of the 5 conditions may prevent a session
  from starting)
- All errors logged with context
- Operator messages are one-liners, non-blocking, in the session header

ARCHITECTURE CONSTRAINTS (ADR-009):
- Error handling preserves the injectable adapter pattern -- errors are
  caught, never propagated as uncaught exceptions
- No new npm dependencies

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY (after this PR merges):
ep1-s6 -- Audit Logging and PostHog Instrumentation (depends on ep1-s1
through this story's error events, which it extends into full instrumentation)
```

---

## Ready / Blocked

✅ **Definition of Ready: PROCEED** — All hard blocks pass. Warnings acknowledged.

**Oversight:** Medium — tech lead awareness self-acknowledged.

**Inner Loop Sequence:**
1. /branch-setup
2. /implementation-plan
3. /subagent-execution (recommended) or /tdd per task
4. /verify-completion
5. /branch-complete

After PR merge: run `/definition-of-done`.

---

## DoR Sign-Off

**Signed Off:** 2026-09-01
**Oversight Level:** Medium
**Reviewer:** Definition-of-ready SKILL.md gate, run by Claude Code on behalf of Hamish King (Platform Owner)
**Status:** Ready for coding agent assignment (queued behind ep1-s1 through ep1-s4)
