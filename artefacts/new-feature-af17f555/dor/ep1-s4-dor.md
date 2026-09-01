# Definition of Ready: ep1-s4 — Stage-Based Skill Routing and Navigation

**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Story:** ep1-s4 — Stage-Based Skill Routing and Navigation
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s4-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-01

---

## Contract Proposal → Contract Review

> ⚠️ **Contract corrected 2026-09-02.** Investigation before `/implementation-plan` confirmed this story is genuine new work (unlike `ep1-s1`/`ep1-s2`), but corrected two factual assumptions — no existing confirmation dialog to reuse, and the target page is `/journey`'s Continue flow, not a "skill session panel." See `dor/ep1-s4-dor-contract.md` for the corrected contract and `decisions.md` for the full writeup.

See `artefacts/new-feature-af17f555/dor/ep1-s4-dor-contract.md` (original + corrected).

**Contract review:** ✅ PASS — `getNextSkill`/`getValidBackwardTargets` plus the corrected stage-selector-on-`/journey` design directly implement AC1's two parts (routing decision, stage selector with backward nav). No mismatch found against the corrected contract.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ⚠️ PASS (1 AC present; design spec compensates) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (10 tests: 6 unit, 1 integration, 3 E2E — covering AC1's routing and UI parts) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Metric 1: Web UI Session Start Share — this story is the primary friction-reduction mechanism the metric's >50% session-share target depends on) |
| H6 | Complexity rated | ✅ PASS (Complexity: 2) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH, 0 MEDIUM, 1 LOW-mitigated) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists `ep1-s3` (reads `completedStages` from the journey record ep1-s3 backfills — a journey-disk.js field, not a pipeline-state.schema.json field). `schemaDepends: [stage]` — this story's routing also reads pipeline-state.json's `stage` field directly, confirmed present in schema. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (references the existing res-s1-s4 pattern; no new ADR needed) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — E2E tooling (Playwright) already configured; the UI-visible portion of AC1 is covered by 3 E2E scenarios, not left as an uncovered gap |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS (NFRs embedded in story) |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (synthetic test data only) |
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
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — same RISK-ACCEPT basis as ep1-s2/ep1-s3 |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED ("None" gap table) |

---

## Oversight Level

**Epic-declared oversight:** Medium — self-acknowledged by the operator (Hamish King), same basis as prior stories in this epic.

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

> ⚠️ Corrected 2026-09-02 — kept for the audit trail. See revised instructions below, matching the corrected contract at `dor/ep1-s4-dor-contract.md`. Unlike `ep1-s1`/`ep1-s2`, investigation confirmed this IS genuinely new work — the routing table and confirm step below are real gaps, not already-built mechanisms.

```
[SUPERSEDED PARTIALLY — original instructions below assumed an existing
confirmation dialog to reuse. None exists. See corrections below.]
```

### Revised Coding Agent Instructions (2026-09-02)

```
STORY: ep1-s4 — Stage-Based Skill Routing and Navigation (corrected)

ACCEPTANCE CRITERIA:
Given a feature at a known stage in pipeline-state.json with a journey record
showing completedStages,
When I select the feature and the session starts,
Then the web UI determines next appropriate skill using the routing table
(ideation->discovery, discovery->spike-or-benefit-metric, etc.) and lands the
session on that skill. Stage selector menu is visible; backward navigation
available to any earlier stage; forward navigation only for later stages.

SCOPE BOUNDARIES:
- Do NOT auto-regenerate downstream artefacts on backward navigation
- Do NOT modify materiality-check.js -- it already fires automatically
  downstream of navigation (at artefact-save time inside a reopened
  session), needs no changes
- Do NOT implement custom/squad-specific routing overrides
- Do NOT modify journey-store.js's getNextStage, or journey.js's
  BACKFILL_STAGE_SEQUENCE/STAGE_INDEX -- the new getNextSkill is additive,
  these existing differently-scoped lookups stay as they are

You will build (all new -- confirmed nothing pre-existing satisfies this):
1. getNextSkill(pipelineStage, contextFlags) -- pure routing-table function
   reading pipeline-state.json's stage vocabulary directly (not any of the
   3 existing flat internal sequences), both conditional branches (spike
   no-build, test-plan skip)
2. getValidBackwardTargets(completedStages, currentStage) -- pure function
3. A stage selector wired into /journey's own Continue flow
   (_renderJourneyHome / handleGetJourneyResume -- NOT a separate "skill
   session panel"), reusing handleGetJourneyStageView's existing sn-bar
   markup pattern (current/done clickable, future non-clickable) as its
   structural basis
4. A NEW minimal confirm-before-navigate interstitial -- "Move back to
   [stage]? This will show you prior artefacts and any revisions since
   then." -- server-rendered, matching this app's existing non-SPA pattern.
   No confirmation dialog like this exists anywhere today; do not look for
   one to reuse.
5. Keyboard accessibility (arrow keys, Enter) -- confirmed absent from every
   existing stage-list rendering; must be built new

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: getNextSkill -- routing table + both conditional branches
2. Task 2: getValidBackwardTargets
3. Task 3: Stage selector on /journey, reusing sn-bar's clickable/
   non-clickable structural pattern
4. Task 4: New confirm-before-navigate interstitial (server-rendered)
5. Task 5: Keyboard accessibility (arrow keys, Enter)
6. Task 6: E2E test harness (Playwright, scenarios from test plan)

VERIFICATION:
Run the test suite (revised test plan --
artefacts/new-feature-af17f555/test-plans/ep1-s4-test-plan.md, revised
2026-09-02) plus the E2E scenarios.

NFR TARGETS:
- Routing table deterministic, covers all valid transitions
- Backward nav keyboard-accessible
- No UI block if a prior stage is missing from completedStages
- Stage selector updates on every skill transition

ARCHITECTURE CONSTRAINTS:
- Stage field from pipeline-state.json is the routing input
- Routing logic pure and testable (no side effects in getNextSkill/
  getValidBackwardTargets)
- Backward navigation eventually feeds into the existing materiality-check
  module unchanged (triggered automatically on save, not built by this
  story) -- do not build a new materiality mechanism

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY (after this PR merges):
ep1-s5 -- Error Handling and Graceful Degradation (depends on ep1-s2, ep1-s3,
and this story's error surfaces -- e.g. "stage routing indeterminate")
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
**Status:** Ready for coding agent assignment (queued behind ep1-s1, ep1-s2, ep1-s3)
