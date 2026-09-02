# Definition of Ready: acdg-s2 — Add a Distinguishable Durability Signal for Stage-Completion Commits

**Feature:** Completed Stages Can Silently Lack Durable Git Backing (2026-09-01-artefact-commit-durability-gap)
**Story:** acdg-s2
**Test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s2-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-02

---

## Contract Proposal → Contract Review

See `artefacts/2026-09-01-artefact-commit-durability-gap/dor/acdg-s2-dor-contract.md`.

**Contract review:** ✅ PASS — the unified signal, reusing `ep1-s6`'s shared helper, directly implements AC1–AC4. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS (4 ACs) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (4 unit + 1 integration + 2 NFR) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Distinguishable Signal Coverage, Manual-Audit Elimination) |
| H6 | Complexity rated | ✅ PASS (Complexity: 1) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH, 0 MEDIUM, 2 LOW informational) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists `acdg-s1` (must be DoD-complete). `schemaDepends: [stage]` — this story's implementation timing depends on checking `acdg-s1.stage === 'definition-of-done'` in `pipeline-state.json` before starting, confirmed present in schema. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (0 HIGH; 1 LOW informational — same guardrails-coverage gap as `acdg-s1`) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable; pure backend logging, no UI |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS (NFR profile exists) |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (Internal) |
| H-NFR-profile | NFR profile presence | ✅ PASS |
| H-GOV | Approved By section | ✅ PASS (discovery.md's Approved By — same basis as `acdg-s1`) |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (no new injectable adapters — reuses `_logCrossChannelEvent`, an existing function) |
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
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — same RISK-ACCEPT basis as `acdg-s1` |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED ("None" gap table) |

---

## Oversight Level

**Epic-declared oversight:** Medium — self-acknowledged by the operator (Hamish King), same basis as `acdg-s1`.

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

```
STORY: acdg-s2 — Add a Distinguishable Durability Signal for Stage-Completion Commits

PRECONDITION: acdg-s1 must be DoD-complete before starting this story. Read
its PR description / DoD to learn the confirmed failure mode and the exact
reason text to log for artefact_commit_failed.

ACCEPTANCE CRITERIA:
AC1: Given a stage completes and its artefact commit succeeds, When
completeStage() proceeds, Then a [cross-channel] log line and PostHog event
with eventType "artefact_commit_succeeded" is emitted, including
featureSlug, stage, and timestamp.

AC2: Given a stage completes and its artefact commit fails (per acdg-s1's
fix, this now blocks completion), When the failure occurs, Then a
[cross-channel] log line and PostHog event with eventType
"artefact_commit_failed" is emitted, including featureSlug, stage,
timestamp, and a reason field describing the failure.

AC3: Given a stage completes for a feature whose product genuinely has no
connected repo, When the commit is skipped, Then a [cross-channel] log
line and PostHog event with eventType "artefact_commit_skipped" is
emitted, including featureSlug, stage, timestamp, and
reason: "no connected repo".

AC4: Given any of the 3 events above, When the log line is inspected, Then
it parses as valid JSON immediately after the "[cross-channel] " prefix.

SCOPE BOUNDARIES:
- Do NOT re-implement or modify acdg-s1's own guard-fix logic
- Do NOT build an operator-facing UI indicator
- Do NOT audit other artefact-write paths for the same pattern

You will wire 3 new _logCrossChannelEvent calls into journey.js's
handlePostGateConfirm, at the same call site acdg-s1 touches (the das-s1
commit-writer block). Reuse the shared helper exactly as ep1-s6 built it --
do not create a second logging mechanism.

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Confirm acdg-s1's DoD is complete; note the confirmed failure
   mode and reason text
2. Task 2: Wire artefact_commit_succeeded on the success path
3. Task 3: Wire artefact_commit_failed on the failure path (per acdg-s1's
   fix), with the confirmed reason text
4. Task 4: Wire artefact_commit_skipped on the genuine no-repo path
5. Task 5: Write the 4 unit tests, 1 integration test, 2 NFR tests from
   the test plan
6. Task 6: Full regression + sibling regression (acdg-s1's own tests,
   ep1-s5/ep1-s6's own tests for the shared helper)

VERIFICATION:
Run the test suite (7 tests from test plan).

NFR TARGETS:
- Fire-and-forget: logging/PostHog calls must not block or add latency
- No credentials or full artefact content in log lines

ARCHITECTURE CONSTRAINTS:
- MUST reuse ep1-s6's shared _logCrossChannelEvent helper -- do not build
  a parallel logging mechanism
- No new npm dependencies
- Open a draft PR when tests pass -- do not mark ready for review

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY:
None -- this is the last story in the epic. After this PR merges, both
stories' dodStatus should be complete and the epic's own status can move
to complete.

Oversight level: Medium
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

**Oversight level:** Medium
**Sign-off required:** No — Medium oversight requires tech lead awareness only, not a named sign-off. DoR artefact shared with the operator (Hamish King, Platform Owner) for awareness before proceeding.
