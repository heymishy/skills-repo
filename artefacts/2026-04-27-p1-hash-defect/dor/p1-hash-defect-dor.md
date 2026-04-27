# Definition of Ready: Fix hash self-comparison defect in cli-adapter advance()

**Story reference:** `artefacts/2026-04-27-p1-hash-defect/stories/p1-hash-defect.md`
**Test plan reference:** `artefacts/2026-04-27-p1-hash-defect/test-plans/p1-hash-defect-test-plan.md`
**Verification script:** `artefacts/2026-04-27-p1-hash-defect/verification-scripts/p1-hash-defect-verification.md`
**NFR profile:** `artefacts/2026-04-27-p1-hash-defect/nfr-profile.md`
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-27
**Track:** Short-track (bounded bug fix — H7 review exempted; test-plan → DoR → coding agent)

---

## Contract Proposal

**What will be built:**

In `src/enforcement/cli-adapter.js`, the `advance()` function will be modified as follows:
1. Add `sidecarRoot` to the destructured `opts` parameter.
2. Change the C5 block condition from `if (govPackage && skillId)` to `if (govPackage && skillId && sidecarRoot)`.
3. Call `govPackage.resolveSkill({ skillId, sidecarRoot })` to obtain the actual file content hash.
4. If `resolveSkill` returns `null`, return `{ error: 'SKILL_NOT_FOUND', skillId }` immediately without calling `advanceState`.
5. Pass `actual: resolved.contentHash` (not `actual: expectedHash`) to `govPackage.verifyHash`.

No other files will change. `governance-package.js` is correct and does not need modification.

**What will NOT be built:**

