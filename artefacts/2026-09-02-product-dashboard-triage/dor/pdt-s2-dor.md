# Definition of Ready: pdt-s2 — Add a Triage Summary Strip for Blocked/Warning Counts

**Feature:** Product Dashboard Becomes Unreadable at Real-World Scale (2026-09-02-product-dashboard-triage)
**Story:** pdt-s2
**Test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s2-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-02

---

## Contract Proposal → Contract Review

See `artefacts/2026-09-02-product-dashboard-triage/dor/pdt-s2-dor-contract.md`.

**Contract review:** ✅ PASS — the strip, reusing existing computed health data and the existing filter mechanism, directly implements AC1–AC3. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS (3 ACs) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (3 unit + 2 NFR) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Time to First Actionable Content) |
| H6 | Complexity rated | ✅ PASS (Complexity: 1) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH, 0 MEDIUM, 1 LOW informational) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists "None" — no schema check required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (0 HIGH; 1 LOW informational) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (Internal) |
| H-NFR-profile | NFR profile presence | ✅ PASS |
| H-GOV | Approved By section | ✅ PASS |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (none introduced) |
| H-INF | Infra-plan check | ✅ PASS (hasInfraTrack: false) |
| H-MIG | Migration-review check | ✅ PASS (hasMigrationTrack: false) |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None" | ✅ ACKNOWLEDGED |
| W2 | Scope stability declared | ✅ ACKNOWLEDGED (Stable) |
| W3 | MEDIUM review findings | ✅ NOT APPLICABLE (none) |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — same RISK-ACCEPT basis as every prior story |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED |

---

## Oversight Level

**Epic-declared oversight:** Medium — self-acknowledged by the operator (Hamish King).

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

```
STORY: pdt-s2 — Add a Triage Summary Strip for Blocked/Warning Counts

ACCEPTANCE CRITERIA:
AC1: Given a product with >=1 Blocked or Warning item, When the operator
loads /products/:id, Then a summary strip renders above the feature list
showing the Blocked and Warning counts.

AC2: Given the strip shows a non-zero Blocked count, When clicked, Then
the page filters to Blocked items via the EXISTING health-filter-chip
mechanism -- do not build a second, parallel filter.

AC3: Given zero Blocked and zero Warning items, When loaded, Then the
strip shows a clear "nothing blocked" state, not empty or missing.

SCOPE BOUNDARIES:
- Do NOT build "stalled 30+ days" or "new this week" counts
- Do NOT modify the existing health-filter-chip mechanism itself

IMPLEMENTATION TASKS:
1. Task 1: Add the summary strip markup to _renderProductView, reading
   from the already-computed healthCounts object
2. Task 2: Wire the Blocked/Warning counts to link into the existing
   filter mechanism
3. Task 3: Add the zero-state message
4. Task 4: Write the 3 unit tests + 2 NFR tests

VERIFICATION:
Run the test suite (5 tests from test plan).

NFR TARGETS:
- No new query/computation -- reuses existing healthCounts
- Strip counts are real <a> elements, keyboard-operable

ARCHITECTURE CONSTRAINTS:
- Reuse healthCounts (via computeOverallHealthSignal), already computed
  in _renderProductView
- No new npm dependencies
- Open a draft PR when tests pass -- do not mark ready for review

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY:
None blocking.

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
