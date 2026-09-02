# Definition of Ready: pdt-s1 — Consolidate the Epic/Phase List

**Feature:** Product Dashboard Becomes Unreadable at Real-World Scale (2026-09-02-product-dashboard-triage)
**Story:** pdt-s1
**Test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s1-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-02

---

## Contract Proposal → Contract Review

See `artefacts/2026-09-02-product-dashboard-triage/dor/pdt-s1-dor-contract.md`.

**Contract review:** ✅ PASS — removing the duplicate static list and defaulting groups to collapsed directly implements AC1–AC4. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS (4 ACs) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (5 unit + 2 NFR) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Time to First Actionable Content) |
| H6 | Complexity rated | ✅ PASS (Complexity: 2) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH; 1 MEDIUM resolved same session, 1 LOW informational) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists "None" for upstream — no schema check required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (0 HIGH; 1 LOW informational — guardrails registry doesn't cover `src/web-ui/`) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable; confirmed no layout-dependent ACs (Step 3a scan, test plan) |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (Internal) |
| H-NFR-profile | NFR profile presence | ✅ PASS |
| H-GOV | Approved By section | ✅ PASS (discovery.md's Approved By — Hamish King, Platform Owner) |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (no new injectable adapters) |
| H-INF | Infra-plan check | ✅ PASS (hasInfraTrack: false) |
| H-MIG | Migration-review check | ✅ PASS (hasMigrationTrack: false) |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None" | ✅ ACKNOWLEDGED |
| W2 | Scope stability declared | ✅ ACKNOWLEDGED (Stable) |
| W3 | MEDIUM review findings | ✅ ACKNOWLEDGED — resolved same session, see review report |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — same RISK-ACCEPT basis as every prior story this session |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED ("None" gap table) |

---

## Oversight Level

**Epic-declared oversight:** Medium — self-acknowledged by the operator (Hamish King).

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

```
STORY: pdt-s1 — Consolidate the Epic/Phase List

ACCEPTANCE CRITERIA:
AC1: Given a product with N epic/phase groups, When the operator loads
/products/:id, Then each group renders exactly once (no duplicate static
text rendering).

AC2: Given any epic/phase group, When the page first loads, Then that
group's rows are visually collapsed (client-side toggle, all data already
present in the rendered HTML -- not a new lazy-load fetch), showing only
title, count, and rolled-up status.

AC3: Given a collapsed group, When clicked, Then it expands to show its
rows -- native <details>/<summary> is an acceptable implementation.

AC4: Given a product with zero groups, When loaded, Then a clear empty
state renders, not a broken/blank section.

SCOPE BOUNDARIES:
- Do NOT change which stories belong to which group
- Do NOT persist collapse state across reloads
- Do NOT touch the By Module/By Phase/All tabs, health filters, search,
  or module editor's own functionality

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Remove the static epic/phase text-dump rendering block
2. Task 2: Change the interactive list's default row-visibility state to
   collapsed (prefer native <details>/<summary>)
3. Task 3: Add the zero-groups empty state
4. Task 4: Write the 5 unit tests + 2 NFR tests

VERIFICATION:
Run the test suite (7 tests from test plan).

NFR TARGETS:
- No response-size regression
- Collapse toggle keyboard-operable (native <details> satisfies this for
  free; a custom toggle needs tabindex/role/aria-expanded)

ARCHITECTURE CONSTRAINTS:
- Confirmed via discovery: _renderConsolidatedFeaturesSection/
  _renderProductView (src/web-ui/routes/products.js) are the correct
  target functions
- No new npm dependencies
- Open a draft PR when tests pass -- do not mark ready for review

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY:
None blocking -- pdt-s2 visually sits above this story's list but has no
hard dependency on it.

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
