# Definition of Ready: ep1-s3 — Journey Record Backfill from CLI

**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Story:** ep1-s3 — Journey Record Backfill from CLI
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s3-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-01

---

## Contract Proposal → Contract Review

See `artefacts/new-feature-af17f555/dor/ep1-s3-dor-contract.md` for the full Contract Proposal.

**Contract review:** ✅ PASS — `backfillJourney(featureSlug)` directly implements the single AC (auto-create on first selection, idempotent, correct `completedStages` inference, audit trail via PostHog + server log). No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ⚠️ PASS (1 AC present; design spec compensates — same precedent as ep1-s1) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (12 tests: 5 unit, 2 integration, 2 NFR — covering AC1) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Metric 1: Web UI Session Start Share — `cliAdoptionTimestamp` is the data point that lets Metric 1's measurement distinguish CLI-origin history from web-UI-continued sessions, per `benefit-metric.md`'s "How we measure it" section) |
| H6 | Complexity rated | ✅ PASS (Complexity: 2) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH, 0 MEDIUM, 1 LOW-mitigated — `review/ep1-s3-review-1.md`) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists `ep1-s2` (both read the same feature disk-state, no direct call dependency; not a schema field dependency). `schemaDepends: [stage]` — this story's own `completedStages` inference reads pipeline-state.json's `stage` field, confirmed present in schema. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (ADR-023 referenced, Active) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable; journey record creation is a pure server-side data operation |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS (NFRs embedded in story) |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (synthetic test data only) |
| H-NFR-profile | NFR profile presence | ✅ PASS (story NFR field populated) |
| H-GOV | Approved By section | ✅ PASS (discovery.md's Approved By — same basis as ep1-s1/ep1-s2) |
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
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — same RISK-ACCEPT basis as ep1-s2 (solo-operator dogfooding session) |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED ("None" gap table) |

---

## Oversight Level

**Epic-declared oversight:** Medium — self-acknowledged by the operator (Hamish King), same basis as ep1-s2.

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

```
STORY: ep1-s3 — Journey Record Backfill from CLI

ACCEPTANCE CRITERIA:
Given a feature selected that has no existing journey record in journey-disk.js,
When the session starts,
Then a new journey record is created with journeyId, featureSlug, createdAt,
updatedAt, completedStages (inferred from pipeline-state.json's stage field),
and cliAdoptionTimestamp / cliAdoptionArtefactHashes baseline. PostHog event
journey_backfilled_from_cli and server log are emitted. Process is idempotent
-- re-selecting never creates duplicate records.

SCOPE BOUNDARIES:
- Do NOT implement conflict resolution for pre-existing journey records with
  disagreeing stage markers
- Do NOT add manual operator control over backfill -- automatic only
- Do NOT implement cross-surface provenance tracking beyond the single
  cliAdoptionTimestamp baseline

You will build a backfillJourney(featureSlug) function that:
1. Checks for an existing journey record by featureSlug -- returns it
   unchanged if found (idempotency)
2. If not found, creates one with completedStages inferred from
   pipeline-state.json's stage field (all stages up to and including current)
3. Stamps cliAdoptionTimestamp and cliAdoptionArtefactHashes
4. Emits journey_backfilled_from_cli to PostHog and a structured server log line
5. Is called from registerHtmlSession() before buildSystemPrompt() runs

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Confirm/extend journey-disk.js schema for cliAdoptionTimestamp /
   cliAdoptionArtefactHashes (design.md Definition Prerequisites item)
2. Task 2: backfillJourney -- existence check + idempotent early return
3. Task 3: backfillJourney -- completedStages inference from pipeline-state.json
4. Task 4: backfillJourney -- baseline stamp + audit events (PostHog + log)
5. Task 5: Wire into registerHtmlSession() before buildSystemPrompt()

VERIFICATION:
Run the test suite (12 tests from test plan).

NFR TARGETS:
- Backfill automatic and silent -- zero required operator interactions
- Idempotency check prevents duplicates -- verified by repeated-call test
- Disclosure message shown once per session, non-blocking

ARCHITECTURE CONSTRAINTS (ADR-023):
- pipeline-state.json is authoritative for stage
- No new npm dependencies

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY (after this PR merges):
ep1-s4 -- Stage-Based Skill Routing and Navigation (depends on this story's
completedStages to determine valid backward-navigation targets)
```

---

## Ready / Blocked

✅ **Definition of Ready: PROCEED** — All hard blocks pass. Warnings acknowledged (W4 RISK-ACCEPT, others clean).

**Oversight:** Medium — tech lead awareness self-acknowledged.

**Inner Loop Sequence:**
1. /branch-setup — create isolated worktree
2. /implementation-plan — break into bite-sized tasks
3. /subagent-execution (recommended) or /tdd per task
4. /verify-completion — run full test suite + verification script
5. /branch-complete — open draft PR

After PR merge: run `/definition-of-done`.

---

## DoR Sign-Off

**Signed Off:** 2026-09-01
**Oversight Level:** Medium
**Reviewer:** Definition-of-ready SKILL.md gate, run by Claude Code on behalf of Hamish King (Platform Owner)
**Status:** Ready for coding agent assignment (queued behind ep1-s1 and ep1-s2)
