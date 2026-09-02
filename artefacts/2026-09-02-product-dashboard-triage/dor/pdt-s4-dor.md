# Definition of Ready: pdt-s4 — Fix the Story-Detail Dead End With a Breadcrumb and Back Link

**Feature:** Product Dashboard Becomes Unreadable at Real-World Scale (2026-09-02-product-dashboard-triage)
**Story:** pdt-s4
**Test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s4-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-02

---

## Contract Proposal → Contract Review

See `artefacts/2026-09-02-product-dashboard-triage/dor/pdt-s4-dor-contract.md`.

**Contract review:** ✅ PASS — the breadcrumb (Product via existing `productId`, Phase/Epic via a new reverse lookup with graceful degradation) directly implements AC1/AC1a/AC2/AC3. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS (4 ACs: AC1, AC1a, AC2, AC3) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (3 unit + 2 integration + 2 NFR) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Time to First Actionable Content) |
| H6 | Complexity rated | ✅ PASS (Complexity: 2, revised after /review) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH; 1 MEDIUM resolved same session, 1 LOW informational) |
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
| W3 | MEDIUM review findings | ✅ ACKNOWLEDGED — resolved same session, see review report |
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
STORY: pdt-s4 — Fix the Story-Detail Dead End With a Breadcrumb and Back Link

ACCEPTANCE CRITERIA:
AC1: Given a story's feature slug resolves to a real journey with a
productId, When the operator loads its detail page, Then it shows a
breadcrumb with the product name, using journeyForPage.productId (already
available -- see alrf-s10's own use of the same field).

AC1a: Given a story is a nested story ID within another feature's
epics[].stories[] (e.g. dic.5), When its detail page loads, Then the
breadcrumb includes the resolved Phase/Epic name if a reverse lookup
finds it, or gracefully omits that segment otherwise -- never a silent
failure or broken breadcrumb.

AC2: Given the breadcrumb shows a Product segment, When clicked, Then the
operator is taken back to that product's page.

AC3: Given a story has no artefacts yet, When its detail page loads, Then
it shows whatever breadcrumb segments ARE resolvable AND the existing
"No artefacts found" message together -- never a bare, context-free page.

SCOPE BOUNDARIES:
- Do NOT redesign the artefact-content display itself
- Do NOT build a full performance/load test of the reverse lookup --
  correctness only for this MVP

CONFIRMED FACTS (from /review's own code investigation -- do not
re-litigate):
- journeyForPage.productId is ALREADY available via
  _journeyStore.getJourneyByFeatureSlug(featureSlug) -- zero new lookup
  for the Product segment
- NO reverse lookup from story ID to parent feature/epic exists anywhere
  in the codebase today -- this is genuinely new work for AC1a

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Add the Product breadcrumb segment using journeyForPage.productId
2. Task 2: Build the reverse lookup (story ID -> parent feature/epic) --
   implementation approach (linear scan vs. precomputed index) is your
   own call, the ACs test observable behaviour only
3. Task 3: Wire the Phase/Epic segment with graceful degradation
4. Task 4: Wire the "Back to product" link, tested by AC2
5. Task 5: Write the 3 unit tests + 2 integration tests + 2 NFR tests

VERIFICATION:
Run the test suite (7 tests from test plan).

NFR TARGETS:
- No new query for the Product segment (reuses existing journeyForPage
  lookup)
- Breadcrumb links are real, keyboard-navigable <a> elements

ARCHITECTURE CONSTRAINTS:
- Product segment: reuse journeyForPage.productId, zero new lookup
- Phase/Epic segment: new reverse lookup over already-loaded pipeline-
  state data, not a new per-request network call
- No new npm dependencies
- Open a draft PR when tests pass -- do not mark ready for review

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY:
None -- this is the last story in the epic. After this PR merges, all 4
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
