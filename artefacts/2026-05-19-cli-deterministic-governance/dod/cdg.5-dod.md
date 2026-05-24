# Definition of Done: cdg.5 — Chain-hash trace emission on gate-confirm

**PR:** https://github.com/heymishy/skills-repo/pull/357 | **Merged:** 2026-05-24
**Story:** cdg.5
**Feature artefact:** artefacts/2026-05-19-cli-deterministic-governance/
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-24

---

## Step 1 — PR and story confirmation

| Item | Status | Detail |
|------|--------|--------|
| PR merged | ✅ | PR #357 merged to master at 6658ebd |
| Story artefact exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.5.md |
| DoR artefact exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.5-dor.md |
| Test plan exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.5-test-plan.md |

---

## Step 2 — AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Successful gate-confirm writes trace entry | ✅ | `tests/check-cdg5-trace-emission.js`: trace entry appended to `workspace/traces/<feature-slug>.trace.jsonl` on successful gate-confirm; entry contains timestamp, featureSlug, storyId, stage, operatorEmail, exitCode: 0, chainHash | Automated test — 10/10 pass | None |
| AC2 — Trace entry includes correct chain hash | ✅ | Multi-entry chain: entry N's chainHash = SHA-256(JSON.stringify(entryWithoutChainHash) + previousChainHash); chain verified by re-computing from entry 1 to N | Automated test | None |
| AC3 — First entry uses empty-string prior hash | ✅ | First entry chainHash = SHA-256(JSON.stringify(entry) + ""); verified by test | Automated test | None |
| AC4 — Failed gate-confirm does not write trace entry | ✅ | Validation-failure path (validate exits non-zero): no entry appended to trace file | Automated test | None |
| AC5 — Trace writer injectable via `setWriteTrace(fn)` | ✅ | `journey.js` exports `setWriteTrace`; `server.js` wires `governance-package.writeTrace` as production implementation; tests inject stub | Automated test + code inspection | None |
| AC6 — Default stub throws (D37) | ✅ | Default stub throws `"Adapter not wired: writeTrace"` when called without `setWriteTrace` | Automated test | None |
| AC7 — `workspace/traces/` in `.gitignore` | ✅ | `.gitignore` updated in PR (2 lines added); `workspace/traces/` entries are git-ignored | Code inspection (git show 6658ebd --stat confirms .gitignore modified) | None |
| AC8 — npm test suite covers all AC paths | ✅ | `tests/check-cdg5-trace-emission.js` exists (408 lines, 10 assertions covering AC1–AC6); npm test exit 0 post-merge | Automated test | None |

**ACs satisfied: 8/8**

---

## Step 3 — Test suite verification

| Suite | Tests | Result |
|-------|-------|--------|
| check-cdg5-trace-emission.js | 10 | ✅ All pass |
| Full npm test (master, post-merge) | All suites | ✅ Exit 0 |

Test evidence: `10 passed, 0 failed` from `check-cdg5-trace-emission.js`. Full `npm test` exit 0 on master post-merge. Pipeline-state records `testPlan.status: "all-passing"`, `passing: 10`, `totalTests: 10`.

---

## Step 4 — Scope compliance

All changes within scope per the DoR contract:
- ✅ `src/enforcement/governance-package.js` — modified (chain-hash `writeTrace` implementation, 85 net insertions)
- ✅ `src/web-ui/routes/journey.js` — modified (`setWriteTrace` injectable adapter, `_writeTrace` call post state-write)
- ✅ `src/web-ui/server.js` — modified (production wiring: `setWriteTrace(governance-package.writeTrace)`)
- ✅ `tests/check-cdg5-trace-emission.js` — created (408 lines, 10 assertions)
- ✅ `package.json` — modified (test chain extended)
- ✅ `.gitignore` — modified (`workspace/traces/` added)
- ✅ `artefacts/2026-05-19-cli-deterministic-governance/plans/cdg.5-plan.md` — created (implementation plan)

Out-of-scope files not touched: `skills verify-trace` CLI, non–DoR-gate trace entries, `skills emit-trace` standalone command.

---

## Step 5 — Metric signal

**M2 (Gate bypass rate):** Now measurable by construction. Every successful gate-confirm appends a chain-hashed trace entry to `workspace/traces/<feature-slug>.trace.jsonl`. Any advancement in `pipeline-state.json` without a corresponding trace entry is detectable as a bypass. Chain hash integrity means post-hoc insertion or deletion of entries is detectable.

**T3M1 (Gate enforcement auditability):** Satisfied. Append-only writes via `appendFileSync` + SHA-256 chain hash using Node.js built-in `crypto` module (no external dependencies).

---

## Step 6 — Open items

None. All 8 ACs satisfied. No deferred items. No HIGH review findings. Pipeline-state: `prStatus=merged`, `stage=definition-of-done`, `acVerified=8`, `testPlan.status=all-passing`.