- The 7 stub CLI commands (`init`, `fetch`, `pin`, `verify`, `workflow`, `back`, `navigate`) — separate P2 story.
- The ADR-013 combined-operation interface (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`) — separate P2 story.
- Expansion of `evaluateGate` beyond its current 4 gate names — separate P2 story.
- Any changes to the MCP adapter — separate surface with its own verification path.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: `verifyHash` receives `actual` from `resolveSkill` | Mock `resolveSkill` returning `contentHash: 'c'.repeat(64)`; mock `verifyHash` captures `actual`; assert `actual === 'c'.repeat(64)` not `'a'.repeat(64)` | Unit |
| AC2: hash mismatch → `HASH_MISMATCH`, no state advance | Mock `resolveSkill` returning mismatched hash; real comparison in `verifyHash` mock; assert `result.error === 'HASH_MISMATCH'` and `advanceState` not called | Unit |
| AC3: `resolveSkill` returns null → `SKILL_NOT_FOUND` | Mock `resolveSkill` returning `null`; assert `result.error === 'SKILL_NOT_FOUND'` and `advanceState` not called | Unit |
| AC4: matching hashes → success, `advanceState` called | Mock both returning matching hash; assert no error and `advanceState` called | Unit |
| AC5: regression — transition rules intact without `skillId`/`sidecarRoot` | Call `advance()` without those params; assert transition error/success as before | Unit (regression) |

**Assumptions:**

- All callers of `advance()` that use hash verification will be updated to pass `sidecarRoot`. For this story, only the test file change is in scope — updating callers in production usage paths is a P2 task.
- The `govPackage` object provided to `advance()` implements `resolveSkill` — this is already the case for `governance-package.js`.

**Estimated touch points:**

- Files: `src/enforcement/cli-adapter.js` (one function, ~5 lines changed)
- Services: None
- APIs: None

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. Each AC has a named, specific test assertion in `tests/check-p1-hash-defect.js`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | As a platform operator / I want advance() to call resolveSkill / So that C5 is genuinely enforced |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1a-e, AC2→T2a-c, AC3→T3a-c, AC4→T4a-c, AC5→T5a-b |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit items scoped out |
| H5 | Benefit linkage field references a named metric | ✅ | References P1 fidelity metric (WSJF portfolio sequencing artefact) |
| H6 | Complexity is rated | ✅ | Rating: 1 (Stable) |
| H7 | No unresolved HIGH findings from the review report | ✅ | Short-track exemption — no review step on bounded bug fixes |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 5 ACs covered; one gap (integration path) acknowledged and delegated to existing `check-p4-enf-package.js` |
| H8-ext | Cross-story schema dependency: Dependencies block is "None" | ✅ | No upstream dependencies → schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | C5, ADR-004, ADR-011, MC-SEC-02, MC-CORRECT-02 all listed; no Category E findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ | Backend/CLI fix only — no browser or DOM concerns |
| H-NFR | NFR profile exists at `artefacts/2026-04-27-p1-hash-defect/nfr-profile.md` | ✅ | NFR-SEC-1 (hash never self-compared), NFR-PERF-1 (sync read accepted), NFR-DEP-1 (no new deps) |
| H-NFR2 | No compliance NFR with a named regulatory clause | ✅ | `meta.regulated: false`; no regulatory clauses |
| H-NFR3 | Data classification not blank | ✅ | "No user data — SHA-256 of SKILL.md content only. Not PCI scope. No PII." |
| H-NFR-profile | Story declares NFRs → NFR profile present | ✅ | `artefacts/2026-04-27-p1-hash-defect/nfr-profile.md` exists |

**Hard blocks: 15/15 passed ✅**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs identified | ✅ | 3 NFRs in profile |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | Short-track — no review run; N/A |
| W4 | Verification script reviewed by domain expert | ⚠️ | Operator to confirm before or alongside coding; Low-oversight path accepts operator as reviewer |
| W5 | No UNCERTAIN gap table items | ✅ | One gap (integration path) explicitly delegated, not uncertain |

**W4 acknowledged:** Operator is the domain expert for this platform. Verification script reviewed inline during DoR. Proceeding.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix hash self-comparison defect in cli-adapter advance()
Story artefact: artefacts/2026-04-27-p1-hash-defect/stories/p1-hash-defect.md
Test plan: artefacts/2026-04-27-p1-hash-defect/test-plans/p1-hash-defect-test-plan.md
Verification script: artefacts/2026-04-27-p1-hash-defect/verification-scripts/p1-hash-defect-verification.md
Test file: tests/check-p1-hash-defect.js

Goal:
Make all 7 currently failing assertions in tests/check-p1-hash-defect.js pass.
Run: node tests/check-p1-hash-defect.js

The fix is confined to src/enforcement/cli-adapter.js, advance() function only.

The defect (current code, lines 109–113):
  const hashResult = govPackage.verifyHash({
    skillId:  skillId,
    expected: expectedHash,
    actual:   expectedHash,   // ← BUG: actual == expected always, C5 is a no-op
  });

Required change:
1. Add `sidecarRoot` to destructured opts.
2. Change the block condition to: if (govPackage && skillId && sidecarRoot)
3. Inside the block, BEFORE calling verifyHash:
   const resolved = govPackage.resolveSkill({ skillId, sidecarRoot });
   if (!resolved) {
     return { error: 'SKILL_NOT_FOUND', skillId };
   }
4. Change the verifyHash call to use: actual: resolved.contentHash

The rest of advance() does not change.

Constraints:
- Touch ONLY src/enforcement/cli-adapter.js
- Do NOT modify governance-package.js, any test files, or any artefact files
- Zero new npm dependencies — Node.js built-ins only
- No new pipeline-state.json fields (MC-CORRECT-02)
- Read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Verification command (must return 0 failures):
  node tests/check-p1-hash-defect.js

Also run full suite to confirm no regressions:
  npm test

Expected after fix:
  [p1-hash-defect] Results: 16 passed, 0 failed
  [p1-hash-defect] PASS

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — personal, non-regulated repo; Complexity=1; Stable scope
**Signed off by:** Not required
**DoR status:** PROCEED ✅
