# Definition of Ready: acdg-s1 — Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Feature:** Completed Stages Can Silently Lack Durable Git Backing (2026-09-01-artefact-commit-durability-gap)
**Story:** acdg-s1
**Test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s1-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-02 — Revision 2, after root-cause investigation confirmed the real mechanism. Revision 1's sign-off is superseded — see `decisions.md`.

---

## Contract Proposal → Contract Review

See `artefacts/2026-09-01-artefact-commit-durability-gap/dor/acdg-s1-dor-contract.md` (Revision 2).

**Contract review:** ✅ PASS — the confirmed `journey.productId` cross-check directly implements AC1, AC2-revised, AC3-revised, AC4. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS (4 ACs: AC1, AC2-revised, AC3-revised, AC4) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (3 unit + 2 integration + 2 NFR covering AC1/AC2-revised/AC3-revised; AC4 satisfied directly by AC2-revised's own test) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (AC2 Guard Correctness) |
| H6 | Complexity rated | ✅ PASS (Complexity: 1, revised down from 2 — ambiguity resolved) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (Run 2: 0 HIGH, 0 MEDIUM, 1 LOW informational) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists "None" for upstream — no schema check required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (0 HIGH; 1 LOW carried forward, informational — guardrails registry doesn't cover `src/web-ui/`) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (Internal) |
| H-NFR-profile | NFR profile presence | ✅ PASS |
| H-GOV | Approved By section | ✅ PASS |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (no new injectable adapters — `journey.productId` is an existing field read, not an adapter) |
| H-INF | Infra-plan check | ✅ PASS (hasInfraTrack: false) |
| H-MIG | Migration-review check | ✅ PASS (hasMigrationTrack: false) |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None" | ✅ ACKNOWLEDGED |
| W2 | Scope stability declared | ✅ ACKNOWLEDGED (Stable) |
| W3 | MEDIUM review findings | ✅ NOT APPLICABLE (Run 2: none) |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — same RISK-ACCEPT basis as every prior story this session |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED (test plan's own gap table states "None") |

---

## Oversight Level

**Epic-declared oversight:** Medium — self-acknowledged by the operator (Hamish King).

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

```
STORY: acdg-s1 — Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)
[Revision 2 -- the real mechanism is confirmed, no further investigation needed]

ACCEPTANCE CRITERIA:
AC1 (regression-protection): Given a feature is linked to a repo-connected
product and ownerRepoForFeature resolves successfully, When the subsequent
commitArtefact call fails, Then completeStage() is NOT called and the
operator receives the existing artefact-commit-failed error response.
This path is already correct on unmodified code -- write the test, expect
it to PASS before your change, and confirm that in the PR description.

AC2-revised (the actual fix): Given a stage completes for a journey whose
journey.productId is set, When ownerRepoForFeature throws for any reason,
Then this is a genuine anomaly -- the operator receives a clear error and
completeStage() is NOT called.

AC3-revised (regression-protection): Given a stage completes for a journey
with NO productId set, When ownerRepoForFeature throws, Then the commit is
skipped and completeStage() proceeds normally with no error -- unchanged
behaviour.

AC4: A dedicated regression test (AC2-revised's own test) demonstrates the
fix reproduces and resolves the shape of new-feature-af17f555's own
historical incident. Name this test explicitly in the PR description.

SCOPE BOUNDARIES:
- Do NOT modify export-data-source.js, artefact-commit-writer.js,
  journey-store.js, or journey-store-pg.js -- all confirmed already
  correct/sufficient
- Do NOT backfill new-feature-af17f555's own 8 already-missing artefacts
- Do NOT add a retry/backoff mechanism
- Do NOT implement acdg-s2's logging signal -- separate story

THE FIX (single, confirmed change):
In journey.js's handlePostGateConfirm, the existing block:

  try {
    _dasOwnerRepo = await ownerRepoForFeature(journey.featureSlug, req.session.accessToken);
  } catch (_dasResolveErr) {
    _dasOwnerRepo = null; // AC4 (original): proceed unchanged
  }

becomes:

  try {
    _dasOwnerRepo = await ownerRepoForFeature(journey.featureSlug, req.session.accessToken);
  } catch (_dasResolveErr) {
    if (journey.productId) {
      // genuine anomaly: the journey believes it's linked to a product,
      // but resolution failed -- block and surface a clear error (AC2-revised)
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'artefact-commit-failed',
        message: 'Could not resolve the connected repository for this feature. The stage has NOT been marked complete -- fix the underlying issue and try again.',
        detail: _dasResolveErr && _dasResolveErr.message
      }));
      return;
    }
    _dasOwnerRepo = null; // genuinely no product link -- AC3-revised: proceed unchanged
  }

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Write the 3 unit tests (AC1, AC2-revised, AC3-revised) against
   CURRENT (unmodified) code first -- record which pass/fail
2. Task 2: Implement the fix exactly as specified above
3. Task 3: Write the 2 integration tests
4. Task 4: Write the 2 NFR tests
5. Task 5: Full regression suite + sibling regression (das-s1's own
   existing behaviour, ep1-s1 through ep1-s6's own test suites, given this
   touches the same journey.js file)

VERIFICATION:
Run the test suite (7 tests from test plan). Confirm AC1 passed on
unmodified code (regression-protection) and AC2-revised failed on
unmodified code, passed after the fix (the real fix).

NFR TARGETS:
- No meaningful latency increase
- No new credential handling
- This story's error path is synchronous and MUST block (unlike
  ep1-s5/ep1-s6's fire-and-forget logging pattern -- not applicable here)

ARCHITECTURE CONSTRAINTS:
- Preserve the exact AC3-revised (unset productId) behaviour -- do not
  change it
- No new npm dependencies
- Open a draft PR when tests pass -- do not mark ready for review

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY:
acdg-s2 depends on this story's DoD completion.

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
