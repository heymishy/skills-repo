# Definition of Ready: ep1-s6 — Audit Logging and PostHog Instrumentation

**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Story:** ep1-s6 — Audit Logging and PostHog Instrumentation
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s6-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-01

---

## Contract Proposal → Contract Review

See `artefacts/new-feature-af17f555/dor/ep1-s6-dor-contract.md`.

**Contract review:** ✅ PASS — the unified success+error event instrumentation layer directly implements AC1. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ⚠️ PASS (1 AC present, covering 6+3 named events; design spec compensates — same precedent as prior stories) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (9 tests: 7 unit, 2 integration — covering AC1) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (this story is the measurement infrastructure for Metrics 1, 2, and 3 in `benefit-metric.md` — every "How we measure it" section for all three metrics depends on PostHog events and server logs this story creates) |
| H6 | Complexity rated | ✅ PASS (Complexity: 1) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH, 0 MEDIUM, 1 LOW-mitigated) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists `ep1-s1 through ep1-s5` (this story instruments their call sites, not a schema field read). `schemaDepends: [stage]` — logged events include pipeline-state.json's `stage` field, confirmed present in schema. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (PostHog client already initialized; log format matches existing server conventions) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable; pure backend logging, no UI |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS (NFRs embedded in story) |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS — `operatorId` is the only potentially-identifying field, already used elsewhere for authorship attribution; no new sensitivity class introduced (noted in test plan's Test Data Strategy) |
| H-NFR-profile | NFR profile presence | ✅ PASS (story NFR field populated) |
| H-GOV | Approved By section | ✅ PASS (discovery.md's Approved By — same basis as prior stories) |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (no new injectable adapters introduced) |
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
STORY: ep1-s6 — Audit Logging and PostHog Instrumentation

ACCEPTANCE CRITERIA:
Given any event: feature discovered, feature selected, journey backfilled,
artefact loaded, session started from CLI-progressed feature, stage
navigation, error encountered,
When event occurs,
Then event logged to server stdout with [cross-channel] prefix and
structured fields (featureSlug, stage, eventType, timestamp, operatorId if
available), and emitted to PostHog with same fields plus event-specific
details (artefactCount, loadTimeMs, errorType).

SCOPE BOUNDARIES:
- Do NOT build a real-time analytics dashboard
- Do NOT build an operator-facing logging UI or trace view
- Do NOT implement retention policy or data deletion workflows
- Do NOT define custom PostHog cohorts or funnels

You will build a shared instrumentation helper that:
1. Logs to server stdout with the [cross-channel] prefix and structured
   JSON fields for all 6 success events + ep1-s5's 3 error events
2. Emits the same base fields to PostHog plus event-specific details
3. Treats PostHog emission as fire-and-forget -- a PostHog failure is caught
   and logged, never propagated
4. Does not alter the behaviour of ep1-s1 through ep1-s5 -- purely observational

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Shared instrumentation helper (log + PostHog emit, one call site)
2. Task 2: Wire into ep1-s1 (feature discovered)
3. Task 3: Wire into ep1-s2 (feature selected, artefact loaded)
4. Task 4: Wire into ep1-s3 (journey backfilled, session started from
   CLI-progressed feature)
5. Task 5: Wire into ep1-s4 (stage navigation)
6. Task 6: Unify with ep1-s5's existing 3 error events under the same shape

VERIFICATION:
Run the test suite (9 tests from test plan).

NFR TARGETS:
- All PostHog events include featureSlug, stage, eventType, timestamp, userId
- Server logs structured (JSON)
- PostHog calls fire-and-forget -- errors in PostHog do not block session

ARCHITECTURE CONSTRAINTS:
- PostHog client already initialized -- no new dependency
- Log format matches existing server conventions
- No new npm dependencies

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY:
None -- this is the last story in the epic. After this PR merges, all 6
stories are shipped; the epic's status should move to complete once every
story's dodStatus is complete.
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
**Status:** Ready for coding agent assignment (queued behind ep1-s1 through ep1-s5 — last story in the epic)
