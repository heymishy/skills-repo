# Definition of Ready: acdg-s1 — Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Feature:** Completed Stages Can Silently Lack Durable Git Backing (2026-09-01-artefact-commit-durability-gap)
**Story:** acdg-s1
**Test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s1-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-02

---

## Contract Proposal → Contract Review

See `artefacts/2026-09-01-artefact-commit-durability-gap/dor/acdg-s1-dor-contract.md`.

**Contract review:** ✅ PASS — the proposed implementation (investigate → fix the confirmed path → preserve AC4 → test all 4 outcome paths) directly aligns with every AC. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS (5 ACs: AC1, AC2, AC2a, AC3, AC4) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (4 unit + 2 integration + 2 NFR covering AC1–AC3; AC4 covered via explicit DoD cross-reference gap entry, consistent with this template's own gap-handling convention) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (AC2 Guard Correctness) |
| H6 | Complexity rated | ✅ PASS (Complexity: 2) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH; 2 MEDIUM both resolved same-session — see review report's Post-review resolution) |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies lists "None" for upstream — no schema check required. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (0 HIGH in Category E; 1 LOW, informational — guardrails registry doesn't cover `src/web-ui/`) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable; no layout-dependent ACs, pure backend logic |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS (NFR profile exists at `nfr-profile.md`) |
| H-NFR2 | Compliance sign-off | ✅ PASS (not applicable — no named regulatory clause) |
| H-NFR3 | Data classification | ✅ PASS (Internal) |
| H-NFR-profile | NFR profile presence | ✅ PASS (story NFRs populated, profile exists) |
| H-GOV | Approved By section | ✅ PASS (discovery.md's Approved By: Hamish King — Platform Owner — 2026-09-02) |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (no new injectable adapters introduced — `commitArtefact`/`ownerRepoForFeature` are plain module-export functions, not `setX()`-style adapters) |
| H-INF | Infra-plan check | ✅ PASS (hasInfraTrack: false) |
| H-MIG | Migration-review check | ✅ PASS (hasMigrationTrack: false) |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None" | ✅ ACKNOWLEDGED (populated) |
| W2 | Scope stability declared | ✅ ACKNOWLEDGED (Stable) |
| W3 | MEDIUM review findings | ✅ ACKNOWLEDGED — both 1-M1 and 1-M2 were resolved same-session by revising the story directly (not deferred), see review report |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — not yet reviewed by a domain expert; RISK-ACCEPT basis matches every prior story in this repo's recent history (solo operator serves both roles) |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED (gap table's one entry — AC4's DoD cross-reference — has an explicit handling decision, not left uncertain) |

---

## Oversight Level

**Epic-declared oversight:** Medium — tech lead awareness required (self-acknowledged by the operator, Hamish King, same basis as every story in the just-shipped `new-feature-af17f555` epic).

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

```
STORY: acdg-s1 — Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

ACCEPTANCE CRITERIA:
AC1: Given a feature is linked to a repo-connected product and ownerRepoForFeature
resolves successfully, When the subsequent commitArtefact call fails, Then
completeStage() is NOT called and the operator receives the existing
artefact-commit-failed error response. Implementation must first confirm
whether commitArtefact genuinely throws (regression-protection AC) or
swallows failures internally (the actual fix site, in that case).

AC2: Given ownerRepoForFeature THROWS while resolving despite a genuinely
valid link, When a stage is completed, Then the operator receives a clear
error and completeStage() is NOT called.

AC2a: Given ownerRepoForFeature returns falsy WITHOUT throwing despite a
genuinely valid link, When a stage is completed, Then the operator receives
a clear error and completeStage() is NOT called.

AC3: Given a feature's product genuinely has no connected repo, When a
stage is completed, Then the commit is skipped and completeStage() proceeds
normally with no error — unchanged regression-protected behaviour.

AC4: Given the specific failure mode is confirmed during implementation,
Then a named regression test exists that would have caught it — record
which of AC1/AC2/AC2a's tests actually failed on unmodified code in the
PR description and DoD.

SCOPE BOUNDARIES:
- Do NOT backfill new-feature-af17f555's own 8 already-missing artefacts
- Do NOT add a retry/backoff mechanism
- Do NOT implement acdg-s2's logging signal — separate story

INVESTIGATION STEP (do this first, before writing any fix):
Read src/web-ui/adapters/artefact-commit-writer.js and
src/web-ui/adapters/export-data-source.js in full. Determine which of the
3 candidate failure sub-modes (AC1/AC2/AC2a) is the actual root cause.
State the finding explicitly in the PR description before writing the fix.

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Read and understand ownerRepoForFeature and commitArtefact's
   actual implementations; confirm the root cause
2. Task 2: Write the 4 unit tests (AC1, AC2, AC2a, AC3) against CURRENT
   (unmodified) code first — record which pass/fail before any fix
3. Task 3: Implement the fix for the confirmed failure path
4. Task 4: Write the 2 integration tests
5. Task 5: Write the 2 NFR tests (call-order assertion; manual code-review
   note for the security NFR, documented in the PR rather than automated)
6. Task 6: Full regression suite + sibling regression (das-s1's own
   existing behaviour, ep1-s1 through ep1-s6's own test suites, given this
   touches the same journey.js file)

VERIFICATION:
Run the test suite (8 tests from test plan). Confirm AC4 by naming the
specific test(s) that failed on unmodified code in the PR description.

NFR TARGETS:
- No meaningful latency increase (resolve-then-commit already synchronous)
- No new credential handling
- Fire-and-forget is NOT applicable to this story (that's acdg-s2's
  logging layer) — this story's error responses ARE synchronous and
  MUST block, unlike ep1-s5/ep1-s6's fire-and-forget logging pattern

ARCHITECTURE CONSTRAINTS:
- Preserve das-s1's existing AC4 behaviour exactly — do not change the
  genuine no-repo skip path
- No new npm dependencies
- Open a draft PR when tests pass — do not mark ready for review
- If investigation reveals a 4th failure sub-mode not covered by any
  current AC, add a PR comment describing it and do not mark ready for
  review — this needs a return to /definition, not a silent workaround

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY:
acdg-s2 depends on this story's DoD completion — its "failed" event
should log the real reason confirmed and fixed here.

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
**Sign-off required:** No — Medium oversight requires tech lead awareness only, not a named sign-off (per `/definition-of-ready`'s own oversight-level rules). DoR artefact shared with the operator (Hamish King, Platform Owner) for awareness before proceeding.
