# Definition of Ready: pdt-s3 — De-emphasize Unknown Health Visually

**Feature:** Product Dashboard Becomes Unreadable at Real-World Scale (2026-09-02-product-dashboard-triage)
**Story:** pdt-s3
**Test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s3-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-02

---

## Contract Proposal → Contract Review

See `artefacts/2026-09-02-product-dashboard-triage/dor/pdt-s3-dor-contract.md`.

**Contract review:** ✅ PASS — the styling-only change directly implements AC1–AC3 without touching the out-of-scope health-computation logic. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS (3 ACs) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (3 unit + 1 NFR) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Health-Signal Trustworthiness) |
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
STORY: pdt-s3 — De-emphasize Unknown Health Visually

ACCEPTANCE CRITERIA:
AC1: Given an item with Unknown health, When it renders, Then it displays
in quiet grey text without a colored badge background.

AC2: Given an item with real Healthy/Warning/Blocked health, When it
renders alongside Unknown items, Then its colored badge is unchanged.

AC3: Given the top-level "Overall:" line, When the product's own overall
signal is itself unknown, Then that line also uses the de-emphasized
treatment, not a competing colored badge.

SCOPE BOUNDARIES:
- Do NOT change computeHealthCounts or any health-computation logic --
  styling/rendering only

IMPLEMENTATION TASKS:
1. Task 1: Update HEALTH_COLORS/HEALTH_LABELS mapping for the 'unknown'
   case (per-item badges)
2. Task 2: Apply the same treatment to the Overall summary line's own
   unknown-signal case
3. Task 3: Write the 3 unit tests + 1 NFR (contrast-ratio) test

VERIFICATION:
Run the test suite (4 tests from test plan).

NFR TARGETS:
- Muted treatment must meet WCAG 2.1 AA contrast (4.5:1) against the page
  background -- not so faint it's illegible

ARCHITECTURE CONSTRAINTS:
- Pure styling change to HEALTH_COLORS/HEALTH_LABELS and badge markup
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
